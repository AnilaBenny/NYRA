const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_ODbZBT9BgeLoJs',
    key_secret: 'yk4Yg61wWZGO9iZ5uPEgqWK3',
  });


  function generateRazorpay(orderId, amount) {
    return new Promise((resolve, reject) => {
        var options = {
            amount: amount,  
            currency: "INR",
            receipt: orderId
        };
        instance.orders.create(options, function(err, order) {
            if (err) {
                console.error('Error creating Razorpay order:', err);
                reject(err); 
                return;
            }
          
            resolve(order); 
        });
    });
}

module.exports={
    generateRazorpay,
    instance

}