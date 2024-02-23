const adminModel = require('../models/adminModel');
const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');
const orderModel=require('../models/orderModel');
const productModel=require('../models/productModel');
const {couponModel}=require('../models/couponModel');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


async function salesReport(date){
try{
    const currentDate = new Date();
    let orders = [];
    for (let i = 0; i < date; i++) {
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() - i);
        endDate.setHours(23, 59, 59, 999);  
    
        const dailyOrders = await orderModel.find({
          status: "Delivered",
          orderDate: {
            $gte: startDate,
            $lt: endDate,
          },
        });
        
    
        orders = [...orders, ...dailyOrders];
      }

      let productEntered = [];
      for (let i = 0; i < date; i++) {
          const startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - i);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() - i);
          endDate.setHours(23, 59, 59, 999);  
      
          const product = await productModel.find({
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
          });
          
      
          productEntered= [...productEntered, ...product];
        }
      let users = await userModel.countDocuments();
     

      let totalRevenue = 0;
      orders.forEach((order) => {
        totalRevenue += order.billTotal;
      });
    
      let totalOrderCount = await orderModel.find({
        status: "Delivered",
      });
    
      let Revenue = 0;
      totalOrderCount.forEach((order) => {
        Revenue += order.billTotal;
      });
    
      let stock = await productModel.find();
      let totalCountInStock = 0;
      stock.forEach((product) => {
        totalCountInStock += product.countInStock;
      });
    
      let averageSales = orders.length / date; 
      let averageRevenue = totalRevenue / date; 
    
     
      return {
        users,
        totalOrders: orders.length,
        totalRevenue,
        totalOrderCount: totalOrderCount.length,
        totalCountInStock,
        averageSales,
        averageRevenue,
        Revenue,
        productEntered:productEntered.length
      };
}
catch(err){
console.log('salesreport',err.message);
}
}

async function orderPieChart() {
    const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Canceled", "Returned"];
    const counts = await Promise.all(statuses.map(status => orderModel.countDocuments({ status })));

    // console.log(counts);

    const [Pending, Processing, Shipped, Delivered, Canceled, Returned] = counts;

    return { Pending, Processing, Shipped, Delivered, Canceled, Returned };
}


// Admin login (get)
let adminLogin = async (req, res) => {
    try {
        res.render('admin-login', { err: null });
    } catch (error) {
        console.error("Error in adminLogin:", error);
        
    }
};

// Admin login (post)
let adminPost = async (req, res) => {
    try {
        const { email, password} = req.body;
        //console.log(email, password);
  
        
        const adminExist = await adminModel.findOne({
            adminEmail: email,
          });
        //console.log(adminExist);

        if (adminExist) {
            // Compare passwords
           
            if (password===adminExist.adminPassword) {
               
                req.session.admin = true;
                return res.redirect("/admin/adminpanel");
            } else {
              
                return res.render("admin-login", { err: "Invalid email or password" });
            }
        } else {
           
            return res.render("admin-login", { err: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Error during login:", error);
      
    }
};

// Admin logout
let adminLogout = (req, res) => {
    req.session.admin = false;
    console.log("Session destroyed");
    res.redirect("/admin");
};

// Admin panel (get)
const loadPanel = async (req, res) => {
    try {
        let daily = await salesReport(1);
        let weekly = await salesReport(7);
        let monthly = await salesReport(30);
        let yearly = await salesReport(365);
        let allProductsCount = await productModel.countDocuments();
        let orders=await orderModel.find().populate('user');
        
        //pie chart
        let orderChart=await orderPieChart();
        console.log(orderChart);

        // console.log(daily,weekly,monthly,yearly,allProductsCount,orders);
        res.render('adminpanel.ejs',{daily,weekly,monthly,yearly,allProductsCount,orders,orderChart});
    } catch (error) {
        console.error(error);
     
    }
};

const loadusermanagement = async (req, res) => {
    try {
        const userdetails = await userModel.find();
        console.log(userdetails)
        res.render('user-management', { users: userdetails });
    } catch (error) {
        console.log(error.message);
    }
};

let userblock = async (req, res) => {
    try {
        const { id } = req.body;
        const userData = await userModel.findById(id);
        if(userData.isBlocked){
            await userModel.findByIdAndUpdate({_id:id},{$set:{ isBlocked:false}});
            await userData.save(); // Save the updated user data
            res.status(200).json({ status: true, users: userData });
        }
        else{
            await userModel.findByIdAndUpdate({_id:id},{$set:{ isBlocked:true}});
            await userData.save(); // Save the updated user data
            res.status(201).json({ status: true, users: userData });
        } 
        } 
     catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }};

    const loadordermanagement = async (req, res) => {
        try {
        
            const order = await orderModel.find().populate('user');
            //console.log(orders);
            res.render('admin-orderlist', { order });
        } catch (err) {
            console.error('Error in load order management:', err.message);
            
        }
    };

    const orderAccept = async (req, res) => {
        try {
            const { orderId } = req.body;
    
            const canceledOrder = await orderModel.findOne({ oId: orderId });
    
            if (!canceledOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
    
            // Restore stock count for products associated with the canceled order
            for (const orderItem of canceledOrder.items) {
                const product = await productModel.findById(orderItem.productId);
    
                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
    
            if(canceledOrder.requests[0].type==='Cancel'){
            const updatedOrder = await orderModel.findOneAndUpdate(
                { oId: orderId },
                { $set: { status: 'Canceled', 'requests.$[elem].status': 'Accepted' } },
                { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
            );}else{
                 await orderModel.findOneAndUpdate(
                    { oId: orderId },
                    { $set: { status: 'Returned', 'requests.$[elem].status': 'Accepted' } },
                    { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
                );
            }
            
    
            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
    
            return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
    

const orderCancel=async(req,res)=>{
    try {
        const { orderId} = req.body;
        //console.log(id);

            const Order = await orderModel.findOne({oId:orderId});

            if (!Order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
        
        for (const orderItem of Order.items) {
            const product = await productModel.findById(orderItem.productId);

            if (product &&product.countInStock>0 ) {
             
                product.countInStock -= orderItem.quantity;
                await product.save();
            }
        }
    
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            { $set: { status: 'Pending', 'requests.$[elem].status': 'Rejected' } },
            { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
        );
        

    if (!updatedOrder) {
        
        return res.status(201).json({ success: true, message: 'Order not found' });
        
    }
    

    return res.status(200).json({ success: true, message: 'Order status rejected', updatedOrder })
     }catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

const loadorderdetail=async(req,res)=>{
    try{
        
        const orders = await orderModel.findById(req.query.id).populate('user');
        //console.log(orders);
        res.render('adminorderdetail',{orders});

    }catch(error){
        console.log('load order detail:',error.message);
    }
}

const uporder=async(req,res)=>{
    try{
        const {newStatus,orderId}=req.body;
        console.log(newStatus,orderId);
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            {$set:{ status: newStatus } },
            { new: true }
        );
          
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    }
    catch(error){
        console.log('uporder:',error.message);
    }

}

const couponManager=async(req,res)=>{
    try{
        const coupons=await couponModel.find({});
        res.render('admincoupon',{coupons});
    }
    catch(error){
        console.log('coupon manager',error.message);
    }

}

const couponCreate=async(req,res)=>{
    try{
        const {
            code,
            description,
            discountPercentage,
            maxDiscountAmount,
            minimumAmount,
            maximumAmount,
            expirationDate,
            maxUsers
        }=req.body;
        console.log(code,
            description,
            discountPercentage,
            maxDiscountAmount,
            minimumAmount,
            maximumAmount,
            expirationDate,
            maxUsers);
            const coupon = new couponModel({
                code,
                description,
                maxDiscountAmount,
                minimumAmount,
                maximumAmount,
                discountPercentage: discountPercentage,
                expirationDate,
                maxUsers: maxUsers > 0 ? maxUsers : null, 
              });
              await coupon.save();
              res.redirect('/admin/coupon')

    }
    catch(error){
        console.log('coupon creation:',error.message);
    }

}

const listunlist=async(req,res)=>{
    try{
        const coupon=await couponModel.findById(req.body.id);
        if(coupon.isActive){
            await couponModel.findByIdAndUpdate({_id:req.body.id},{$set:{ isActive:false}});
            await coupon.save(); 
            res.status(200);
           
        }
        else{
            await couponModel.findByIdAndUpdate({_id:req.body.id},{$set:{ isActive:true}});
            await coupon.save(); 
            res.status(201);
        } 
       
        
    }
    catch(error){
        console.log(error.message);
    }

}

const salesdetails=async(req,res)=>{
try{
const order=await orderModel.find().populate('user');
res.render('salesdetails',{order});
}
catch(err){
    console.log('sales details',err.message);
}
}

module.exports = {
    adminLogin,
    adminPost,
    loadPanel,
    adminLogout,
    loadusermanagement,
    userblock,
    loadordermanagement,
    orderCancel,
    orderAccept,
    loadorderdetail,
    uporder,

    couponManager,
    couponCreate,
    listunlist

    ,salesdetails
};
