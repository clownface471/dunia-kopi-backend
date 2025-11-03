const axios = require('axios');

module.exports = async (req, res) => {
  // --- Perbaikan CORS ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- Akhir Perbaikan CORS ---

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
    
    if (!RAJAONGKIR_API_KEY) {
      console.error('RAJAONGKIR_API_KEY not found');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Fetching all provinces from NEW Komerce API...');

    // --- Perbaikan URL Komerce ---
    const url = 'https://rajaongkir.komerce.id/api/v1/destination/province';

    const response = await axios.get(url, {
      headers: {
        'key': RAJAONGKIR_API_KEY,
      },
    });

    console.log('Komerce Response Status:', response.status);

    // --- Perbaikan Struktur Data ---
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