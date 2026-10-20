import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import { sequelize } from '../config/database.js';
import type UserRole from './UserRole.js';

class Role extends AuditedModel {
  declare id: string;
  declare name: string;
  declare type: string;

  // Association declarations
  declare userRoles?: UserRole[];
}

Role.init(
  {
    ...Role.auditAttributes(),
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    underscored: true,
  }
);

export default Role;
