const { Model, DataTypes } = require('sequelize');

class Product extends Model {
    static init(sequelize) {
        super.init(
            {
                enabled: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                slug: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                use_in_menu: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                stock: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                description: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                price: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                },
                price_with_discount: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: 'products',
                timestamps: true,
            }
        );
    }

    static associate(models) {
        this.hasMany(models.ProductImage, {
            foreignKey: 'product_id',
            as: 'images',
        });
        this.hasMany(models.ProductOption, {
            foreignKey: 'product_id',
            as: 'options',
        });
        this.belongsToMany(models.Category, {
            foreignKey: 'product_id',
            through: models.ProductCategory,
            as: 'categories',
        });
    }
}

module.exports = Product;