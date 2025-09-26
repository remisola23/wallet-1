const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// In-memory wallet storage (replace with DB in production)
let wallets = {}; // { userId: { balance: 0, transactions: [] } }

// Helper to initialize wallet for new users
function getWallet(userId){
  if(!wallets[userId]) wallets[userId] = { balance: 0, transactions: [] };
  return wallets[userId];
}

// --- Serverless function handler ---
module.exports = async (req, res) => {
  const { method, query, body } = req;

  // --- Fetch Wallet ---
  if(method === 'GET' && query.userId){
    const wallet = getWallet(query.userId);
    return res.status(200).json(wallet);
  }

  // --- Top-up Wallet (initialize Paystack) ---
  if(method === 'POST' && req.url.includes('/topup')){
    const { userId, amount, email } = body;
    const reference = `cw_tx_${Date.now()}`;

    try {
      const response = await axios.post('https://api.paystack.co/transaction/initialize',{
        email, amount: amount*100, currency:'NGN', reference
      },{
        headers:{ Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });

      return res.status(200).json({
        reference,
        publicKey: PAYSTACK_PUBLIC_KEY
      });
    } catch(err){
      console.error(err);
      return res.status(500).json({ error:'Top-up initiation failed' });
    }
  }

  // --- Verify Payment ---
  if(method === 'GET' && req.url.includes('/verify/')){
    const reference = req.url.split('/verify/')[1];
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,{
        headers:{ Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });

      const trx = response.data.data;
      if(trx.status === 'success'){
        const userId = trx.metadata?.userId || 'default';
        const wallet = getWallet(userId);
        wallet.balance += trx.amount/100;
        wallet.transactions.unshift({
          type: "Credit",
          amount: trx.amount/100,
          date: trx.paid_at
        });
        return res.status(200).json({ success:true });
      } else return res.status(400).json({ success:false });
    } catch(err){
      console.error(err);
      return res.status(500).json({ success:false });
    }
  }

  // --- Deduct Wallet ---
  if(method === 'POST' && req.url.includes('/deduct')){
    const { userId, amount } = body;
    const wallet = getWallet(userId);
    if(wallet.balance >= amount){
      wallet.balance -= amount;
      wallet.transactions.unshift({ type: "Debit", amount, date: new Date().toISOString() });
      return res.status(200).json({ success:true });
    } else {
      return res.status(400).json({ success:false, message:'Insufficient balance' });
    }
  }

  res.status(404).json({ error:'Endpoint not found' });
};
