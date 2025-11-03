const axios = require('axios'); // Gunakan Axios agar konsisten dengan file lain

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { destination, weight, courier } = req.body;

    if (!destination || !weight) {
      return res.status(400).json({ 
        error: 'Missing required fields: destination and weight are required' 
      });
    }

    const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
    
    if (!RAJAONGKIR_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // --- PERBAIKAN 1: Asal Statis ---
    const ORIGIN_CITY_ID = '151'; // Jakarta Selatan
    const couriersToCheck = courier || 'jne:tiki:pos'; // Kurir default

    // --- PERBAIKAN 2: URL API Komerce BARU ---
    const url = 'https://rajaongkir.komerce.id/api/v1/cost';
    
    const postData = {
      origin: ORIGIN_CITY_ID,
      destination: destination.toString(),
      weight: parseInt(weight),
      courier: couriersToCheck
    };

    console.log('Fetching shipping cost from Komerce:', url);

    const response = await axios.post(url, postData, {
      headers: {
        'key': RAJAONGKIR_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Komerce Cost Response Status:', response.status);

    // --- PERBAIKAN 3: Struktur Respons BARU ---
    // API lama menggunakan 'rajaongkir.results', API baru menggunakan 'data'
    const results = response.data.data; 

    if (results && Array.isArray(results)) {
      // (Asumsi) Strukturnya mungkin sedikit berubah.
      // Kita coba transformasikan berdasarkan data lama Anda.
      const formattedResults = results.map(courierData => ({
        code: courierData.code,
        name: courierData.name,
        services: courierData.costs.map(cost => ({
          service: cost.service,
          description: cost.description,
          cost: cost.cost[0].value,
          etd: cost.cost[0].etd,
          note: cost.cost[0].note || '',
        })),
      }));

      res.status(200).json({
        success: true,
        origin: { city_id: ORIGIN_CITY_ID, city_name: 'Jakarta Selatan' },
        destination: { city_id: destination.toString() },
        weight: parseInt(weight),
        results: formattedResults,
      });

    } else {
      console.error('Unexpected cost response structure:', response.data);
      res.status(500).json({ error: 'Invalid cost response structure from Komerce API' });
    }

  } catch (error) {
    console.error('Shipping cost calculation error:', error.message);
    if (error.response) {
      console.error('Error Response:', error.response.data);
      res.status(error.response.status || 500).json({ 
        error: 'Failed to fetch shipping cost from Komerce',
        details: error.response.data 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  }
};