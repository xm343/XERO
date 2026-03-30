const express = require('express')
const passport = require('passport')
const router = express.Router()
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')

router.get('/page-error', userController.errorPage)
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.post('/verify-otp', userController.verifyOtp)
router.get('/resend-otp',userController.resendOtp)

router.get('/login', userController.loadLogin)
router.post('/login', userController.login)
router.get('/logout', userController.logout)
router.get('/logout-success', userController.loadLogoutPage)
router.get('/', userController.loadHomepage)

// Google Auth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/signup' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);


//password reset

router.get('/forgot-password',profileController.getForgotPassword)
router.post('/forgot-password',profileController.getEmailVal)
router.post('/verify-forgot-otp',profileController.verifyOtp)
router.get('/reset-password',profileController.getConfirmPassword)
router.post('/resend-otp',profileController.resendOtp)
router.post('/reset-password',profileController.resetPassword)

module.exports = router
