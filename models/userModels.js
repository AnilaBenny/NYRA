const mongoose=require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/NYRA');
connect.then(()=>{console.log('Data base connected')}).catch(()=>{console.log('database not connected')});

//user schema
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true,
        unique: true,
    },
    email:{
        type:String,
        required:true,
        unique: true,
        lowercase: true
    },
    password:{
        type:String,
        required:true,
        minlength: 6
    },

   image:{
        type:String,
        required:true
    },
    is_varified:{
        type:Number,
        default:0
    }
});
module.exports=mongoose.model('user',userSchema);

