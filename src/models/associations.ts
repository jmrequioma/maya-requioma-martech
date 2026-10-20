import User from './User.js';
import Wallet from './Wallet.js';
import Transaction from './Transaction.js';
import UserTransferLimit from './UserTransferLimit.js';
import UserRole from './UserRole.js';
import Role from './Role.js';

export function setupAssociations() {
  // User → Wallet (one-to-one)
  User.hasOne(Wallet, {
    foreignKey: 'userId',
    as: 'wallet',
    onDelete: 'CASCADE',
  });
  Wallet.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // User → UserTransferLimit (one-to-one)
  User.hasOne(UserTransferLimit, {
    foreignKey: 'userId',
    as: 'transferLimit',
    onDelete: 'CASCADE',
  });
  UserTransferLimit.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // User → Transaction as sender (one-to-many)
  User.hasMany(Transaction, {
    foreignKey: 'senderId',
    as: 'sentTransactions',
    onDelete: 'CASCADE',
  });
  Transaction.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
  });

  // User → Transaction as recipient (one-to-many)
  User.hasMany(Transaction, {
    foreignKey: 'recipientId',
    as: 'receivedTransactions',
    onDelete: 'CASCADE',
  });
  Transaction.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient',
  });

  // User → UserRole (one-to-many)
  User.hasMany(UserRole, {
    foreignKey: 'userId',
    as: 'userRoles',
    onDelete: 'CASCADE',
  });
  UserRole.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // Role → UserRole (one-to-many)
  Role.hasMany(UserRole, {
    foreignKey: 'roleId',
    as: 'userRoles',
    onDelete: 'CASCADE',
  });
  UserRole.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role',
  });
}
