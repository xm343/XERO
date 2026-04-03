const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
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
            const totalUsers = await User.countDocuments({ isAdmin: false });
            const totalOrders = await Order.countDocuments();
            
            const revenueData = await Order.aggregate([
                { $match: { status: { $ne: 'Cancel' } } },
                { $group: { _id: null, totalRevenue: { $sum: "$finalAmount" } } }
            ]);
            const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

            const activeOrders = await Order.countDocuments({ 
                status: { $in: ['Pending', 'Processing', 'Shipped'] } 
            });

            // Fetch data for charts (Last 7 days)
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                last7Days.push(date.toISOString().split('T')[0]);
            }

            const dailyStats = await Order.aggregate([
                {
                    $match: {
                        createdOn: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdOn" } },
                        count: { $sum: 1 },
                        revenue: { $sum: "$finalAmount" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // Format daily stats to match labels
            const ordersData = last7Days.map(date => {
                const dayMatch = dailyStats.find(stat => stat._id === date);
                return dayMatch ? dayMatch.count : 0;
            });

            const revenueChartData = last7Days.map(date => {
                const dayMatch = dailyStats.find(stat => stat._id === date);
                return dayMatch ? dayMatch.revenue : 0;
            });

            // Product distribution by category
            const categoryStats = await Product.aggregate([
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                { $unwind: "$categoryDetails" },
                {
                    $project: {
                        name: "$categoryDetails.name",
                        count: 1
                    }
                }
            ]);

            res.render('admin/dashboard', {
                totalUsers,
                totalOrders,
                totalRevenue,
                activeOrders,
                chartLabels: JSON.stringify(last7Days),
                ordersChartData: JSON.stringify(ordersData),
                revenueChartData: JSON.stringify(revenueChartData),
                categoryNames: JSON.stringify(categoryStats.map(c => c.name)),
                categoryCounts: JSON.stringify(categoryStats.map(c => c.count))
            })
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
