const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');
const {check, validationResult } = require('express-validator');
const {sentOtp,transporter}=require('../config/nodemailer');

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const enterHome = async (req, res) => {
  try {
    res.render('home.ejs');
  } catch (error) {
    console.log(error.message);
  }
};

const loadLoginpage = async (req, res) => {
  try {
    res.render('login.ejs');
  } catch (error) {
    console.log(error.message);
  }
};

//load registration page(get)

const loadregisterpage = async (req, res) => {
  try {
    res.render('register', { errors: [] ,message:null});
  } catch (error) {
    console.log(error.message);
  }
};

const forgotpassword = async (req, res) => {
  try {
    res.render('forgot.ejs');
  } catch (error) {
    console.log(error.message);
  }
};


const insertUser = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    

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

    const errors = validationResult(req).array() ;
   
     
    // const passwordHash = await bcrypt.hash(password, 10);


    
    const existingUser = await userModel.findOne({
      $or: [{
          email: email,
        },
        {
          mobile: mobile,
        },
      ],
    });

    //check existing user 

    if (existingUser) {
      if (existingUser.email === email && existingUser.mobile == mobile) {
         message='Email and phone number is already registered';
       
      } else if (existingUser.email === email) {
       message='Email is already registered' ;
        
      }
      
      else if (existingUser.mobile == mobile) {
        message=' phone number is already registered';
       
      }
     
      return res.render('register', { errors: [], message: message });
    }
      else{
        let passwordHash = await securePassword(password);
        const newUser = new userModel({ name, email, password: passwordHash, mobile });
        if(newUser){
          // Generate OTP and send it via email
        const otp = sentOtp(email);

        // Redirect to the OTP page with email and otp details
        return res.redirect(`/otp?email=${email}&otp=${otp}`);
        }
        // const userData = await newUser.save();

    // if (userData) {
    //   res.render('register', { message: 'Your registration has been successfully completed!!!' });
    // } else {
    //   res.render('register', { message: 'Your registration has failed!!!' });
    // }
      }
      
  } catch (error) {
    console.error(error.message);
    }
    
  };

//post otp
let postVerifyOtp = async (req, res, next) => {
  let { otp } = req.body;

  try {
    // Check if OTP is a valid numeric value
    if (!isNaN(otp)) {
     
      const storedOtp = sentOtp(email);;
      
      // Check if the submitted OTP matches the stored OTP
      if (otp === storedOtp) {
        // OTP matched, proceed to insert user data into the database
        
        // Retrieve user details submitted during registration (you need to implement this logic)
        const userDetails = await getStoredUserDetails(); // Implement this function to retrieve user details
      
        // Create a new user with the retrieved userDetails
        const newUser = new userModel(userDetails);

        // Save the new user to the database
        await newUser.save();

        return res.status(200).send("User registered successfully!");
      } else {
        // Invalid OTP
        return res.status(400).send("Invalid OTP.");
      }
    } else {
      // Invalid OTP format
      return res.status(400).send("Invalid OTP format.");
    }
  } catch (error) {
    console.error(error.message);
   
  }
};

  // load otp
  const loadOtp=async(req,res)=>{
    try{
        res.render('otp');
    }
    catch(error){
        console.log(error.message);
    }

  }


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
