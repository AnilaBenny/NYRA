const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const userModels = require('../models/userModels');
const cartModel = require('../models/cartModel');
const wishlistModel=require('../models/wishlistModel');
const orderModel = require('../models/orderModel');

const loadproduct = async (req, res) => {
    try {
        const categorydetails = await categoryModel.find({is_active:true});
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
            category: category._id,list:true,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ]
        })
        .populate('category');
}else{
     products = await productModel
    .find({list:true,
       
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



const insertproduct = async (req, res) => {
    try {
        console.log(req.body);
        const images = [];
        
      
        if (req.files && req.files.length > 0) {
            
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        } else {
            console.log('No files were uploaded');
          
            return res.render('admin-product', { message: 'No files were uploaded' });
        }

        const category=await categoryModel.findById(req.body.category) || null;
        let product={};
        
        if(category !==null && typeof category.offerTime!=='undefined'  )
        {
           
         product = new productModel({
            name: req.body.name,
            description: req.body.description,
            images: images,
            brand: req.body.brand,
            countInStock: req.body.stock,
            category: req.body.category,
            price: req.body.price,
            offerTime:category.offerTime,
            discountPrice:category.discountPrice

        });
    }else{
         product = new productModel({
            name: req.body.name,
            description: req.body.description,
            images: images,
            brand: req.body.brand,
            countInStock: req.body.stock,
            category: req.body.category,
            price: req.body.price

        });

    }
        const savedProduct = await product.save();

        if (savedProduct) {
            return res.redirect('/admin/productlist');
        } else {
            const categorydetails = await categoryModel.find();
            return res.render('admin-product', { cate: categorydetails, message: 'Error saving product.' });
        }
    } catch (error) {
        console.error('Error saving product:', error.message);
      
        return res.render('admin-product', { message: 'Error saving product.' });
    }
};

const productlist = async (req, res) => {
    try {
        const perPage=8;
        const page = parseInt(req.query.page) || 1;
        const totalproducts= await productModel.countDocuments({});
        const totalPage=Math.ceil(totalproducts / perPage)
        const productdetails = await productModel.find({}).populate('category').skip(perPage*(page-1)).limit(perPage);;
      
        res.render('admin-product-list', { pro:productdetails,totalPage,page});
    }
    catch (error) {
        console.log('product List',error.message);
    }

};
const loadpro = async (req, res) => {
    try {
        const id = req.query.id;
        const image=req.query.delete;
        const productdetails = await productModel.findById({ _id: id }).populate('category');
        const index = productdetails.images.indexOf(image);
        if(image){
          
        if (index > -1) {

            await productModel.findByIdAndUpdate(id, { $unset: { [`images.${index}`]: 1 } });

            await productModel.findByIdAndUpdate(id, { $pull: { images: null } });
        } else {
            console.log("Image not found in the array");
        }
                }
  

        
        const categorydetails = await categoryModel.find({});
        if (productdetails) {
            

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
        const categorydetails = await categoryModel.find({});

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
            
            const category=await categoryModel.findById(req.body.category) || null;
        
            if(category !==null && typeof category.offerTime!=='undefined'  )
            {
               
                await productModel.findByIdAndUpdate(req.query.id, {
                    $set: {
                        name: req.body.name,
                        description: req.body.description,
                        images: allImages,
                        brand: req.body.brand,
                        category: req.body.category,
                        price: req.body.price,
                        countInStock:req.body.stock,
                        offerTime:category.offerTime,
                        discountPrice:category.discountPrice
        
                    }});
       }else{
        await productModel.findByIdAndUpdate(req.query.id, {
            $set: {
                name: req.body.name,
                description: req.body.description,
                images: allImages,
                brand: req.body.brand,
                category: req.body.category,
                price: req.body.price,
                countInStock: req.body.stock
            },
            $unset: {
                offerTime: "",
                discountPrice: ""
            }
        });
        
            
        }
        
            res.redirect('/admin/productlist');
        

    }}
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
        const productdetails = await productModel.findById({ _id: id }).populate('category').populate({
            path: 'review.user',
            model: 'user'
        });
        const cartqty=await cartModel.find({'items.productId':id})

        if (productdetails) {
            const user=await userModels.findOne({email:req.session.email});
            let wish=await wishlistModel.findOne({user:user._id});
            if(!wish){
              wish=null;
            }
            let cart=await cartModel.findOne({owner:user._id})
            if(!cart)
            {
            cart=null;
            }
            if(productdetails.review && productdetails.review.length > 0){
               const totalRating = productdetails.review.reduce((acc, review) => acc + review.rating, 0);
                rating = totalRating / productdetails.review.length;
            }
            else{
                productdetails.review=null;
                rating=0
            }
          
            res.render('user-product-details', { pro: productdetails,cart:cartqty.quantity ,wish,cart,rating});
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
            const totalproducts= await productModel.countDocuments({list:true,category:category._id});
            const totalPage=Math.ceil(totalproducts / perPage)
            
            if (!category) {
                product = await productModel.find({list:true})
             
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
                product = await productModel.find({ category: category._id,list:true,isFeatured: true }).populate('category').sort(sortQuery).skip(perPage * (page - 1))
                .limit(perPage);
            } else if (sort === 'popularity') {
                sortQuery = { popularity: -1 };
            } else if (sort === 'averagerating') {
                sortQuery = { "review.rating": -1 };
            } else if (sort === 'Newarrivals') {
                sortQuery = { createdAt: -1 };
            }
            if (search !== '') {
                product = await productModel
                    .find({
                        category: category._id,list:true,
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { brand: { $regex: search, $options: 'i' } }
                        ]
                    })
                    .populate('category')
                    .sort(sortQuery).skip(perPage * (page - 1))
                    .limit(perPage);
            }else if(sort){
                product = await productModel.find({ category: category._id,list:true }).populate('category').sort(sortQuery).skip(perPage * (page - 1))
                .limit(perPage);
        }else{
            product = await productModel.find({ category: category._id,list:true}).populate('category').skip(perPage * (page - 1))
            .limit(perPage);
        }
        const userData = await userModels.findOne({ email: req.session.email });
             let wish=await wishlistModel.findOne({user:userData._id});
           
   
    let cart=await cartModel.findOne({owner:userData._id})
    if(!cart)
    {
    cart=null;
    }
    if (!wish) {
        wish = null;
    }

            res.render('shop-product', { product, cat,totalPage,page,wish,cart,sort});
        } catch (error) {
            console.error('Error in showproduct:', error.message);
            res.redirect('/home');
            
        }
    }
    
const allProduct=async(req,res)=>{
    try{
        let product=await productModel.find({list:true})
        const perPage=8;
            const page = parseInt(req.query.page) || 1;
            const totalproducts= await productModel.countDocuments({});
            const totalPage=Math.ceil(totalproducts / perPage);
            const userData = await userModels.findOne({ email: req.session.email });
            let wish=await wishlistModel.findOne({user:userData._id});
            const id=req.query.id;
            let category=await categoryModel.find({});
            
            
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
                product = await productModel.find({list:true,isFeatured: true }).populate('category').sort(sortQuery).skip(perPage * (page - 1))
                .limit(perPage);
            } else if (sort === 'popularity') {
                sortQuery = { popularity: -1 };
            } else if (sort === 'averagerating') {
                sortQuery = { "review.rating": -1 };
            } else if (sort === 'Newarrivals') {
                sortQuery = { createdAt: -1 };
            }
            if (search !== '') {
                product = await productModel
                    .find({
                        list:true,
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { brand: { $regex: search, $options: 'i' } }
                        ]
                    })
                    .populate('category')
                    .sort(sortQuery).skip(perPage * (page - 1))
                    .limit(perPage);
            }else if(sort){
                product = await productModel.find({list:true}).populate('category').sort(sortQuery).skip(perPage * (page - 1))
                .limit(perPage);
        }else{
            product = await productModel.find({list:true}).populate('category').skip(perPage * (page - 1))
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
    if(id){
        product=await productModel.find({category:id,list:true}).populate('category').skip(perPage * (page - 1))
        .limit(perPage);
   }
        res.render('shopAll',{product,totalPage,page,wish,cart,category,sort});
    }
    catch(error)
    {
    console.log('allProduct',error.message);
    }
}

const reviewUpdate = async (req, res) => {
    try {
        const { id, review, userRating,oId } = req.body;
        const user = await userModels.findOne({ email: req.session.email });
        await orderModel.findOneAndUpdate(
            {'items.productId': id},
            {reviewed: true},
            {new: true,upsert:true}
        );
        
       
        
        let product = await productModel.findById(id);

        if (!product.review) {
            product.review = [];
        }

        const existingReviewIndex = product.review.findIndex(reviewObj => String(reviewObj.user) === String(user._id));

        if (existingReviewIndex !== -1) {
            product.review[existingReviewIndex].reviewdescription = review;
            product.review[existingReviewIndex].rating = userRating;
        } else {
            
            product.review.push({ user: user._id, reviewdescription: review, rating: userRating });
        }

        
        await product.save();

        
        res.status(200).send("Product review updated successfully.");
    } catch (error) {
        console.error('reviewUpdate', error.message);
        res.status(500).send("Internal Server Error");
    }
};

const postOffer = async (req, res) => {
    try {
        const { date, discount, id } = req.body;
        let product=await productModel.findById(id);
       product.discountPrice=(product.price*discount/100).toFixed();
        product.offerTime=date;

        await product.save();
        res.redirect('/admin/offer')

    } catch (error) {
        console.log('product offer', error.message);
    }
};

const postOffer2 = async (req, res) => {
    try {
        const { date, discount, id } = req.body;

   

        let category = await categoryModel.findById(id);
        if (!category) {
            console.log('Category not found');
            return res.status(404).send('Category not found');
        }

        let products = await productModel.find({ category: id });

        const newDiscountPrices = products.map(product => {
            const newDiscountPrice = (product.price * discount / 100).toFixed(); 
            return {
                ...product._doc, 
                newDiscountPrice: +newDiscountPrice 
            };
        });

        for (const product of newDiscountPrices) {
            if (product.newDiscountPrice > product.discountPrice) {
                await productModel.findByIdAndUpdate(product._id, { discountPrice: product.newDiscountPrice, offerTime: date });
            }
        }

        category.offerTime = date;
        category.discountPrice=discount;
        await category.save();

        res.redirect('/admin/offer');

    } catch (error) {
        console.log('Error in postOffer2:', error.message);

        return res.status(500);
    }
};




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
    allProduct,
    reviewUpdate,

    postOffer,
    postOffer2


}