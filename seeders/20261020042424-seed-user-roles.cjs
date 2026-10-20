'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [normalUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE handle_id != \'admin@example.com\' ORDER BY handle_id ASC;',
    );

    const [adminUser] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE handle_id = 'admin@example.com' LIMIT 1;",
    );

    const [adminRole] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1;",
    );

    const [userRole] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'User' LIMIT 1;",
    );

    // create admin user role
    if (adminUser.length > 0 && adminRole.length > 0) {
      await queryInterface.bulkInsert('user_roles', [
        {
          id: Sequelize.literal('gen_random_uuid()'),
          user_id: adminUser[0].id,
          role_id: adminRole[0].id,
          created_by: 'system',
          updated_by: 'system',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ], {});
    }

    // create normal user role
    if (normalUsers.length > 0 && userRole.length > 0) {
      await queryInterface.bulkInsert('user_roles', normalUsers.map(user => ({
        id: Sequelize.literal('gen_random_uuid()'),
        user_id: user.id,
        role_id: userRole[0].id,
        created_by: 'system',
        updated_by: 'system',
        created_at: new Date(),
        updated_at: new Date(),
      })), {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_roles', null, {});
  },
};
