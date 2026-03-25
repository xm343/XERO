const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const {userAuth,adminAuth} = require('../middlewares/auth')


router.get('/login', adminController.loadLogin)
router.post('/login', adminController.login)
router.get('/', adminAuth,adminController.loadDashboard)
router.get('/logout', adminController.logout)
router.get('/page-404',adminController.errorPage)

// Customer Management
router.get('/users', adminAuth, customerController.customerInfo)
router.get('/blockCustomer', adminAuth, customerController.customerBlocked)
router.get('/unblockCustomer', adminAuth, customerController.customerunBlocked)

//Category Management
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.get('/editCategory',adminAuth,categoryController.getListCategory)
router.post('/editCategory',adminAuth,categoryController.updateCategory)
router.get('/listCategory',adminAuth,categoryController.listCategory)
router.get('/unlistCategory',adminAuth,categoryController.unlistCategory)


module.exports = router
