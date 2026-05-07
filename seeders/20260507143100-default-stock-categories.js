'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO stock_categories (name, created_at, updated_at)
      VALUES
        ('frais', NOW(), NOW()),
        ('congele', NOW(), NOW()),
        ('sec', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_categories', {
      name: ['frais', 'congele', 'sec'],
    });
  },
};
