const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');

const loadproduct = async (req, res) => {
    try {
        const categorydetails = await categoryModel.find();
        res.render('admin-product', { cate: categorydetails, message: null });


    }
    catch (error) {
        console.log(error.message)
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
            // countInStock: req.body.countInStock,
            category: req.body.category,
            price: req.body.price
            // ,discountPrice: req.body.discountPrice,
            // afterDiscount: Math.floor(parseInt(req.body.price) - (parseInt(req.body.price) * (parseInt(req.body.discountPrice) / 100)))
        });

        const savedProduct = await product.save();

        // Associate the product with its category
        // const category = await categoryModel.findById(product.category);
        // if (category) {
        //     category.products.push(savedProduct._id);
        //     await category.save();
        // }
        const categorydetails = await categoryModel.find();
        if (savedProduct) {

           // res.render('admin-product', { cate: categorydetails, message: 'Product saved successfully.' })
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
        const productdetails = await productModel.find().populate('category')
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
        const productdetails = await productModel.findById({ _id: id }).populate('category');
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

        if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
            existingImages = existingProduct.images;
        }

        let newImages = [];
        if (req.files && Array.isArray(req.files)) {
            newImages = req.files.map(file => file.filename);
        }

        const allImages = existingImages.concat(newImages);



        const Data = await productModel.findByIdAndUpdate(req.query.id, {
            $set: {
                name: req.body.name,
                description: req.body.description,
                images: allImages,
                brand: req.body.brand,
                category: req.body.category,
                price: req.body.price
            }
        });
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
        await productModel.deleteOne({ _id: id });
        res.redirect('/admin/productlist');
    } catch (error) {
        console.log(error.message);
    }

};

const loaduserprodetails = async (req, res) => {
    try {
        const id = req.query.id;
        const productdetails = await productModel.findById({ _id: id }).populate('category');

        if (productdetails) {
            console.log(productdetails);

            res.render('user-product-details', { pro: productdetails });
        }
        else {
            res.redirect('/home');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    loadproduct,
    insertproduct,
    productlist,
    loadpro,
    updatepro,
    deletepro,
    loaduserprodetails


}