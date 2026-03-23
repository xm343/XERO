const express = require('express')
const passport = require('passport')
const router = express.Router()
const userController = require('../controllers/user/userController')

router.get('/page-error', userController.errorPage)
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.post('/verify-otp', userController.verifyOtp)
router.get('/resend-otp',userController.resendOtp)

router.get('/login', userController.loadLogin)
router.post('/login', userController.login)
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

module.exports = router
