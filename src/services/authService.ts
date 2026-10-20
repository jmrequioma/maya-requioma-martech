import { sequelize, Op } from '../config/database.js';
import User from '../models/User.js';
import UserRoles from '../models/UserRole.js';
import Role from '../models/Role.js';
import { generateToken } from '../middleware/auth.js';
import type { Request, Response } from 'express';
import bcryptLib from 'bcrypt';
import Wallet from '../models/Wallet.js';
import UserTransferLimit from '../models/UserTransferLimit.js';

export async function login(req: Request, res: Response) {
  try {
    const { handleId, password } = req.body;

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
    const adminRole = await Role.findOne({ where: { type: 'ADM' } });
    const isAdmin =
      (await UserRoles.findOne({ where: { userId: user.id, roleId: adminRole?.id } })) !== null;
    // Check password
    const retPassword = user.password;
    const passwordMatch = await bcryptLib.compare(password, retPassword);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const token = generateToken(user.id, isAdmin);
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

export async function register(req: Request, res: Response) {
  const txn = await sequelize.transaction();
  try {
    const { handleId, password, firstName, lastName } = req.body;

    const accountQuery = {
      handle_id: sequelize.where(sequelize.fn('LOWER', sequelize.col('handle_id')), {
        [Op.eq]: handleId.toLowerCase(),
      }),
    };

    const existingUser = await User.findOne({ where: accountQuery });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
      });
    }

    const hashedPassword = await bcryptLib.hash(password, 10);
    const newUser = await User.create(
      {
        handleId: handleId,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        createdBy: 'system',
        updatedBy: 'system',
      },
      { transaction: txn }
    );

    await UserRoles.create(
      {
        userId: newUser.id,
        roleId: (await Role.findOne({ where: { type: 'USR' } }))?.id,
        createdBy: newUser.id,
        updatedBy: newUser.id,
      },
      { transaction: txn }
    );

    await Wallet.create(
      {
        userId: newUser.id,
        createdBy: newUser.id,
        updatedBy: newUser.id,
      },
      { transaction: txn }
    );

    await UserTransferLimit.create(
      {
        userId: newUser.id,
        createdBy: newUser.id,
        updatedBy: newUser.id,
      },
      { transaction: txn }
    );

    await txn.commit();
    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser.id,
    });
  } catch (error) {
    await txn.rollback();
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
