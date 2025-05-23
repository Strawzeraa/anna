// models/SecretCode.js
const mongoose = require('mongoose');

const SecretCodeSchema = new mongoose.Schema({
  code: String,
  expiresAt: Date,
  winner: String
});

module.exports = mongoose.model('SecretCode', SecretCodeSchema);