const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const Mine = require('./models/Mine');

const seedMines = async () => {
  try {
    await connectDB();
    const mineCount = await Mine.countDocuments();
    console.log(`Current mine count: ${mineCount}`);
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
    } else {
      console.log('⏭️ Mines already exist, skipping seed.');
    }
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error seeding mines:', err);
    process.exit(1);
  }
};

seedMines();
