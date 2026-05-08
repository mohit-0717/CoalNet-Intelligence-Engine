const OpenAI = require('openai');

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize SDKs
const cerebras = new OpenAI({
  apiKey: CEREBRAS_API_KEY || 'dummy_key',
  baseURL: 'https://api.cerebras.ai/v1',
});

const groq = new OpenAI({
  apiKey: GROQ_API_KEY || 'dummy_key',
  baseURL: 'https://api.groq.com/openai/v1',
});

const isResponseFormatUnsupported = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('response_format') || message.includes('json_object');
};

const createCompletion = async (client, payload) => {
  try {
    return await client.chat.completions.create(payload);
  } catch (error) {
    if (!payload.response_format || !isResponseFormatUnsupported(error)) {
      throw error;
    }

    const retryPayload = { ...payload };
    delete retryPayload.response_format;
    console.warn('[LLM Service] Provider rejected response_format; retrying without JSON mode.');
    return await client.chat.completions.create(retryPayload);
  }
};

/**
 * Call the specified LLM. 
 * Automatically falls back to the other model if rate limited or failing.
 */
const callLLM = async ({ provider, prompt, systemPrompt, messages, maxTokens = 1000, responseFormat }) => {
  let primaryClient, secondaryClient;
  let primaryModel, secondaryModel;

  if (provider === 'cerebras') {
    primaryClient = cerebras;
    primaryModel = 'llama3.1-8b'; // Cerebras
    secondaryClient = groq;
    secondaryModel = 'llama-3.1-8b-instant'; // Use the only working Groq model
  } else {
    // If provider is grok/groq
    primaryClient = groq;
    primaryModel = 'llama-3.1-8b-instant'; // The only supported model currently active on Groq that didn't crash
    secondaryClient = cerebras;
    secondaryModel = 'llama3.1-8b'; 
  }

  const apiMessages = messages || [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const payload = {
    model: primaryModel,
    messages: apiMessages,
    max_tokens: maxTokens,
    temperature: 0.0
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  try {
    const response = await createCompletion(primaryClient, payload);
    return response.choices[0].message.content;
  } catch (error) {
    console.warn(`⚠️ [LLM Service] Primary provider '${provider}' failed:`, error.message);
    console.log(`🔄 [LLM Service] Falling back to secondary provider...`);
    
    // Exponential backoff logic would typically wrap the retry.
    // For immediate fallback:
    try {
      const fallbackPayload = { ...payload, model: secondaryModel };
      const fallbackResponse = await createCompletion(secondaryClient, fallbackPayload);
      return fallbackResponse.choices[0].message.content;
    } catch (fallbackError) {
      console.error(`❌ [LLM Service] Both providers failed!`, fallbackError.message);
      throw new Error('AI Service is currently unavailable. Please try again later.');
    }
  }
};

module.exports = {
  callLLM,
};
