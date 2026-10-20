import express from 'express';
import { sequelize } from './config/database.js';
import { setupAssociations } from './models/associations.js';
import apiRouter from './routes/api.js';
import { logger } from './middleware/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(logger);
app.use(apiLimiter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Send Money Limits Module is running' });
});
// API Routes
app.use('/api', apiRouter);
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(notFoundHandler);
app.use(errorHandler);
// Initialize database and start server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        // Setup all model associations
        setupAssociations();
        console.log('Model associations initialized.');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map