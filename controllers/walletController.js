const WalletModel=require('../models/walletModel');
const OrderModel=require('../models/orderModel');
const userModel=require('../models/userModels');
const addtoWallet = async (req, res) => {
    
    try {
        const { orderId, userId } = req.body;
      

        const order = await OrderModel.findById(orderId);
       
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let wallet = await WalletModel.findOne({ user: userId });
        if (!wallet) {
          
            wallet = new WalletModel({
                user: userId,
                balance: 0, 
                transactions: [] 
            });
        }

        wallet.balance += order.billTotal;
        wallet.transactions.push({
            amount: order.billTotal,
            type: 'credit',
            reason: 'Refund for order ' + orderId
        });

        await wallet.save();

        return res.json({ success: true, message: 'Amount refunded successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

module.exports={
addtoWallet
}