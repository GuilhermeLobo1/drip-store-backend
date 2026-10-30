const { Model, DataTypes } = require('sequelize');

class ProductCategory extends Model {
    static init(sequelize) {
        super.init(
            {
                product_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                },
                category_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                },
            },
            {
                sequelize,
                tableName: 'product_categories',
                timestamps: true,
            }
        );
    }
}

module.exports = ProductCategory;