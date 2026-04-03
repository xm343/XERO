const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Wishlist = require('../../models/wishlistSchema')

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        
        const wishlist = await Wishlist.findOne({ userId: userId }).populate({
            path: 'products.productsId',
            populate: {
                path: 'category'
            }
        });

        res.render('user/wishlist', {
            user: user,
            wishlist: wishlist ? wishlist.products : []
        });
    } catch (error) {
        console.log('error loading into wishlist', error);
        res.redirect('/page-error');
    }
}

const addToWishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;

        if (!userId) {
            return res.json({ status: false, message: 'Please login to add to wishlist' });
        }

        let wishlist = await Wishlist.findOne({ userId: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: userId,
                products: [{ productsId: productId }]
            });
        } else {
            const productExists = wishlist.products.find(item => item.productsId.toString() === productId);
            if (productExists) {
                return res.json({ status: false, message: 'Product already in wishlist' });
            }
            wishlist.products.push({ productsId: productId });
        }

        await wishlist.save();
        res.json({ status: true, message: 'Product added to wishlist' });

    } catch (error) {
        console.log('Error adding to wishlist', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;

        await Wishlist.updateOne(
            { userId: userId },
            { $pull: { products: { productsId: productId } } }
        );

        res.json({ status: true, message: 'Product removed from wishlist' });

    } catch (error) {
        console.log('Error removing from wishlist', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
}
