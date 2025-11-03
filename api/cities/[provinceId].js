const https = require('https');

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

  const { provinceId } = req.query;

  if (!provinceId) {
    return res.status(400).json({ error: 'Province ID is required' });
  }

  const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
  
  if (!RAJAONGKIR_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const options = {
    hostname: 'api.komerce.id',
    path: `/v1/city?province=${provinceId}`,
    method: 'GET',
    headers: {
      'key': RAJAONGKIR_API_KEY,
    },
  };

  https.get(options, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        
        if (parsedData.rajaongkir && parsedData.rajaongkir.results) {
          res.status(200).json(parsedData.rajaongkir.results);
        } else {
          res.status(500).json({ error: 'Invalid response from RajaOngkir API' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to parse RajaOngkir response' });
      }
    });
  }).on('error', (error) => {
    res.status(500).json({ error: 'Failed to fetch cities', details: error.message });
  });
};