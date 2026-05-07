const express = require('express');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth.routes');
const houseRoutes = require('./routes/house.routes');
const itemRoutes = require('./routes/item.routes');
const memberRoutes = require('./routes/member.routes');
const referenceRoutes = require('./routes/reference.routes');
const openApiDocument = require('./docs/openapi');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api-docs.json', (req, res) => res.status(200).json(openApiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api', itemRoutes);
app.use('/api', memberRoutes);
app.use('/api', referenceRoutes);

module.exports = app;
