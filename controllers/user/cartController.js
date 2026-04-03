const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");

const getCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        let subtotal = 0;
        if (cart) {
            subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        }

        res.render('user/cart', {
            user: user,
            cart: cart,
            subtotal: subtotal
        });
    } catch (error) {
        console.log('Error loading cart', error);
        res.redirect('/page-error');
    }
}

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.json({ status: false, message: 'Please login to add to cart' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ status: false, message: 'Product not found' });
        }

        if (product.quantity < quantity) {
            return res.json({ status: false, message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            cart = new Cart({
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: quantity,
                    price: product.salesPrice,
                    totalPrice: quantity * product.salesPrice
                }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
                cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * product.salesPrice;
            } else {
                cart.items.push({
                    productId: productId,
                    quantity: quantity,
                    price: product.salesPrice,
                    totalPrice: quantity * product.salesPrice
                });
            }
        }

        await cart.save();
        res.json({ status: true, message: 'Product added to cart' });

    } catch (error) {
        console.log('Error adding to cart', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

const updateCartQuantity = async (req, res) => {
    try {
        const { productId, change } = req.body;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId: userId });
        if (!cart) return res.json({ status: false, message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) return res.json({ status: false, message: 'Item not found in cart' });

        const product = await Product.findById(productId);
        const newQuantity = cart.items[itemIndex].quantity + change;

        if (newQuantity < 1) return res.json({ status: false, message: 'Quantity cannot be less than 1' });
        if (newQuantity > product.quantity) return res.json({ status: false, message: 'Insufficient stock' });

        cart.items[itemIndex].quantity = newQuantity;
        cart.items[itemIndex].totalPrice = newQuantity * cart.items[itemIndex].price;

        await cart.save();
        res.json({ status: true });

    } catch (error) {
        console.log('Error updating quantity', error);
        res.status(500).json({ status: false });
    }
}

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        await Cart.updateOne(
            { userId: userId },
            { $pull: { items: { productId: productId } } }
        );

        res.json({ status: true });
    } catch (error) {
        console.log('Error removing from cart', error);
        res.status(500).json({ status: false });
    }
}

module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart
}
