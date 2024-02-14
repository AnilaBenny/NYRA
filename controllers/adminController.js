const adminModel = require('../models/adminModel');
const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');
const orderModel=require('../models/orderModel');

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
        console.log(email, password);
  
        // Find admin by email
        const adminExist = await adminModel.findOne({
            adminEmail: email,
          });
        console.log(adminExist);

        if (adminExist) {
            // Compare passwords
           
            if (password===adminExist.adminPassword) {
                // If password is valid, set session and redirect to admin panel
                req.session.admin = true;
                return res.redirect("/admin/adminpanel");
            } else {
                // If password is invalid, return error
                return res.render("admin-login", { err: "Invalid email or password" });
            }
        } else {
            // If admin does not exist, return error
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
        res.render('adminpanel.ejs');
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

    const loadordermanagement=async(req,res)=>{
        try{
            
            
            const order= await orderModel.find().populate('user');
            res.render('admin-orderlist',{order})
        }
        catch(err){
            console.log('error in load order management:',err.message);
        }
    }
    const orderCancel = async (req, res) => {
        try {
            const { id,type} = req.body;
            console.log(id,type);
            
            if (type === 'Cancel') {
               
                const canceledOrder = await orderModel.findOne({oId:id});
    
                if (!canceledOrder) {
                    return res.status(404).json({ success: false, message: 'Order not found' });
                }
            
            for (const orderItem of canceledOrder.items) {
                const product = await productModel.findById(orderItem.productId);

                if (product) {
                 
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
        }
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: id },
            { status: 'Canceled','requests.status':'Accepted', 'requests.type':null},
            { new: true }
        );

        if (!updatedOrder) {

            
            return res.status(201).json({ success: true, message: 'Order not found' });
            
        }
        

        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder })
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: 'Internal server error' });
        }
    };
    

const orderAccept=async(req,res)=>{
    try {
        const { id,status } = req.body;
        console.log(id,status);
        if (status === 'Pending') {
           
            const Order = await orderModel.findOne({oId:id});

            if (!Order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
        
    //     for (const orderItem of Order.items) {
    //         const product = await productModel.findById(orderItem.productId);

    //         if (product) {
             
    //             product.countInStock += orderItem.quantity;
    //             await product.save();
    //         }
    //     }
    }
    const updatedOrder = await orderModel.findOneAndUpdate(
        { oId: id },
        { status: 'Processing'},
        { new: true }
    );

    if (!updatedOrder) {
        
        return res.status(201).json({ success: true, message: 'Order not found' });
        
    }
    

    return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder })
     }catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
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
    orderAccept
};
