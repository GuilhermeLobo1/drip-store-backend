require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./models');

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/v1/user', userRoutes);
app.use('/v1/category', categoryRoutes);
app.use('/v1/product', productRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Drip Store API running' });
});

module.exports = app;