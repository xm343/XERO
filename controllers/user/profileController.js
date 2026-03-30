const User = require('../../models/userSchema')
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
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>`
        }) 
        console.log(`Email sent:`, info.messageId)
        return true
    } catch (error) {
        console.log('Error sending mail', error)
        return false
    }
}

async function securePassword(password){
    try {
        const hash = await bcrypt.hash(password, 10)
        return hash
    } catch (error) {
        console.log('Cannot hash password', error)
    }
}


const getForgotPassword = async(req,res)=>{
    try {
        res.render('user/forgot-password')
    } catch (error) {
        console.log('Error loading forgot-password', error)
        res.redirect('/page-error')
    }
}


const getEmailVal = async(req,res)=>{
    try {
        const {email} = req.body
        const findUser = await User.findOne({email:email})
        if(findUser){
            const otp = generateOtp()
            const sendMail = await sendVerificationMail(email, otp)
            if(sendMail){
                req.session.userOtp = otp
                req.session.email = email
                res.render('user/otp-page')
                console.log('OTP:', otp)
            }
            else{
                res.status(400).json({success:false, message:'Failed to send OTP'})
            }
        }
        else{
            res.render('user/forgot-password', {
                message: 'User with this email does not exist'
            })
        }

    } catch (error) {
        console.log('Failed to load OTP page', error)
        res.redirect('/page-error')
    }
}


const verifyOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp
        if(enteredOtp === req.session.userOtp){
            res.status(200).json({success: true, redirectUrl: '/reset-password'})
        }
        else{
            res.status(400).json({success: false, message: 'OTP does not match'})
        }

    } catch (error) {
        console.log('Error verifying OTP', error)
        res.status(500).json({success: false, message: 'Internal server error'})
    }
}


const getConfirmPassword = async(req,res)=>{
    try {
        res.render('user/reset-password')
    } catch (error) {
        console.log('Error loading reset password page', error)
        res.redirect('/page-error')
    }
}

const resendOtp = async(req,res)=>{
    try {
        const email = req.session.email
        const otp = generateOtp()
        req.session.userOtp = otp
        const sendMail = await sendVerificationMail(email, otp)
        console.log('Resent OTP:', otp)
        if(sendMail){
            res.status(200).json({success: true, message: 'OTP send successful'})
        }
        else{
            res.status(500).json({success: false, message: 'OTP send fail'})
        }
    } catch (error) {
        console.log('Error resending OTP', error)
        res.status(500).json({success: false, message: 'Internal server error'})
    }
}

const resetPassword = async(req,res)=>{
    try {
        const {pass1, pass2} = req.body
        const email = req.session.email
        if(pass1 === pass2){
            const passwordHash = await securePassword(pass1)
            await User.updateOne(
                {email: email},
                {$set: {password: passwordHash}}
            )
            res.redirect('/login')
        }
        else{
            res.render('user/reset-password', {message: 'Passwords do not match'})
        }
    } catch (error) {
        console.log('Error resetting password', error)
        res.redirect('/page-error')
    }
}

module.exports = {
    getForgotPassword, getEmailVal, verifyOtp, getConfirmPassword, resendOtp, resetPassword
}
