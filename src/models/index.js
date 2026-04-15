const fs = require('node:fs');
const path = require('node:path');
const Sequelize = require('sequelize');
const sequelize = require('../utils/database');
const db = {};

// Membaca semua file di direktori models
fs.readdirSync(__dirname)
  .filter(file => {
    return !file.startsWith('.') && (file !== 'index.js') && file.endsWith('.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Menjalankan fungsi associate untuk setiap model jika didefinisikan
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

module.exports = db;
