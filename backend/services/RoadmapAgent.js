const { callLLM } = require('./llmService');
const Mine = require('../models/Mine');
const { getMineEmissionModel } = require('../models/Emission');

const generateRoadmap = async (mineId) => {
  const mine = await Mine.findById(mineId);
  if (!mine) throw new Error('Mine not found');

  const MineEmission = getMineEmissionModel(mine.name);
  
  // Get latest emissions for context
  const latestEmissions = await MineEmission.find().sort({ date: -1 }).limit(30);
  const avgDailyEmissions = latestEmissions.reduce((acc, curr) => acc + curr.total_carbon_emission, 0) / (latestEmissions.length || 1);
  const avgFuelEmissions = latestEmissions.reduce((acc, curr) => acc + curr.fuel_emission, 0) / (latestEmissions.length || 1);
  const avgMethaneEmissions = latestEmissions.reduce((acc, curr) => acc + curr.methane_emissions_co2e, 0) / (latestEmissions.length || 1);

  const prompt = `
Generate a highly customized 36-month decarbonization plan for this specific coal mine:
Name: ${mine.name}
Location: ${mine.location}, ${mine.state}

Specific Emission Profile (30-day Avg):
- Total Daily Average: ${avgDailyEmissions.toFixed(2)} kg CO2e
- Heavy Machinery Fuel: ${avgFuelEmissions.toFixed(2)} kg CO2e
- Methane Leaks: ${avgMethaneEmissions.toFixed(2)} kg CO2e

CRITICAL INSTRUCTION: You must aggressively tailor your roadmap to attack this mine's specific emission profile.
- If Methane is disproportionately high, Phase 1 MUST focus on ventilation shafts, gas capture systems, and leak sealing.
- If Machinery Fuel is disproportionately high, Phase 1 MUST focus on EV haul truck conversion and AI route optimization.
DO NOT output a generic plan. Name-drop ${mine.name} and cite their specific metrics in the initiatives to prove this is a custom strategy.
`;

  const systemPrompt = `
You are a Carbon Strategy Consultant for CoalNet.
Your goal is to provide a 3-year decarbonization roadmap.
Every suggestion must be financially grounded (calculate an estimated ROI or payback period).
Output strictly in JSON format:
{
  "roadmapTitle": "Title of the plan",
  "phases": [
    {
      "timeframe": "Month 1-12",
      "focus": "Immediate wins",
      "initiatives": [
        {
          "title": "Convert 20% of haul fleet to EV",
          "estimatedCost": "$2.5M",
          "roi": "2.3 years payback due to diesel savings",
          "co2Reduction": "15%"
        }
      ]
    }
  ]
}
Ensure exactly 3 phases.
`;

  try {
    // Priority: Grok for reasoning, planning, and financial grounding
    const jsonString = await callLLM({
      provider: 'grok',
      prompt,
      systemPrompt,
      maxTokens: 1500
    });

    // Extract only the JSON portion from the LLM response
    let cleanJsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
    let startIdx = cleanJsonString.indexOf('{');
    let endIdx = cleanJsonString.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
      cleanJsonString = cleanJsonString.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleanJsonString);
  } catch (error) {
    console.error('RoadmapAgent LLM execution failed:', error);
    return {
      roadmapTitle: "Decarbonization Roadmap Unavailable",
      phases: []
    };
  }
};

module.exports = {
  generateRoadmap
};
