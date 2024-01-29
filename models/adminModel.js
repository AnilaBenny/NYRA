const mongoose=require('mongoose');
const validator=require("validator");

//adminschema
const adminModel=new mongoose.Schema({
    name: {
        type:String,
        required:true,
        trim:true
    },
    email:{
       type: String,
        required: true,
        validate: [validator.isEmail, 'Invalid email format'],
        trim: true
    
    }

})
module.exports= mongoose.model('admin',adminModel);