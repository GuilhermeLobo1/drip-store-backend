const { Model, DataTypes } = require('sequelize');

class User extends Model {
    static init(sequelize) {
        super.init(
            {
                firstname: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                surname: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                email: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: 'users',
                timestamps: true,
            }
        );
    }
}

module.exports = User;