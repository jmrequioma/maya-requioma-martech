'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { faker } = await import('@faker-js/faker');
    const hashedPassword = await bcrypt.hash('Password!23', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        handle_id: 'admin@example.com',
        password: hashedPassword,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        status: 'A',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        handle_id: 'user@example.com',
        password: hashedPassword,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        status: 'A',
        created_by: 'system',
        updated_by: 'system',
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'users',
      {
        handle_id: [
          'admin@example.com',
          'user@example.com',
        ],
      },
      {},
    );
  },
};
