const productModel=require('../models/productModel');
const userModels = require('../models/userModels');
const wishlistModel=require('../models/wishlistModel');
const cartModel=require('../models/cartModel')
const addToWishlist = async (req, res) => {
    try {
        const id = req.query.id;
        const user = await userModels.findOne({ email: req.session.email });

        let wishlist = await wishlistModel.findOne({ user: user._id });
        //  let exist=wishlist.some(wishItem => wishItem.product.includes(id));
        
        if (!wishlist) {
            wishlist = new wishlistModel({
                user: user._id,
                product: [id]
            });
            
        } else {

            wishlist.product.push(id);
        }

        await wishlist.save();
        res.status(200).send('Product added to wishlist successfully.');
    } catch (err) {
        console.error('addToWishlist:', err.message);
        res.status(500).send('Internal Server Error');
    }
};

const removeWishlist = async (req, res) => {
    try {
        const id = req.query.id;
        const user = await userModels.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).send('User not found.');
        }

        let wishlist = await wishlistModel.findOne({ user: user._id });

        if (!wishlist) {
            return res.status(404).send('Wishlist not found.');
        }

        const index = wishlist.product.indexOf(id);
        if (index === -1) {
            return res.status(404).send('Product not found in wishlist.');
        }

        wishlist.product.splice(index, 1);

   
        await wishlist.save();

        res.status(200).send('Product removed from wishlist successfully.');
    } catch (error) {
        console.error('Error removing product from wishlist:', error.message);
        res.status(500).send('Internal server error.');
    }
}

const loadWishlist=async(req,res)=>{
    try{
        const user = await userModels.findOne({ email: req.session.email });
        let wishlist = await wishlistModel.findOne({ user: user._id }).populate('product', null, null, { strictPopulate: false });
        if(!wishlist){
            wishlist=null
        }
           
        let cart=await cartModel.findOne({owner:user._id})
        if(!cart)
        {
        cart=null;
        }
      
        console.log(wishlist);
        res.render('wishlist',{wish:wishlist,cart})
    }
    catch(error){
        console.log(error.message);
    }
}
module.exports={
    addToWishlist,
    removeWishlist,
    loadWishlist
}