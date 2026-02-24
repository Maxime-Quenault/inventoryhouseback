'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('items', 'location_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    });

    await queryInterface.addIndex('items', ['location_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('items', ['location_id']);
    await queryInterface.removeColumn('items', 'location_id');
  }
};
