const addressModel = require("../models/addressModel");
const userModel = require("../models/userModels");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const randomstring = require('randomstring');
const crypto = require("crypto");

const {generateRazorpay,instance}=require('../config/razorpay');
const Razorpay = require('razorpay');


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
        const paymentOption=req.body.paymentOption ;
        const address= req.body.address || 'home';

        // console.log(paymentOption, address);
        // if(!address || !paymentOption){
        //     res.render('/checkout?error=Please select both an address and a payment option');

        // }
       
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
            //return res.status(400).json({ message: "Invalid address ID" });
        }

        //console.log(addressdetails);

        const selectedItems = cart.items;

        for (const item of selectedItems) {
            const product = await productModel.findOne({ _id: item.productId });
            // console.log(product);
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

         res.redirect(`/orderConfirmation?orderId=${order_id}`);

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
          //  console.log(amount);
          instance.orders.create(options, async (err, razorpayOrder) => {
            if (!err) {
              console.log(razorpayOrder);
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

   
    const body=`${req.body.razorpay_order_id}|${req.body.razorpay_payment_id}`;

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
      // Handle invalid address ID
    }

    const secretKey = 'rzp_test_2sQVid1X3uLewM'; 

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(body.toString())
      .digest("hex");
console.log(expectedSignature);
console.log(req.body.razorpay_signature);

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

      // res.redirect(`/orderConfirmation?orderId=${req.body.razorpay_order_id}`);
    // } 
    // else {
    //   // Signature verification failed
    //   console.log("Signature verification failed");
      // return res.status(401).send("Unauthorized");
    // }
  } catch (err) {
    console.log(err.message);
    return res.status(500).send("Internal Server Error");
  }
}




module.exports={
    loadcheckout,
    Postcheckout,
    orderConfirmation,
    loadOrderdetail,
    razorpayVerify
}