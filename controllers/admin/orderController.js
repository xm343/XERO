const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');

const getOrders = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const filter = {
            orderId: { $regex: search, $options: 'i' }
        };

        const orders = await Order.find(filter)
            .sort({ createdOn: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const count = await Order.countDocuments(filter);

        res.render('admin/orders', {
            orders: orders,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search: search
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.redirect('/admin/page-error');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await Order.findOneAndUpdate({ orderId: orderId }, { status: status });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.id;
        const order = await Order.findOne({ orderId: orderId }).populate('orderedItems.product');
        if (!order) {
            return res.redirect('/admin/orders');
        }
        res.render('admin/order-details', { order: order });
    } catch (error) {
        console.error('Error loading order details:', error);
        res.redirect('/admin/page-error');
    }
};

module.exports = {
    getOrders,
    updateOrderStatus,
    getOrderDetails
};
