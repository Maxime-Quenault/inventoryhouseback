const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Location extends Model {
    static associate(models) {
      Location.hasMany(models.Item, { foreignKey: 'location_id' });
    }
  }

  Location.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Location;
};
