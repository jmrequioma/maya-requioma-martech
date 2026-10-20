import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import { sequelize } from '../config/database.js';
import type Wallet from './Wallet.js';
import type UserTransferLimit from './UserTransferLimit.js';
import type Transaction from './Transaction.js';
import type UserRole from './UserRole.js';

class User extends AuditedModel {
  declare id: string;
  declare handleId: string;
  declare password: string;
  declare firstName: string;
  declare middleName: string | null;
  declare lastName: string;
  declare status: string;

  // Association declarations
  declare wallet?: Wallet;
  declare transferLimit?: UserTransferLimit;
  declare sentTransactions?: Transaction[];
  declare receivedTransactions?: Transaction[];
  declare userRoles?: UserRole[];
}

User.init(
  {
    ...User.auditAttributes(),
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    handleId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(4),
      allowNull: false,
      defaultValue: 'A',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
  }
);

export default User;
