const jwt=require('jsonwebtoken');
const { Long } = require("mongodb");
const maxAge = 2 * 24 * 60 * 60;
const User = require("../models/userModels");
const Cart=require("../models/cartModel");

const createToken = (id) => {
    return jwt.sign({ id }, "secret", {
      expiresIn: maxAge,
    });
  };


  const isLogin = (req, res, next) => {

    const token = req.cookies.jwt;
       if (token) {
         jwt.verify(token, "secret", (err, decodedToken) => {
         if (err) {
             console.log(err.message);
             res.redirect("/");
         } else {
             console.log(decodedToken);
             next();
         }
         });
     } else {
         res.redirect("/");
     }
};
const isLogOut = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "secret", (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                next(); 
            } else {
                console.log(decodedToken);
                res.redirect("/home"); 
            }
        });
    } else {
        next(); 
    }
};


const isAdminLogin = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, "secret", (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.redirect("/admin");
        } else {
        //   console.log(decodedToken);
          next();
        }
      });
    } else {
      res.redirect("/admin");
    }
  };

  
  const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "secret", async (err, decodedToken) => {
            // console.log(decodedToken);
        if (err) {
            console.log("Error:", err.message);
             res.locals.currentUser = null;
            next();
        } else {
            try {
            let user = await User.findById(decodedToken.id);
            res.locals.currentUser = user;
            next();
            } catch (userError) {
            console.log("User Error:", userError.message);
               res.locals.currentUser = null;
            next();
            }
        }
        });
    } else {
         res.locals.currentUser = null;
        console.log("No token found");
        next();
    }
    };

    module.exports={
        createToken,
        isLogin,
        checkUser,
        isAdminLogin,
        maxAge ,
        isLogOut

    }