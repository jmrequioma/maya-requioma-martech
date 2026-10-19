import { DataTypes } from 'sequelize';
import AuditedModel from './AuditedModel.js';
import sequelize from '../config/database.js';

class UserRole extends AuditedModel {
  declare id: string;
  declare name: string;
}

UserRole.init(
  {
    ...UserRole.auditAttributes(),
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
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    underscored: true,
  }
);

export default UserRole;
