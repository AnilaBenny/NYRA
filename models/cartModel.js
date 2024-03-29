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
      ref: 'Products',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min:[1, 'Quantity can not be less then 1.'],
      default: 1
      },
    price: {
      type:Number
    }
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
},{strictPopulate : false})

cartSchema.pre('save', function(next) {

  const shippingCharge = this.billTotal > 499 ? 0 : 50; 

  this.shipping = shippingCharge;

  this.billTotal += this.shipping;

  if (this.isApplied && this.coupon !== 'nil') {
    const discountPrice = this.discountPrice;
    this.billTotal -= discountPrice; 
  }
  this.billTotal = this.billTotal.toFixed();


  next();
});


const cartModel = mongoose.model('Cart',cartSchema);

module.exports=cartModel;


