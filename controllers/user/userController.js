const errorPage = async (req, res) => {
    try {
        res.render('page-404')
    } catch (error) {
        console.error('Error rendering 404 page:', error)
        res.status(500).send('Internal Server Error')
    }
}

module.exports = {
    errorPage
}
