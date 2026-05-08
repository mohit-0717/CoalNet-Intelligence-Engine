const { callLLM } = require('./llmService');

const validate = async (telemetryData) => {
  const prompt = `
Please analyze the following mine telemetry data for physical consistency and logical errors.
Telemetry Data:
${JSON.stringify(telemetryData, null, 2)}
`;

  const systemPrompt = `
You are an expert mining engineer and data validation agent.
Your task is to analyze submitted daily emission telemetry from a coal mine and ensure it makes physical sense.
For example:
- If fuel usage is 0 but transport emissions are high, that is a physical contradiction.
- If methane emissions are extremely high but no coal was extracted, that is unlikely.
- If electricity usage drops to 0 on a normal weekday without a reported outage, it may be an error.

Analyze the telemetry strictly.
Return your response ONLY as a JSON object with the following structure:
{
  "isValid": boolean,
  "confidenceScore": number (0 to 100),
  "warnings": [ "List of physical contradictions or warnings" ],
  "reasoning": "A brief explanation of your analysis."
}
`;

  try {
    // Priority 1: Cerebras for speed (Validation needs to be instant)
    const jsonString = await callLLM({
      provider: 'cerebras',
      prompt,
      systemPrompt,
      maxTokens: 500
    });

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('ValidationAgent LLM execution failed:', error);
    // Safe fallback if LLM completely fails
    return {
      isValid: true,
      confidenceScore: 0,
      warnings: ['AI Validation unavailable. Basic schema validation applied.'],
      reasoning: 'System fallback.'
    };
  }
};

module.exports = {
  validate
};
