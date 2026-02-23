const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class StockCategory extends Model {
    static associate(models) {
      StockCategory.hasMany(models.Item, { foreignKey: 'category_id' });
    }
  }

  StockCategory.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  }, {
    sequelize,
    modelName: 'StockCategory',
    tableName: 'stock_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return StockCategory;
};