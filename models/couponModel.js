const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
   code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true
   },
   description: {
      type: String,

   },
   minimumAmount: {
      type: Number,
      required: true,
      default: 100
   },
   maximumAmount: {
      type: Number,
      required: true,
   },
   discountPercentage: {
      type: Number,
      required: true,
      min: 0, 
      max: 100, 
     
   },
   expirationDate: {
      type: Date,
      required: true,
   },
   isActive: {
      type: Boolean,
      required: true,
      default: true,
   },
   usersUsed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   }, ],
   maxUsers: {
      type: Number,
      default: null, 
   },

   
}, {
   timestamps: true
});

const couponModel = mongoose.model('coupon', couponSchema);


module.exports = {couponModel};

