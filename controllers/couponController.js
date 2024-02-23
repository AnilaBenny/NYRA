const {couponModel}=require('../models/couponModel');
const cartModel=require('../models/cartModel');
const userModel=require('../models/userModels');


const Couponcart = async (req, res) => {
    try {
        const code = req.query.code;
        const coupon = await couponModel.findOne({ code: code });
        const user = await userModel.findOne({ email: req.session.email });
        const cart = await cartModel.findOne({ owner: user._id });

        // console.log(coupon);
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

        cart.billTotal *= (1 - coupon.discountPercentage / 100);
        cart.isApplied=true;
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

        cart.billTotal =cart.items.reduce((total, item) => total + item.price, 0);
        cart.isApplied=false;
        await cart.save();
        console.log(coupon);
        const userIdIndex = coupon.usersUsed.indexOf(user._id);
        if (userIdIndex !== -1) {
            coupon.usersUsed.splice(userIdIndex, 1);
        }
        coupon.maxUsers++;
        await coupon.save();
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