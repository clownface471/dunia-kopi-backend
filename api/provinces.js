const axios = require('axios');

module.exports = async (req, res) => {
  // --- PERBAIKAN CORS DIMULAI ---
  // Menambahkan header CORS untuk mengizinkan Flutter Web
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Mengizinkan semua domain (ganti dengan domain web Anda di produksi)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Menangani request pre-flight 'OPTIONS' dari browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- PERBAIKAN CORS SELESAI ---

  // Menangani request GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
    
    if (!RAJAONGKIR_API_KEY) {
      console.error('RAJAONGKIR_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Fetching all provinces from NEW Komerce API...');

    // Menggunakan URL Komerce yang benar yang kita temukan
    const url = 'https://rajaongkir.komerce.id/api/v1/destination/province';

    const response = await axios.get(url, {
      headers: {
        'key': RAJAONGKIR_API_KEY,
      },
    });

    console.log('Komerce Response Status:', response.status);

    // Menggunakan struktur data Komerce yang benar ('response.data.data')
    const provinces = response.data.data;

    if (provinces && Array.isArray(provinces)) {
      console.log('Provinces fetched successfully:', provinces.length);
      res.status(200).json(provinces);
    } else {
      console.error('Unexpected response structure:', response.data);
      res.status(500).json({ error: 'Invalid response structure from Komerce API' });
    }
  } catch (error) {
    console.error('Error fetching provinces:', error.message);
    if (error.response) {
      console.error('Error Response:', error.response.data);
      res.status(error.response.status || 500).json({ 
        error: 'Failed to fetch provinces from Komerce',
        details: error.response.data 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch provinces', 
        details: error.message 
      });
    }
  }
};