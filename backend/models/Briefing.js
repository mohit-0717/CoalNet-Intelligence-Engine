const mongoose = require('mongoose');

const briefingSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  markdownBody: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Briefing', briefingSchema);
