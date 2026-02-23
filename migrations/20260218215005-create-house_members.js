'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('house_members', {
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      house_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'houses', key: 'id' },
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'RESTRICT',
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // PK composite
    await queryInterface.addConstraint('house_members', {
      fields: ['user_id', 'house_id'],
      type: 'primary key',
      name: 'pk_house_members_user_house'
    });

    // index utile pour lister les membres d'une maison
    await queryInterface.addIndex('house_members', ['house_id']);
    await queryInterface.addIndex('house_members', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('house_members');
  }
};