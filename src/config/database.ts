import { Sequelize, Op } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'maya_martech',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

export { sequelize, Op };
