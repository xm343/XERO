const User = require('../../models/userSchema')
const mongoose = require('mongoose')
const bcrypt = require("bcrypt")


const loadLogin = async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect('/admin')
        }
        res.render('admin/admin-login')
    } catch (error) {
        console.log('Error loading admin login', error)
        res.redirect('/page-error')
    }
}

const login = async(req,res)=>{
    try {
        const {email, password} = req.body
        const admin = await User.findOne({email, isAdmin: true})
        
        if(admin){
            const passwordMatch = await bcrypt.compare(password, admin.password)
            if(passwordMatch){
                req.session.admin = admin._id
                return res.redirect('/admin')
            } else {
                return res.render('admin/admin-login', {message: 'Incorrect Password'})
            }
        } else {
            return res.render('admin/admin-login', {message: 'Admin not found'})
        }
    } catch (error) {
        console.log('Login error', error)
        res.redirect('/page-error')   
    }
}

const loadDashboard = async(req,res)=>{
    try {
        if(req.session.admin){
            res.render('admin/dashboard')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log('Error loading dashboard', error)
        res.redirect('/page-error')
    }
}

const logout = async(req,res)=>{
    try {
        req.session.admin = null
        res.redirect('/admin/login')
    } catch (error) {
        console.log('Logout error', error)
        res.redirect('/page-error')
    }
}
const errorPage = async (req, res) => {
    try {
        res.render('user/page-404')
    } catch (error) {
        console.error('Error rendering 404 page:', error)
        res.status(500).send('Internal Server Error')
    }
}


module.exports = {
    loadLogin,
    login,
    loadDashboard,
    logout,errorPage
}
