const express = require('express')
const passport = require('passport')
const router = express.Router()
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const productController = require('../controllers/user/productController')
const wishlistController = require('../controllers/user/wishlistController')
const cartController = require('../controllers/user/cartController')
const orderController = require('../controllers/user/orderController')
const {userAuth,adminAuth} = require('../middlewares/auth')

router.get('/page-error', userController.errorPage)
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.post('/verify-otp', userController.verifyOtp)
router.get('/resend-otp',userController.resendOtp)

router.get('/login', userController.loadLogin)
router.post('/login', userController.login)
router.get('/logout', userController.logout)
router.get('/logout-success', userController.loadLogoutPage)
router.get('/shop', userController.loadShop)
router.get('/', userController.loadHomepage)

// Google Auth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (req.user.isBlocked) {
        req.logout((err) => {
            if (err) {
                console.error("Logout error:", err);
            }
            res.render('user/login', { message: "Account is blocked" });
        });
    } else {
        req.session.user = req.user._id;
        res.redirect('/');
    }
  }
);


//password reset profile

router.get('/forgot-password',profileController.getForgotPassword)
router.post('/forgot-password',profileController.getEmailVal)
router.post('/verify-forgot-otp',profileController.verifyOtp)
router.get('/reset-password',profileController.getConfirmPassword)
router.post('/resend-otp',profileController.resendOtp)
router.post('/reset-password',profileController.resetPassword)
router.get('/user-profile',userAuth,profileController.userProfile)
router.get('/manage-address',userAuth,profileController.getAddress)
router.get('/add-address',userAuth,profileController.getAddAddress)
router.post('/add-address',userAuth,profileController.addAddress)
router.get('/edit-address',userAuth,profileController.getEditAddress)
router.post('/edit-address',userAuth,profileController.editAddress)
router.get('/delete-address',userAuth,profileController.deleteAddress)


//product page

router.get('/productDetails',productController.loadProduct)


//wishlist

router.get('/wishlist',userAuth,wishlistController.getWishlist)
router.post('/addToWishlist',wishlistController.addToWishlist)
router.post('/removeFromWishlist',wishlistController.removeFromWishlist)


//cart

router.get('/cart',userAuth,cartController.getCart)
router.post('/addToCart',cartController.addToCart)
router.post('/updateCartQuantity',userAuth,cartController.updateCartQuantity)
router.post('/removeFromCart',userAuth,cartController.removeFromCart)

// Checkout & Orders

router.get('/checkout', userAuth, orderController.getCheckout)
router.post('/place-order', userAuth, orderController.placeOrder)
router.post('/verify-payment', userAuth, orderController.verifyPayment)
router.get('/order-success', userAuth, orderController.getOrderSuccess)

module.exports = router
