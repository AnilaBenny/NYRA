
const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute'); 
const adminRoute=require('./routes/adminRoute');
const expressvalidator = require('express-validator');
const session=require('express-session');



//database connection

const connectToDatabase = require('./config/databaseconnect');
connectToDatabase();

const app = express();
const PORT = process.env.PORT || 8080;

//Use body parsing middlewares before session middleware
app.use(express.json());
app.use(express.urlencoded({
   extended: true
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

//for user routes
app.use('/',userRoute);
//for admin
app.use('/admin',adminRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
