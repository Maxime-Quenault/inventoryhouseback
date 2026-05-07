'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE locations
      SET name = 'congelateur', updated_at = NOW()
      WHERE LOWER(name) LIKE 'cong%';
    `);
  },

  async down() {
    // No-op: keep normalized ASCII names.
  },
};
