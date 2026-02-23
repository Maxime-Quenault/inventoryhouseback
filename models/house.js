const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class House extends Model {
    static associate(models) {
      House.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });

      House.belongsToMany(models.User, {
        through: models.HouseMember,
        foreignKey: 'house_id',
        otherKey: 'user_id',
      });

      House.hasMany(models.Item, { foreignKey: 'house_id' });
      House.hasMany(models.HouseMember, { foreignKey: 'house_id' });
    }
  }

  House.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'home' },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
  }, {
    sequelize,
    modelName: 'House',
    tableName: 'houses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return House;
};