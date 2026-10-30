const Sequelize = require('sequelize');
const dbConfig = require('../config/database');

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

const connection = new Sequelize(dbConfig);

User.init(connection);
Category.init(connection);
Product.init(connection);
ProductImage.init(connection);
ProductOption.init(connection);
ProductCategory.init(connection);

Category.associate(connection.models);
Product.associate(connection.models);
ProductImage.associate(connection.models);
ProductOption.associate(connection.models);

module.exports = {
    connection,
    User,
    Category,
    Product,
    ProductImage,
    ProductOption,
    ProductCategory,
};