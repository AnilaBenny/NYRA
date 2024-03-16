const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    }
    ,
    is_active: {
        type: Boolean,
        default: true
    },
    offerTime:{
        type: Date
    },
    discountPrice:{
        type:Number
    }
});



module.exports = mongoose.model('category', categorySchema);
