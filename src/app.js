require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./models');

const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/v1/user', userRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Drip Store API running' });
});

module.exports = app;