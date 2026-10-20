'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [normalUsers] = await queryInterface.sequelize.query(
      "SELECT user_id FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'User');",
    );

    await queryInterface.bulkInsert('user_transfer_limits', normalUsers.map(user => ({
      id: Sequelize.literal('gen_random_uuid()'),
      user_id: user.user_id,
      daily_limit: 50000,
      monthly_limit: 500000,
      created_by: 'system',
      updated_by: 'system',
      created_at: new Date(),
      updated_at: new Date(),
    })), {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_transfer_limits', null, {});
  },
};
