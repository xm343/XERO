



function generateOtp(){
    
}




const errorPage = async (req, res) => {
    try {
        res.render('page-404')
    } catch (error) {
        console.error('Error rendering 404 page:', error)
        res.status(500).send('Internal Server Error')
    }
}

const signup = async(req,res)=>{
    try {
        res.render('signup')
    } catch (error) { 
        res.status(500).redirect('/errorPage')
        console.log('could not render signup ',error)     
    }
}

module.exports = {
    errorPage,signup
}
