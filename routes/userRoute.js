const express = require('express');
const userRoute = express.Router();
const userController = require('../controllers/userController');

userRoute.get('/home', userController.enterHome);

userRoute.get('/', userController.loadLoginpage);
userRoute.post('/', userController.verifyUser);

userRoute.get('/register', userController.loadregisterpage);
userRoute.post('/register', userController.insertUser);

//otp
userRoute.get('/otp',userController.loadOtp);
userRoute.post('/otp',userController.postVerifyOtp);

userRoute.get('/forgot', userController.forgotpassword);

module.exports = userRoute;
