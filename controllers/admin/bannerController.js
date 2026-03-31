const Banner = require('../../models/bannerSchema') 
const path = require('path')
const fs = require('fs')

const getBanner = async(req,res)=>{
    try {
        const bannerData = await Banner.find({})
        res.render('admin/banner',{banner:bannerData})
    } catch (error) {
        console.log('error loading banner page ',error)
        res.redirect('/page-error')
    }
}

const getAddBanner = async(req,res)=>{

    try {
        res.render('admin/add-banner')
    } catch (error) {
        console.log('error loading add banner',error)
        res.redirect('/page-error')        
    }
}

const addBanner = async(req,res)=>{
    try {
        const data = req.body
        const image = req.file
        
        const newBanner = new Banner({
            image: image.filename,
            title: data.title,
            description: data.description,
            link: data.link,
            startDate: new Date(data.startDate + 'T00:00:00'),
            endDate: new Date(data.endDate + 'T00:00:00')
        })

        await newBanner.save()
        res.redirect('/admin/banner')
    } catch (error) {
        console.log('error saving new banner',error)
        res.redirect('/page-error')
    }
}

const deleteBanner = async (req, res) => {
    try {
        const id = req.query.id
        await Banner.deleteOne({ _id: id })
        res.redirect('/admin/banner')
    } catch (error) {
        console.log('error deleting banner', error)
        res.redirect('/page-error')
    }
}


module.exports = {
    getBanner,
    getAddBanner,
    addBanner,
    deleteBanner
}
