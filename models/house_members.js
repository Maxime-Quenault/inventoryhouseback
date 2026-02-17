const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('house_members', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    house_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "member"
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'house_members',
    schema: 'dev',
    timestamps: false,
    indexes: [
      {
        name: "house_members_pkey",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "house_id" },
        ]
      },
    ]
  });
};
