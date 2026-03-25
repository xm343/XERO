const Category = require('../../models/categorySchema')

const categoryInfo = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 4
        const skip = (page-1)*limit
        const search = req.query.search || ""

        const filter = {
            name: { $regex: search, $options: 'i' }
        }

        const categoryData = await Category.find(filter)
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
            .exec()

        const totalCategories = await Category.countDocuments(filter)
        const totalPages = Math.ceil(totalCategories/limit)
        
        res.render('admin/categories',{
            cat:categoryData,
            totalCategories:totalCategories,
            currentPage:page,
            totalPages:totalPages,
            search: search
        })


    } catch (error) {
        console.log('category loading error',error)
        res.redirect('/admin/page-404')
    }
}

const addCategory = async(req,res)=>{
    try {
        const {name,description} = req.body
        
        if(!name || !description){
            return res.status(400).json({success: false, message: 'Name and description are required'})
        }

        const existingCategory = await Category.findOne({name})
        if(existingCategory){
            return res.status(400).json({success: false, message: 'Category already exists'})
        } 
        
        const newCategory = new Category({
            name,
            description
        })
        await newCategory.save()
        
        return res.status(200).json({success: true, message: 'Category added successfully'})
        
    } catch (error) {
        console.error('Add Category Error:', error);
        res.status(500).json({success: false, message: 'Internal Server error'})
    }
}

const getListCategory = async(req,res)=>{
    try {
        const id = req.query.id
        const category = await Category.findById(id)
        if(!category){
            return res.redirect('/admin/page-404')
        }
        res.render('admin/edit-category', { category: category })
    } catch (error) {
        res.redirect('/admin/page-404')
    }
}

const updateCategory = async(req,res)=>{
    try {
        const id = req.body.id
        const {name, description} = req.body
        
        const existingCategory = await Category.findOne({name: name})
        if(existingCategory && existingCategory._id.toString() !== id){
            return res.status(400).json({success: false, message: 'Category name already exists'})
        }

        await Category.findByIdAndUpdate(id, {
            name: name,
            description: description
        }, {new: true})
        
        res.status(200).json({success: true, message: 'Category updated successfully'})
        
    } catch (error) {
        res.status(500).json({success: false, message: 'Internal Server error'})
    }
}

const listCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        res.status(200).json({ success: true, message: 'Category listed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const unlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.status(200).json({ success: true, message: 'Category unlisted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    updateCategory,
    listCategory,
    unlistCategory
}