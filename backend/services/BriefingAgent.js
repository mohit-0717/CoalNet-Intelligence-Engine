const cron = require('node-cron');
const { Resend } = require('resend');
const { callLLM } = require('./llmService');
const Mine = require('../models/Mine');
const { getMineEmissionModel } = require('../models/Emission');
const Briefing = require('../models/Briefing');
const { sendWhatsAppBriefing } = require('./whatsappService');

const TARGET_EMAIL = process.env.TARGET_EMAIL;
const resend = new Resend(process.env.RESEND_API_KEY);

const path = require('path');

const generateAppleEmailHTML = (data) => {
  const isCritical = data.report_metadata.status_theme.toLowerCase() === 'critical';
  const isWarning = data.report_metadata.status_theme.toLowerCase() === 'warning';
  
  const themeColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#34C759';
  const themeBg = isCritical ? 'linear-gradient(135deg, #fff0f0 0%, #ffe6e6 100%)' : 
                  isWarning ? 'linear-gradient(135deg, #fffaf0 0%, #fff2e6 100%)' : 
                  'linear-gradient(135deg, #f0fff4 0%, #e6ffed 100%)';

  // Force Date to today's date in 2026
  const today = new Date();
  today.setFullYear(2026);
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f5f5f7; margin: 0; padding: 40px 20px; color: #1d1d1f; -webkit-font-smoothing: antialiased; }
  .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05); }
  
  /* Header Section */
  .header { padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.03); }
  .logo { max-width: 200px; height: auto; display: block; margin: 0 auto 15px; }
  .date-badge { display: inline-block; background: #f5f5f7; color: #86868b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 12px; border-radius: 20px; }
  
  /* Hero Section */
  .hero { text-align: center; padding: 50px 40px; background: ${themeBg}; border-bottom: 1px solid rgba(0,0,0,0.03); }
  .hero-tag { font-size: 12px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; display: inline-block; }
  .hero h1 { font-size: 42px; line-height: 1.05; font-weight: 800; margin: 0 0 20px; letter-spacing: -1.5px; color: #1d1d1f; }
  .hero p { font-size: 18px; color: #515154; margin: 0 auto; font-weight: 500; max-width: 80%; line-height: 1.4; }
  
  /* Stats Grid */
  .stats-container { padding: 40px; text-align: center; background: #ffffff; border-bottom: 1px solid rgba(0,0,0,0.03); }
  .stat-box { display: inline-block; width: 100%; max-width: 400px; text-align: center; padding: 30px 20px; background: #fafafa; border-radius: 16px; border: 1px solid rgba(0,0,0,0.03); box-sizing: border-box; }
  .stat-label { color: #86868b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: block; }
  .stat-value { font-size: 44px; font-weight: 800; letter-spacing: -2px; color: #1d1d1f; margin: 0 0 12px; white-space: nowrap; line-height: 1.1; }
  .stat-unit { font-size: 18px; color: #86868b; font-weight: 500; display: block; margin-top: 5px; }
  .change-badge { display: inline-block; padding: 6px 12px; background: rgba(0,0,0,0.04); border-radius: 20px; font-size: 13px; font-weight: 600; color: #515154; margin-top: 8px; }
  
  /* Table Section */
  .table-section { padding: 40px; }
  .section-title { font-size: 18px; font-weight: 700; color: #1d1d1f; margin: 0 0 20px; letter-spacing: -0.5px; text-align: center; }
  table { width: 100%; max-width: 500px; margin: 0 auto; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,0,0,0.05); }
  th { text-align: center; padding: 16px; background: #fafafa; color: #86868b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(0,0,0,0.05); }
  td { text-align: center; padding: 18px 16px; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; font-weight: 600; color: #1d1d1f; }
  tr:last-child td { border-bottom: none; }
  .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-critical { background: #fee2e2; color: #ef4444; }
  .status-warning { background: #fef3c7; color: #f59e0b; }
  .status-stable { background: #d1fae5; color: #10b981; }
  
  /* Deep Dive Section */
  .deep-dive { background: #1d1d1f; color: #ffffff; padding: 50px 40px; margin: 0 20px 20px; border-radius: 24px; text-align: left; position: relative; }
  .deep-dive::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: ${themeColor}; }
  .deep-dive-icon { font-size: 24px; margin-bottom: 20px; display: block; }
  .deep-dive h3 { margin: 0 0 16px; font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #ffffff; }
  .deep-dive p { margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #a1a1a6; font-weight: 400; }
  
  /* Financial Box */
  .financial-impact { background: #2d2d2f; border: 1px solid #3d3d40; padding: 24px; border-radius: 16px; margin-bottom: 20px; }
  .financial-impact strong { display: block; font-size: 12px; color: #a1a1a6; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
  .financial-impact p { margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; line-height: 1.4; }

  /* Social Impact Box */
  .social-impact { background: rgba(52, 199, 89, 0.1); border: 1px solid rgba(52, 199, 89, 0.2); padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 15px; }
  .social-impact p { margin: 0; font-size: 14px; font-weight: 500; color: #d1fae5; line-height: 1.5; display: inline; }
  .social-impact strong { color: #34C759; }
  
  /* Footer */
  .footer { text-align: center; padding: 30px 40px; color: #86868b; font-size: 12px; line-height: 1.6; }
  .footer strong { color: #1d1d1f; }
  
  /* Mobile Responsiveness */
  @media only screen and (max-width: 600px) {
    body { padding: 0 !important; }
    .container { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
    .header { padding: 30px 20px 20px !important; }
    .hero { padding: 40px 20px !important; }
    .hero h1 { font-size: 32px !important; margin-bottom: 15px !important; }
    .hero p { max-width: 100% !important; font-size: 16px !important; }
    .stats-container { padding: 30px 20px !important; }
    .stat-value { font-size: 36px !important; }
    .table-section { padding: 30px 10px !important; }
    table { width: 100% !important; max-width: 100% !important; }
    th { padding: 12px 6px !important; font-size: 10px !important; }
    td { padding: 14px 6px !important; font-size: 12px !important; }
    .status-badge { padding: 6px 8px !important; font-size: 9px !important; letter-spacing: 0px !important; white-space: nowrap !important; }
    .deep-dive { padding: 40px 20px !important; margin: 0 10px 20px !important; border-radius: 16px !important; }
    .deep-dive h3 { font-size: 24px !important; }
    .financial-impact { padding: 20px !important; }
    .social-impact { flex-direction: column; text-align: center; gap: 10px; }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/mohit-0717/CoalNet-Intelligence-Engine/main/frontend/src/assets/CoalNet_Zero_LOGO.png" alt="CoalNet Zero" class="logo" />
      <div><span class="date-badge">${formattedDate}</span></div>
    </div>
    
    <div class="hero">
      <span class="hero-tag">Executive Intelligence</span>
      <h1>${data.report_metadata.hero_headline}</h1>
      <p>Your daily autonomous briefing on network emissions and carbon asset risks.</p>
    </div>

    <div class="stats-container">
      <div class="stat-box left">
        <span class="stat-label">Network Total</span>
        <div class="stat-value">${data.network_summary.total_value} <span class="stat-unit">${data.network_summary.unit}</span></div>
        <span class="change-badge">${data.network_summary.change_percentage} vs 30d avg</span>
      </div>
    </div>

    <div class="table-section" align="center" style="padding: 40px;">
      <h3 class="section-title" style="font-size: 18px; font-weight: 700; color: #1d1d1f; margin: 0 0 20px; letter-spacing: -0.5px; text-align: center;">Priority Monitored Assets</h3>
      
      <!-- Bulletproof Email Table Wrapper -->
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e5e5; border-collapse: separate; border-spacing: 0; overflow: hidden;">
        <tr>
          <th style="text-align: center; padding: 16px; background-color: #fafafa; color: #86868b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e5e5;">Mine Facility</th>
          <th style="text-align: center; padding: 16px; background-color: #fafafa; color: #86868b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e5e5;">Emissions (${data.network_summary.unit})</th>
          <th style="text-align: center; padding: 16px; background-color: #fafafa; color: #86868b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e5e5;">AI Status</th>
        </tr>
        ${data.priority_cards.map(card => {
          const bg = card.status.toLowerCase() === 'critical' ? '#fee2e2' : card.status.toLowerCase() === 'warning' ? '#fef3c7' : '#d1fae5';
          const color = card.status.toLowerCase() === 'critical' ? '#ef4444' : card.status.toLowerCase() === 'warning' ? '#f59e0b' : '#10b981';
          return `
          <tr>
            <td style="text-align: center; padding: 18px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${card.mine_name}</td>
            <td style="text-align: center; padding: 18px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: #515154;">${card.emission_value}</td>
            <td style="text-align: center; padding: 18px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: #1d1d1f;"><span class="status-badge" style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${bg}; color: ${color}; white-space: nowrap;">${card.status}</span></td>
          </tr>
          `;
        }).join('')}
      </table>
    </div>

    <div class="deep-dive">
      <span class="deep-dive-icon">✨</span>
      <h3>${data.agent_deep_dive.insight_headline}</h3>
      <p>${data.agent_deep_dive.analysis_text}</p>
      
      <div class="financial-impact">
        <strong>Financial Impact Analysis</strong>
        <p>${data.agent_deep_dive.financial_impact}</p>
      </div>

      <div class="social-impact">
        <p><strong>Social Impact Commitment:</strong> The CoalNet AI is built with inclusive engineering principles. Reducing emissions at these facilities actively improves the respiratory health index for local mining communities.</p>
      </div>
    </div>
  </div>
  
  <div class="footer">
    This briefing was autonomously generated by the <strong>CoalNet Agentic Intelligence Core</strong>.<br>
    Strictly Confidential. Do not distribute without clearance.
  </div>
</body>
</html>
  `;
};

const generateAndSendBriefing = async () => {
  console.log('🤖 [BriefingAgent] Waking up to generate Daily Intelligence Report...');
  try {
    const mines = await Mine.find({ status: 'active' });
    let totalEmissions = 0;
    let highestEmitter = null;
    let maxEmissions = 0;

    // For demo purposes, look back 30 days to guarantee data is found
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const aggregatedData = [];

    // Aggregate yesterday's data
    for (const mine of mines) {
      const MineEmission = getMineEmissionModel(mine.name);
      const emissions = await MineEmission.find({
        date: { $gte: startDate, $lte: endDate }
      });

      if (emissions.length > 0) {
        const mineTotal = emissions.reduce((sum, e) => sum + e.total_carbon_emission, 0);
        totalEmissions += mineTotal;
        aggregatedData.push({
          mine: mine.name,
          state: mine.state || '',
          total_carbon_emission: mineTotal,
          fuel_emission: emissions.reduce((sum, e) => sum + e.fuel_emission, 0),
          methane_emission: emissions.reduce((sum, e) => sum + e.methane_emissions_co2e, 0)
        });

        if (mineTotal > maxEmissions) {
          maxEmissions = mineTotal;
          highestEmitter = mine.name;
        }
      }
    }

    if (aggregatedData.length === 0) {
      console.log('🤖 [BriefingAgent] No data from yesterday. Skipping report.');
      return;
    }

    // Sort to find the highest emitters, and only send top 5 to LLM to prevent context overflow
    aggregatedData.sort((a, b) => b.total_carbon_emission - a.total_carbon_emission);
    const topMines = aggregatedData.slice(0, 5);

    const prompt = `
Analyze yesterday's mine data:

Network Total: ${totalEmissions.toFixed(2)} kg CO2e
${topMines.map(m => `${m.mine} (${m.state}): ${m.total_carbon_emission.toFixed(2)} kg (Fuel: ${m.fuel_emission.toFixed(2)}, Methane: ${m.methane_emission.toFixed(2)})`).join('\n')}

Generate the JSON for the Apple-style briefing.
`;

    const systemPrompt = `
You are the CoalNet Zero Executive Intelligence Engine. Your task is to analyze daily emission telemetry and format it for a premium, high-level executive report.

Instructions:
1. Analyze Total Performance: Look at network-wide emissions.
2. Identify Anomalies: Isolate the highest emitter and determine if its spike is critical.
3. Strategic Reasoning: Provide a root cause analysis (RCA) and calculate the financial impact (e.g., ROI of fixing the issue or loss in carbon credits).
4. Tone: Professional, minimalist, and action-oriented.

STRICT OUTPUT FORMAT: You must return ONLY a valid JSON object with this exact structure (no markdown, no backticks, just raw JSON):

{
  "report_metadata": {
    "date": "Month DD, YYYY",
    "status_theme": "critical | warning | stable", 
    "hero_headline": "Short punchy headline (e.g. Attention Required at Ashoka.)"
  },
  "network_summary": {
    "total_value": "140,517.72",
    "unit": "kg CO2e",
    "change_percentage": "+12%"
  },
  "priority_cards": [
    {
      "mine_name": "Mine Name",
      "emission_value": "Value",
      "status": "Critical | Warning | Stable",
      "quick_action": "Action (e.g. Optimize Operations)"
    }
  ],
  "agent_deep_dive": {
    "insight_headline": "Headline",
    "analysis_text": "Detailed RCA...",
    "financial_impact": "Financial reasoning..."
  }
}
`;

    // Call LLM
    const responseText = await callLLM({
      provider: 'grok',
      prompt,
      systemPrompt,
      maxTokens: 1500
    });

    let jsonData;
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('❌ [BriefingAgent] Failed to parse LLM JSON:', e);
      throw new Error("Invalid JSON generated by AI");
    }

    const htmlEmail = generateAppleEmailHTML(jsonData);
    
    // Generate WhatsApp Text
    const waStatusEmoji = jsonData.report_metadata.status_theme.toLowerCase() === 'critical' ? '🔴' : 
                          jsonData.report_metadata.status_theme.toLowerCase() === 'warning' ? '🟡' : '🟢';
    const whatsappText = `🤖 *COALNET AI ALERT*
🌡️ Total Network: ${jsonData.network_summary.total_value} ${jsonData.network_summary.unit}
${waStatusEmoji} ${jsonData.report_metadata.hero_headline}

🔍 *AI Insight:* ${jsonData.agent_deep_dive.analysis_text}
💡 *Financial Impact:* ${jsonData.agent_deep_dive.financial_impact}`;

    // Save to Database
    const newBriefing = await Briefing.create({
      subject: `CoalNet AI: ${jsonData.report_metadata.hero_headline}`,
      markdownBody: htmlEmail // Save HTML to DB
    });
    console.log(`📥 [BriefingAgent] Saved briefing to MongoDB (ID: ${newBriefing._id})`);

    // --- WhatsApp Dispatch (English) ---
    console.log('🤖 [BriefingAgent] Sending WhatsApp summary...');
    try {
      const TARGET_WHATSAPP = process.env.MY_PHONE_NUMBER || 'whatsapp:+919309962509';
      const numbers = TARGET_WHATSAPP.split(',');
      for (const num of numbers) {
        if (num.trim()) {
          await sendWhatsAppBriefing(whatsappText, num.trim());
        }
      }
    } catch (waErr) {
      console.error('❌ [WhatsApp] Failed to send summary.', waErr.message);
    }

    if (!TARGET_EMAIL || TARGET_EMAIL === 'your_project_primary@example.com') {
      console.log('⚠️ [BriefingAgent] TARGET_EMAIL not properly configured. Printing to console instead.');
      return;
    }

    // Free tier of Resend requires 'onboarding@resend.dev' as sender.
    // We only send to the first email in the array because the free tier limits recipients to verified domains/addresses.
    const primaryTarget = TARGET_EMAIL.split(',')[0].trim();

    const info = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: primaryTarget,
      subject: `CoalNet AI: ${jsonData.report_metadata.hero_headline}`,
      html: htmlEmail
    });

    if (info.error) {
      console.error('❌ [BriefingAgent] Resend Error:', info.error);
    } else {
      console.log(`✅ [BriefingAgent] Apple-Style Briefing sent via Resend to ${primaryTarget}`);
      console.log(`✅ [BriefingAgent] Message ID: ${info.data.id}`);
    }

  } catch (error) {
    console.error('❌ [BriefingAgent] Failed to execute daily run:', error.message);
  }
};

const initCron = () => {
  // Run at 09:00 AM IST daily
  cron.schedule('0 9 * * *', generateAndSendBriefing, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  console.log('⏰ [BriefingAgent] Cron job initialized for 09:00 AM IST daily.');
};

module.exports = {
  initCron,
  generateAndSendBriefing // exported for testing
};
