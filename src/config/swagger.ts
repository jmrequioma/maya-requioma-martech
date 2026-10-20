import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Maya Requioma Martech',
      version: '1.0.0',
      description: 'API documentation for the Send Money Limits Module',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['dist/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
