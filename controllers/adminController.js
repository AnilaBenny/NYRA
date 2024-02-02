const adminModel = require('../models/adminModel');
const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');

// Admin login (get)
let adminLogin = async (req, res) => {
    try {
        res.render('admin-login', { err: null });
    } catch (error) {
        console.error("Error in adminLogin:", error);
        
    }
};

// Admin login (post)
let adminPost = async (req, res) => {
    try {
        const { email, password} = req.body;
        console.log(email, password);
  
        // Find admin by email
        const adminExist = await adminModel.findOne({
            adminEmail: email,
          });
        console.log(adminExist);

        if (adminExist) {
            // Compare passwords
           
            if (password===adminExist.adminPassword) {
                // If password is valid, set session and redirect to admin panel
                req.session.admin = true;
                return res.redirect("/admin/adminpanel");
            } else {
                // If password is invalid, return error
                return res.render("admin-login", { err: "Invalid email or password" });
            }
        } else {
            // If admin does not exist, return error
            return res.render("admin-login", { err: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Error during login:", error);
      
    }
};

// Admin logout
let adminLogout = (req, res) => {
    req.session.admin = false;
    console.log("Session destroyed");
    res.redirect("/admin");
};

// Admin panel (get)
const loadPanel = async (req, res) => {
    try {
        res.render('adminpanel.ejs');
    } catch (error) {
        console.error(error);
     
    }
};

const loadusermanagement = async (req, res) => {
    try {
        const userdetails = await userModel.find();
        console.log(userdetails)
        res.render('user-management', { users: userdetails });
    } catch (error) {
        console.log(error.message);
    }
};

let userblock = async (req, res) => {
    try {
        const { id } = req.body;
        const userData = await userModel.findById(id);
        if(userData.isBlocked){
            await userModel.findByIdAndUpdate({_id:id},{$set:{ isBlocked:false}});
            await userData.save(); // Save the updated user data
            res.status(200).json({ status: true, users: userData });
        }
        else{
            await userModel.findByIdAndUpdate({_id:id},{$set:{ isBlocked:true}});
            await userData.save(); // Save the updated user data
            res.status(201).json({ status: true, users: userData });
        } 
        } 
     catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }};


module.exports = {
    adminLogin,
    adminPost,
    loadPanel,
    adminLogout,
    loadusermanagement,
    userblock
};
