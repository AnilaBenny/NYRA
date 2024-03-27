const adminModel = require('../models/adminModel');
const userModel = require('../models/userModels');
const bcrypt = require('bcryptjs');
const orderModel=require('../models/orderModel');
const productModel=require('../models/productModel');
const {couponModel}=require('../models/couponModel');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const cartModel = require('../models/cartModel');
const WalletModel=require('../models/walletModel');
const { Table } = require('pdfkit-table');

const categoryModel = require('../models/categoryModel');
const userModels = require('../models/userModels');


async function salesReport(date){
try{
    const currentDate = new Date();
    let orders = [];
    for (let i = 0; i < date; i++) {
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() - i);
        endDate.setHours(23, 59, 59, 999);  
    
        const dailyOrders = await orderModel.find({
          status: "Delivered",
          orderDate: {
            $gte: startDate,
            $lt: endDate,
          },
        });
        
    
        orders = [...orders, ...dailyOrders];
      }

      let productEntered = [];
      for (let i = 0; i < date; i++) {
          const startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - i);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() - i);
          endDate.setHours(23, 59, 59, 999);  
      
          const product = await productModel.find({
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
          });
          
      
          productEntered= [...productEntered, ...product];
        }
      let users = await userModel.countDocuments();
     

      let totalRevenue = 0;
      orders.forEach((order) => {
        totalRevenue += order.billTotal;
      });
    
      let totalOrderCount = await orderModel.find({
        status: "Delivered",
      });
    
      let Revenue = 0;
      totalOrderCount.forEach((order) => {
        Revenue += order.billTotal;
      });
    
      let stock = await productModel.find();
      let totalCountInStock = 0;
      stock.forEach((product) => {
        totalCountInStock += product.countInStock;
      });
    
      let averageSales = orders.length / date; 
      let averageRevenue = totalRevenue / date; 
 
     
      return {
        users,
        totalOrders: orders.length,
        totalRevenue,
        totalOrderCount: totalOrderCount.length,
        totalCountInStock,
        averageSales,
        averageRevenue,
        Revenue,
        productEntered:productEntered.length,
       
        totalOrder:orders
      };
}
catch(err){
console.log('salesreport',err.message);
}
}

async function salesReportmw(startDate, endDate) {
    try {
        let orders = await orderModel.find({
            status: "Delivered",
            orderDate: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        let productEntered = await productModel.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        let usersCount = await userModel.countDocuments();

        let totalRevenue = orders.reduce((total, order) => total + order.billTotal, 0);

        let totalOrderCount = orders.length;

        let stock = await productModel.find(); 
        let totalCountInStock = stock.reduce((total, product) => total + product.countInStock, 0);

        let daysInRange = (endDate - startDate) / (1000 * 60 * 60 * 24);
        let averageSales = totalOrderCount / daysInRange; 
        let averageRevenue = totalRevenue / daysInRange; 

        return {
            usersCount,
            totalOrders: totalOrderCount,
            totalRevenue,
            totalCountInStock,
            averageSales,
            averageRevenue,
            productEntered: productEntered.length,
            totalOrder: orders 
        };
    } catch (err) {
        console.error('salesReport error', err.message);
        throw err; 
    }
}


const getWeeksInMonth = (currentDate) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const weeks = [];
    const firstDate = new Date(year, month, 1);
    const numDays = currentDate.getDate();

    let start = 1;
    let end = 7 - currentDate.getDay();

    while (start <= numDays) {
        if (end > numDays) {
            end = numDays;
        }

        weeks.push({ start: new Date(year, month, start), end: new Date(year, month, end) });

        start = end + 1;

        // Calculate new end based on the new start
        end = start + 6;

        // If end exceeds the number of days in the month, set it to the last day of the month
        if (end > numDays) {
            end = numDays;
        }
    }


    return weeks;
};

const getMonthsInYear = (currentMonth) => {
    let months = [];
    for (let month = 0; month <= currentMonth; month++) {
        months.push({ month, year: new Date().getFullYear() });
    }
    return months;
};
function getMonthName(month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month];
}

const pdf = async (req, res) => {
    try {
        let title = "";
        const currentDate = new Date();

        switch (req.query.type) {
            case 'daily':
                let dailySalesData = await salesReport(1);
                generatePDF([dailySalesData], "Daily Sales Report", res);
                break;
            case 'weekly':
                let weeklySalesData = [];
                const weeks = getWeeksInMonth(currentDate);
                for (const week of weeks) {
                    const data = await salesReportmw(week.start, week.end);
                    weeklySalesData.push({ ...data, period:`Week ${weeks.indexOf(week) + 1}, ${getMonthName(currentDate.getMonth())}` });
                }
                generatePDF(weeklySalesData, "Weekly Sales Report", res);
                break;
            case 'monthly':
                let monthlySalesData = [];
                const months = getMonthsInYear(currentDate.getMonth());;
                for (const { month, year } of months) {
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);
                    const data = await salesReportmw(monthStart, monthEnd);
                    monthlySalesData.push({ ...data, period: `${getMonthName(month)} ${currentDate.getFullYear()}` });
                }
                generatePDF(monthlySalesData, "Monthly Sales Report", res);
                break;
            case 'yearly':
                let yearlySalesData = [await salesReport(365)];
                generatePDF(yearlySalesData, "Yearly Sales Report", res);
                break;
            default:
                res.status(400).send('Invalid report type specified.');
                return;
        }
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).send('Error generating PDF.');
    }
};

const generatePDF = (salesData, title, res) => {
    try {
        let doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, "_")}.pdf"`);
        doc.pipe(res);

        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        doc.fontSize(20).text(`${title} - ${today}`, { align: 'center' });
        doc.moveDown(2);

        for (const data of salesData) {
            doc.moveDown(2);
            doc.text(data.period, { align: 'left' });

            const tableHeaders = ['Metric', 'Value'];
            const columnStartPositions = [50, 300];
            const fontSize = 12;

            doc.font('Helvetica-Bold').fontSize(fontSize);
            tableHeaders.forEach((header, index) => {
                doc.text(header, columnStartPositions[index], doc.y, { width: 200, align: 'center' });
                doc.strokeColor('black').lineWidth(1);
            });

            doc.font('Helvetica').fontSize(fontSize);
            const tableRows = [
                ['Total Revenue', `INR ${data.totalRevenue}`],
                ['Total Orders', data.totalOrders],
             
                ['Average Sales', `${data.averageSales ? data.averageSales.toFixed(2) : 'N/A'}%`],
                ['Average Revenue', `${data.averageRevenue ? data.averageRevenue.toFixed(2) : 'N/A'}`],
            ];

            data.totalOrder.forEach(order => {
                if (order.coupon !== 'nil') {
                    tableRows.push([`Coupon: ${order.coupon}`, `INR ${order.discountPrice}`]);
                }
            });

            const overallDiscountPrice = data.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
            tableRows.push(['Overall Discount Price', `INR ${overallDiscountPrice}`]);

            tableRows.forEach((row, rowIndex) => {
                row.forEach((text, index) => {
                    doc.text(text, columnStartPositions[index], doc.y, { width: 200, align: 'center' });
                });
                doc.moveDown(0.5);
            });
        }

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).send('Error generating PDF.');
    }
};


  const generateExcel = async (req, res, next) => {
    try {
      const salesDatas = await salesReport(365);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
      const overallDiscountPrice=salesDatas.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
      const couponcode = salesDatas.totalOrder.map(order => { return order.coupon;});
      const couponCodesString = couponcode.join(', ');
   
      worksheet.columns = [
        { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
        { header: 'Total Orders', key: 'totalOrders', width: 15 },
        { header: 'Total Count In Stock', key: 'totalCountInStock', width: 15 },
        { header: 'Average Sales', key: 'averageSales', width: 15 },
        { header: 'Average Revenue', key: 'averageRevenue', width: 15 },
        { header: 'Revenue', key: 'Revenue', width: 15 },
        { header: 'Applied coupon code', key: 'couponCodesString', width: 15 },
        { header: 'overall discount price', key: 'overalldiscountprice', width: 15 }
      ];
      
    



      worksheet.addRow({
        totalRevenue: salesDatas.totalRevenue,
        totalOrders: salesDatas.totalOrders,
        totalCountInStock: salesDatas.totalCountInStock,
        averageSales: salesDatas.averageSales ? salesDatas.averageSales.toFixed(2) : 'N/A',
        averageRevenue: salesDatas.averageRevenue ? salesDatas.averageRevenue.toFixed(2) : 'N/A',
        Revenue: salesDatas.Revenue,
        couponCodesString:couponCodesString,
        overalldiscountprice:overallDiscountPrice
        
        
      });
      
    

  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
  
      workbook.xlsx.write(res).then(() => res.end());
    } catch (error) {
      console.log(error.message);
      return res.status(500);
    }
  };


async function orderPieChart() {
    const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Canceled", "Returned"];
    const counts = await Promise.all(statuses.map(status => orderModel.countDocuments({ status })));

    

    const [Pending, Processing, Shipped, Delivered, Canceled, Returned] = counts;

    return { Pending, Processing, Shipped, Delivered, Canceled, Returned };
}


let adminLogin = async (req, res) => {
    try {
        res.render('admin-login', { err: null });
    } catch (error) {
        console.error("Error in adminLogin:", error);
        
    }
};


let adminPost = async (req, res) => {
    try {
        const { email, password} = req.body;
       
  
        
        const adminExist = await adminModel.findOne({
            adminEmail: email });
        console.log(adminExist);

        if (adminExist) {
           
           
            if (password===adminExist.adminPassword) {
               
                req.session.admin = true;
                return res.redirect("/admin/adminpanel");
            } else {
              
                return res.render("admin-login", { err: "Invalid email or password" });
            }
        } else {
           
            return res.render("admin-login", { err: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Error during login:", error);
      
    }
};


let adminLogout = (req, res) => {
    req.session.admin = false;

    res.redirect("/admin");
};


const loadPanel = async (req, res) => {
    try {
        let daily = await salesReport(1);
        let weekly = await salesReport(7);
        let monthly = await salesReport(30);
        let yearly = await salesReport(365);
        let allProductsCount = await productModel.countDocuments();
        let orders=await orderModel.find().populate('user').limit(5);
    
        
        
        let orderChart=await orderPieChart();
        
        res.render('adminpanel.ejs',{daily,weekly,monthly,yearly,allProductsCount,orders,orderChart});
    } catch (error) {
        console.error(error);
     
    }
};

const loadusermanagement = async (req, res) => {
    try {
        const userdetails = await userModel.find();
       
        res.render('user-management', { users: userdetails });
    } catch (error) {
        console.log('load user manage',error.message);
    }
};

let userblock = async (req, res) => {
    try {
        const { id } = req.body;
        const userData = await userModel.findById(id);
        if(userData.isBlocked){
            await userModel.findByIdAndUpdate({_id:id},{$set:{ isBlocked:false}});
            await userData.save(); 
            res.status(200).json({ status: true, users: userData });
        }
        else{
            await userModel.findByIdAndUpdate({_id:id},{$set:{ isBlocked:true}});
            await userData.save(); 
            res.status(201).json({ status: true, users: userData });
        } 
        } 
     catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }};

const loadordermanagement = async (req, res) => {
        try {
            const perPage=8;
            const page = parseInt(req.query.page) || 1;
            const totalorders= await orderModel.countDocuments({});
            const totalPage=Math.ceil(totalorders / perPage);
            const order = await orderModel.find({}).populate('user').sort({updatedAt:-1}).skip(perPage * (page - 1)).limit(perPage);
            
            res.render('admin-orderlist', { order,totalPage,page});
        } catch (err) {
            console.error('Error in load order management:', err.message);
            
        }
    };

const requestAccept = async (req, res) => {
        try {
            const { orderId,userId } = req.body;
    
            const canceledOrder = await orderModel.findOne({ oId: orderId });
            const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
            if (!canceledOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            let wallet = await WalletModel.findOne({ user: userId });
            if (!wallet) {
              
                wallet = new WalletModel({
                    user: userId,
                    balance: 0, 
                    transactions: [] 
                });
            }
            wallet.balance += canceledOrder.billTotal;
            wallet.transactions.push({
                amount: canceledOrder.billTotal,
                type: 'credit',
                reason: 'Refund for order ' + orderId
            });
    
            await wallet.save();
    
    
            for (const orderItem of canceledOrder.items) {
                const product = await productModel.findById(orderItem.productId);
    
                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
    for(let i=0;i<canceledOrder.requests.length;i++){
            if(canceledOrder.requests[i].type==='Cancel'){
            await orderModel.findOneAndUpdate(
                { oId: orderId },
                { $set: { status: 'Canceled', 'requests.$[elem].status': 'Accepted' } },
                { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
            );}else{
                 await orderModel.findOneAndUpdate(
                    { oId: orderId },
                    { $set: { status: 'Returned', 'requests.$[elem].status': 'Accepted' } },
                    { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
                );
            }}
            return res.status(200).json({ success: true, message: 'Order status updated successfully'});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
    

const requestCancel=async(req,res)=>{
    try {
        const { orderId} = req.body;
       

            const Order = await orderModel.findOne({oId:orderId});

            if (!Order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
        
        for (const orderItem of Order.items) {
            const product = await productModel.findById(orderItem.productId);

            if (product &&product.countInStock>0 ) {
             
                product.countInStock -= orderItem.quantity;
                await product.save();
            }
        }
    
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            { $set: { status: 'Pending', 'requests.$[elem].status': 'Rejected' } },
            { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
        );
        

    if (!updatedOrder) {
        
        return res.status(201).json({ success: true, message: 'Order not found' });
        
    }
    

    return res.status(200).json({ success: true, message: 'Order status rejected', updatedOrder })
     }catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
}

const loadorderdetail=async(req,res)=>{
    try{
        
        const orders = await orderModel.findById(req.query.id).populate('user');
        
        res.render('adminorderdetail',{orders});

    }catch(error){
        console.log('load order detail:',error.message);
    }
}

const uporder=async(req,res)=>{
    try{
        const {newStatus,orderId}=req.body;
       
        const order=await orderModel.findOne({oId:orderId});
        if(newStatus==='Canceled'){
            for (const orderItem of order.items) {
                let product = await productModel.findById(orderItem.productId);
    

                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }

        }
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            {$set:{ status: newStatus } },
            { new: true }
        );
          
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    }
    catch(error){
        console.log('uporder:',error.message);
    }

}

const couponManager=async(req,res)=>{
    try{
        const coupons=await couponModel.find({});
        const users=await userModels.find({});
        res.render('admincoupon',{coupons,users,message:null});
    }
    catch(error){
        console.log('coupon manager',error.message);
    }

}

const couponCreate=async(req,res)=>{
    try{
        const {
            code,
            description,
            discountPercentage,
            maxDiscountAmount,
            minimumAmount,
            maximumAmount,
            expirationDate,
            maxUsers
        }=req.body;
        const minAmount = parseInt(minimumAmount);
        const maxAmount = parseInt(maximumAmount);
        const coupons=await couponModel.find({});
        const users=await userModels.find({});
        if(minAmount>maxAmount){
           return res.render('admincoupon',{coupons,users,message:'minimum amount is not greater than maximum amount'});
        }else{
      
            const coupon = new couponModel({
                code,
                description,
                maxDiscountAmount,
                minimumAmount:minAmount,
                maximumAmount:maxAmount,
                discountPercentage: discountPercentage,
                expirationDate,
                maxUsers: maxUsers > 0 ? maxUsers : null, 
              });
              await coupon.save();
              res.redirect('/admin/coupon')
            }

    }
    catch(error){
        console.log('coupon creation:',error.message);
    }

}

const listunlist=async(req,res)=>{
    try{
        const coupon=await couponModel.findById(req.body.id);
        if(coupon.isActive){
            await couponModel.findByIdAndUpdate({_id:req.body.id},{$set:{ isActive:false}});
            await coupon.save(); 
            res.status(200);
           
        }
        else{
            await couponModel.findByIdAndUpdate({_id:req.body.id},{$set:{ isActive:true}});
            await coupon.save(); 
            res.status(201);
        } 
       
        
    }
    catch(error){
        console.log(error.message);
    }

}

const salesdetails=async(req,res)=>{
try{
const order=await orderModel.find({status: "Delivered"}).populate('user');
res.render('salesdetails',{order});
}
catch(err){
    console.log('sales details',err.message);
}
}

const filterData=async(req,res)=>{
    try{
        const filterData=req.body;
       
        if(filterData.type==='today'){
            date=1
        }else if(filterData.type==='week'){
            date=7
        }else{
            date=30
        }
        if(filterData.type==='custom'){
            const endDate = new Date(filterData.endDate);
            const startDate = new Date(filterData.startDate);
            
            const differenceMs = endDate.getTime() - startDate.getTime();
            const differenceDays = differenceMs / (1000 * 3600 * 24);
           date = Math.round(differenceDays);
            
            
            
        }
        const currentDate = new Date();
        let order = [];
        for (let i = 0; i < date; i++) {
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() - i);
            endDate.setHours(23, 59, 59, 999);  
        
            const dailyOrders = await orderModel.find({
              status: "Delivered",
              orderDate: {
                $gte: startDate,
                $lt: endDate,
              },
            }).populate('user');
            
        
            order= [...order, ...dailyOrders];
          }
   
        res.json({ success: true, message: 'Filter data received successfully',order:order });
    }
    catch(error){
        console.log('filter data',error.message);

    }
}

let logout = (req, res) => {
    req.session.admin = false;
    res.redirect("/admin");
  };

const bestSelling=async(req,res)=>{
    try{

        const popularityByCategory = await orderModel.aggregate([
            {
                $unwind: "$items" 
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product" 
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category" 
            },
            {
                $group: {
                    _id: { categoryId: "$product.category", categoryName: "$category.name", productId: "$items.productId" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.categoryId",
                    categoryName: { $first: "$_id.categoryName" },
                    products: {
                        $push: {
                            productId: "$_id.productId",
                            count: "$count"
                        }
                    }
                }
            }
        ]);
        
      
        const bestSellingBrands= await orderModel.aggregate([
            {
                $unwind: "$items" 
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product" 
            },
            {
                $group: {
                    _id: "$product.brand", 
                    totalQuantitySold: { $sum: "$items.quantity" } 
                }
            },
            {
                $sort: { totalQuantitySold: 1 } 
            }
        ]);
        


        const product=await productModel.find({list:true}).sort({popularity:1}).limit(10);
        
        res.render('bestSelling',{product,popularityByCategory,bestSellingBrands})

    }
    catch(error){
        console.log('best selling',error.message);
    }
}

const offer=async(req,res)=>{
    try{
        let product=await productModel.find({list:true});
        const category=await categoryModel.find({is_active:true});
        for (let i = 0; i < product.length; i++) {
            const offerDate = new Date(product[i].offerTime);
            const currentDate=new Date();

            if (currentDate > offerDate) {
                product[i].discountPrice = 0;
                product[i].offerTime = null;
            }
    
            await product[i].save();
        }
        for (let i = 0; i < category.length; i++) {
            const offerDate = new Date(category[i].offerTime);
            const currentDate = new Date();
        
            if (currentDate > offerDate) {
                const products = await productModel.find({category: category[i]._id});
        
              
                const updateProductPromises = products.map(async (product) => {
                    product.discountPrice = 0;
                    product.offerTime = null;
                    return product.save();
                });
                
                await Promise.all(updateProductPromises);
        
                await categoryModel.findByIdAndUpdate(category[i]._id, {
                    $unset: { offerTime: "",discountPrice:"" } 
                });
        
           
            }
        }

    
    res.render('offer',{product,category});
    }
    catch(error){
        console.log('offer',error.message);
    }
}

const offerEnd=async(req,res)=>{
    try{
        const id=req.query.id;
        let product=await productModel.findOne({_id:id,list:true});
      
            product.discountPrice = 0;
            product.offerTime = null;
    
        await product.save();
        res.redirect('/admin/offer')

    }
    catch(error){
        console.log('offer End',error.message);
    }

}

const categoryofferEnd=async(req,res)=>{
    try {
        const id = req.query.id;
        const products = await productModel.find({ category: id });
    
        const updateProductPromises = products.map(async (product) => {
            product.discountPrice = 0;
            product.offerTime = null;
            return product.save();
        });
    
        await Promise.all(updateProductPromises);
    
        await categoryModel.findByIdAndUpdate(id, {
            $unset: { offerTime: "" ,discountPrice:"" }
        });
    
        res.redirect('/admin/offer');
    } catch (error) {
        console.log('Error ending category offer:', error.message);
    }
    

}


module.exports = {
    adminLogin,
    adminPost,
    loadPanel,
    adminLogout,
    loadusermanagement,
    userblock,
    loadordermanagement,
    requestCancel,
    requestAccept,
    loadorderdetail,
    uporder,

    couponManager,
    couponCreate,
    listunlist

    ,salesdetails,
    filterData,

    pdf,
    generateExcel,
    logout
    ,
    bestSelling,
    offer,
    offerEnd,
    categoryofferEnd
};
