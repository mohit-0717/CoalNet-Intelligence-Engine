const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Sends a punchy AI briefing via WhatsApp
 * @param {string} message - The summary text
 * @param {string} to - Recipient number
 */
async function sendWhatsAppBriefing(message, to = process.env.MY_PHONE_NUMBER) {
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      body: message,
      to: to
    });
    console.log('✅ WhatsApp Sent! SID:', response.sid);
    return response;
  } catch (error) {
    console.error('❌ WhatsApp Failed:', error);
  }
}

module.exports = { sendWhatsAppBriefing };
