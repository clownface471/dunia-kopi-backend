const express = require("express");
const cors = require("cors");
const midtransClient = require("midtrans-client");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// Ambil kunci rahasia dari Environment Variables
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

// --- PERUBAHAN DI SINI: URL BARU RAJAONGKIR ---
const RAJAONGKIR_BASE_URL = "https://api.rajaongkir.com/starter"; // Ganti jika platform baru memberikan URL yang berbeda

// Inisialisasi Midtrans
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

// Endpoint untuk Midtrans
app.post("/create-transaction", async (req, res) => {
  try {
    const { orderId, amount, customerDetails } = req.body;
    if (!orderId || !amount || !customerDetails) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: customerDetails,
    };
    const transaction = await snap.createTransaction(parameter);
    res.status(200).json({ token: transaction.token });
  } catch (e) {
    console.error("Midtrans Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Endpoint untuk mendapatkan semua provinsi
app.get("/api/provinces", async (req, res) => {
  try {
    console.log("Fetching provinces from new RajaOngkir API...");
    const response = await axios.get(`${RAJAONGKIR_BASE_URL}/province`, {
      headers: { key: RAJAONGKIR_API_KEY },
    });
    console.log("Successfully fetched provinces.");
    res.status(200).json(response.data.rajaongkir.results);
  } catch (error) {
    console.error("RajaOngkir Provinces Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      message: "Gagal mengambil data provinsi.",
      detail: error.response ? error.response.data : error.message,
    });
  }
});

// Endpoint untuk mendapatkan kota berdasarkan ID provinsi
app.get("/api/cities/:provinceId", async (req, res) => {
  try {
    const { provinceId } = req.params;
    console.log(`Fetching cities for province ID: ${provinceId}...`);
    const response = await axios.get(`${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`, {
      headers: { key: RAJAONGKIR_API_KEY },
    });
    console.log("Successfully fetched cities.");
    res.status(200).json(response.data.rajaongkir.results);
  } catch (error) {
    console.error("RajaOngkir Cities Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      message: "Gagal mengambil data kota.",
      detail: error.response ? error.response.data : error.message,
     });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

