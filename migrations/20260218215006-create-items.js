'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('items', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      house_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'houses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },

      category_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'stock_categories',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('items');
  }
};