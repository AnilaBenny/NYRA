const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');
const {check, validationResult } = require('express-validator');

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

const loadregisterpage = async (req, res) => {
  try {
    res.render('register', { errors: [] });
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
    console.log(errors);
    if (errors.length>0) {
        return res.render('register', { errors: errors});
      }

    // Proceed with saving user if validations pass...

    if (userData) {
      res.render('register', { message: 'Your registration has been successfully completed!!!' });
    } else {
      res.render('register', { message: 'Your registration has failed!!!' });
    }
  } catch (error) {
    console.error(error);
    res.render('register', { message: 'An error occurred during registration!!!' });
  }
};




// const insertUser = async (req, res) => {
//     let errors = [];
//     try {
//       const { name, email, mobile, password, confirmPassword } = req.body;
      
  
//       // Custom validation functions
//       const validateName = (value) => {
//         if (!value || value.trim() === '') {
//           throw new Error('Name is required');
//         }
//         // Additional validation rules for name if needed
//       };
  
//       const validateEmail = (value) => {
//         if (!value || value.trim() === '') {
//           throw new Error('Email is required');
//         }
//         // Additional validation rules for email if needed
//       };
  
//       const validateMobile = (value) => {
//         if (!value || value.trim() === '') {
//           throw new Error('Mobile number is required');
//         }
//         // Additional validation rules for mobile if needed
//       };
  
//       const validatePassword = (value) => {
//         if (!value || value.trim() === '') {
//           throw new Error('Password is required');
//         }
//         // Additional validation rules for password if needed
//       };
  
//       // Perform custom validations
//       validateName(name);
//       validateEmail(email);
//       validateMobile(mobile);
//       validatePassword(password);
  
//       if (password !== confirmPassword) {
//         errors.push({ param: 'confirmPassword', msg: 'Passwords do not match' });
//       }
  
//       // Proceed with saving user if validations pass
//       const passwordHash = await bcrypt.hash(password, 10);
//       const newUser = new userModel({ name, email, password: passwordHash, mobile });
//       const userData = await newUser.save();
  
//       if (userData) {
//         res.render('register', { message: 'Your registration has been successfully completed!!!' });
//       } else {
//         res.render('register', { message: 'Your registration has failed!!!' });
//       }
//     } catch (validationError) {
//       // Add field-specific error messages to the errors array
//       if (validationError.message.includes('Name')) {
//         errors.push({ param: 'name', msg: validationError.message });
//       }
//       if (validationError.message.includes('Email')) {
//         errors.push({ param: 'email', msg: validationError.message });
//       }
//       if (validationError.message.includes('Mobile number')) {
//         errors.push({ param: 'mobile', msg: validationError.message });
//       }
//       if (validationError.message.includes('Password')) {
//         errors.push({ param: 'password', msg: validationError.message });
//       }
//       console.log('Validation Errors:', errors);
//       res.render('register', { errors });
//     }
//   };
  
  
  


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
  verifyUser
};
