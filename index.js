require('dotenv').config();
const express = require('express');
const midtransClient = require('midtrans-client');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Mengizinkan request dari domain lain (aplikasi Flutter web kita)
app.use(express.json());

// Inisialisasi Midtrans Snap API
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Endpoint untuk membuat transaksi
app.post('/create-transaction', async (req, res) => {
  try {
    const { orderId, amount, customerDetails } = req.body;

    if (!orderId || !amount || !customerDetails) {
      return res.status(400).send({ error: 'Missing required fields: orderId, amount, customerDetails' });
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerDetails.firstName,
        email: customerDetails.email,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    console.log(`Transaction token created for orderId: ${orderId}`);
    res.send({ token: transaction.token });

  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    res.status(500).send({ error: 'Failed to create transaction' });
  }
});

app.listen(port, () => {
  console.log(`Dunia Kopi backend listening on port ${port}`);
});
