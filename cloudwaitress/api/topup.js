import fetch from 'node-fetch';

export default async function handler(req, res) {
  if(req.method !== 'POST') return res.status(405).end();

  const { userId, amount, email } = req.body;

  if(!userId || !amount || !email){
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create Paystack transaction
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // in kobo
      callback_url: `https://cloud-ten-red.vercel.app/api/wallet/verify/`,
    })
  });

  const data = await response.json();

  if(data.status){
    res.status(200).json({ reference: data.data.reference, publicKey: process.env.PAYSTACK_PUBLIC_KEY });
  } else {
    res.status(500).json({ error: 'Failed to initialize transaction' });
  }
}
