const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HouseMember extends Model {
    static associate(models) {
      HouseMember.belongsTo(models.User, { foreignKey: 'user_id' });
      HouseMember.belongsTo(models.House, { foreignKey: 'house_id' });
      HouseMember.belongsTo(models.Role, { foreignKey: 'role_id' });
    }
  }

  HouseMember.init({
    user_id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false },
    house_id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false },
    role_id: { type: DataTypes.BIGINT, allowNull: false },
    joined_at: { type: DataTypes.DATE, allowNull: false },
  }, {
    sequelize,
    modelName: 'HouseMember',
    tableName: 'house_members',
    timestamps: false,
  });

  return HouseMember;
};