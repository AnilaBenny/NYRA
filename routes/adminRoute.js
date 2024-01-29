const express = require('express');
const admin_route=express();

//controller connection
const adminController=require('../controllers/adminController');

//login
admin_route.get('/',adminController.adminLogin);
admin_route.post('/',adminController.adminPost);

//adminpanel
admin_route.get('/adminpanel',adminController.loadPanel);


module.exports=admin_route;