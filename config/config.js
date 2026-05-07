require('dotenv').config();

function shouldUseSsl() {
  return process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production';
}

function databaseSchema() {
  return process.env.DATABASE_SCHEMA || 'public';
}

function dialectOptions() {
  const schema = databaseSchema();
  const options = {
    options: `-c search_path=${schema}`,
  };

  if (!shouldUseSsl()) return options;

  return {
    ...options,
    ssl: {
      require: true,
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
    },
  };
}

function databaseConfig() {
  const poolMax = Number(process.env.DATABASE_POOL_MAX) || 2;

  if (process.env.DATABASE_URL) {
    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: dialectOptions(),
      searchPath: databaseSchema(),
      define: { schema: databaseSchema() },
      pool: { max: poolMax, min: 0, acquire: 30000, idle: 10000 },
    };
  }

  return {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: dialectOptions(),
    searchPath: databaseSchema(),
    define: { schema: databaseSchema() },
    pool: { max: poolMax, min: 0, acquire: 30000, idle: 10000 },
  };
}

module.exports = {
  development: databaseConfig(),
  production: {
    ...databaseConfig(),
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
  }
};
