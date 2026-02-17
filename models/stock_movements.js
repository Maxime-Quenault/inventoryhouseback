const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('stock_movements', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    change_quantity: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'stock_movements',
    schema: 'dev',
    timestamps: true,
    indexes: [
      {
        name: "stock_movements_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
