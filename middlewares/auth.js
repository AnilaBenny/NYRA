

const logSession = (req,res,next)=>{
   if(req.session.email || req.session.userId){
      next()
   } else {
      res.redirect('/home')
   }
}


const AdminLogSession = (req,res,next)=>{
   if(req.session.admin){
      next()
   } else {
      res.redirect('/admin')
   }
}

const isAuthenticated = (req, res, next) => {
   console.log(req.session.email)
   if (req.session.email) {
     // User is authenticated, redirect them to the home page
     return res.redirect("/home");
   } else {
       // User is not authenticated, continue to the next middleware or route handler
      next();
   }
  
 
 };

module.exports = {
   logSession,
   AdminLogSession,
   isAuthenticated
}