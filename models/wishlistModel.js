const mongoose = require('mongoose')
const ObjectID = mongoose.Schema.Types.ObjectId;

const wishlistSchema = new mongoose.Schema({
   user: {
      type: ObjectID,
      ref: 'User',
      required: true
   },
   product: [{
      type: ObjectID,
      ref: 'Products'
   }]
})


const wishlistModel = mongoose.model('Whishlist', wishlistSchema);
module.exports = wishlistModel;