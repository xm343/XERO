const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')
const passport = require('./config/passport')
const { connectDB } = require('./config/db')
const fs = require('fs')
const https = require('https')
require('dotenv').config()


const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

connectDB()

const uploadDir = path.join(__dirname, 'public', 'uploads', 're-image');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.set('trust proxy', 1) // Trust first proxy for HTTPS


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')))

// Redirect to HTTPS if not already
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
})

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure: process.env.NODE_ENV === 'production' || !!process.env.SSL_KEY_PATH,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

app.use(passport.initialize());
app.use(passport.session());


app.use('/', userRoute)
app.use('/admin', adminRoute)


app.use((req, res) => {
    res.status(404).render('user/page-404')
})

const PORT = process.env.PORT || 3000

// HTTPS support
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    try {
        const options = {
            key: fs.readFileSync(process.env.SSL_KEY_PATH),
            cert: fs.readFileSync(process.env.SSL_CERT_PATH)
        }
        https.createServer(options, app).listen(PORT, () => {
            console.log(`HTTPS server running on port ${PORT}`)
        })
    } catch (error) {
        console.error('Failed to start HTTPS server:', error.message)
        app.listen(PORT, () => {
            console.log(`Fallback: HTTP server running on port ${PORT}`)
        })
    }
} else {
    app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`)
    })
}

module.exports = app
