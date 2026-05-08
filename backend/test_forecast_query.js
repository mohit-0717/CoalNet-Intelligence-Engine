const mongoose = require('mongoose');
require('dotenv').config();
const { getMineEmissionModel } = require('./models/Emission');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 120);

  const MineEmission = getMineEmissionModel('Raniganj Coalfield');
  const count = await MineEmission.countDocuments({
    date: { $gte: cutoffDate }
  });

  console.log('Count for Raniganj >= ' + cutoffDate + ':', count);
  process.exit(0);
});
