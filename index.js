
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});

app.post('/api/create-transaction', async (req, res) => {
    try {
        console.log('Received request body:', req.body);

        const { transaction_details, customer_details } = req.body;

        if (!transaction_details || !customer_details || !transaction_details.order_id || !transaction_details.gross_amount) {
            return res.status(400).send({ error: 'Missing required transaction parameters.' });
        }

        const parameter = {
            transaction_details,
            customer_details,
        };

        const transaction = await snap.createTransaction(parameter);
        
        console.log('Midtrans transaction created successfully:', transaction);
        res.status(200).json({ token: transaction.token });

    } catch (e) {
        console.error("Error creating Midtrans transaction:", e.message || e);
        res.status(500).send({ error: 'Failed to create transaction', details: e.message });
    }
});


app.get('/api/provinces', async (req, res) => {
    try {
        const response = await axios.get('https://api.rajaongkir.com/starter/province', {
            headers: { 'key': process.env.RAJAONGKIR_API_KEY }
        });
        res.json(response.data.rajaongkir.results);
    } catch (error) {
        console.error("Error fetching provinces:", error);
        res.status(500).json({ message: "Failed to fetch provinces from RajaOngkir" });
    }
});

app.get('/api/cities/:provinceId', async (req, res) => {
    try {
        const { provinceId } = req.params;
        const response = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
            headers: { 'key': process.env.RAJAONGKIR_API_KEY }
        });
        res.json(response.data.rajaongkir.results);
    } catch (error) {
        console.error("Error fetching cities:", error);
        res.status(500).json({ message: "Failed to fetch cities from RajaOngkir" });
    }
});

app.post('/api/cost', async (req, res) => {
    try {
        const { origin, destination, weight, courier } = req.body;

        console.log('Calculating cost with DUMMY DATA for:', req.body);
        
        // Validasi input sederhana
        if (!origin || !destination || !weight || !courier) {
            return res.status(400).json({ message: "Missing required parameters for cost calculation." });
        }

        // --- INI ADALAH DATA PALSU (DUMMY DATA) ---
        const dummyResponse = [
            {
                "code": "jne",
                "name": "Jalur Nugraha Ekakurir (JNE)",
                "costs": [
                    {
                        "service": "OKE",
                        "description": "Ongkos Kirim Ekonomis",
                        "cost": [ { "value": 18000, "etd": "3-5", "note": "" } ]
                    },
                    {
                        "service": "REG",
                        "description": "Layanan Reguler",
                        "cost": [ { "value": 22000, "etd": "2-3", "note": "" } ]
                    }
                ]
            },
            {
                "code": "tiki",
                "name": "Citra Van Titipan Kilat (TIKI)",
                "costs": [
                     {
                        "service": "REG",
                        "description": "Layanan Reguler",
                        "cost": [ { "value": 21000, "etd": "2-3", "note": "" } ]
                    },
                    {
                        "service": "ONS",
                        "description": "Over Night Service",
                        "cost": [ { "value": 35000, "etd": "1", "note": "" } ]
                    }
                ]
            }
        ];

        res.json({
            rajaongkir: {
                query: req.body,
                status: { code: 200, description: "OK" },
                results: dummyResponse
            }
        });

    } catch (error) {
        console.error("Error in dummy cost endpoint:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;