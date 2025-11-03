module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
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

    // Static origin: Jakarta Selatan
    const ORIGIN_CITY_ID = '151';
    
    // Default couriers if not specified
    const couriersToCheck = courier || 'jne,tiki,pos';

    // Call RajaOngkir Cost API
    const rajaOngkirUrl = 'https://pro.komerce.id/api/cost';
    const apiKey = process.env.RAJAONGKIR_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'RajaOngkir API key not configured' });
    }

    const response = await fetch(rajaOngkirUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        origin: ORIGIN_CITY_ID,
        destination: destination.toString(),
        weight: parseInt(weight),
        courier: couriersToCheck,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RajaOngkir API Error:', errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch shipping cost from RajaOngkir',
        details: errorText 
      });
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.rajaongkir?.status?.code !== 200) {
      return res.status(400).json({ 
        error: 'RajaOngkir API returned an error',
        details: data.rajaongkir?.status?.description 
      });
    }

    // Extract and format the results
    const results = data.rajaongkir?.results || [];
    
    // Transform the data to a cleaner format
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

    return res.status(200).json({
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

  } catch (error) {
    console.error('Shipping cost calculation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};