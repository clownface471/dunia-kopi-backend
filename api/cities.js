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
    // Get provinceId from query parameter instead of path
    const provinceId = req.query.province || req.query.provinceId;

    if (!provinceId) {
      return res.status(400).json({ error: 'Province ID is required as query parameter (?province=5)' });
    }

    const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
    
    if (!RAJAONGKIR_API_KEY) {
      console.error('RAJAONGKIR_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log(`Fetching cities for province ${provinceId} from Komerce API...`);

    // Use Komerce API URL
    const url = `https://rajaongkir.komerce.id/api/v1/destination/city?province=${provinceId}`;

    const response = await axios.get(url, {
      headers: {
        'key': RAJAONGKIR_API_KEY,
      },
    });

    console.log('Komerce Cities Response Status:', response.status);

    // Extract data from response
    const cities = response.data.data;

    if (cities && Array.isArray(cities)) {
      console.log(`✅ Cities fetched successfully: ${cities.length} cities found`);
      // Return array directly
      res.status(200).json(cities);
    } else {
      console.error('Unexpected response structure:', response.data);
      res.status(500).json({ error: 'Invalid response structure from Komerce API' });
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