import { sequelize, Op } from '../config/database.js';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { loginSchema } from '../schemas/loginSchema.js';
import type { Request, Response } from 'express';
import bcryptLib from 'bcrypt';

export async function login(req: Request, res: Response) {
  try {
    const { handleId, password } = loginSchema.parse(req.body);

    const accountQuery = {
      handle_id: sequelize.where(sequelize.fn('LOWER', sequelize.col('handle_id')), {
        [Op.eq]: handleId.toLowerCase(),
      }),
    };

    const user = await User.findOne({ where: accountQuery });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }
    // Check password
    const retPassword = user.password;
    const passwordMatch = await bcryptLib.compare(password, retPassword);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid password',
      });
    }

    const token = generateToken(handleId);
    res.status(200).json({
      token,
      expiresIn: '24h',
      type: 'Bearer',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
