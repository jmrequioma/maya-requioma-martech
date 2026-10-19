import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import { sequelize } from '../config/database.js';

class Transaction extends AuditedModel {
  declare id: string;
  declare senderId: string;
  declare recipientId: string;
  declare amount: number;
  declare status: 'COMPLETED' | 'FAILED';
  declare failureReason?: string;
  declare idempotencyKey: string;
}

Transaction.init(
  {
    ...Transaction.auditAttributes(),
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    status: {
      type: DataTypes.ENUM('COMPLETED', 'FAILED'),
      defaultValue: 'COMPLETED',
      allowNull: false,
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idempotencyKey: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['senderId', 'idempotencyKey'],
      },
    ],
  }
);

export default Transaction;
