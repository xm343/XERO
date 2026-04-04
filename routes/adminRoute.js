const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const brandController = require('../controllers/admin/brandController')
const productController = require('../controllers/admin/productController')
const bannerController = require('../controllers/admin/bannerController')
const orderController = require('../controllers/admin/orderController')
const multer = require('multer')
const storage = require('../helpers/multer')
const uploads = multer({storage:storage})
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
router.get('/deleteCategory',adminAuth,categoryController.deleteCategory)


//Brand management
router.get('/brands',adminAuth,brandController.getBrand)
router.post('/addBrand',adminAuth,uploads.single('image'),brandController.addBrand)
router.get('/listBrand',adminAuth,brandController.listBrand)
router.get('/unlistBrand',adminAuth,brandController.unlistBrand)
router.get('/deleteBrand',adminAuth,brandController.deleteBrand)


//Product Management

router.get('/products',adminAuth,productController.getProduct)
router.get('/addProducts', adminAuth, productController.getAddProduct)
router.post('/addProducts',adminAuth,uploads.array('image',4),productController.addProduct)
router.get('/blockProduct', adminAuth, productController.blockProduct)
router.get('/unblockProduct', adminAuth, productController.unblockProduct)
router.get('/deleteProduct', adminAuth, productController.deleteProduct)
router.get('/editProduct', adminAuth, productController.getEditProduct)
router.post('/editProduct/:id', adminAuth, uploads.array('image',4), productController.editProduct)
router.post('/deleteProductImage', adminAuth, productController.deleteProductImage)



//Banner management

router.get('/banner',adminAuth,bannerController.getBanner)
router.get('/addBanner',adminAuth,bannerController.getAddBanner)
router.post('/addBanner',adminAuth,uploads.single('image'),bannerController.addBanner)
router.get('/deleteBanner',adminAuth,bannerController.deleteBanner)


// Order Management

router.get('/orders', adminAuth, orderController.getOrders)
router.post('/updateOrderStatus', adminAuth, orderController.updateOrderStatus)
router.get('/orderDetails', adminAuth, orderController.getOrderDetails)
router.get('/deleteOrder', adminAuth, orderController.deleteOrder)


module.exports = router
