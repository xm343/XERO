const User = require('../../models/userSchema')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()



function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}
async function sendVerifcationMail(email,otp){
    try {
        const transport = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transport.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:'Verify your account',
            text:`OTP is ${otp}`,
            html:`<b>OTP is ${otp}</b>`
        })
        return info.accepted.length > 0
    } catch (error) {
        console.log('error sending mail',error)
        return false
    }
}



const errorPage = async (req, res) => {
    try {
        res.render('page-404')
    } catch (error) {
        console.error('Error rendering 404 page:', error)
        res.status(500).send('Internal Server Error')
    }
}

const loadSignup = async(req,res)=>{
    try {
        res.render('signup')
    } catch (error) { 
        res.status(500).redirect('/page-error')
        console.log('could not render signup ',error.message)     
    }
}

const signup = async(req,res)=>{
    const {name, email, phone, password, confirmPassword} = req.body
    try {
        if(password!==confirmPassword){
           return res.render('signup',{message:'Password do not match'})
        }
        const findUser = await User.findOne({email})
        if(findUser){
           return res.render('signup',{message:'User already exists'})
        }
        const otp = generateOtp()
        const emailsent = await sendVerifcationMail(email,otp)
        if(!emailsent){
            console.log('email not send')
        }
        req.session.userOtp=otp
        req.session.userData = {name, email, phone, password}

        res.render('verify-otp')
        console.log(`otp:${otp}`)

    } catch (error) {
        console.log('error signing up ',error)
        res.redirect('/page-error')
    }
}

const verifyOtp = async (req,res) => {
    try {
        const {otp} = req.body
        console.log('entered otp ',otp)
        if(otp === req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await bcrypt.hash(user.password,10)
            const saveUser = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
            await saveUser.save()
            req.session.user = saveUser._id
            res.redirect('/')
        }else{
            res.render('verify-otp',{message:'Invalid OTP'})
        }
    } catch (error) {
        console.log('error verifying otp ',error)
        res.redirect('/page-error')
    }
}

const resendOtp = async (req,res) => {
    try {
        const {email} = req.session.userData
        if(!email){
            return res.status(400).json({success:false, message:'Email not found in session'})
        }
        const otp = generateOtp()
        req.session.userOtp = otp
        const emailSent = await sendVerifcationMail(email,otp)
        if(emailSent){
            console.log(`Resent OTP: ${otp}`)
            res.status(200).render('verify-otp')
        }else{
            res.status(500).json({success:false, message:'Error sending email'})
        }
    } catch (error) {
        console.error('Error resending OTP',error)
        res.status(500).json({success:false, message:'Internal Server Error'})
    }
}

const loadLogin = async(req,res)=>{
    try {   
        if(!req.session.user){
            return res.render('login')
        } else {
            return res.redirect('/')
        }
    } catch (error) {
        console.log('error loading login',error)
        res.redirect('/page-error')       
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.render('login', { message: 'User not found' });
        }
        if (findUser.isBlocked) {
            return res.render('login', { message: 'User is blocked by admin' });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render('login', { message: 'Incorrect Password' });
        }

        req.session.user = findUser._id;
        res.redirect('/');
    } catch (error) {
        console.error('login error', error);
        res.render('login', { message: 'login failed. Please try again later' });
    }
};

const loadHomepage = async (req, res) => {
    try {
        res.send('Welcome to XERO Homepage'); // Placeholder
    } catch (error) {
        console.log('Home page not found', error);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    errorPage,loadSignup,signup,verifyOtp,resendOtp,loadLogin,login,loadHomepage
}
