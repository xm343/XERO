const express = require('express')
const router = express.Router()
const userController = require('../controllers/user/userController')

router.get('/page-error', userController.errorPage)
router.get('/signup',userController.signup)

module.exports = router
