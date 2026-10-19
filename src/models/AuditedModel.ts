import { DataTypes, Model } from 'sequelize';

export default abstract class AuditedModel extends Model {
  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static auditAttributes() {
    return {
      createdBy: {
        type: DataTypes.STRING(320),
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.STRING(320),
        allowNull: false,
      },
    };
  }
}
