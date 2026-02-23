const express = require('express');

const authRoutes = require('./routes/auth.routes');
const houseRoutes = require('./routes/house.routes');
const itemRoutes = require('./routes/item.routes');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api', itemRoutes);

module.exports = app;