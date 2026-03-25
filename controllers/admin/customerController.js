const User = require("../../models/userSchema");

const customerInfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page);
        }
        const limit = 3;
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        }).countDocuments();

        res.render("admin/customers", {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Error in customerInfo:", error);
        res.redirect("/page-error");
    }
};

const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.status(200).json({ success: true, message: "Customer blocked successfully" });
    } catch (error) {
        console.error("Error in customerBlocked:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const customerunBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.status(200).json({ success: true, message: "Customer unblocked successfully" });
    } catch (error) {
        console.error("Error in customerunBlocked:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked,
};
