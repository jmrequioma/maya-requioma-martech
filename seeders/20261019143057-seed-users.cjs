'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { faker } = await import('@faker-js/faker');

    await queryInterface.bulkInsert('users', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        email: 'admin@example.com',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        status: 'A',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        email: 'user@example.com',
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
        email: [
          'admin@example.com',
          'user@example.com',
        ],
      },
      {}
    );
  }
};
