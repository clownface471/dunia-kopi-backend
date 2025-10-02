const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';
const DUNIA_KOPI_ORIGIN_CITY_ID = '22';

app.get('/', (req, res) => {
  res.send('Dunia Kopi Backend is running!');
});

app.post('/api/create-transaction', async (req, res) => {
  try {
    const { order_id, gross_amount, customer_details } = req.body;

    const transactionDetails = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount,
      },
      customer_details: customer_details,
    };

    const response = await axios.post(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      transactionDetails,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(MIDTRANS_SERVER_KEY).toString('base64'),
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.get('/api/provinces', async (req, res) => {
    try {
        const response = await axios.get(`${RAJAONGKIR_BASE_URL}/province`, {
            headers: { 'key': RAJAONGKIR_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/cities/:provinceId', async (req, res) => {
    try {
        const { provinceId } = req.params;
        const response = await axios.get(`${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`, {
            headers: { 'key': RAJAONGKIR_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/shipping-cost', async (req, res) => {
    try {
        const { destination, weight, courier } = req.body;

        if (!destination || !weight || !courier) {
            return res.status(400).json({ message: 'Bad Request: destination, weight, and courier are required.' });
        }

        const response = await axios.post(
            `${RAJAONGKIR_BASE_URL}/cost`,
            {
                origin: DUNIA_KOPI_ORIGIN_CITY_ID,
                destination: destination,
                weight: weight,
                courier: courier,
            },
            {
                headers: {
                    'key': RAJAONGKIR_API_KEY,
                    'content-type': 'application/x-www-form-urlencoded'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('RajaOngkir Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: error.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;