'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = Sequelize.fn('NOW');

    await queryInterface.bulkInsert('locations', [
      { name: 'frigo', created_at: now, updated_at: now },
      { name: 'congélateur', created_at: now, updated_at: now },
      { name: 'placard', created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', {
      name: ['frigo', 'congélateur', 'placard'],
    });
  },
};
