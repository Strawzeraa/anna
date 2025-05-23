const mongoose = require('mongoose');

// Define o esquema de filhos
const FilhoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  genero: {
    type: String,
    required: true
  },
  nascimento: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Define o esquema do usuário
const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  coins: {
    type: Number,
    default: 0
  },
  lastDaily: {
    type: Number,
    default: 0
  },
  lastWork: {
    type: Number,
    default: 0
  },
  lastInvest: {
    type: Number,
    default: 0
  },
  lastFish: {
    type: Number,
    default: 0
  },
  lastCasino: {
    type: Number,
    default: 0
  },
  lastCrimeTime: {
    type: Number,
    default: 0
  },
  lastRaceTime: {
    type: Number,
    default: 0
  },
  lastDuelRaceTime: {
    type: Number,
    default: 0
  },
  marriedTo: {
    type: String,
    default: null
  },
  lastGF: {
    type: Number,
    default: 0
  },
  lastCare: {
    type: Number,
    default: 0
  },
  filhos: {
    type: [FilhoSchema],
    default: []
  },
  bio: {
    type: String,
    default: 'Use /bio para personalizar sua biografia!'
  },
  banner: {
    type: String,
    default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJng5gt1TnhUjbvF_94ZhC-Ve7mYVJ0DIDpgBKKQdhrW4KxjZM6EudaGG&s=10'
  },
  bannersComprados: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);