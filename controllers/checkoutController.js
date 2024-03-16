const addressModel = require("../models/addressModel");
const userModel = require("../models/userModels");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const randomstring = require('randomstring');
const crypto = require("crypto");
const wishlistModel=require('../models/wishlistModel')
const walletModel = require('../models/walletModel');

const {generateRazorpay,instance}=require('../config/razorpay');
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const { UpdateModeEnum } = require("chart.js");
const fs = require('fs');


async function generateUniqueOrderID() {

    const randomPart= randomstring.generate({
        length: 6,
        charset: 'numeric',
      });
   
  
  
    const currentDate = new Date();
  
    
    const datePart = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  
   
    const orderID = `ID_${randomPart}${datePart}`;
  
    return orderID;
  }

const loadcheckout=async(req,res)=>{
    try{
        const user=await userModel.findOne({email:req.session.email});
        const cart=await cartModel.findOne({owner:user._id}).populate({ path: 'items.productId', model: 'Products' }) || null;
        let address=await addressModel.findOne({user:user._id});
        let wish=await wishlistModel.findOne({user:user._id}) || null;
       
        if(!address){
          address=null;
        }
        
        res.render('checkout',{address:address,cart:cart,wish});
    }
    catch(error){
        console.log('load check out',error.message);
    }
};



const Postcheckout = async (req,res) => {
    try {
        const paymentOption=req.body.paymentOption ;
        const address= req.body.addressType || 'home';

        
       
        const user = await userModel.findOne({ email: req.session.email });
        const cart = await cartModel.findOne({ owner: user._id });
        if (!cart) {
            return res.status(400).json({ message: "Cart not found" });
        }

        const OrderAddress = await addressModel.findOne({ user: user._id });
        if (!OrderAddress) {
            return res.status(400).json({ message: "Address not found" });
        }

        const addressdetails = OrderAddress.addresses.find(
            (item) => item.addressType === address
        );
        if (!addressdetails) {
            return res.status(400).json({ message: "Invalid address ID" });
        }

      

        const selectedItems = cart.items;

        for (const item of selectedItems) {
            const product = await productModel.findOne({ _id: item.productId });
         
            if(product.countInStock===0){
              return res.status(400).json({ message: "product Out of stock" });
            }
            if (product) {
                if (product.countInStock >= item.quantity) {
                    product.countInStock -= item.quantity;
                    product.popularity ++;
              
                    await product.save();
                } 
                
            } else {
                console.log('Product not found');
            }
        }

        const order_id = await generateUniqueOrderID();

        if(paymentOption==='COD'){
          const orderData = new orderModel({
            user: user._id,
            cart: cart._id,
            items: selectedItems,
            billTotal: cart.billTotal, 
            oId: order_id,
            paymentStatus: "Success",
            paymentMethod: paymentOption,
            deliveryAddress: addressdetails,
            coupon:cart.coupon,
            discountPrice:cart.discountPrice
        });

        await orderData.save();
        
        cart.items = [];
        await cart.save();

         res.status(200).json({
          success: true,
          message: "Order placed successfully.",
          orderId:order_id ,
      });

        }else if(paymentOption==='razorpay'){
         
          var instance = new Razorpay({
          key_id: 'rzp_test_2sQVid1X3uLewM',
          key_secret: '9O1FvD9eQj4ZmHMAP4ygy0fO',
          });

          var options = {
          amount:cart.billTotal*100,  
          currency: "INR",
          receipt: order_id
          };
        
          instance.orders.create(options, async (err, razorpayOrder) => {
            if (!err) {
            
                res.status(201).json({
                    success: true,
                    message: "Order placed successfully.",
                    order: razorpayOrder,
                });
            } else {
                console.error("Error creating Razorpay order:", err);
                res.status(400).json({
                    success: false,
                    message: "Something went wrong!",
                    error: err.message, 
                });
            }
        });
        


        }else{
         
        let wallet = await walletModel.findOne({ user: user._id });
            if (!wallet || wallet.balance<cart.billTotal) {
              
              return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance",
            });
            }
            wallet.balance -= cart.billTotal;
            wallet.transactions.push({
                amount: -cart.billTotal,
                type: 'debit',
                description: 'purchase with wallet'
            });
    
            await wallet.save();
            
            const orderData = new orderModel({
              user: user._id,
              cart: cart._id,
              items: selectedItems,
              billTotal: cart.billTotal, 
              oId: order_id,
              paymentStatus: "Success",
              paymentMethod: paymentOption,
              deliveryAddress: addressdetails,
              coupon:cart.coupon,
              discountPrice:cart.discountPrice
          });
  
          await orderData.save();
          
          cart.items = [];
          await cart.save();
         res.status(200).json({
          success: true,
          message: "Order placed successfully.",
          orderId:order_id ,
      });
        }
        
    } catch (error) {
        console.log('Post checkout error:', error.message);
        res.status(500).json({ message: "Internal server error" });
        res.redirect('/home');
    }
};

const orderConfirmation=async(req,res)=>{
    try{
        
        const user=await userModel.findOne({email:req.session.email});
        const cart=await cartModel.findOne({owner:user._id}) || null;
        let wish=await wishlistModel.findOne({user:user._id}) || null;
        await cartModel.findOneAndUpdate({owner:user._id},{
        $set:{
          items:[]
        }
      })
        const order=await orderModel.findOne({oId:req.query.orderId})
       
        res.render('orderconfirmation',{order:order,wish,cart});
    }
    catch(error){
        console.log('order confirmation:',error.message);
        res.redirect('/home');
    }
}

const loadOrderdetail=async(req,res)=>{
    try{
        const order=await orderModel.findOne({oId:req.query.oId}).populate('User');
        const user=await userModel.findOne({email:req.session.email});
        const cart=await cartModel.findOne({owner:user._id}) || null;
        let wish=await wishlistModel.findOne({user:user._id}) || null;
        if(req.query.pdf){
          let doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');

    doc.pipe(res);

    doc.fontSize(20).text('Invoice', { align: 'center' });
    
    doc.fontSize(16).text(`Order ID: ${order.oId}`);
    doc.fontSize(16).text(`User: ${order.user.name}`); 
    

    doc.end();
        }
        res.render('order-detail',{order,wish,cart});
    }catch(error){
        console.log('loadOrderdetail',error.message);
    }

}

const razorpayVerify = async (req, res) => {
  try {

 

    const address = req.body.address || 'home';

    const user = await userModel.findOne({ email: req.session.email });
    const cart = await cartModel.findOne({ owner: user._id });

    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const OrderAddress = await addressModel.findOne({ user: user._id });

    if (!OrderAddress) {
      return res.status(400).json({ message: "Address not found" });
    }

    const addressdetails = OrderAddress.addresses.find(item => item.addressType === address);

    if (!addressdetails) {
     
    }

    const secretKey = 'rzp_test_2sQVid1X3uLewM'; 

    let expectedSignature = crypto .createHmac("sha256", secretKey)

    expectedSignature.update(req.body.razorpay_order_id+"|"+req.body.razorpay_payment_id) 
    expectedSignature=expectedSignature.digest("hex");



    // if (expectedSignature === req.body.razorpay_signature) {
      const orderData = new orderModel({
        user: user._id,
        cart: cart._id,
        items: cart.items, 
        billTotal: cart.billTotal, 
        oId: req.body.razorpay_order_id, 
        paymentStatus: "Success",
        paymentMethod: 'razorpay',
        deliveryAddress: addressdetails,
        coupon: cart.coupon,
        discountPrice: cart.discountPrice
      });

      await orderData.save();
    
      cart.items = [];
      await cart.save();
      res.json({ success: true, message: "Order processed successfully", orderId: req.body.razorpay_order_id });

      
    // } 
   
  } catch (err) {
    console.log(err.message);
    return res.status(500).send("Internal Server Error");
  }
}

const failedPayment = async (req, res) => {
  try {
      const { email } = req.session;
     
      const address = req.body.address || 'home';
      const user = await userModel.findOne({ email });
      
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
      }
      const OrderAddress = await addressModel.findOne({ user: user._id });

      if (!OrderAddress) {
        return res.status(400).json({ message: "Address not found" });
      }
  
      const addressdetails = OrderAddress.addresses.find(item => item.addressType === address);
  
      if (!addressdetails) {
       
      }
      const cart = await cartModel.findOne({ owner: user._id });
      
      if (!cart) {
          return res.status(404).json({ success: false, message: "Cart not found" });
      }
      const order_id = await generateUniqueOrderID();
      const orderData = new orderModel({
          user: user._id,
          cart: cart._id,
          items: cart.items, 
          billTotal: cart.billTotal, 
          oId: order_id, 
          paymentStatus: "Pending",
          paymentMethod: 'razorpay',
          deliveryAddress: addressdetails, 
          coupon: cart.coupon,
          discountPrice: cart.discountPrice
      });

      await orderData.save();
    
      // Clear cart items after order creation
      cart.items = [];
      await cart.save();

      return res.json({ success: true, message: "Order processed successfully", orderId: order_id });
  } catch (error) {
      console.error('Failed Payment:', error);
      return res.status(500).json({ success: false, message: "Failed to process order. Please try again later" });
  }
};

const retryPayment=async(req,res)=>{
  try{
  
const id=req.body.id;
const order=await orderModel.findOne({oId:id});

var instance = new Razorpay({
  key_id: 'rzp_test_2sQVid1X3uLewM',
  key_secret: '9O1FvD9eQj4ZmHMAP4ygy0fO',
  });

  var options = {
  amount:order.billTotal*100,  
  currency: "INR",
  receipt: id
  };

  instance.orders.create(options, async (err, razorpayOrder) => {
    if (!err) {
   
        res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            order: razorpayOrder,
        });
    } else {
        console.error("Error creating Razorpay order:", err);
        res.status(400).json({
            success: false,
            message: "Something went wrong!",
            error: err.message, 
        });
    }
});

  }
  catch(error){
console.log(error.message);
  }
}

const verifyPayment=async(req,res)=>{
try{
  
  const id=req.body.id;
  console.log(id);
  const order=await orderModel.findOneAndUpdate({oId:id},{paymentStatus:'Success'});
  console.log(order);
  res.json({ success: true, message: "Order processed successfully", orderId: id });

}
catch(error){
console.log(error.message);
}
}

module.exports={
    loadcheckout,
    Postcheckout,
    orderConfirmation,
    loadOrderdetail,
    razorpayVerify,
    failedPayment,
    retryPayment,
    verifyPayment
}