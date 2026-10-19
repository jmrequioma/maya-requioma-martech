import express, { Express, Request, Response } from 'express';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Send Money Limits Module is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
