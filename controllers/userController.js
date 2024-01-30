const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const nodemailer = require("nodemailer");
const randomstring = require('randomstring');

// const Email = process.env.Email;
// const Pass = process.env.Pass;

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user:'nyraproduct@gmail.com' ,
        pass: 'gcnmqgwrjkuculam'
    }
});

//password hashing

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

//load home
const enterHome = async (req, res) => {
    try {
        res.render('home.ejs');
    } catch (error) {
        console.log(error.message);
    }
};


//load login page
const loadLoginpage = async (req, res) => {
    try {
        res.render('login.ejs');
    } catch (error) {
        console.log(error.message);
    }
};


//load register page
const loadregisterpage = async (req, res) => {
    try {
        res.render('register', { errors: [], message: null });
    } catch (error) {
        console.log(error.message);
    }
};


//forgot password

const forgotpassword = async (req, res) => {
    try {
        res.render('forgot.ejs');
    } catch (error) {
        console.log(error.message);
    }
};



//insert user & send the otp
const insertUser=async(req,res)=>{
  
  try{
    const { name, email, mobile, password } = req.body;

        // Validate request body using express-validator
        const validators = [
          check('name')
        
          .exists({ checkFalsy: true })
          .withMessage('Name is required').bail()
          .isLength({ min: 3 })
          .withMessage('Name must be at least 3 characters long').bail()
          .matches(/^[^0-9]+$/)
          .withMessage('Name cannot contain numbers').bail()
          .custom((value) => {
            if (value.trim() !== value) {
              throw new Error('Name cannot have leading or trailing spaces');
            }
            const parts = value.trim().split(' ');
            if (parts.length !== 2) {
              throw new Error('Please provide both first name and last name');
            }
            if (parts[0].length === 0 || parts[1].length === 0) {
              throw new Error('Please provide both first name and last name');
            }
            if (!value.trim().match(/^[^\s]+(\s{1}[^\s]+)?$/)) {
              throw new Error('Name format is invalid. Please provide first name and last name with one space between them');
            }
            return true;
          }).bail(),
        check('email')
         
          .isEmail()
          .withMessage('Email is not valid').bail()
          .exists()
          .withMessage('Email is required').bail()
          .normalizeEmail()
          .custom((value) => {
            if (value !== value.toLowerCase()) {
              throw new Error('Email should not contain capital letters');
            }
            if (value.trim() !== value) {
              throw new Error('Email cannot have leading or trailing spaces');
            }
            if (!/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(value)) {
              throw new Error('Email must be in correct format');
            }
            return true;
          }).bail(),
        check('mobile')
          
          .exists({ checkFalsy: true })
          .withMessage('Mobile number is required').bail()
          .isLength({ min: 10, max: 10, checkFalsy: true })
          .withMessage('Mobile number must be 10 digits long').bail()
          .custom((value) => {
            if (!/^\d{10}$/.test(value)) {
              throw new Error('Mobile number must contain only numbers');
            }
            return true;
          }).bail(),
        check('password')
         
          .exists({ checkFalsy: true })
          .withMessage('Password is required').bail()
          .isLength({ min: 6, max: 15, checkFalsy: true })
          .withMessage('Password must be between 6 and 15 characters').bail()
          .custom((value) => {
            if (value.length < 6) {
              throw new Error('Password must be at least 6 characters long');
            }
            if (!/[A-Z]/.test(value)) {
              throw new Error('Password must contain at least one uppercase letter');
            }
            if (!/[a-z]/.test(value)) {
              throw new Error('Password must contain at least one lowercase letter');
            }
            if (!/\d/.test(value)) {
              throw new Error('Password must contain at least one number');
            }
            if (!/[!@#$%^&*]/.test(value)) {
              throw new Error('Password must contain at least one special character');
            }
            return true;
          }).bail()
      
  
        ];

        await Promise.all(validators.map((validator) => validator.run(req)));

        const errors = validationResult(req).array();
        console.log(errors);
        if (errors.length>0)
        {
          // console.log(errors);
          res.render('register',{errors})
        }
        else{
         
          
          const data={name,email,mobile,password};
          req.session.data=data;
          console.log(req.session.data);
          const otp= randomstring.generate({
            length: 6,
            charset: 'numeric',
          });
          req.session.otp=otp;
          // console.log(otp);

          // Send OTP via email
            const mailOptions = await{
                from: 'nyraproduct@gmail.com',
                to: email,
                subject: 'Your OTP Code for verification',
                text: `Your OTP code is: ${otp}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
          res.redirect('/otp');
        }
        

  }
  catch(error){
    console.log(error.message)
  }
}

//post verify
const postVerifyOtp = async (req, res, next) => {
    try {
    
          const { otp } = req.body;
          if (req.session.otp != null) {
                  if (!isNaN(otp)) {
                    if (otp === req.session.otp) {
                      const passwordHash = await securePassword(req.session.data.password);
                      const newUser = new userModel({
                        name:req.session.data.name,
                      email:req.session.data.email,
                      mobile:req.session.data.mobile,
                    password: passwordHash ,
                    is_admin:false,
                  is_verified:true});
                      const userData = await newUser.save();
                      
                      if (userData) {
                        return res.redirect('/');
                      }
                    } 
                    }}
                    else {
                      return res.render('otp', { message: 'Your registration has failed!!!' });
                    }}
     catch (error) {
        console.log(error.message);
        res.redirect("/otp");
    }
};

const loadOtp = async (req, res) => {
    try {
      res.render('otp',{message:null});
    } catch (error) {
        console.log(error.message);
    }
};

const verifyUser = async (req, res) => {
    try {
      
        const userData = await userModel.findOne({ email: req.body.email });
        if (userData) {
          const isPasswordValid = await bcrypt.compare(req.body.password, userData.password);
          if (isPasswordValid) {
            res.redirect('/home');
          } else {
            res.render('login', { alert: "Login Failed!!!, please verify your email and password" });
          }
        }
      
    } catch (error) {
        console.error(error.message);
    }
};

module.exports = {
    enterHome,
    loadLoginpage,
    loadregisterpage,
    forgotpassword,
    insertUser,
    verifyUser,
    loadOtp,
    postVerifyOtp
};




