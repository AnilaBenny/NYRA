const express = require('express');
const userController = require('../controllers/userController');
const product=require('../controllers/productController');
const cart=require('../controllers/cartController');
const checkout=require('../controllers/checkoutController');
const {logSession,isLogout } =  require('../middlewares/auth');
const coupon=require('../controllers/couponController');
const wishlist=require('../controllers/wishlistController')

const userRoute = express.Router();


userRoute.get('/',isLogout,userController.loadLoginpage);
userRoute.post('/',isLogout,userController.verifyUser);

userRoute.get('/logout',userController.logout);

userRoute.get('/register',isLogout,userController.loadregisterpage);
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
userRoute.post('/cart',coupon.Couponcart);
userRoute.post('/cart-delete',cart.deleteCart);
userRoute.post('/update-cart-quantity',cart.updateCart);

userRoute.get('/shop',logSession,product.showproduct);
userRoute.get('/allProduct',logSession,product.allProduct);

userRoute.get('/checkout',logSession,checkout.loadcheckout);
userRoute.post('/checkout',checkout.Postcheckout);

userRoute.post('/orderOnlinePayment',logSession,checkout.razorpayVerify);

userRoute.get('/orderConfirmation',logSession,checkout.orderConfirmation);
userRoute.get('/myorder',logSession,userController.loadorderpage);

userRoute.post('/myorder',logSession,userController.deleteorder);

userRoute.post('/return',logSession,userController.reqreturn);

userRoute.get('/orderDetails',logSession,checkout.loadOrderdetail);

userRoute.get('/applycoupon',logSession,coupon.Couponcart);
userRoute.get('/removecoupon',logSession,coupon.removeCoupon);

userRoute.get('/addToWishlist',logSession,wishlist.addToWishlist);
userRoute.get('/removeWishlist',logSession,wishlist.removeWishlist);
userRoute.get('/wishlist',logSession,wishlist.loadWishlist);

userRoute.get('/search',logSession,product.showsearch);

userRoute.post('/addtocartIn',cart.addToCartIn);
userRoute.get('/newArrivals',userController.newArrivals)




module.exports = userRoute;
