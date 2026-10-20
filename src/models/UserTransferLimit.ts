import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import { sequelize } from '../config/database.js';
import type User from './User.js';

class UserTransferLimit extends AuditedModel {
  declare id: string;
  declare userId: string;
  declare dailyLimit: number;
  declare monthlyLimit: number;

  // Association declarations
  declare user?: User;
}

UserTransferLimit.init(
  {
    ...UserTransferLimit.auditAttributes(),
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    dailyLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 50000, // Default: ₱50,000
      validate: {
        min: 0,
      },
    },
    monthlyLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 500000, // Default: ₱500,000
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: 'UserTransferLimit',
    tableName: 'user_transfer_limits',
    underscored: true,
  }
);

export default UserTransferLimit;
