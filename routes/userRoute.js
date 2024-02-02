const express = require('express');
const userRoute = express.Router();
const userController = require('../controllers/userController');
const product=require('../controllers/productController');
const {logSession,isAuthenticated } =  require('../middlewares/auth');

userRoute.get('/home',logSession,userController.enterHome);

userRoute.get('/',userController.loadLoginpage);
userRoute.post('/', userController.verifyUser);

userRoute.get('/logout', userController.logout);

userRoute.get('/register', userController.loadregisterpage);
userRoute.post('/register', userController.insertUser);

//otp
userRoute.get('/otp',userController.loadOtp);
userRoute.post('/otp',userController.postVerifyOtp);

userRoute.get('/forgot', userController.forgotpassword);

userRoute.get('/productdetails',logSession,product.loaduserprodetails);

module.exports = userRoute;
