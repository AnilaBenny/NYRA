const categoryModel = require("../models/categoryModel");
const userModel = require("../models/userModels");
const mongoose = require("mongoose");
const { check, validationResult } = require('express-validator');
const ProductModel = require("../models/productModel");



const loadCategory=async(req,res)=>{
  try{
          const categorydetails = await categoryModel.find();
          res.render('category', { cate: categorydetails ,errors: null, message: null});
      }
  catch(error){
      console.log(error.message);
      if (error.code === 11000) {
    
        res.render('category', {cate: null ,errors: null, message: 'Duplicate category found' });
      } else {
        res.render('category',{cate: null ,errors: null, message: 'Failed to load categories' });
      }
}};


const insertCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
   
  
    const validators=[
      check('name')
      .exists({ checkFalsy: true })
      .withMessage('Name is required').bail()
      .isLength({ min:3 })
      .withMessage('Name must be at least 3 characters long').bail()
      .matches(/^[^0-9]+$/)
      .withMessage('Name cannot contain numbers& symbols').bail()
      .custom((value) => {
        if (value.trim() !== value) {
          throw new Error('Name cannot have leading or trailing spaces');
        }
        return true;
      }).bail(),
      check('description')
    
      .exists({ checkFalsy: true })
      .withMessage('description is required').bail()
      .isLength({ max:70 })
      .withMessage('description must be at most 70 characters long').bail()
      .matches(/^[^0-9]+$/)
      .withMessage('description cannot contain numbers& symbols').bail()
      .custom((value) => {
        if (value.trim() !== value) {
          throw new Error('description cannot have leading or trailing spaces');
        }
        return true;
      }).bail()
    ];
    await Promise.all(validators.map((validator) => validator.run(req)));

        const errors = validationResult(req).array();
        
        if (errors.length>0)
        {
       
          const categorydetails = await categoryModel.find();
          res.render('category',{cate:categorydetails,errors,message: null})
        }
      
    else{
      const existingcate = await categoryModel.findOne({
        
            name: name.toLowerCase(),
        
      });
      
      if(existingcate ){
        const categorydetails = await categoryModel.find();
          res.render('category',{cate:categorydetails,errors:null,message:'name is already entered'})
      }
      else{
    const category = new categoryModel({
      name,
      description
    });
    const savedCategory = await category.save();
   
    const categorydetails = await categoryModel.find();
    if(savedCategory){
     
      res.render("category",{cate:categorydetails,errors:null,message:"Category Sucessfully Registered!!!"});
    }else{
 
        res.render("category", { cate:categorydetails,errors:null,message: "Failed to insert category" });
    }}}
  } catch (error) {
    console.error(error.message);
  }
};



const loadcateedit=async(req,res)=>{
  try{
             const id=req.query.id;
            const categorydetails=await categoryModel.findById({_id:id});
            if(categorydetails){
             
              res.render('admin-edit-cate',{cate:categorydetails,message:null});
            }
            else{
              res.redirect('/admin/adminCategory');
            }
            
      }
  catch(error){
      console.log(error.message);
}};

const upcateedit=async(req,res)=>{
  try{
    const Data=await categoryModel.findByIdAndUpdate({_id:req.body.id},{$set:{ name:req.body.name,description:req.body.description}});
   
    if(Data){
      res.redirect('/admin/adminCategory');
    }
    
  }
  catch(error){
    console.log('update cate',error.message);
    const categorydetails=await categoryModel.findById({_id:req.body.id});
    if (error.code === 11000) {
  
      res.render('admin-edit-cate', {cate:categorydetails,message: 'Duplicate category found' });
    } else {
      res.render('admin-edit-cate',{cate:categorydetails, message: 'Failed to load categories' });
    }
  }
};


const deletecate = async (req, res) => {
  try {
    const id = req.query.id;
    const action = req.query.action;

    if (action === 'Active') {
      await categoryModel.findByIdAndUpdate(id, { is_active: false });

      await ProductModel.updateMany({ category: id }, { list: false });
    } else {
      await categoryModel.findByIdAndUpdate(id, { is_active: true });

    
      await ProductModel.updateMany({ category: id }, { list: true });
    }

    res.redirect('/admin/adminCategory');
  } catch (error) {
    console.error(error.message);
    res.status(500);
  }
};


module.exports = {
  insertCategory,
  loadCategory,
  loadcateedit,
  upcateedit,
  deletecate
};
