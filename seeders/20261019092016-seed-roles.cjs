'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        type: 'ADM',
        name: 'Admin',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        type: 'USR',
        name: 'User',
        created_by: 'system',
        updated_by: 'system',
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'roles',
      {
        name: [
          'Admin',
          'User',
        ],
      },
      {},
    );
  },
};
