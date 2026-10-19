import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Transaction extends Model {
  declare id: string;
  declare senderId: string;
  declare recipientId: string;
  declare amount: number;
  declare status: 'COMPLETED' | 'FAILED';
  declare failureReason?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
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
    createdBy: {
      type: DataTypes.STRING(320),
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.STRING(320),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
  }
);

export default Transaction;
