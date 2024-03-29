
const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute'); 
const adminRoute=require('./routes/adminRoute');
const expressvalidator = require('express-validator');
const session=require('express-session');
const nocache=require('nocache');






const connectToDatabase = require('./config/databaseconnect');
connectToDatabase();

const app = express();
const PORT = process.env.PORT || 8080;



app.use(express.json());
app.use(express.urlencoded({
   extended: true
}));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
       maxAge: 3600000
    }
 }));

 app.use(nocache());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads',express.static(path.join(__dirname, 'uploads')))


app.use('/',userRoute);

app.use('/admin',adminRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
