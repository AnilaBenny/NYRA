const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    owner : {
  type: ObjectID,
   required: true,
   ref: 'users'
 },

 items: [{
    productId: {
      type: ObjectID,
      ref: 'products',
      required: true
    },
    image:{
    type: String,
    required:true
    },

    name: {
      type:String,
      required:true,
    },
    productPrice:{
      type:Number,
      required:true
    },
    quantity: {
      type: Number,
      required: true,
      min:[1, 'Quantity can not be less then 1.'],
      default: 1
      },
    price: {
      type:Number
    },
    countInStock: {
      type: Number
   },
    selected: {
      type: Boolean, 
      default: false, 
  },
   }],
 
billTotal: {
    type: Number,
    required: true,
   default: 0
  },
  shipping:{
    type:Number,
    default: 0
  },
  isApplied:{
    type: Boolean, 
    default: false,
  },
  coupon:{
    type:String,
    default:'nil'
  },
  discountPrice:{
    type: Number,
    default: 0,
 }
}, {
timestamps: true
})

cartSchema.pre('save', function(next) {

  const shippingCharge = this.billTotal > 499 ? 0 : 50; 

  this.shipping = shippingCharge;

  this.billTotal += this.shipping;

  next();
});


const cartModel = mongoose.model('Cart',cartSchema);

module.exports=cartModel;