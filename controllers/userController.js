
const userModel = require('../models/userModels');
const bcrypt=require('bcrypt');

const securePassword=async(password)=>{
    try{
        const passwordHash=await bcrypt.hash(password,10);
        return passwordHash;
    }
    catch(error){
        console.log(error.message);
    }

};


const loadLogin=async(req,res)=>{
    try{
        res.render('logined.ejs');
    }
    catch(error){
        console.log(error.message);
    }
};

const loadRegister =async(req,res)=>{
    try{
        res.render('page-login-register.ejs');
    }
    catch(error){
        console.log(error.message);
    }

};

const loadLoginpage=async(req,res)=>{
    try{
        res.render('login.ejs');
    }
    catch(error){
        console.log(error.message);
    }
};

const loadregisterpage=async(req,res)=>{
    try{
        res.render('register.ejs');
    }
    catch(error){
        console.log(error.message);
    }

};
const forgotpassword=async(req,res)=>{
    try{
        res.render('forgot.ejs');
    }  catch(error){
        console.log(error.message);
    }

};

const insertUser=async(req,res)=>{
    try{
        console.log(req.body.password)
        let {name,email,password,mobile}=req.body;

        const spassword=await securePassword(password);
       
        let user = {
          name: name,
          email: email,
          password: spassword,
          mobile: mobile
        };
        console.log(name, email, mobile, password)


      
    //    const userData=await user.save();
    //    if(userData){
    //     res.render('register',{message:"Your registration has been sucessfully completed!!!"});

    //    }
    //    else{
    //    res.render('register',{message:"Your registration has been failed!!!"})
    // }
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports={
    loadLogin,
    loadRegister,
    loadLoginpage,
    loadregisterpage,
    forgotpassword,
    insertUser

};