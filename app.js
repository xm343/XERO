const express = require('express')
const app = express()
const path = require('path')
const { connectDB } = require('./config/db')
const fs = require('fs')

// Load .env file manually
if (fs.existsSync('.env')) {
    const envConfig = fs.readFileSync('.env', 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim()
        }
    })
}

const userRoute = require('./routes/userRoute')
// const adminRoute = require('./routes/adminRoute')

connectDB()

app.set('view engine', 'ejs')
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')])

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', userRoute)
// app.use('/admin', adminRoute)

app.use((req, res) => {
    res.status(404).render('page-404')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})

module.exports = app
