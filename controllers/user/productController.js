const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema')
const Product = require('../../models/productSchema')
const Brand = require('../../models/brandSchema')

const loadProduct = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.query.id;

        const userData = userId ? await User.findById(userId) : null;
        const productData = await Product.findById(productId).populate('category');
        
        if (!productData) {
            return res.redirect('/page-error');
        }

        const findCategory = productData.category;
        const categoryOffer = findCategory ? findCategory.categoryOffer || 0 : 0;
        const productOffer = productData.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        res.render('user/product-details', {
            user: userData,
            product: productData,
            quantity: productData.quantity,
            totalOffer: totalOffer,
            category: findCategory
        });

    } catch (error) {
        console.log('error loading product page', error);
        res.redirect('/page-error');
    }
}

module.exports = {
    loadProduct
}
