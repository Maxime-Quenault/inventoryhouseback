'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const pg = require('pg');
require('dotenv').config();

const basename = path.basename(__filename);
const db = {};

function shouldUseSsl() {
  return process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production';
}

function databaseSchema() {
  return process.env.DATABASE_SCHEMA || 'public';
}

function buildSequelizeOptions() {
  const schema = databaseSchema();
  const poolMax = Number(process.env.DATABASE_POOL_MAX) || 2;
  const options = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    searchPath: schema,
    define: {
      schema,
    },
    dialectOptions: {
      options: `-c search_path=${schema}`,
    },
    pool: {
      max: poolMax,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  if (shouldUseSsl()) {
    options.dialectOptions = {
      ...options.dialectOptions,
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
      },
    };
  }

  return options;
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, buildSequelizeOptions())
  : new Sequelize(
      process.env.DATABASE_NAME,
      process.env.DATABASE_USER,
      process.env.DATABASE_PASSWORD,
      buildSequelizeOptions()
    );

fs.readdirSync(__dirname)
  .filter((file) => (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js'
  ))
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));
    const model = modelFactory(sequelize);
    db[model.name] = model;
  });

// Call associate
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
