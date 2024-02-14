const addressModel = require("../models/addressModel");
const userModel = require("../models/userModels");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const randomstring = require('randomstring');

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
            deliveryAddress: addressdetails,
            'requests.type':'-'
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
        
        const order=await orderModel.findOne({oId:req.query.orderId})
        //console.log(order);
        res.render('orderconfirmation',{order:order});
    }
    catch(error){
        console.log('order confirmation:',error.message);
        res.redirect('/home');
    }
}

module.exports={
    loadcheckout,
    Postcheckout,
    orderConfirmation
}