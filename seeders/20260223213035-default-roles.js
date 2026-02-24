'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    
    await queryInterface.bulkInsert('roles', [
      { name: 'owner', created_at: now, updated_at: now },
      { name: 'member', created_at: now, updated_at: now },
      { name: 'admin', created_at: now, updated_at: now },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', {
      name: ['owner', 'member', 'admin'],
    });
  }
};