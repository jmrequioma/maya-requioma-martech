'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [normalUsers] = await queryInterface.sequelize.query(
      "SELECT user_id FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'User');",
    );

    await queryInterface.bulkInsert('wallets', normalUsers.map(user => ({
      id: Sequelize.literal('gen_random_uuid()'),
      user_id: user.user_id,
      balance: 10000,
      created_by: 'system',
      updated_by: 'system',
      created_at: new Date(),
      updated_at: new Date(),
    })), {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('wallets', null, {});
  },
};
