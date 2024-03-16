const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

   name: {
      type: String,
      required: true,
   },

   description: {
      type: String,
      required: true
   },


   images:[{
      type:String
   }],

   brand:{
      type:String
   },

   countInStock: {
      type: Number,
      required: true,
      min: 0,
      max: 300
   },

   review: [
      {
          user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'user'
          },
          rating: {
              type: Number,
              default: 0
          },
          reviewdescription: {
              type: String
          }
      },
  ],

   isFeatured: {
      type: Boolean,
      default: true
   },
   
   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category',
      required: true
   },

   price: {
      type: Number,
      required: true,
      default: 0,

   },
   popularity:{
      type:Number,
      default: 0

   },
   list:{
      type: Boolean,
      default: true
   }
,
   discountPrice:{
      type: Number,
      default: 0,
   },
offerTime:{
type:Date
}
   
}, {
   timestamps: true
},{strictPopulate : false})


const ProductModel = mongoose.model('Products', productSchema)

module.exports = ProductModel;