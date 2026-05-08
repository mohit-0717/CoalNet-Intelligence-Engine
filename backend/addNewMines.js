const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Mine = require('./models/Mine');
const { getMineEmissionModel } = require('./models/Emission');

// Connect to MongoDB directly
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const addNewMines = async () => {
  try {
    await connectDB();
    
    // Add mines from states not previously included: Telangana, Maharashtra, Assam
    const newMines = [
      { name: 'Singareni', location: 'Kothagudem', state: 'Telangana', coordinates: { lat: 17.55, lng: 80.61 } },
      { name: 'Chandrapur', location: 'Chandrapur', state: 'Maharashtra', coordinates: { lat: 19.95, lng: 79.29 } },
      { name: 'Makum', location: 'Tinsukia', state: 'Assam', coordinates: { lat: 27.28, lng: 95.68 } }
    ];

    const insertedMines = [];
    for (let m of newMines) {
      const existing = await Mine.findOne({ name: m.name });
      if (!existing) {
        const doc = new Mine(m);
        await doc.save();
        insertedMines.push(doc);
        console.log(`✅ Added mine: ${m.name} (${m.state})`);
      } else {
        insertedMines.push(existing);
        console.log(`⏭️ Mine already exists: ${m.name} (${m.state})`);
      }
    }

    // Generate 180 days of dummy data for ONLY the newly inserted mines
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6);

    for (let mi = 0; mi < insertedMines.length; mi++) {
      const mine = insertedMines[mi];
      const MineEmission = getMineEmissionModel(mine.name);

      await MineEmission.deleteMany({});
      console.log(`🗑️ Cleared any existing data for ${mine.name}`);
      
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const baseEmission = 800 + Math.random() * 700;
      let currentDate = new Date(startDate);
      let generatedRecords = 0;

      while (currentDate <= endDate) {
        // Simple random stable profile
        let multiplier = 0.80 + Math.random() * 0.40;
        const totalTarget = baseEmission * multiplier;

        const fuelPct = 0.35 + Math.random() * 0.05;
        const electricityPct = 0.15 + Math.random() * 0.05;
        const explosivesPct = 0.02 + Math.random() * 0.01;
        const transportPct = 0.20 + Math.random() * 0.05;
        const methanePct = 1 - fuelPct - electricityPct - explosivesPct - transportPct;

        const fuel_emission = totalTarget * fuelPct;
        const electricity_emission = totalTarget * electricityPct;
        const explosives_emission = totalTarget * explosivesPct;
        const transport_emission = totalTarget * transportPct;
        const methane_emissions_co2e = totalTarget * methanePct;

        const fuel_used = fuel_emission / 2.68;
        const electricity_used = electricity_emission / 0.82;
        const explosives_used = explosives_emission / 1.5;
        const transport_fuel_used = transport_emission / 2.68;
        const methane_emissions_ch4 = methane_emissions_co2e / 28;

        const scope1 = fuel_emission + explosives_emission + methane_emissions_co2e;
        const scope2 = electricity_emission;
        const scope3 = transport_emission;
        const total_carbon_emission = scope1 + scope2 + scope3;

        const newRecord = new MineEmission({
          date: new Date(currentDate),
          fuel_used, electricity_used, explosives_used, methane_emissions_ch4, transport_fuel_used,
          fuel_emission, electricity_emission, explosives_emission, methane_emissions_co2e, transport_emission,
          scope1, scope2, scope3, total_carbon_emission
        });

        await newRecord.save();
        generatedRecords++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      console.log(`✅ Generated ${generatedRecords} daily emission records for ${mine.name}`);
    }

    console.log('🎉 Done adding new state mines!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
};

addNewMines();
