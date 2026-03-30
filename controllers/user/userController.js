const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema')
const Product = require('../../models/productSchema')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')

function generateOtp(){
    let digits = '0123456789'
    let otp =''
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp
}

async function sendVerificationMail(email, otp){
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your account',
            text: `Your OTP for signup is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>`
        }) 
        console.log(`Email sent:`, info.messageId)
        return true
    } catch (error) {
        console.log('Error sending mail', error)
        return false
    }
}

const loadSignup = async (req,res) => {
    try {
        return res.render('user/signup')
    } catch (error) {
        console.log('signup page not found')
        res.status(500).send('server error')
    }
}

const signup = async (req,res) => {
    try {
        const {name, email, phone, password, cPassword} = req.body
        if(password !== cPassword){
            return res.render('user/signup', {message: 'Passwords do not match'})
        }
        const findUser = await User.findOne({email: email})
        if(findUser){
            return res.render('user/signup', {message: 'User with this email already exists'})
        }

        const otp = generateOtp()
        const sentMail = await sendVerificationMail(email, otp)
        if(!sentMail){
            return res.render('user/signup', {message: 'Failed to send OTP'})
        }

        req.session.userOtp = otp
        req.session.userData = {name, email, phone, password}

        res.render('user/verify-otp')
        console.log(`OTP: ${otp}`)

    } catch (error) {
        console.log('error signing up ', error)
        res.redirect('/page-error')
    }
}

const verifyOtp = async (req,res) => {
    try {
        const {otp} = req.body
        console.log('entered otp ', otp)
        
        if(!req.session.userData){
            return res.render('user/verify-otp', {message: 'Session expired. Please signup again.'})
        }

        if(otp === req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await bcrypt.hash(user.password, 10)
            const saveUser = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash
            })
            await saveUser.save()
            req.session.user = saveUser._id
            res.redirect('/')
        }else{
            res.render('user/verify-otp', {message: 'Invalid OTP'})
        }
    } catch (error) {
        console.log('error verifying otp ', error)
        res.redirect('/page-error')
    }
}

const resendOtp = async (req,res) => {
    try {
        if(!req.session.userData || !req.session.userData.email){
            return res.status(400).json({success: false, message: 'Session expired'})
        }
        const email = req.session.userData.email
        const otp = generateOtp()
        req.session.userOtp = otp
        const sentMail = await sendVerificationMail(email, otp)
        if(sentMail){
            console.log(`Resent OTP: ${otp}`)
            res.status(200).json({success: true, message: 'OTP Resent successfully'})
        } else {
            res.status(500).json({success: false, message: 'Failed to resend OTP'})
        }
    } catch (error) {
        console.log('error resending otp ', error)
        res.status(500).json({success: false, message: 'Internal Server Error'})
    }
}

const loadLogin = async (req,res) => {
    try {
        if(!req.session.user){
            return res.render('user/login')
        } else {
            res.redirect('/')
        }
    } catch (error) {
        res.redirect('/page-error')
    }
}

const login = async (req,res) => {
    try {
        const {email, password} = req.body
        const findUser = await User.findOne({isAdmin: 0, email: email})
        if(!findUser){
            return res.render('user/login', {message: 'User not found'})
        }
        if(findUser.isBlocked){
            return res.render('user/login', {message: 'User is blocked'})
        }
        const passwordMatch = await bcrypt.compare(password, findUser.password)
        if(!passwordMatch){
            return res.render('user/login', {message: 'Password incorrect'})
        }
        req.session.user = findUser._id
        res.redirect('/')
    } catch (error) {
        console.log('login error ', error)
        res.render('user/login', {message: 'Login failed. Please try again later.'})
    }
}

const loadHomepage = async (req, res) => {
    try {
        const user = req.session.user
        const categories = await Category.find({isListed: true})
        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(cat => cat._id) },
            quantity: { $gt: 0 }
        })

        productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        productData = productData.slice(0, 4)

        if(user){
            const userData = await User.findOne({_id: user})
            res.render('user/home', {
                user: userData,
                products: productData,
                categories: categories
            })
        } else {
            res.render('user/home', {
                user: null,
                products: productData,
                categories: categories
            })
        }
    } catch (error) {
        console.log('home page not found ', error)
        res.redirect('/page-error')
    }
}

const logout = async (req,res) => {
    try {
        req.session.destroy((err) => {
            if(err){
                console.log('logout error ', err)
                return res.redirect('/page-error')
            }
            res.redirect('/logout-success')
        })
    } catch (error) {
        console.log('logout error ', error)
        res.redirect('/page-error')
    }
}

const loadLogoutPage = async (req, res) => {
    try {
        res.render('user/logout')
    } catch (error) {
        res.redirect('/page-error')
    }
}

const errorPage = async (req,res) => {
    try {
        res.render('user/page-404')
    } catch (error) {
        res.send('404 page error')
    }
}

module.exports = {
    loadSignup, signup, verifyOtp, resendOtp, loadLogin, login, loadHomepage, logout, loadLogoutPage, errorPage
}
