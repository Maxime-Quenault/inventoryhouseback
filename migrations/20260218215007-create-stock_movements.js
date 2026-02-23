'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      item_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },

      // Recommandé (dénormalisation utile)
      house_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'houses', key: 'id' },
        onDelete: 'CASCADE',
      },

      change_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false, // add | remove | update
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('stock_movements', ['item_id']);
    await queryInterface.addIndex('stock_movements', ['house_id', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_movements');
  }
};