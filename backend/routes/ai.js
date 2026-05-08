const express = require('express');
const router = express.Router();
const ValidationAgent = require('../services/ValidationAgent');
const AnalysisService = require('../services/AnalysisService');
const RoadmapAgent = require('../services/RoadmapAgent');
const BriefingAgent = require('../services/BriefingAgent');
const Briefing = require('../models/Briefing');

// POST /api/ai/validate-input
router.post('/validate-input', async (req, res) => {
  try {
    const data = req.body;
    const validationResult = await ValidationAgent.validate(data);
    res.json({ success: true, data: validationResult });
  } catch (error) {
    console.error('Validation Agent Error:', error.message);
    res.status(500).json({ success: false, error: 'Validation failed.' });
  }
});

// POST /api/ai/analyze-anomaly
router.post('/analyze-anomaly', async (req, res) => {
  try {
    const { mineId, telemetry, historicalAverages, chartContext } = req.body;
    const analysisResult = await AnalysisService.analyze(mineId, telemetry, historicalAverages, chartContext);
    res.json({ success: true, data: analysisResult });
  } catch (error) {
    console.error('Analysis Service Error:', error.message);
    res.status(500).json({ success: false, error: 'Analysis failed.' });
  }
});

// GET /api/ai/roadmap/:mineId
router.get('/roadmap/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;
    const roadmapResult = await RoadmapAgent.generateRoadmap(mineId);
    res.json({ success: true, data: roadmapResult });
  } catch (error) {
    console.error('Roadmap Agent Error:', error.message);
    res.status(500).json({ success: false, error: 'Roadmap generation failed.' });
  }
});

// GET /api/ai/briefings
router.get('/briefings', async (req, res) => {
  try {
    const briefings = await Briefing.find().sort({ date: -1 }).limit(10);
    res.json({ success: true, data: briefings });
  } catch (error) {
    console.error('Fetch Briefings Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch briefings' });
  }
});

// POST /api/ai/trigger-briefing
router.post('/trigger-briefing', async (req, res) => {
  try {
    // Run asynchronously
    BriefingAgent.generateAndSendBriefing();
    res.json({ success: true, message: 'Briefing generation triggered.' });
  } catch (error) {
    console.error('Trigger Briefing Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to trigger briefing' });
  }
});

const ChatAgent = require('../services/ChatAgent');

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, contextData, history } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const response = await ChatAgent.handleChat(message, contextData, history);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Chat API Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process chat message' });
  }
});

module.exports = router;
