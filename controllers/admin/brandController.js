const Brand = require('../../models/brandSchema');

const getBrand = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const brandData = await Brand.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalDocuments = await Brand.countDocuments();
        const totalPages = Math.ceil(totalDocuments / limit);

        res.render('admin/brand', {
            data: brandData,
            currentPage: page,
            totalPages: totalPages,
            totalDocuments: totalDocuments
        });
    } catch (error) {
        console.error('Error loading brand page', error);
        res.redirect('/admin/page-error');
    }
};

const addBrand = async (req, res) => {
    try {
        const brandName = req.body.name;
        const findBrand = await Brand.findOne({ brandName });
        if (!findBrand) {
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName: brandName,
                brandImage: [image]
            });
            await newBrand.save();
            res.status(200).json({ success: true, message: 'Brand added successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Brand already exists' });
        }
    } catch (error) {
        console.error('Error adding brand:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const listBrand = async (req, res) => {
    try {
        const id = req.query.id;
        await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.status(200).json({ success: true, message: 'Brand unblocked successfully' });
    } catch (error) {
        console.error('Error listing brand:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const unlistBrand = async (req, res) => {
    try {
        const id = req.query.id;
        await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.status(200).json({ success: true, message: 'Brand blocked successfully' });
    } catch (error) {
        console.error('Error unlisting brand:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const id = req.query.id;
        await Brand.deleteOne({ _id: id });
        res.status(200).json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    getBrand,
    addBrand,
    listBrand,
    unlistBrand,
    deleteBrand
};
