const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const Brand = require('../../models/brandSchema')
const User = require('../../models/userSchema')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')


const getProduct = async(req,res)=>{
    try {
        const search = req.query.search || ""
        const page = parseInt(req.query.page) || 1
        const limit = 4
        
        const filter = {
            productName: { $regex: search, $options: 'i' }
        }

        const productData = await Product.find(filter)
            .populate('category')
            .sort({createdAt: -1})
            .skip((page - 1) * limit)
            .limit(limit)
            .exec()

        const count = await Product.countDocuments(filter)
        
        res.render('admin/products', {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search: search
        })
    } catch (error) {
        console.log('error loading products page',error)
        res.redirect('/admin/page-404')        
    }
}

const getAddProduct = async(req,res)=>{
    try {
        const categoryData = await Category.find({isListed: true})
        const brandData = await Brand.find({isBlocked: false})
        res.render('admin/add-product', {
            cat: categoryData,
            brand: brandData
        })
    } catch (error) {
        console.log('error loading add product page', error)
        res.redirect('/admin/page-404')
    }
}


const addProduct = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({ productName: products.productName });

        if (!productExists) {
            const images = [];
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    
                    const buffer = await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toBuffer();
                    
                    fs.writeFileSync(originalImagePath, buffer);
                    images.push(req.files[i].filename);
                }
            }

            const categoryId = await Category.findOne({ _id: products.category });

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salesPrice: products.salesPrice,
                createdAt: new Date(),
                quantity: products.quantity,
                color: products.color,
                productImage: images,
                status: 'Available',
            });

            await newProduct.save();
            res.redirect('/admin/products');
        } else {
            return res.status(400).json("Product already exists, please try with another name");
        }
    } catch (error) {
        console.error("Error saving product", error);
        res.redirect('/admin/page-404');
    }
};



const blockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error blocking product:', error);
        res.redirect('/admin/page-404');
    }
};

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error unblocking product:', error);
        res.redirect('/admin/page-404');
    }
};

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({ _id: id }).populate('category');
        const category = await Category.find({});
        const brand = await Brand.find({});
        res.render('admin/edit-product', {
            product: product,
            cat: category,
            brand: brand
        });
    } catch (error) {
        res.redirect('/admin/page-404');
    }
};

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists" });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const buffer = await sharp(req.files[i].path)
                    .resize({ width: 440, height: 440 })
                    .toBuffer();
                fs.writeFileSync(req.files[i].path, buffer);
                images.push(req.files[i].filename);
            }
        }

        const updateData = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice: data.regularPrice,
            salesPrice: data.salesPrice,
            quantity: data.quantity,
            color: data.color,
            productOffer: data.productOffer || 0,
        };

        if (images.length > 0) {
            updateData.$push = { productImage: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateData, { new: true });
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/page-404');
    }
};

const deleteProductImage = async (req, res) => {
    try {
        const { productId, imageName } = req.body;
        await Product.findByIdAndUpdate(productId, {
            $pull: { productImage: imageName }
        });
        const imagePath = path.join(__dirname, '../../public/uploads/re-image', imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findById(id);
        
        if (product && product.productImage.length > 0) {
            product.productImage.forEach(img => {
                const imagePath = path.join(__dirname, '../../public/uploads/re-image', img);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }
        
        await Product.findByIdAndDelete(id);
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.redirect('/admin/page-404');
    }
};

module.exports = {
    getProduct,
    getAddProduct,
    addProduct,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteProductImage,
    deleteProduct
}