const addressModel = require("../models/addressModel");
const userModel = require("../models/userModels");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const randomstring = require('randomstring');
const crypto = require("crypto");

const {generateRazorpay,instance}=require('../config/razorpay');

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
        const cart=await cartModel.findOne({owner:user._id});
        const address=await addressModel.findOne({user:user._id});
        //console.log(cart);

        res.render('checkout',{address:address,cart:cart});
    }
    catch(error){
        console.log('load check out',error.message);
    }
};



const Postcheckout = async (req,res) => {
    try {
        const paymentOption=req.body.paymentOption || 'COD';
        const address= req.body.address || 'home';

        //console.log(paymentOption, address);
        // if(!address || !paymentOption){
        //     res.render('/checkout?error=Please select both an address and a payment option');

        // }
       
        const user = await userModel.findOne({ email: req.session.email });
        const cart = await cartModel.findOne({ owner: user._id });
        if (!cart) {
            //return res.status(400).json({ message: "Cart not found" });
        }

        const OrderAddress = await addressModel.findOne({ user: user._id });
        if (!OrderAddress) {
            //return res.status(400).json({ message: "Address not found" });
        }

        const addressdetails = OrderAddress.addresses.find(
            (item) => item.addressType === address
        );
        if (!addressdetails) {
            // res.render('checkout',{error:'please select address and paymentOption'});
            //return res.status(400).json({ message: "Invalid address ID" });
        }

        //console.log(addressdetails);

        const selectedItems = cart.items;

        for (const item of selectedItems) {
            const product = await productModel.findOne({ _id: item.productId });
            console.log(product);
            if (product) {
                if (product.countInStock >= item.quantity) {
                    product.countInStock -= item.quantity;
                    //console.log(product.countInStock);
                    await product.save();
                } 
            } else {
                console.log('Product not found');
            }
        }

        const order_id = await generateUniqueOrderID();

        const orderData = new orderModel({
            user: user._id,
            cart: cart._id,
            items: selectedItems,
            billTotal: cart.billTotal, 
            oId: order_id,
            paymentStatus: "Success",
            paymentMethod: paymentOption,
            deliveryAddress: addressdetails
        });

        await orderData.save();
        cart.items = [];
        await cart.save();

        res.redirect(`/orderConfirmation?orderId=${order_id}`);
    } catch (error) {
        console.log('Post checkout error:', error.message);
        res.status(500).json({ message: "Internal server error" });
        res.redirect('/home');
    }
};

const orderConfirmation=async(req,res)=>{
    try{
        
        const user=await userModel.findOne({email:req.session.email});
        await cartModel.findOneAndUpdate({owner:user._id},{
        $set:{
          items:[]
        }
      })
        const order=await orderModel.findOne({oId:req.query.orderId})
        //console.log(order);
        res.render('orderconfirmation',{order:order});
    }
    catch(error){
        console.log('order confirmation:',error.message);
        res.redirect('/home');
    }
}

const loadOrderdetail=async(req,res)=>{
    try{
        const order=await orderModel.findOne({oId:req.query.oId});
        console.log(order);
        res.render('order-detail',{order});
    }catch(error){
        console.log('loadOrderdetail',error.message);
    }

}

const razorpayVerify = async (req, res) => {
    try {
      console.log("VERIFY EYE/////////////////////////////");
      const body =
        req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
      console.log(body);
  
      const expectedSignature = crypto
        .createHmac("sha256", 'rzp_test_ODbZBT9BgeLoJs')
        .update(body.toString())
        .digest("hex");
  
      if (expectedSignature === req.body.razorpay_signature) {
        console.log("Corrected Verify");
  
        // Find the previously stored record using orderId
        const updatedOrder = await orderModel.findOneAndUpdate(
          { oId: req.body.razorpay_order_id },
          {
            // paymentId: req.body.razorpay_payment_id,
            // signature: req.body.razorpay_signature,
            paymentStatus: "Success",
          },
          { new: true }
        );
        console.log(updatedOrder);
        if (updatedOrder) {
          const cart = await cartModel.findOne({ owner: req.session.userId });
          // Remove selected items from the cart
          cart.items = [];
          cart.billTotal = 0;
          await cart.save();
          // Render the payment success page
          return res.json({
            success: true,
            message: "Order Sucessfully",
            updatedOrder,
          });
        } else {
          // Handle the case where the order couldn't be updated
          return res.json({
            success: false,
            message: "Order Failed Please try Again",
          });
        }
      } else {
        // Handle the case where the signature does not match
        return res.json({
          success: false,
          message: "Order Failed Please try Again",
        });
      }
    } catch (err) {
      console.log(err);
      // Handle errors
      return res.render("paymentFailed", {
        title: "Error",
        error: "An error occurred during payment verification",
      });
    }
  };

module.exports={
    loadcheckout,
    Postcheckout,
    orderConfirmation,
    loadOrderdetail,
    razorpayVerify
}