const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db.js');
const Mine = require('./models/Mine');

// Initialize app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== REQUEST LOGGING ====================
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n📨 [${timestamp}] ${req.method} ${req.path}`);
  
  // Intercept res.json
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusMsg = statusCode >= 400 ? '❌' : '✅';
    
    console.log(`${statusMsg} [${statusCode}] ${req.method} ${req.path} (${duration}ms)`);
    return originalJson(data);
  };
  
  next();
});

// Connect to Database
console.log('🔌 Connecting to MongoDB...');
connectDB();

// Routes
const mineRoutes = require('./routes/mines');
const emissionRoutes = require('./routes/emissions');
const dashboardRoutes = require('./routes/dashboard');
const systemRoutes = require('./routes/system');
const forecastRoutes = require('./routes/forecast');
const insightsRoutes = require('./routes/insights');
const comparisonRoutes = require('./routes/comparison');
const reportRoutes = require('./routes/report');
const aqiRoutes = require('./routes/aqi');
const homeStatsRoutes = require('./routes/homeStats');
const aiRoutes = require('./routes/ai');

app.use('/api/mines', mineRoutes);
app.use('/api/emissions', emissionRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', systemRoutes);
app.use('/api/aqi', aqiRoutes);
app.use('/api/home-stats', homeStatsRoutes);
app.use('/api/forecast/insights', insightsRoutes);
app.use('/api/forecast/compare', comparisonRoutes);
app.use('/api/forecast/report', reportRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Seeding initial mine data
const seedMines = async () => {
  try {
    const mineCount = await Mine.countDocuments();
    if (mineCount === 0) {
      const allMinesData = [
        { name: 'Jharia, Dhanbad', location: 'Dhanbad', state: 'Jharkhand', coordinates: { lat: 23.75, lng: 86.42 } },
        { name: 'Bokaro', location: 'Bokaro', state: 'Jharkhand', coordinates: { lat: 23.78, lng: 85.82 } },
        { name: 'Jayanti', location: 'Jayanti', state: 'Jharkhand', coordinates: { lat: 23.7, lng: 86.6 } },
        { name: 'Godda', location: 'Godda', state: 'Jharkhand', coordinates: { lat: 24.83, lng: 87.21 } },
        { name: 'Giridih (Karbhari Coal Field)', location: 'Giridih', state: 'Jharkhand', coordinates: { lat: 24.18, lng: 86.3 } },
        { name: 'Ramgarh', location: 'Ramgarh', state: 'Jharkhand', coordinates: { lat: 23.63, lng: 85.51 } },
        { name: 'Karanpura', location: 'Karanpura', state: 'Jharkhand', coordinates: { lat: 23.7, lng: 85.25 } },
        { name: 'Daltonganj', location: 'Daltonganj', state: 'Jharkhand', coordinates: { lat: 24.03, lng: 84.07 } },
        { name: 'Raniganj Coalfield', location: 'Raniganj', state: 'West Bengal', coordinates: { lat: 23.6, lng: 87.12 } },
        { name: 'Birbhum', location: 'Birbhum', state: 'West Bengal', coordinates: { lat: 23.9, lng: 87.6 } },
        { name: 'Korba', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.35, lng: 82.68 } },
        { name: 'Singrauli', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.2, lng: 82.67 } },
      ];
      await Mine.insertMany(allMinesData);
      console.log('✅ Mines seeded!');
    }
  } catch (err) {
    console.error('❌ Error seeding mines:', err.message);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const { initCron } = require('./services/BriefingAgent');

app.listen(port, async () => {
  console.log(`\n🚀 Server is running on port ${port}`);
  await seedMines();
  initCron();
  console.log('✨ Server ready!\n');
});