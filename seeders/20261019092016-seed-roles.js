'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        id_: Sequelize.literal('gen_random_uuid()'),
        role_type: 'XAD',
        role_name: 'Super Admin',
        status: 'A',
        remarks: 'Super Admin role',
        created_at: new Date(),
        created_by: 'system',
      },
      {
        id_: Sequelize.literal('gen_random_uuid()'),
        role_type: 'ADM',
        role_name: 'Admin',
        status: 'A',
        remarks: 'Admin role',
        created_at: new Date(),
        created_by: 'system',
      },
      {
        id_: Sequelize.literal('gen_random_uuid()'),
        role_type: 'MEM',
        role_name: 'Alumni',
        status: 'A',
        remarks: 'Alumni role',
        created_at: new Date(),
        created_by: 'system',
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'roles',
      {
          role_name: [
              'Admin',
              'User',
          ],
      },
      {}
    );
  },
};
