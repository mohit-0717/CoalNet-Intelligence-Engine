const mongoose = require('mongoose');
require('dotenv').config();
const Mine = require('./models/Mine');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
};

const seedRemainingMines = async () => {
  try {
    await connectDB();
    const mineCount = await Mine.countDocuments();
    if (mineCount >= 45) {
      console.log('Mines already at 45 or more');
      process.exit(0);
    }

    const newMines = [
      { name: 'Kusmunda', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.33, lng: 82.68 } },
      { name: 'Gevra', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.34, lng: 82.59 } },
      { name: 'Dipka', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.32, lng: 82.55 } },
      { name: 'Rajmahal', location: 'Godda', state: 'Jharkhand', coordinates: { lat: 25.03, lng: 87.35 } },
      { name: 'Nigahi', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.13, lng: 82.65 } },
      { name: 'Jayant', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.14, lng: 82.64 } },
      { name: 'Dudhichua', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.15, lng: 82.66 } },
      { name: 'Khadia', location: 'Singrauli', state: 'Uttar Pradesh', coordinates: { lat: 24.16, lng: 82.68 } },
      { name: 'Bina', location: 'Sonbhadra', state: 'Uttar Pradesh', coordinates: { lat: 24.17, lng: 82.70 } },
      { name: 'Kakri', location: 'Sonbhadra', state: 'Uttar Pradesh', coordinates: { lat: 24.18, lng: 82.71 } },
      { name: 'Krishnashila', location: 'Sonbhadra', state: 'Uttar Pradesh', coordinates: { lat: 24.19, lng: 82.72 } },
      { name: 'Block B', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.20, lng: 82.73 } },
      { name: 'Ashoka', location: 'Chatra', state: 'Jharkhand', coordinates: { lat: 23.85, lng: 85.00 } },
      { name: 'Piparwar', location: 'Chatra', state: 'Jharkhand', coordinates: { lat: 23.86, lng: 85.02 } },
      { name: 'Magadh', location: 'Chatra', state: 'Jharkhand', coordinates: { lat: 23.87, lng: 85.04 } },
      { name: 'Amrapali', location: 'Chatra', state: 'Jharkhand', coordinates: { lat: 23.88, lng: 85.06 } },
      { name: 'Chandragupt', location: 'Chatra', state: 'Jharkhand', coordinates: { lat: 23.89, lng: 85.08 } },
      { name: 'Sanghamitra', location: 'Chatra', state: 'Jharkhand', coordinates: { lat: 23.90, lng: 85.10 } },
      { name: 'Pachwara', location: 'Godda', state: 'Jharkhand', coordinates: { lat: 25.05, lng: 87.37 } },
      { name: 'Chuperbhita', location: 'Pakur', state: 'Jharkhand', coordinates: { lat: 24.60, lng: 87.80 } },
      { name: 'Gare Palma', location: 'Raigarh', state: 'Chhattisgarh', coordinates: { lat: 22.10, lng: 83.50 } },
      { name: 'Chhal', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.40, lng: 82.80 } },
      { name: 'Baroud', location: 'Raigarh', state: 'Chhattisgarh', coordinates: { lat: 22.15, lng: 83.55 } },
      { name: 'Jampali', location: 'Raigarh', state: 'Chhattisgarh', coordinates: { lat: 22.20, lng: 83.60 } },
      { name: 'Bijari', location: 'Raigarh', state: 'Chhattisgarh', coordinates: { lat: 22.25, lng: 83.65 } },
      { name: 'Samaleswari', location: 'Jharsuguda', state: 'Odisha', coordinates: { lat: 21.80, lng: 83.90 } },
      { name: 'Lajkura', location: 'Jharsuguda', state: 'Odisha', coordinates: { lat: 21.82, lng: 83.92 } },
      { name: 'Lilari', location: 'Jharsuguda', state: 'Odisha', coordinates: { lat: 21.84, lng: 83.94 } },
      { name: 'Lakhanpur', location: 'Jharsuguda', state: 'Odisha', coordinates: { lat: 21.86, lng: 83.96 } },
      { name: 'Belpahar', location: 'Jharsuguda', state: 'Odisha', coordinates: { lat: 21.88, lng: 83.98 } },
      { name: 'Ananta', location: 'Angul', state: 'Odisha', coordinates: { lat: 20.95, lng: 85.15 } },
      { name: 'Bharatpur', location: 'Angul', state: 'Odisha', coordinates: { lat: 20.97, lng: 85.17 } },
      { name: 'Bhubaneswari', location: 'Angul', state: 'Odisha', coordinates: { lat: 20.99, lng: 85.19 } },
    ];

    await Mine.insertMany(newMines);
    console.log(`✅ Added ${newMines.length} more mines!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedRemainingMines();
