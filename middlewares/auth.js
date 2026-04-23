const User = require('../models/userSchema')



const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then((data)=>{
            if(data && !data.isBlocked){
                next()
            }
            else{
                const returnTo = encodeURIComponent(req.originalUrl);
                req.session.returnTo = req.originalUrl;
                req.session.save(() => {
                    res.redirect(`/login?returnTo=${returnTo}`)
                });
            }
        })
        .catch((error)=>{
            console.error('Error  in user middleware')
            res.status(500).send('error in user auth')
        })
    }
    else{
        const returnTo = encodeURIComponent(req.originalUrl);
        req.session.returnTo = req.originalUrl;
        req.session.save(() => {
            res.redirect(`/login?returnTo=${returnTo}`)
        });
    }
}

const adminAuth = (req,res,next)=>{
    if(req.session.admin){
        User.findOne({_id: req.session.admin, isAdmin: true})
        .then((data)=>{
            if(data){
                next()
            }
            else{
                res.redirect('/admin/login')
            }
        })
        .catch((error)=>{
            console.log('error in loading admin auth')
            res.status(500).send('error loading admin auth')
        })
    }
    else{
        res.redirect('/admin/login')
    }
}


module.exports = {userAuth,adminAuth}