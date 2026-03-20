const express = require('express')
const app = express()
const path = require('path')
const { connectDB } = require('./config/db')
const fs = require('fs')
require('dotenv').config()


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
