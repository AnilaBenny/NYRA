const mongoose = require('mongoose');
require('dotenv').config();

const databaseURI = process.env.MONGODB_URI;

async function connectToDatabase() {
   try {
      if (!databaseURI) {
         throw new Error('MONGODB_URI is not defined in the environment variables.');
      }

      await mongoose.connect(databaseURI);

      console.log('MongoDB Connected');
   } catch (err) {
      console.error('Error connecting to MongoDB: ' + err.message);
   }
}

module.exports = connectToDatabase;





