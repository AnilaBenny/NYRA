const express = require('express');
const admin_route=express();
const product = require('../controllers/productController');
const multer=require('multer');
const {AdminLogSession,adminisLogout}=require('../middlewares/auth')



//controller connection
const adminController=require('../controllers/adminController');
const category=require('../controllers/categoryController')

//multer setup
const storage=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'./uploads/productImages');
  
  },
  filename:function(req,file,cb){
   
    cb(null,file.originalname);
  }
  });

  const upload=multer({storage:storage}).array('images', 3);//directly placed


//login
admin_route.get('/',adminisLogout,adminController.adminLogin);

admin_route.post('/',adminisLogout,adminController.adminPost);

//adminpanel
admin_route.get('/adminpanel',AdminLogSession,adminController.loadPanel);

//load category
admin_route.get('/adminCategory',AdminLogSession,category.loadCategory);
admin_route.post('/adminCategory',AdminLogSession,category.insertCategory);

//edit category
admin_route.get('/edit-cate',AdminLogSession,category.loadcateedit);
admin_route.post('/edit-cate',AdminLogSession,category.upcateedit);

//delete category
admin_route.get('/delete-cate',AdminLogSession,category.deletecate);

//load product add
admin_route.get('/productmanagement',AdminLogSession,product.loadproduct);
admin_route.post('/productmanagement',AdminLogSession,upload,product.insertproduct);

//load productlist
admin_route.get('/productlist',AdminLogSession,product.productlist);

//edit product
admin_route.get('/edit-pro',AdminLogSession,product.loadpro);
admin_route.post('/edit-pro',AdminLogSession,upload,product.updatepro);

//delete product
admin_route.get('/delete-pro',AdminLogSession,product.deletepro);

//userManagement
admin_route.get('/userManage',AdminLogSession,adminController.loadusermanagement);

// blocking/unblocking user
admin_route.post('/blockUser',AdminLogSession,adminController.userblock);

admin_route.get('/order-list',AdminLogSession,adminController.loadordermanagement);

admin_route.get('/orderdetails',AdminLogSession,adminController.loadorderdetail);

admin_route.post('/acceptcancel',AdminLogSession,adminController.orderAccept);

admin_route.post('/rejectcancel',AdminLogSession,adminController.orderCancel);

admin_route.post('/uporderstatus',AdminLogSession,adminController.uporder);

//coupon
admin_route.get('/coupon',AdminLogSession,adminController.couponManager);

admin_route.post('/coupon',AdminLogSession,adminController.couponCreate);

admin_route.post('/coupon/list',AdminLogSession,adminController.listunlist);

admin_route.get('/salesdetails',AdminLogSession,adminController.salesdetails)


module.exports=admin_route;