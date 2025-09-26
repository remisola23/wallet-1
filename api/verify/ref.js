import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { ref } = req.query;

  if(!ref) return res.status(400).json({ error: 'Missing reference' });

  const response = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });

  const data = await response.json();

  if(data.status && data.data.status === 'success'){
    // Update your backend DB here: add amount to user wallet
    res.status(200).json({ success: true, amount: data.data.amount/100 });
  } else {
    res.status(200).json({ success: false });
  }
}
