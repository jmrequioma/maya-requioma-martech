import { Router, Request, Response } from 'express';

const router = Router();

router.post('/transfers', (req: Request, res: Response) => {
  res.send('Admin route');
});

export default router;
