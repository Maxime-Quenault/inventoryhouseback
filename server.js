const express = require('express');
const app = express();
const db = require('./database/database');
// const userRoutes = require('./routes/userRoutes');
// const { swaggerUi, swaggerSpec } = require("./swagger");

require('dotenv').config();

app.use(express.json());  // Pour analyser les requêtes JSON

// app.use('/api/user', userRoutes);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Démarrer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log(`Documentation Swagger : http://localhost:${port}/api-docs`);
});