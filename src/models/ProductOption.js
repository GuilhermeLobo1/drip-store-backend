const { Model, DataTypes } = require('sequelize');

class ProductOption extends Model {
    static init(sequelize) {
        super.init(
            {
                product_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                title: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                shape: {
                    type: DataTypes.ENUM('square', 'circle'),
                    allowNull: true,
                    defaultValue: 'square',
                },
                radius: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                type: {
                    type: DataTypes.ENUM('text', 'color'),
                    allowNull: true,
                    defaultValue: 'text',
                },
                values: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: 'product_options',
                timestamps: true,
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product',
        });
    }
}

module.exports = ProductOption;