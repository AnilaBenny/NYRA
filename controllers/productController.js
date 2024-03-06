const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const userModels = require('../models/userModels');
const cartModel = require('../models/cartModel');
const wishlistModel=require('../models/wishlistModel')

const loadproduct = async (req, res) => {
    try {
        const categorydetails = await categoryModel.find();
        res.render('admin-product', { cate: categorydetails, message: null });


    }
    catch (error) {
        console.log(error.message)
    }

};

const showsearch = async (req, res) => {
    try {
        const search = req.query.text;
        let products=[];
        if(req.query.category){
            const cat = req.query.category;
        const category = await categoryModel.findOne({ name: cat });
        products = await productModel
        .find({
            category: category._id,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ]
        })
        .populate('category');
}else{
     products = await productModel
    .find({
       
        $or: [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
        ]
    })
    .populate('category');
}
 res.status(200).json({ product: products });
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//insert product

const insertproduct = async (req, res) => {
    try {
        // console.log(req.body.category)
        const images = [];
        for (let i = 0; i < req.files.length; i++) {
            images.push(req.files[i].filename);
        }

        console.log(images);
        // const categoryname=await category.findById({_id:req.body.category}).populate("categories", { name: 1 }) ;
        // console.log(categoryname);

        const product = new productModel({
            name: req.body.name,
            description: req.body.description,
            images: images,
            brand: req.body.brand,
            countInStock:req.body.stock,
            category: req.body.category,
            price: req.body.price
            // ,discountPrice: req.body.discountPrice,
            // afterDiscount: Math.floor(parseInt(req.body.price) - (parseInt(req.body.price) * (parseInt(req.body.discountPrice) / 100)))
        });

        const savedProduct = await product.save();

        const categorydetails = await categoryModel.find();
        if (savedProduct) {

        //    res.render('admin-product', { cate: categorydetails, message: 'Product saved successfully.' })
           res.redirect('/admin/productlist')

        } else {
            res.render('admin-product', { cate: categorydetails, message: ' Error saving product.' })
        }


    }
    catch (error) {
        console.error('Error saving product:', error);

    }
};

//product list
const productlist = async (req, res) => {
    try {
        const productdetails = await productModel.find().populate('category');
        //console.log(productdetails);
        res.render('admin-product-list', { pro: productdetails });
    }
    catch (error) {
        console.log(error.message);
    }

};
const loadpro = async (req, res) => {
    try {
        const id = req.query.id;
        const image=req.query.delete;
        const productdetails = await productModel.findById({ _id: id }).populate('category');
        const index = productdetails.images.indexOf(image);
        if(image){
            // console.log('enter');
        if (index > -1) {

            await productModel.findByIdAndUpdate(id, { $unset: { [`images.${index}`]: 1 } });

            await productModel.findByIdAndUpdate(id, { $pull: { images: null } });
        } else {
            console.log("Image not found in the array");
        }
                }
  

        
        const categorydetails = await categoryModel.find();
        if (productdetails) {
            // console.log(productdetails);

            res.render('admin-product-edit', { cate: categorydetails, pro: productdetails, message: null });
        }
        else {
            res.redirect('/admin/productmanagement');
        }

    }
    catch (error) {
        console.log(error.message);
    }

}
const updatepro = async (req, res) => {
    try {

        let existingImages = [];
        const existingProduct = await productModel.findById(req.query.id);
        const categorydetails = await categoryModel.find();

        if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images) ) {
            existingImages = existingProduct.images;
        }

        let newImages = [];
        if (req.files && Array.isArray(req.files)) {
            newImages = req.files.map(file => file.filename);
        }


        const allImages = existingImages.concat(newImages);
        if(allImages.length>3){
            res.render('admin-product-edit', { cate: categorydetails, pro: existingProduct, message: 'maximum 3 images per product' });
        }else{
        const Data = await productModel.findByIdAndUpdate(req.query.id, {
            $set: {
                name: req.body.name,
                description: req.body.description,
                images: allImages,
                brand: req.body.brand,
                category: req.body.category,
                price: req.body.price,
                countInStock:req.body.stock,

            }
        });}
        // console.log(Data);
        if (Data) {
            res.redirect('/admin/productlist');
        }

    }
    catch (error) {
        console.log('update product:', error.message);
    }
};

const deletepro = async (req, res) => {
    try {
        const id = req.query.id;
        const action=req.query.action;
        if(action==='InActive'){
        await productModel.findByIdAndUpdate({ _id: id },{list:false});
        }else{
            await productModel.findByIdAndUpdate({ _id: id },{list:true});
        }
        res.redirect('/admin/productlist');
    } catch (error) {
        console.log(error.message);
    }

};

const loaduserprodetails = async (req, res) => {
    try {
        const id = req.query.id;
        const productdetails = await productModel.findById({ _id: id }).populate('category');
        const cartqty=await cartModel.find({'items.productId':id})

        if (productdetails) {
            // console.log(productdetails);
            let wish=await wishlistModel.findOne({user:user._id});
            if(!wish){
              wish=null;
            }
            let cart=await cartModel.findOne({owner:user._id})
            if(!cart)
            {
            cart=null;
            }
            res.render('user-product-details', { pro: productdetails,cart:cartqty.quantity ,wish,cart});
        }
        else {
            res.redirect('/home');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/home');
    }
};

const showproduct = async (req, res) => {
        try {
            const cat = req.query.category;
            
            const category = await categoryModel.findOne({ name: cat });
            const perPage=8;
            const page = parseInt(req.query.page) || 1;
            const totalproducts= await productModel.countDocuments({});
            const totalPage=Math.ceil(totalproducts / perPage)
            if (!category) {
                product = await productModel.find()
             
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
                sortQuery = { isFeatured: true };
            } else if (sort === 'popularity') {
                sortQuery = { popularity: -1 };
            } else if (sort === 'averagerating') {
                sortQuery = { rating: -1 };
            } else if (sort === 'Newarrivals') {
                sortQuery = { createdAt: -1 };
            }
            if (search !== '') {
                product = await productModel
                    .find({
                        category: category._id,
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { brand: { $regex: search, $options: 'i' } }
                        ]
                    })
                    .populate('category')
                    .sort(sortQuery).skip(perPage * (page - 1))
                    .limit(perPage);
            }else if(sort){
                product = await productModel.find({ category: category._id }).populate('category').sort(sortQuery).skip(perPage * (page - 1))
                .limit(perPage);
        }else{
            product = await productModel.find({ category: category._id }).populate('category').skip(perPage * (page - 1))
            .limit(perPage);
        }
        const userData = await userModels.findOne({ email: req.session.email });
             let wish=await wishlistModel.findOne({user:userData._id});
           
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:userData._id})
    if(!cart)
    {
    cart=null;
    }
            res.render('shop-product', { product, cat,totalPage,page,wish,cart});
        } catch (error) {
            console.error('Error in showproduct:', error.message);
            res.redirect('/home');
            
        }
    }
    
const allProduct=async(req,res)=>{
    try{
        let product=await productModel.find({})
        const perPage=8;
            const page = parseInt(req.query.page) || 1;
            const totalproducts= await productModel.countDocuments({});
            const totalPage=Math.ceil(totalproducts / perPage);
            const userData = await userModels.findOne({ email: req.session.email });
            const wish=await wishlistModel.findOne({user:userData._id});
            
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
                sortQuery = { isFeatured: true };
            } else if (sort === 'popularity') {
                sortQuery = { popularity: -1 };
            } else if (sort === 'averagerating') {
                sortQuery = { rating: -1 };
            } else if (sort === 'Newarrivals') {
                sortQuery = { createdAt: -1 };
            }
            if (search !== '') {
                product = await productModel
                    .find({
                        
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { brand: { $regex: search, $options: 'i' } }
                        ]
                    })
                    .populate('category')
                    .sort(sortQuery).skip(perPage * (page - 1))
                    .limit(perPage);
            }else if(sort){
                product = await productModel.find({}).populate('category').sort(sortQuery).skip(perPage * (page - 1))
                .limit(perPage);
        }else{
            product = await productModel.find({}).populate('category').skip(perPage * (page - 1))
            .limit(perPage);
        }
        
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:userData._id})
    if(!cart)
    {
    cart=null;
    }
        res.render('shopAll',{product,totalPage,page,wish,cart});
    }
    catch(error)
    {
    console.log('allProduct',error.message);
    }
}


module.exports = {
    loadproduct,
    insertproduct,
    productlist,
    loadpro,
    updatepro,
    deletepro,
    loaduserprodetails,
    showproduct,
    showsearch,
    allProduct


}