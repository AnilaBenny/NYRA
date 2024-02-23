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
      type: Boolean, // Add a selected field to mark whether the item is selected
      default: false, 
  },
   }],
 
billTotal: {
    type: Number,
    required: true,
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

const cartModel = mongoose.model('Cart',cartSchema);

module.exports=cartModel;