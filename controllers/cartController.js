const categoryModel = require("../models/categoryModel");
const userModel = require("../models/userModels");
const cartModel = require("../models/cartModel");
const addTocart=async(req,res)=>{
    try{
        const userId=req.session.email;
        
        let userCart=await cartModel.findOne({})
    }
    catch(err){
        console.log('load cart:',err.message);
    }

}

module.exports={addTocart}