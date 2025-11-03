const https = require('https');

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

    // Validation
    if (!destination || !weight) {
      return res.status(400).json({ 
        error: 'Missing required fields: destination and weight are required' 
      });
    }

    const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
    
    if (!RAJAONGKIR_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Static origin: Jakarta Selatan (City ID 151)
    const ORIGIN_CITY_ID = '151';
    
    // Default to JNE, TIKI, POS if courier not specified
    const couriersToCheck = courier || 'jne:tiki:pos';

    // Prepare POST data for RajaOngkir
    const postData = JSON.stringify({
      origin: ORIGIN_CITY_ID,
      destination: destination.toString(),
      weight: parseInt(weight),
      courier: couriersToCheck
    });

    const options = {
      hostname: 'api.komerce.id',
      path: '/v1/cost',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'key': RAJAONGKIR_API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // Make the request to RajaOngkir
    const rajaOngkirRequest = https.request(options, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          
          if (parsedData.rajaongkir && parsedData.rajaongkir.results) {
            // Transform the data to a cleaner format
            const results = parsedData.rajaongkir.results;
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
              origin: {
                city_id: ORIGIN_CITY_ID,
                city_name: 'Jakarta Selatan',
              },
              destination: {
                city_id: destination.toString(),
              },
              weight: parseInt(weight),
              results: formattedResults,
            });
          } else {
            res.status(500).json({ 
              error: 'Invalid response from RajaOngkir API',
              details: parsedData 
            });
          }
        } catch (error) {
          res.status(500).json({ 
            error: 'Failed to parse RajaOngkir response',
            details: error.message 
          });
        }
      });
    });

    rajaOngkirRequest.on('error', (error) => {
      res.status(500).json({ 
        error: 'Failed to fetch shipping cost from RajaOngkir',
        details: error.message 
      });
    });

    // Send the POST data
    rajaOngkirRequest.write(postData);
    rajaOngkirRequest.end();

  } catch (error) {
    console.error('Shipping cost calculation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};