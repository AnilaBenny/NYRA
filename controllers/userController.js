const userModel = require('../models/userModels');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
const ProductModel=require('../models/productModel');
const categoryModel=require('../models/categoryModel');
const newOtp=require('../models/otpModel');
const otpModel = require('../models/otpModel');
const addressModel=require('../models/addressModel');
const orderModel = require('../models/orderModel');
const wishlistModel=require('../models/wishlistModel');
const walletModel=require('../models/walletModel');
const cartModel=require('../models/cartModel') ;
const Razorpay = require('razorpay');



const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user:'nyraproduct@gmail.com' ,
        pass: 'gcnmqgwrjkuculam'
    }
});



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};


let enterHome = async (req, res) => {
 
    try {
    
        if (req.session.email) {
            
            const userData = await userModel.findOne({ email: req.session.email });

            if (userData && !userData.isBlocked) {
              
                const products = await ProductModel.find({});
                const categories = await categoryModel.find({});
                let wish=await wishlistModel.findOne({user:userData._id});
                if(!wish){
                  wish=null;
                }
                let cart=await cartModel.findOne({owner:userData._id})
                if(!cart)
                {
                cart=null;
                }
              
               
                return res.render("home", { pro: products, category: categories,wish,cart});
            } else {
                
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Error destroying session:', err);
                    }
                    res.redirect('/');
                });
            }
        } else {
            
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error in enterHome:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const loadLoginpage = async (req, res) => {
    try {
      if (req.session.data) {
        req.session.data={};
     } 
        res.render('login.ejs',{message:null});
    } catch (error) {
        console.log('loadloginpage',error.message);
    }
};


const loadregisterpage = async (req, res) => {
    try {
     
      if (req.session.data) {
         req.session.data={};
      } 
    
        res.render('register', { errors:null,message:null});
    
        
    } catch (error) {
        console.log('loadregister',error.message);
    }
};


const forgotpassword = async (req, res) => {
    try {
        res.render('forgot.ejs',{message:null});
        
    } catch (error) {
        console.log(error.message);
    }
};



const insertUser=async(req,res)=>{
  try{
    const { name, email, mobile, password } = req.body;
 

        
        const validators = [
          check('name')
        
          .exists({ checkFalsy: true })
          .withMessage('Name is required').bail()
          .isLength({ min: 3 })
          .withMessage('Name must be at least 3 characters long').bail()
          .matches(/^[^0-9]+$/)
          .withMessage('Name cannot contain numbers').bail()
          .custom((value) => {
            if (value.trim() !== value) {
              throw new Error('Name cannot have leading or trailing spaces');
            }
            const parts = value.trim().split(' ');
            if (parts.length !== 2) {
              throw new Error('Please provide both first name and last name');
            }
            if (parts[0].length === 0 || parts[1].length === 0) {
              throw new Error('Please provide both first name and last name');
            }
            if (!value.trim().match(/^[^\s]+(\s{1}[^\s]+)?$/)) {
              throw new Error('Name format is invalid. Please provide first name and last name with one space between them');
            }
            return true;
          }).bail(),
        check('email')
         
          .isEmail()
          .withMessage('Email is not valid').bail()
          .exists()
          .withMessage('Email is required').bail()
          .normalizeEmail()
          .custom((value) => {
            if (value !== value.toLowerCase()) {
              throw new Error('Email should not contain capital letters');
            }
            if (value.trim() !== value) {
              throw new Error('Email cannot have leading or trailing spaces');
            }
            if (!/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(value)) {
              throw new Error('Email must be in correct format');
            }
            return true;
          }).bail(),
          check('mobile')
          .exists()
          .withMessage('Mobile number is required')
          .isLength({ min: 10, max: 10 })
          .withMessage('Mobile number must be 10 digits long')
          .custom((value) => {
              if (!/^\d{10}$/.test(value)) {
                  throw new Error('Mobile number must contain only numbers');
              }
              return true;
          }).bail()
      ,
        check('password')
         
          .exists({ checkFalsy: true })
          .withMessage('Password is required').bail()
          .isLength({ min: 6, max: 15, checkFalsy: true })
          .withMessage('Password must be between 6 and 15 characters').bail()
          .custom((value) => {
            if (value.length < 6) {
              throw new Error('Password must be at least 6 characters long');
            }
            if (!/[A-Z]/.test(value)) {
              throw new Error('Password must contain at least one uppercase letter');
            }
            if (!/[a-z]/.test(value)) {
              throw new Error('Password must contain at least one lowercase letter');
            }
            if (!/\d/.test(value)) {
              throw new Error('Password must contain at least one number');
            }
            if (!/[!@#$%^&*]/.test(value)) {
              throw new Error('Password must contain at least one special character');
            }
            return true;
          }).bail()
      
  
        ];

        await Promise.all(validators.map((validator) => validator.run(req)));

        const errors = validationResult(req).array();
      
       
        if (errors.length>0)
        {
       
          res.render('register',{errors:errors,message:null})
        }
        else{
         
        
          const existingUser = await userModel.findOne({
            $or: [{
                email: email,
              },
              {
                mobile:mobile,
              },
            ],
          });
        
          if(existingUser){
            if (existingUser.email === email && existingUser.mobile === mobile) {
              res.render('register',{errors:null,message:'email and mobile number is already registered'})
            } else if (existingUser.email === email) {
              res.render('register',{errors:null,message:"Email is already registered"});
            }
          
            else if (existingUser.mobile === mobile) {
              res.render('register',{errors:null,message:"Mobile number is already registered"});
          }
          }else{
            const data={name,email,mobile,password};
          
            req.session.data=data;
          
            
            const otp = sentOtp(req,req.session.data.email);
            if (otp) {
              res.redirect('/otp');
            }
      
          }
        }
        

  }
  catch(error){
    console.log('insert user',error.message)
  }
}


const postVerifyOtp = async (req, res, next) => {
    try {
    
          const { otp } = req.body;
          const dbOtp= await otpModel.findOne({ otp});
          console.log('dbotp',dbOtp.otp);
         
                 
                    if (otp === dbOtp.otp) {
                      const passwordHash = await securePassword(req.session.data.password);
                      const newUser = new userModel({
                        name:req.session.data.name,
                      email:req.session.data.email,
                      mobile:req.session.data.mobile,
                    password: passwordHash ,
                    image:req.session.data.image,
                    isBlocked:false,
                  is_verified:true});
                  
                      const userData = await newUser.save();
                      
                      if (userData) {
                     
                        return res.redirect('/');
                      }
                    } 
                    
                    else{
                      res.render('otp', { message: 'Your registration has failed!!!' });
                    }}
     catch (error) {
        console.log('postverify otp',error.message);
        res.redirect("/otp");
    }
  };


const loadOtp = async (req, res) => {
    try {
      res.render('otp',{message:null});
    
    
    } catch (error) {
        console.log(error.message);
    }
};



const verifyUser = async (req, res) => {
    try {
      const {email,password}=req.body;
  
      if (!(email.includes('@gmail.com') && email.trim() === email)) {
        const errMsg = 'Email is not a valid Gmail address';
        return res.render('login', { message: errMsg });
    }
      else{
        const userData = await userModel.findOne({ email: req.body.email});
      
        if (userData) {
          
          if(userData.isBlocked){
            res.render('login', { message: "User is blocked" });
          }
            const isPasswordValid = await bcrypt.compare(req.body.password, userData.password);
            if(isPasswordValid && userData.is_verified && req.body.email===userData.email && !userData.isBlocked ) {
            req.session.email=userData.email;
            res.redirect('/home');
           
        }else {
          
          return res.render('login', { message: "Login Failed!!! Please verify your email and password" });
      } }
          else{
            res.render('login', { message: "Login Failed!!!, please verify your email and password" });
          }
      
        
        }
      
    } catch (error) {
        console.error(error.message);
    }
};


let logout = (req, res) => {
  req.session.email = false;
  res.redirect("/");
};


async function sentOtp(req,email)
{
  const otp= randomstring.generate({
    length: 6,
    charset: 'numeric',
  });

  console.log(otp);

  const updatedOtp = await otpModel.findOneAndUpdate(
    { email: email},
    { otp: otp },
    { new: true,upsert: true }
);

  if(updatedOtp){
 
    const mailOptions = {
        from: 'nyraproduct@gmail.com',
        to: email,
        subject: 'Your OTP Code for verification',
        text: `Your OTP code is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } 
        else {
            console.log('Email sent:', info.response);
        }
    });}
    setTimeout(async () => {
      const nullifiedOtp = await otpModel.findOneAndUpdate(
          { email: email },
          { otp: null },
          { new: true }
      );
      console.log('OTP set to null after 30 seconds:', nullifiedOtp);
  }, 30000); 
}
  
  
let resendOtp = async (req, res) => {
  try {
    if (req.session.data && req.session.data.email) {
    sentOtp(req, req.session.data.email); 
    res.status(200).json({
      status: true
    })}else {
      console.error('Error resending OTP: req.session.data or req.session.data.email is undefined');
      res.status(500).json({
        status: false,
        message: 'Error resending OTP'
      });
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({
      status: false,
      message: 'Error resending OTP'
    });
  }
};


   
let  postforgot=async(req,res)=>{
  try{
    const {email}=req.body;
    
    const Checkexist=await userModel.findOne({email:email});
    if(Checkexist){
      const otp=sentOtp(req,email);
      if(otp){
        req.session.forgotemail=req.body.email;
        res.redirect('/reset')
      }
      
     
    }else{
      res.render('forgot',{message:'please enter registered email'})
    }


  }catch(error){
    console.log('post forgot',error.message);
  }

};

const loadreset=async(req,res)=>{
  try{
    res.render('reset-password');

  }
  catch(error){
    console.log('loadrest:',error.message);
  }
};
const loadpassword=async(req,res)=>{
  try{
   
    const otp=sentOtp(req,req.session.email);
    console.log(otp);
    res.render('reset-password');
  }
  catch(error){
    console.log('loadrest:',error.message);
  }
};

const postPassword=async (req, res) => {
  try {
      const { otp, password } = req.body;
      const dbOtp = await otpModel.findOne({ otp });

      if (!dbOtp) {
          return res.render('reset-password', { message: 'Invalid OTP' });
      }

      const updatedUser = await userModel.findOneAndUpdate(
          { email: req.session.email },
          { password: await securePassword(password) },
          { new: true }
      );

      if (!updatedUser) {
          return res.render('reset-password', { message: 'Failed to update password' });
      }

    
      res.redirect('/userAc');
  } catch (error) {
      console.error('postPassword', error.message);
      
  }
}

const postreset = async (req, res) => {
  try {
      const { otp, password } = req.body;
      const dbOtp = await otpModel.findOne({ otp });

      if (!dbOtp) {
          return res.render('forgot', { message: 'Invalid OTP' });
      }

      const updatedUser = await userModel.findOneAndUpdate(
          { email: req.session.forgotemail },
          { password: await securePassword(password) },
          { new: true }
      );

      if (!updatedUser) {
          return res.render('forgot', { message: 'Failed to update password' });
      }

   
      res.redirect('/');
  } catch (error) {
      console.error('postreset', error.message);
      res.render('forgot', { message: 'An error occurred while resetting password' });
  }
};


const loaduserAc = async (req, res) => {
      try {
        if (req.session.email) {
          const user = await userModel.findOne({ email: req.session.email });
          if (!user) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
          }
    
          let address = await addressModel.findOne({ user: user._id }) || null;
          let wish = await wishlistModel.findOne({ user: user._id }) || null;
          let cart = await cartModel.findOne({ owner: user._id }) || null;
          let wallet = await walletModel.findOne({ user: user._id }) || null;
    
          if (req.query.wallet) {
            const amount = Number(req.query.wallet) / 100; // Assuming amount is in smallest currency unit (e.g., cents)
            if (!wallet) {
              wallet = new walletModel({
                user: user._id,
                balance: 0,
                transactions: []
              });
            }
            wallet.balance += amount;
            wallet.transactions.push({
              amount: amount,
              type: 'credit',
              description: 'Add to wallet'
            });
            await wallet.save();
          }
    
          // If no wallet was found or created, set to null for the response
          if (!wallet) {
            wallet = null;
          }

            wallet.transactions.sort((a, b) => b.updatedAt - a.updatedAt);

    
          res.render('user-detail', { user, address, wallet, wish, cart });
        } else {
          // Handle case where user is not logged in or session is not established
          res.status(401).send('User not logged in');
        }
      } catch (error) {
        console.error('loaduserAc', error.message);
        res.status(500).send('An error occurred');
      }
    };
    


const editprofile = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await userModel.findOne({ email: req.session.email });
    let wish=await wishlistModel.findOne({user:user._id});
    let wallet=await walletModel.findOne({user:user._id});
    let address=await addressModel.findOne({user:user._id})
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:user._id})
    if(!cart)
    {
    cart=null;
    }
  
    const existingUserWithMobile = await userModel.findOne({ mobile: mobile });
    if (existingUserWithMobile && existingUserWithMobile.email !== req.session.email) {
      return res.render('user-detail', { error: 'There is a user with this mobile number.', user,wish,cart,wallet,address });
    }

    // Update user details
    const updatedUser = await userModel.findOneAndUpdate(
      { email: req.session.email },
      {
        $set: {
          name: name,
          mobile: mobile
        }
      },
      { new: true }
    );

    if (updatedUser) {
     res.redirect('/userAc');
    } else {
      return res.render('user-detail', { error: 'Failed to update user details.', user,wish,cart,wallet,address});
    }
  } catch (error) {
    console.log('editprofile', error.message);
   
  }
};


const loadAddadd=async(req,res)=>{
  try{
    const user=await userModel.findOne({email:req.session.email});
    let wish=await wishlistModel.findOne({user:user._id}) || null;
  
    let cart=await cartModel.findOne({owner:user._id}) || null;
  
res.render('add-address',{wish,cart});
  }
  catch(error){
    console.log('loadAddadd:',error.message);
  }

};


const userAddAddress = async (req, res) => {
  try {
 
    
    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country
    } = req.body;

 
    const user = await userModel.findOne({email:req.session.email});
   
    if (!user) {
     console.log('user is not found');
    }

   
    let useraddresses = await addressModel.findOne({
      user: user._id
    });

    if (!useraddresses) {
   
      useraddresses = new addressModel({
        user:  user._id,
        addresses: []
      });
    }
    let wish=await wishlistModel.findOne({user:user._id});
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:user._id})
    if(!cart)
    {
    cart=null;
    }

  
    const existingAddress = useraddresses.addresses.find((address) =>
      address.addressType === addressType &&
      address.HouseNo === houseNo &&
      address.Street === street &&
      address.pincode === pincode &&
      address.Landmark === landmark &&
      address.city === city &&
      address.district === district&&
      address.State === state &&
      address.Country === country
    );
    const existtype=useraddresses.addresses.find((address) =>address.addressType === addressType);
    if (existingAddress) {
     
      res.render('add-address',{error:'Address already exists for this user',wish,cart});
    }
    
    else if(existtype) {
     
      res.render('add-address',{error:`${existtype.addressType} is alredy registered`,wish,cart});
    }
  
    else if (useraddresses.addresses.length >= 3) {
      
      res.render('add-address',{error:'User cannot have more than 3 addresses',cart,wish});
    }
else{
 
    const newAddress = {
      addressType: addressType,
      HouseNo: houseNo,
      Street: street,
      Landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      State: state,
      Country: country,
    };

    useraddresses.addresses.push(newAddress);


    await useraddresses.save();

   res.redirect('/userAc');
  }
  } catch (err) {
  
    console.log('userAddaddress:',err.message)
  }
};

const deleteAddress=async(req,res)=>{
try{
 

      const user = await userModel.findOne({email:req.session.email});
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
     
      
      const addresses = await addressModel.findOne({
        user: user._id
      })
     
  
     
  
      const addressTypeToDelete = req.query.addressType; 
  
      const addressIndexToDelete = addresses.addresses.findIndex((address) => address.addressType === addressTypeToDelete);
  
     
    
      addresses.addresses.splice(addressIndexToDelete, 1);
  
      await addresses.save();
  
     
  
}
catch(error){
  console.log('deleteAddress',error.message);

}
};

const loadeditAddress=async(req,res)=>{
  try{
    const user= await userModel.findOne({email:req.session.email});
   
    let useraddresses = await addressModel.findOne({
      user:user._id
    });
   
    const addressType=req.query.addressType;
    
    const address = useraddresses.addresses.find(address => address.addressType === addressType);

 let wish=await wishlistModel.findOne({user:user._id});
 if(!wish){
   wish=null;
 }
 let cart=await cartModel.findOne({owner:user._id})
 if(!cart)
 {
 cart=null;
 }

if (address) {
   
    res.render('edit-address', { address: address,wish,cart });
} else {
    
    console.log('Address or HouseNo not found');
    
}

  
  }
  catch(error){
    console.log('editAddress',error.message);
  }

};

const editAddress = async (req, res) => {
  try {
    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country
    } = req.body;

    const user = await userModel.findOne({email:req.session.email});
  
    if (!user) {
     console.log('user not found')
    }
    const addresses = await addressModel.findOne({
      user: user._id
    })

    if (!addresses) {
      console.log('address is not found');
    }
    let wish=await wishlistModel.findOne({user:user._id});
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:user._id})
    if(!cart)
    {
    cart=null;
    }
    const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

    if (!addressToEdit) {
      
      console.log('Address with type not found')
    }

    addressToEdit.HouseNo = houseNo;
    addressToEdit.Street = street;
    addressToEdit.Landmark = landmark;
    addressToEdit.pincode = pincode;
    addressToEdit.city = city;
    addressToEdit.district = district;
    addressToEdit.State = state;
    addressToEdit.Country = country;

    await addresses.save();
    res.render('edit-address', { addresses,message:'Updated sucessfully!',wish,cart});

  } catch (err) {
    console.error(err);
   console.log('edit Address:',err.message)
}
}
 
const loadorderpage = async (req, res) => {
  try {
   
  const user = await userModel.findOne({email:req.session.email});
 
  const perPage=5;
  const page=req.query.page || 1;
  const orderLength=await orderModel.countDocuments({ user: user._id });
  const totalPage=Math.ceil(orderLength / perPage);


   
    const order= await orderModel.find({ user: user._id }).skip(perPage * (page - 1))
    .limit(perPage).sort({updatedAt:-1});
   
    let wish=await wishlistModel.findOne({user:user._id});
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:user._id})
    if(!cart)
    {
    cart=null;
    }
    res.render('order', { order,page,totalPage,wish,cart});
  } catch (error) {
   
    console.error('Error loading order page:', error.message);
   
  }
}

const deleteorder = async (req, res) => {
  try {
      const { reason, oId } = req.body;

      if (!reason || !oId) {
          return res.status(400).json({ success: false, error: "Reason and orderId are required" });
      }

      const order = await orderModel.findOne({ oId });

      if (!order) {
          return res.status(404).json({ success: false, error: "Order not found" });
      }

      // Add cancellation request to the order
      const newCancelRequest = {
          type: 'Cancel',
          status: 'Pending',
          reason: reason
      };

      order.requests.push(newCancelRequest);
      await order.save();

      res.json({ success: true, message: "Order canceled successfully" });
  } catch (error) {
      console.error("deleteOrder error:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const reqreturn=async(req,res)=>{
  try{
const {oId,reason}=req.body;
if (!reason || !oId) {
  return res.status(400).json({ success: false, error: "Reason and orderId are required" });
}

const order = await orderModel.findOne({ oId });

if (!order) {
  return res.status(404).json({ success: false, error: "Order not found" });
}


const returnRequest = {
  type: 'Return',
  status: 'Pending',
  reason: reason
};

order.requests.push(returnRequest);
await order.save();

res.json({ success: true, message: "return requested successfully" });

  }
  catch(error){
    console.log('return',error.message);
  }

}

const newArrivals=async(req,res)=>{
try{
const perPage=8;
const page = parseInt(req.query.page) || 1;
const totalproducts= await ProductModel.countDocuments({});
const totalPage=Math.ceil(totalproducts / perPage);
const userData = await userModel.findOne({ email: req.session.email });

let wish=await wishlistModel.findOne({user:userData._id});

if(!wish){
  wish=null;
}
let cart=await cartModel.findOne({owner:userData._id});

if(!cart)
{
  cart=null
}
const search = req.query.search || '';
            
let sortQuery = {};

const sort = req.query.sort || '';

if (sort === 'lowtohigh') {
    sortQuery = { price: 1 };
} else if (sort === 'hightolow') {
    sortQuery = { price: -1 };
} else if (sort === 'a-z') {
    sortQuery = { name: 1 };
} else if (sort === 'z-a') {
    sortQuery = { name: -1 };
} else if (sort === 'featured') {
  product=await ProductModel.find({list:true,isFeatured: true }).populate('category').sort(sortQuery).skip(perPage * (page - 1))
  .limit(perPage);
} else if (sort === 'popularity') {
    sortQuery = { popularity: -1 };
} else if (sort === 'averagerating') {
  sortQuery = { "review.rating": -1 };
} else if (sort === 'Newarrivals') {
    sortQuery = { createdAt: -1 };
}
if (search !== '') {
    product = await ProductModel
        .find({
            
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ]
        })
        .populate('category')
        .sort(sortQuery).skip(perPage * (page - 1))
        .limit(perPage).limit(5) ;
}else if(sort){
    product = await ProductModel.find({}).populate('category').sort(sortQuery).skip(perPage * (page - 1))
    .limit(perPage).limit(5) ;
}else{
product = await ProductModel.find({}).populate('category').skip(perPage * (page - 1))
.limit(perPage) .sort({ createdAt: -1 })
.limit(5) ;
}
res.render('newArrivals', { product, wish, totalPage, page, wish, cart });

}
catch(error){
  console.log('new Arrivals',error.message);

}
}


const addToWallet=async(req,res)=>{
  var instance = new Razorpay({
    key_id: 'rzp_test_2sQVid1X3uLewM',
    key_secret: '9O1FvD9eQj4ZmHMAP4ygy0fO',
  });

 
  const amount = Number(req.body.amount);
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Invalid amount provided.",
    });
  }

  var options = {
    amount: amount * 100,  
    currency: "INR",
  };


  try {
    const razorpayOrder = await instance.orders.create(options);
    console.log(razorpayOrder);
    res.status(201).json({
      success: true,
      message: "Wallet updated successfully.",
      order: razorpayOrder,
    });
  } catch (orderError) {
  
    console.error('Razorpay Order Creation Error:', orderError);
    res.status(500).json({
      success: false,
      message: "Failed to create order with Razorpay.",
    });
  }


}

module.exports = {
    enterHome,
    loadLoginpage,
    loadregisterpage,
    forgotpassword,
    insertUser,
    verifyUser,
    loadOtp,
    postVerifyOtp,
    logout,
    resendOtp,
    postforgot,
    loadreset,
    postreset

    ,loaduserAc,
    editprofile,

    loadAddadd,
    userAddAddress,
    deleteAddress,
    loadeditAddress,
    editAddress,

    loadorderpage,
    deleteorder,
    reqreturn,

    newArrivals,
    addToWallet,

    loadpassword,
    postPassword

    
};



