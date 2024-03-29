

const logSession = (req,res,next)=>{
   if(req.session.email || req.session.userId){
      next()
   } else {
      res.redirect('/')
   }
}

const isLogout=async(req,res,next)=>{
   try{
       if(req.session.email){
           res.redirect('/home');
       }
       else{
           next();
       }
       
   }
   catch(error){
       console.log(error.message);

   }
}

const AdminLogSession = (req,res,next)=>{
   if(req.session.admin){
      next()
   } else {
      res.redirect('/admin')
   }
}

const adminisLogout=async(req,res,next)=>{
   try{
       if(req.session.admin){
           res.redirect('/admin/adminpanel');
       }
       else{
           next();
       }
       
   }
   catch(error){
       console.log(error.message);

   }
}

const isAuthenticated = (req, res, next) => {
   console.log(req.session.email)
   if (req.session.email) {
    
     return res.redirect("/");
   } else {

      next();
   }
  
 
 };

module.exports = {
   logSession,
   AdminLogSession,
   isAuthenticated,
   isLogout,
   adminisLogout
}