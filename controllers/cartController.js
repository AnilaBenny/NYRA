const productModel = require("../models/productModel");
const userModel = require("../models/userModels");
const cartModel = require("../models/cartModel");
const {couponModel}=require('../models/couponModel');
const wishlistModel=require('../models/wishlistModel');


const addToCartIn = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.session.email });
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userId = user._id;
        const productId = req.body.productId;
        const quantity=parseInt(req.body.quantity);

    

        const product = await productModel.findById(productId);
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ message: 'Product not found' });
        }

        let userCart = await cartModel.findOne({ owner: userId });
        if (!userCart) {
            userCart = new cartModel({
                owner: userId,
                items: [],
                billTotal: 0,
            });
        }
        
        const existingCartItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
        
        if (existingCartItemIndex !== -1) {
            const existingCartItem = userCart.items[existingCartItemIndex];
            const newQuantity = existingCartItem.quantity + quantity;
            
            if (newQuantity <= product.countInStock && newQuantity <= 5) {
                existingCartItem.quantity = newQuantity;
                existingCartItem.price = newQuantity * product.price;
            } else {
                return res.status(400).json({ message: 'Maximum quantity per person reached' });
            }
        } else {
            
            userCart.items.push({
                productId: productId,
                name: product.name,
                image: product.images[0],
                productPrice: product.price,
                quantity: quantity,
                countInStock: product.countInStock,
                price: product.price * quantity,
            });
          
        }
            userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);

         
          await userCart.save();
          
          return res.status(200).json({ message: 'Item added to cart successfully' });

        
    } catch (err) {
        console.log('Error adding to cart:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const addTocart = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.session.email });
        if (!user) {
            console.log('User is not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;
        const productId = req.body.productId;

        const product = await productModel.findById(productId);
      
        if (!product) {
            console.log('Product is not found');
            return res.status(404).json({ message: 'Product not found' });
        }

        let userCart = await cartModel.findOne({ owner: userId });
        if (!userCart) {
            userCart = new cartModel({
                owner: userId,
                items: [],
                billTotal: 0,
            });
        }
        
        const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);

        if (existingCartItem) {
            if (existingCartItem.quantity < product.countInStock && existingCartItem.quantity < 5) {
                existingCartItem.quantity += 1;
                existingCartItem.price = existingCartItem.quantity * product.price;
            } else {
                return res.status(400).json({ message: 'Maximum quantity per person reached' });
            }
        } else {
            
            userCart.items.push({
                productId: productId,
                name: product.name,
                image: product.images[0],
                productPrice: product.price,
                quantity: 1,
                countInStock: product.countInStock,
                price: product.price,
                
            });
        }

        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);

        await userCart.save();
        return res.redirect('/cart');
    } catch (err) {
        console.log('Error adding to cart:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const showcart=async(req,res)=>{
    try{
        const user=await userModel.findOne({email:req.session.email});
      
        const userId=user._id;
        
        let userCart = await cartModel.findOne({ owner: userId }).populate({path:'items.productId',model:'Products'});
       
        const coupon=await couponModel.find();
        const eligibleCoupons = coupon.filter(coupon => {
            return userCart.billTotal >= coupon.minimumAmount && userCart.billTotal <= coupon.maximumAmount && coupon.isActive

        });
        
       
        let wish=await wishlistModel.findOne({user:userId});
           
        if(!wish){
          wish=null;
        }
        
        if(!userCart)
        {
        cart=null;
        }
        
     
        if(userCart.items.length>0){
            res.render('cart',{cart:userCart,coupon:eligibleCoupons,wish})
        }
        else{
            res.render('empty-cart',{wish,cart:userCart});
        }
    }
    catch(err){
        console.log('show cart:',err.message);
    }

}

const deleteCart = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.session.email });
        if (!user) {
            console.log('User is not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;
        const { productId } = req.body;

       
        let userCart = await cartModel.findOne({ owner: userId });
        if (!userCart) {
            userCart = new cartModel({
                owner: userId,
                items: [],
                billTotal: 0,
            });
        }

        const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);
        if (existingCartItem) {
            if (existingCartItem.quantity > 0) {
            
                existingCartItem.quantity = 0;
                existingCartItem.price = existingCartItem.productPrice;
                userCart.billTotal -= existingCartItem.productPrice;

               
                if (existingCartItem.quantity === 0) {
                    userCart.items = userCart.items.filter(item => item.productId.toString() !== productId);
                    userCart.billTotal =0;
                }

                await userCart.save();
                return res.status(200).json({ success: true, message: 'Item removed from cart' });
            } else {
                console.log('Quantity cannot be less than 0');
                return res.status(400).json({ message: 'Quantity cannot be less than 0' });
            }
        } else {
            console.log('Item not found in cart');
            return res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (err) {
        console.log('Error deleting from cart:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateCart = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.session.email });
        const userId = user._id;
        if(!user){
            console.log('user is not found in update cart');
        }
     
        const cart = await cartModel.findOne({ owner: userId });
       
        const { productId, need } = req.body;
      
        const cartItem = cart.items.find(item => item.productId.toString() === productId);
      
        if(!cartItem){
            console.log('cart is not found in update cart');
        }
       
        const product = await productModel.findById(productId);
        if(!product){
            console.log('product is not found in update cart');
        }
        if(cartItem.quantity >= 5 && need !== "sub"){
            return res.status(400).json({ success: false, message: "Maximum quantity per person for this product has been reached" })
        }
        else{
        cartItem.quantity = (need === "sub") ? Math.max(1, cartItem.quantity - 1) : cartItem.quantity + 1;
        cartItem.price = cartItem.quantity * cartItem.productPrice;
        cart.billTotal = (need === "sub") ? Math.max(product.price, cart.billTotal - product.price) : cart.billTotal + product.price;
        
        await cart.save();

        return res.status(200).json({ success: true,cart});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



module.exports={
    addTocart,
    showcart,
    deleteCart,
    updateCart,
    addToCartIn
};