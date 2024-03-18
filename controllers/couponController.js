const {couponModel}=require('../models/couponModel');
const cartModel=require('../models/cartModel');
const userModel=require('../models/userModels');


const Couponcart = async (req, res) => {
    try {
        const code = req.query.code;
        const coupon = await couponModel.findOne({ code: code });
        const user = await userModel.findOne({ email: req.session.email });
        const cart = await cartModel.findOne({ owner: user._id });

       
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }
        if (coupon.maxUsers === 0 || coupon.usersUsed.includes(user._id) || cart.isApplied) {
            return res.status(400).send('Coupon not applicable');
        }

        if (!cart) {
            return res.status(404).send('Cart not found');
        }
        let discountAmount = 0;

        if (cart.billTotal <= 500) {
            discountAmount = (coupon.discountPercentage / 100) * cart.billTotal;
            cart.billTotal -= discountAmount;
        } else {
            discountAmount = (coupon.discountPercentage / 100) * cart.billTotal;
            cart.billTotal *= (1 - coupon.discountPercentage / 100);
        }
        cart.billTotal = Number(cart.billTotal.toFixed());
        
        
    
       

        cart.isApplied=true;
        cart.discountPrice=discountAmount;
        cart.coupon=code;
        await cart.save();

        
        coupon.usersUsed.push(user._id);
        coupon.maxUsers--;
        await coupon.save();

        res.status(200).send('Coupon applied successfully');
    } catch (error) {
        console.error('Coupon cart error:', error.message);
        res.status(500).send('Internal server error');
    }
};

const removeCoupon=async(req,res)=>{
    try{
        const Fullcoupon = await couponModel.find();
        const user = await userModel.findOne({ email: req.session.email });
        const coupons= Fullcoupon.filter(coupon => coupon.usersUsed.includes(user._id));
        let coupon=coupons[0];
        const cart = await cartModel.findOne({ owner: user._id });
        if(cart.isApplied){
        cart.billTotal =cart.items.reduce((total, item) => total + item.price, 0);
        cart.isApplied=false;
        cart.coupon='nil';
        cart.discountPrice=0;
        await cart.save();
    
        const userIdIndex = coupon.usersUsed.indexOf(user._id);
        if (userIdIndex !== -1) {
            coupon.usersUsed.splice(userIdIndex, 1);
        }
        coupon.maxUsers++;
        
        await coupon.save();
    }
        
    res.status(200).send('Coupon updated successfully');
        
    }
    catch(error){
        console.log('removeCoupon:',error.message);
    }

}

module.exports={
    
    Couponcart,
    removeCoupon
}