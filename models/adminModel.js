const mongoose=require('mongoose');


//adminschema
const adminModel=new mongoose.Schema({

    adminEmail:{
       type:String,
       required: true
    },
    adminPassword:{
       type:String,
       required: true
    }
 })
module.exports= mongoose.model('admin',adminModel);



