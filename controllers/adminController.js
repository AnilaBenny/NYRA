const adminModel=require('../models/adminModel');
const bcrypt = require('bcrypt');

//admin login (get)
const adminLogin=async(req,res)=>{
    try{
        res.render('admin-login.ejs');
    }
    catch(error){
        console.log(error.message);
    }
};

// //hash admin password
// const registerAdmin = async (email, password) => {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     await adminModel.create({ email, password: hashedPassword });
// };


//admin login(post) 
const adminPost = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const adminData = await adminModel.findOne({ email });
        console.log(adminData.email)
        if (adminData) {
            // Compare passwords after hashing
            const isPasswordValid = await bcrypt.compare(password, adminData.password);

            if (isPasswordValid) {
                // Redirect to the admin panel if credentials are valid
                res.redirect('/adminpanel');
            } else {
                // Password is invalid
                res.render('admin-login', { message: 'Invalid email or password!' });
            }
        } else {
            // No admin found with the given email
            res.render('admin-login', { message: 'Invalid email or password!!!' });
        }
    } catch (error) {
        console.error(error.message);
        res.render('admin-login', { message: 'An error occurred during login!' });
    }
};

//admin pannel (get)
const loadPanel=async(req,res)=>{
    try{
        res.render('adminpanel.ejs');
    }
    catch(error){
        console.log(error);
    }

};

module.exports={
    adminLogin,
    adminPost,
    loadPanel
}