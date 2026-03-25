const User = require('../models/userSchema')



const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then((data)=>{
            if(data && !data.isBlocked){
                next()
            }
            else{
                res.redirect('/login')
            }
        })
        .catch((error)=>{
            console.error('Error  in user middleware')
            res.status(500).send('error in user auth')
        })
    }
    else{
        res.redirect('/login')
    }
}

const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then((data)=>{
        if(data){
            next()
        }
        else{
            res.redirect('/admin-login')
        }
    })
    .catch((error)=>{
        console.log('error in loading admin auth')
        res.status(500).send('error loading admin auth')
    })
}


module.exports = {userAuth,adminAuth}