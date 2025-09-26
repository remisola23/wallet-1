export default async function handler(req, res) {
  const { userId } = req.query;

  // For demo, using dummy data
  const wallets = {
    'demoUser': { balance: 1500, transactions: [
      { type: 'Credit', amount: 1000, date: new Date() },
      { type: 'Debit', amount: 500, date: new Date() },
    ]}
  };

  const wallet = wallets[userId] || { balance:0, transactions: [] };

  res.status(200).json(wallet);
}
