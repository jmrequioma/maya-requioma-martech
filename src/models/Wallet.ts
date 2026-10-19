import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import sequelize from '../config/database.js';

class Wallet extends AuditedModel {
  declare id: string;
  declare userId: string;
  declare balance: number;
  declare totalSent: number;
  declare totalReceived: number;
}

Wallet.init(
  {
    ...Wallet.auditAttributes(),
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
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalSent: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalReceived: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallets',
    underscored: true,
  }
);

export default Wallet;
