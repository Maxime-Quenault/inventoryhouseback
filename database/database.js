require('dotenv').config();
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models'); // Le fichier généré par l'outil

// Configuration de la connexion
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'postgres',
  logging: false
});

// Initialise tous les modèles d'un coup
const models = initModels(sequelize);

module.exports = { sequelize, ...models };