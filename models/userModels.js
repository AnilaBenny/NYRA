const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email format'],
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet', 
    }
});



module.exports = mongoose.model('user', userSchema);


