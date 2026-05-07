const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.House, {
        through: models.HouseMember,
        foreignKey: 'user_id',
        otherKey: 'house_id',
      });

      User.hasMany(models.House, { foreignKey: 'created_by' });
      User.hasMany(models.Item, { foreignKey: 'created_by' });
      User.hasMany(models.StockMovement, { foreignKey: 'user_id' });
    }
  }

  User.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(320), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    google_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    auth_provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'local' },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return User;
};
