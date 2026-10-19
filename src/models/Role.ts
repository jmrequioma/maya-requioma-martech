import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Role extends Model {
  declare id: string;
  declare name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
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
    created_by: {
      type: DataTypes.STRING(320),
      allowNull: false,
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
