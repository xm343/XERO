const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize razorpay instance only if keys are present to avoid crash on startup
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    console.log('Razorpay keys found. Initializing Razorpay Instance...');
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from .env. Online payments will not work.');
}

const getCheckout = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.query.id;
        
        const user = await User.findById(userId);
        const addressData = await Address.findOne({ userId: userId });
        const addresses = addressData ? addressData.address : [];

        let checkoutItems = [];
        let subtotal = 0;

        if (productId) {
            // "Buy Now" for a single product
            const product = await Product.findById(productId);
            if (!product) {
                return res.redirect('/shop');
            }
            checkoutItems.push({
                productId: product,
                quantity: 1,
                price: product.salesPrice,
                totalPrice: product.salesPrice
            });
            subtotal = product.salesPrice;
        } else {
            // Checkout from Cart
            const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
            if (!cart || cart.items.length === 0) {
                return res.redirect('/cart');
            }
            checkoutItems = cart.items;
            subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        }

        res.render('user/checkout', {
            user: user,
            addresses: addresses,
            items: checkoutItems,
            subtotal: subtotal,
            isBuyNow: !!productId,
            razorpayKey: process.env.RAZORPAY_KEY_ID || ''
        });

    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.redirect('/page-error');
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const { addressId, paymentMethod, isBuyNow, productId } = req.body;
        console.log('Place Order Request:', { paymentMethod, isBuyNow, productId, addressId });

        const addressData = await Address.findOne({ userId: userId });
        if (!addressData || !addressData.address) {
            console.log('Order Failed: No address data found for user');
            return res.status(400).json({ success: false, message: 'Please add an address first' });
        }

        const selectedAddress = addressData.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) {
            console.log('Order Failed: Selected address not found');
            return res.status(400).json({ success: false, message: 'Invalid address selected' });
        }

        let orderedItems = [];
        let totalPrice = 0;

        const buyNow = isBuyNow === true || isBuyNow === 'true';

        if (buyNow && productId) {
            const product = await Product.findById(productId);
            if (!product) {
                console.log('Order Failed: Product not found:', productId);
                return res.status(400).json({ success: false, message: 'Product not found' });
            }
            if (product.quantity < 1) {
                console.log('Order Failed: Product out of stock');
                return res.status(400).json({ success: false, message: 'Product out of stock' });
            }
            orderedItems.push({
                product: product._id,
                quantity: 1,
                price: product.salesPrice
            });
            totalPrice = product.salesPrice;
        } else {
            const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
            if (!cart || cart.items.length === 0) {
                console.log('Order Failed: Cart is empty');
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }

            for (const item of cart.items) {
                if (!item.productId) {
                    console.error('Order Failed: Null product in cart items');
                    continue;
                }
                if (item.productId.quantity < item.quantity) {
                    console.log(`Order Failed: Insufficient stock for ${item.productId.productName}`);
                    return res.status(400).json({ success: false, message: `Insufficient stock for ${item.productId.productName}` });
                }
                orderedItems.push({
                    product: item.productId._id,
                    quantity: item.quantity,
                    price: item.price
                });
                totalPrice += item.totalPrice;
            }
        }

        if (orderedItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No items to order' });
        }

        // Create initial order with 'Pending' status
        const newOrder = new Order({
            orderedItems: orderedItems,
            totalPrice: totalPrice,
            finalAmount: totalPrice,
            address: selectedAddress,
            status: 'Pending',
            createdOn: new Date()
        });

        if (paymentMethod === 'Online') {
            console.log('Processing Online Payment for amount:', totalPrice);
            if (!razorpayInstance) {
                console.error('Order Failed: Razorpay instance not initialized. Keys might be missing from .env or server not restarted.');
                return res.status(500).json({ success: false, message: 'Online payment is currently unavailable. Please check your configuration.' });
            }

            const options = {
                amount: Math.round(totalPrice * 100), // amount in paise
                currency: "INR",
                receipt: newOrder.orderId
            };

            try {
                const razorpayOrder = await razorpayInstance.orders.create(options);
                console.log('Razorpay Order Created:', razorpayOrder.id);
                
                await newOrder.save();

                return res.json({
                    success: true,
                    paymentMethod: 'Online',
                    razorpayOrder: razorpayOrder,
                    orderId: newOrder.orderId
                });
            } catch (rzpError) {
                console.error('Razorpay Order Creation Error:', rzpError);
                return res.status(500).json({ success: false, message: 'Failed to initiate payment with Razorpay' });
            }
        } else {
            // For COD, confirm order and deduct stock
            await newOrder.save();
            console.log('COD Order Saved:', newOrder.orderId);

            // Deduct Stock
            for (const item of orderedItems) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { quantity: -item.quantity } }
                );
            }

            // Clear Cart if not Buy Now
            if (!buyNow) {
                await Cart.deleteOne({ userId: userId });
            }

            // Update user's order history
            await User.findByIdAndUpdate(userId, {
                $push: { orderHistory: newOrder._id }
            });

            res.json({ success: true, orderId: newOrder.orderId });
        }

    } catch (error) {
        console.error('CRITICAL Error in placeOrder:', error);
        res.status(500).json({ success: false, message: 'A critical server error occurred. Please try again.' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, isBuyNow } = req.body;
        console.log('Verify Payment Request:', { razorpay_order_id, orderId });

        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error('Verification Failed: RAZORPAY_KEY_SECRET missing');
            return res.status(500).json({ success: false, message: 'Razorpay configuration error' });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            console.log('Payment Verified Successfully');
            // Payment verified, confirm order
            const order = await Order.findOne({ orderId: orderId });
            if (!order) {
                console.error('Verification Error: Order not found in database for ID:', orderId);
                return res.status(404).json({ success: false, message: 'Order reference not found' });
            }
            
            order.status = 'Processing';
            await order.save();

            // Deduct Stock
            for (const item of order.orderedItems) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { quantity: -item.quantity } }
                );
            }

            // Clear Cart if not Buy Now
            if (!(isBuyNow === true || isBuyNow === 'true')) {
                await Cart.deleteOne({ userId: req.session.user });
            }

            // Update user's order history
            await User.findByIdAndUpdate(req.session.user, {
                $push: { orderHistory: order._id }
            });

            res.json({ success: true });
        } else {
            console.warn('Payment Verification Failed: Invalid Signature');
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('CRITICAL Error in verifyPayment:', error);
        res.status(500).json({ success: false, message: 'A server error occurred during payment verification' });
    }
};

const getOrderSuccess = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const orderId = req.query.id;
        const order = await Order.findOne({ orderId: orderId });

        res.render('user/order-success', {
            user: user,
            order: order
        });
    } catch (error) {
        console.error('Error loading order success page:', error);
        res.redirect('/page-error');
    }
};

module.exports = {
    getCheckout,
    placeOrder,
    getOrderSuccess,
    verifyPayment
};
