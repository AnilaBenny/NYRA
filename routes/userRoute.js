const express = require('express');
const userRoute = express.Router();
const userController = require('../controllers/userController');
const product=require('../controllers/productController');
const cart=require('../controllers/cartController');
const checkout=require('../controllers/checkoutController');
const {logSession,isLogout } =  require('../middlewares/auth');



userRoute.get('/',isLogout,userController.loadLoginpage);
userRoute.post('/',isLogout,userController.verifyUser);

userRoute.get('/logout',userController.logout);

userRoute.get('/register',isLogout, userController.loadregisterpage);
userRoute.post('/register',isLogout, userController.insertUser);

//otp
userRoute.get('/otp',isLogout,userController.loadOtp);
userRoute.post('/otp',isLogout,userController.postVerifyOtp);
userRoute.post('/resendotp',isLogout,userController.resendOtp);


userRoute.get('/forgot',isLogout, userController.forgotpassword);
userRoute.post('/forgot',isLogout,userController.postforgot);
userRoute.get('/reset',isLogout,userController.loadreset);
userRoute.post('/reset',isLogout,userController.postreset);

userRoute.get('/home',logSession,userController.enterHome);

userRoute.get('/productdetails',logSession,product.loaduserprodetails);

userRoute.get('/userAc',logSession,userController.loaduserAc);
userRoute.post('/userAc',logSession,userController.editprofile);

userRoute.get('/editAddress',logSession,userController.loadAddadd);
userRoute.post('/editAddress',logSession,userController.userAddAddress);
userRoute.get('/address-del',logSession,userController.deleteAddress);
userRoute.get('/address-edit',logSession,userController.loadeditAddress);
userRoute.post('/address-edit',logSession,userController.editAddress);

userRoute.post('/add-to-cart',logSession,cart.addTocart);
userRoute.get('/cart',logSession,cart.showcart);
userRoute.post('/cart-delete',logSession,cart.deleteCart);
userRoute.post('/update-cart-quantity',logSession,cart.updateCart);

userRoute.get('/shop',logSession,product.showproduct);

userRoute.get('/checkout',logSession,checkout.loadcheckout);
userRoute.post('/checkout',logSession,checkout.Postcheckout);

userRoute.get('/orderConfirmation',logSession,checkout.orderConfirmation);
userRoute.get('/myorder',logSession,userController.loadorderpage);

userRoute.post('/myorder',logSession,userController.deleteorder);





module.exports = userRoute;
