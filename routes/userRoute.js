const express = require('express');
const user_route=express();
//controller connection
const userController=require('../controllers/userController')

user_route.get('/home',userController.loadLogin);

user_route.get('/login',userController.loadLoginpage);

user_route.get('/register',userController.loadregisterpage);

user_route.post('/register',userController.insertUser);

user_route.get('/forgot',userController.forgotpassword);



module.exports=user_route;