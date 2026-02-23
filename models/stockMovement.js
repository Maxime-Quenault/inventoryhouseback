const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class StockMovement extends Model {
    static associate(models) {
      StockMovement.belongsTo(models.Item, { foreignKey: 'item_id' });
      StockMovement.belongsTo(models.User, { foreignKey: 'user_id' });
      StockMovement.belongsTo(models.House, { foreignKey: 'house_id' });
    }
  }

  StockMovement.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    item_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    house_id: { type: DataTypes.BIGINT, allowNull: false },

    change_quantity: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  }, {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    timestamps: false,
  });

  return StockMovement;
};