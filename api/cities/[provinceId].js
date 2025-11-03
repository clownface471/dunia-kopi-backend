const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provinceId } = req.query;

    if (!provinceId) {
      return res.status(400).json({ error: 'Province ID is required' });
    }

    const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
    
    if (!RAJAONGKIR_API_KEY) {
      console.error('RAJAONGKIR_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log(`Fetching cities for province ${provinceId} from Komerce API...`);

    // FIXED: Use the NEW Komerce endpoint
    const response = await axios.get(`https://api.komerce.id/v1/city?province=${provinceId}`, {
      headers: {
        'key': RAJAONGKIR_API_KEY,
      },
    });

    console.log('Komerce Response Status:', response.status);

    if (response.data.rajaongkir && response.data.rajaongkir.results) {
      console.log('Cities fetched successfully:', response.data.rajaongkir.results.length);
      res.status(200).json(response.data.rajaongkir.results);
    } else if (response.data.rajaongkir && response.data.rajaongkir.status) {
      console.error('Komerce API Error:', response.data.rajaongkir.status);
      res.status(500).json({ 
        error: 'Komerce API error', 
        details: response.data.rajaongkir.status.description 
      });
    } else {
      console.error('Unexpected response structure:', response.data);
      res.status(500).json({ error: 'Invalid response from Komerce API' });
    }
  } catch (error) {
    console.error('Error fetching cities:', error.message);
    if (error.response) {
      console.error('Error Response:', error.response.data);
      res.status(error.response.status || 500).json({ 
        error: 'Failed to fetch cities from Komerce',
        details: error.response.data 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch cities', 
        details: error.message 
      });
    }
  }
};