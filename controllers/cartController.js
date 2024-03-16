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

        let userCart = await cartModel.findOne({ owner: userId }).populate({path:'items.productId',model:'Products'});
        if (!userCart) {
            userCart = new cartModel({
                owner: userId,
                items: [],
                billTotal: 0,
            });
        }
        
        const existingCartItemIndex = userCart.items.findIndex(item => item.productId._id.toString() === productId);
        
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
            
                quantity: quantity,
                
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
        const {productId} = req.body;

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
              
                quantity: 1,
                
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
        
        let userCart = await cartModel.findOne({ owner: userId }).populate({path:'items.productId',model:'Products'}) || null;
        let wish=await wishlistModel.findOne({user:userId}) || null;
        
        if(userCart !==null){
            const coupon=await couponModel.find({isActive:true});
        const eligibleCoupons = coupon.filter(coupon => {
            return userCart.billTotal >= coupon.minimumAmount && userCart.billTotal <= coupon.maximumAmount && coupon.isActive

        });
        if( userCart.items.length>0){
            res.render('cart',{cart:userCart,coupon:eligibleCoupons,wish})
        }}
        if(userCart===null || userCart.items.length===0 )
            res.render('empty-cart',{wish,cart:userCart});

        
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

        const { productId } = req.body;
        let userCart = await cartModel.findOne({ owner: user._id }).populate({ path: 'items.productId', model: 'Products' });
        
        if (!userCart) {
            console.log('Cart not found');
            return res.status(404).json({ message: 'Cart not found' });
        }

        const productIndex = userCart.items.findIndex(item => item.productId._id.toString() === productId);

        if (productIndex !== -1) {
            const [productItem] = userCart.items.splice(productIndex, 1); 
            userCart.billTotal -= (productItem.quantity * productItem.productId.price); 

            if (userCart.isApplied) {
                
                userCart.billTotal = userCart.items.reduce((total, item) => total + (item.quantity * item.productId.price), 0); 
                userCart.isApplied = false;
                userCart.coupon = 'nil';
                userCart.discountPrice = 0;

                const coupon = await couponModel.findOne({ usersUsed: user._id }); 
                if (coupon) {
                    coupon.usersUsed.pull(user._id); 
                    coupon.maxUsers++;
                    await coupon.save();
                }
            }

            await userCart.save();
            res.status(200).json({ success: true, message: 'Item removed from cart' });
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
        if (!user) {
            console.log('User not found in update cart');
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const userId = user._id;

        let cart = await cartModel.findOne({ owner: userId }).populate({ path: 'items.productId', model: 'Products' });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const { productId, need } = req.body;
        const cartItem = cart.items.find(item => item.productId._id.toString() === productId);
        if (!cartItem) {
            console.log('Cart item not found in update cart');
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }

        const maxPerPerson = 5;
        if (cartItem.quantity >= maxPerPerson && need !== "sub") {
            return res.status(400).json({ success: false, message: "Maximum quantity per person for this product has been reached" });
        }

        if (need === "sub") {
            cartItem.quantity = Math.max(1, cartItem.quantity - 1);
        } else if (need === "sum") {
            const maxQuantity = Math.min(cartItem.productId.countInStock, maxPerPerson);
            cartItem.quantity = Math.min(cartItem.quantity + 1, maxQuantity);
        } else {
            return res.status(404).json({ success: false, message: "Invalid operation" });
        }

        cartItem.price = cartItem.quantity * cartItem.productId.price;
        cart.billTotal = cart.items.reduce((total, item) => total + (item.quantity * item.productId.price), 0);

        await cart.save();
        return res.status(200).json({ success: true, cart });
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