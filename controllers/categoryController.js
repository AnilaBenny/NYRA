const categoryModel = require("../models/categoryModel");
const userModel = require("../models/userModels");
// const productModel = require("../model/productSchema");
const mongoose = require("mongoose");
const { log } = require("console");
const { check, validationResult } = require('express-validator');

// const categoryManagementGet = async (req, res) => {
//   try {
//     if (req.session.admin) {
//       const categories = await categoryModel.find(); // Fetch all categories from the database

//       // Pass the categories to the view
//       log(req.session.editCategory)
//       if (req.session.categoryData === true) {
//         req.session.categoryData = false;
//         res.render("category", {
//           pagetitle: "Category",
//           categories: categories,
//           error: "Category name already exists", // Pass the categories to the view
//         });
//       } else if (req.session.newCategory===true) {
//         req.session.newCategory = false
//         res.render("category", {
//           pagetitle: "Category",
//           categories: categories,
//           error: "New Category added succesfully",
//         });
//       } else if (req.session.editCategory === true) {
//         req.session.editCategory = false
//         res.render('category', {
//             pagetitle: 'Category',
//             categories: categories,
//             error:'Category edited succesfully'
//         })
//       } else {
//         res.render("category", {
//           pagetitle: "Category",
//           categories: categories,
//           error: "",
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching categories:");
//     res.status(500).send("Internal Server Error");
//   }
// };

//load category
const loadCategory=async(req,res)=>{
  try{
          const categorydetails = await categoryModel.find();
          res.render('category', { cate: categorydetails ,errors: null, message: null});
      }
  catch(error){
      console.log(error.message);
      if (error.code === 11000) {
        // Handle duplicate key 
        res.render('category', {cate: null ,errors: null, message: 'Duplicate category found' });
      } else {
        res.render('category',{cate: null ,errors: null, message: 'Failed to load categories' });
      }
}};

//insert category
const insertCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
   
    // Validation
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
        console.log(errors);
        if (errors.length>0)
        {
          // console.log(errors);
          const categorydetails = await categoryModel.find();
          res.render('category',{cate:categorydetails,errors,message: null})
        }
      
    else{
      const existingcate = await categoryModel.findOne({
        
            name: name.toLowerCase(),
        
      });
      //console.log(existingUser);
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
    console.log(savedCategory)
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


// const categoryManagementEdit = async (req, res) => {
//   try {
//     let { editName, editDescription } = req.body;
//     editName = editName.trim();
//     editDescription = editDescription.trim();
//     const categoryId = req.params.categoryId;
//     const category = await categoryModel.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     // Check if a category with the same name already exists (case-insensitive)
//     const categoryExists = await categoryModel.findOne({
//       name: { $regex: new RegExp(`^${editName}$`, "i") }, // Using a case-insensitive regex match
//       _id: { $ne: categoryId },
//     });

//     if (categoryExists) {
//       req.session.categoryData = true;
//       return res.status(400).redirect("/admin/category-management");
//     }

//     // Update name and description
//     category.name = editName;
//     category.description = editDescription;
//     // console.log(category.image+"############");
//     // Update image if a new one is uploaded
//     if (req.file) {
//       // Replace backslashes with forward slashes and remove 'public/' from the path
//       const newImage = req.file.path.replace(/\\/g, "/").replace("public/", "");
//       category.image = newImage;
//     }
//     console.log(req.body, req.file);
//     await category.save();
//     req.session.editCategory = true
//     res.status(200).redirect("/admin/category-management");
//     // res.status(200).json({ message: 'Category updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


//cate edit
const loadcateedit=async(req,res)=>{
  try{
             const id=req.query.id;
            const categorydetails=await categoryModel.findById({_id:id});
            if(categorydetails){
              // console.log(categorydetails);
              res.render('admin-edit-cate',{cate:categorydetails});
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
    // console.log(Data);
    if(Data){
      res.redirect('/admin/adminCategory');
    }
    
  }
  catch(error){
    console.log(error.message);
  }
};

//category deletion
const deletecate=async(req,res)=>{
  try {
      const id=req.query.id;
      const action=req.query.action;
      if(action==='Active'){
      await categoryModel.findByIdAndUpdate({_id:id},{is_active:false});
      }else{
        await categoryModel.findByIdAndUpdate({_id:id},{is_active:true});
      }
     res.redirect('/admin/adminCategory'); 
  } catch (error) {
      console.log(error.message);
  }

};

module.exports = {
  insertCategory,
  loadCategory,
  loadcateedit,
  upcateedit,
  deletecate
};
