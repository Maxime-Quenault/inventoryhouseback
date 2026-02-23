const db = require('./models');
const app = require('./app');

const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    console.log('✅Database connected');
    return db.sequelize.sync({ alter: false }); // En prod : pas sync auto
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('🚨Database error:', err);
  });