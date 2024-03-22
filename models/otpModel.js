const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    email:{
        type:String
    },
otp: {
        type: String
    }
      
});



module.exports = mongoose.model('otp', userSchema);
