import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import sequelize from '../config/database.js';

class User extends AuditedModel {
  declare id: string;
  declare email: string;
  declare firstName: string;
  declare middleName: string | null;
  declare lastName: string;
}

User.init(
  {
    ...User.auditAttributes(),
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
