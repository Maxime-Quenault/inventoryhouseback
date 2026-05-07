const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Item extends Model {
    static associate(models) {
      Item.belongsTo(models.House, { foreignKey: 'house_id' });
      Item.belongsTo(models.StockCategory, { foreignKey: 'category_id' });
      Item.belongsTo(models.User, { foreignKey: 'created_by' });
      Item.belongsTo(models.Location, { foreignKey: 'location_id' });
    }
  }

  Item.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    house_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },

    expiration_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    location_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

  }, {
    sequelize,
    modelName: 'Item',
    tableName: 'items',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  return Item;
};
