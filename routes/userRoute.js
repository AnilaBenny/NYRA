const express = require('express');
const userRoute = express.Router();
const userController = require('../controllers/userController');
const product=require('../controllers/productController');
const cart=require('../controllers/cartController');
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
userRoute.post('/resendotp',userController.resendOtp);



userRoute.get('/forgot', userController.forgotpassword);
userRoute.post('/forgot',userController.postforgot);
userRoute.get('/reset',userController.loadreset);
userRoute.post('/reset',userController.postreset);

userRoute.get('/productdetails',logSession,product.loaduserprodetails);

userRoute.get('/userAc',userController.loaduserAc);
userRoute.post('/userAc',userController.editprofile);

userRoute.get('/editAddress',userController.loadAddadd);
userRoute.post('/editAddress',logSession,userController.userAddAddress);
userRoute.get('/address-del',userController.deleteAddress);
userRoute.get('/address-edit',userController.loadeditAddress);
userRoute.post('/address-edit',userController.editAddress);

userRoute.get('/add-to-cart',cart.addTocart);





module.exports = userRoute;
