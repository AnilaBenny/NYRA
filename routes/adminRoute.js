const express = require('express');
const admin_route=express();
const product = require('../controllers/productController');
const multer=require('multer');
const {AdminLogSession,adminisLogout}=require('../middlewares/auth')
const wallet=require('../controllers/walletController');



const adminController=require('../controllers/adminController');
const category=require('../controllers/categoryController')


const storage=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'./uploads/productImages');
  
  },
  filename:function(req,file,cb){
   
    cb(null,file.originalname);
  }
  });

  const upload=multer({storage:storage}).array('images', 3);



admin_route.get('/',adminisLogout,adminController.adminLogin);

admin_route.post('/',adminisLogout,adminController.adminPost);

admin_route.get('/logout',adminController.logout);


admin_route.get('/adminpanel',AdminLogSession,adminController.loadPanel);


admin_route.get('/adminCategory',AdminLogSession,category.loadCategory);
admin_route.post('/adminCategory',AdminLogSession,category.insertCategory);


admin_route.get('/edit-cate',AdminLogSession,category.loadcateedit);
admin_route.post('/edit-cate',AdminLogSession,category.upcateedit);


admin_route.get('/delete-cate',AdminLogSession,category.deletecate);

admin_route.get('/productmanagement',AdminLogSession,product.loadproduct);
admin_route.post('/productmanagement',AdminLogSession,upload,product.insertproduct);

admin_route.get('/productlist',AdminLogSession,product.productlist);

admin_route.get('/edit-pro',AdminLogSession,product.loadpro);

admin_route.post('/edit-pro',AdminLogSession,upload,product.updatepro);

admin_route.get('/delete-pro',AdminLogSession,product.deletepro);

admin_route.get('/userManage',AdminLogSession,adminController.loadusermanagement);

admin_route.post('/blockUser',AdminLogSession,adminController.userblock);

admin_route.get('/order-list',AdminLogSession,adminController.loadordermanagement);

admin_route.get('/orderdetails',AdminLogSession,adminController.loadorderdetail);

admin_route.post('/acceptcancel',AdminLogSession,adminController.requestAccept);

admin_route.post('/rejectcancel',AdminLogSession,adminController.requestCancel);

admin_route.post('/uporderstatus',AdminLogSession,adminController.uporder);

admin_route.get('/coupon',AdminLogSession,adminController.couponManager);

admin_route.post('/coupon',AdminLogSession,adminController.couponCreate);

admin_route.post('/coupon/list',AdminLogSession,adminController.listunlist);

admin_route.get('/salesdetails',AdminLogSession,adminController.salesdetails);

admin_route.post('/filterData',adminController.filterData);

admin_route.get('/pdf',AdminLogSession,adminController.pdf);

admin_route.get('/excel',AdminLogSession,adminController.generateExcel);

admin_route.post('/refund',wallet.addtoWallet);

admin_route.get('/bestSelling',AdminLogSession,adminController.bestSelling);

admin_route.get('/offer',AdminLogSession,adminController.offer);

admin_route.post('/productoffer',product.postOffer);
admin_route.post('/offer',product.postOffer2);



module.exports=admin_route;