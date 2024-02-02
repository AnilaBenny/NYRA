const express = require('express');
const admin_route=express();
const product = require('../controllers/productController');
const multer=require('multer');



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
admin_route.get('/',adminController.adminLogin);

admin_route.post('/',adminController.adminPost);

//adminpanel
admin_route.get('/adminpanel',adminController.loadPanel);

//load category
admin_route.get('/adminCategory',category.loadCategory);
admin_route.post('/adminCategory',category.insertCategory);

//edit category
admin_route.get('/edit-cate',category.loadcateedit);
admin_route.post('/edit-cate',category.upcateedit);

//delete category
admin_route.get('/delete-cate',category.deletecate);

//load product add
admin_route.get('/productmanagement',product.loadproduct);
admin_route.post('/productmanagement',upload,product.insertproduct);

//load productlist
admin_route.get('/productlist',product.productlist);

//edit product
admin_route.get('/edit-pro',product.loadpro);
admin_route.post('/edit-pro',upload,product.updatepro);

//delete product
admin_route.get('/delete-pro',product.deletepro);

//userManagement
admin_route.get('/userManage',adminController.loadusermanagement);

// Express route handler for blocking/unblocking user
admin_route.post('/blockUser',adminController.userblock);

module.exports=admin_route;