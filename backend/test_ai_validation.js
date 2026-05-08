const axios = require('axios');

const testValidation = async () => {
  console.log('🚀 Sending test payload to Validation Agent...');
  
  // We'll intentionally send a "bad" payload that breaks physical constraints:
  // Zero fuel used, but extremely high transport emissions.
  const badTelemetry = {
    mine: "Test Mine Alpha",
    date: new Date().toISOString(),
    fuel_used: 0,
    transport_emission: 15000,
    electricity_used: 450,
    electricity_emission: 380,
    methane_emissions_ch4: 120,
    methane_emissions_co2e: 3360
  };

  const startTime = Date.now();

  try {
    const response = await axios.post('http://localhost:3001/api/ai/validate-input', badTelemetry, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Response received in ${duration}ms!`);
    console.log('🤖 AI Validation Result:');
    console.log(JSON.stringify(response.data.data, null, 2));

  } catch (error) {
    console.error('❌ Request failed:', error.response ? error.response.data : error.message);
  }
};

testValidation();
