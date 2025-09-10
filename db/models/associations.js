"use strict";

module.exports = function (models) {
  const {
    user,
    wallet,
    token,
    balance,
    transaction,
    KYC,
    virtualCard,
    cardTransaction,
    staking,
    investment,
    reward,
    userSession,
    notification,
    auditLog,
  } = models;

  // user Associations
  user.hasMany(wallet, { foreignKey: "userId", as: "wallets" });
  user.hasMany(balance, { foreignKey: "userId", as: "balances" });
  user.hasMany(transaction, {
    foreignKey: "fromuserId",
    as: "senttransactions",
  });
  user.hasMany(transaction, {
    foreignKey: "touserId",
    as: "receivedtransactions",
  });
  user.hasOne(KYC, { foreignKey: "userId", as: "kyc" });
  user.hasMany(virtualCard, { foreignKey: "userId", as: "virtualCards" });
  user.hasMany(cardTransaction, {
    foreignKey: "userId",
    as: "cardTransactions",
  });
  user.hasMany(staking, { foreignKey: "userId", as: "stakings" });
  user.hasMany(investment, { foreignKey: "userId", as: "investments" });
  user.hasMany(reward, { foreignKey: "userId", as: "rewards" });
  user.hasMany(userSession, { foreignKey: "userId", as: "sessions" });
  user.hasMany(notification, { foreignKey: "userId", as: "notifications" });
  user.hasMany(auditLog, { foreignKey: "userId", as: "auditLogs" });

  // Self-referencing associations for referrals
  user.belongsTo(user, { foreignKey: "referredBy", as: "referrer" });
  user.hasMany(user, { foreignKey: "referredBy", as: "referrals" });

  // Admin associations
  user.hasMany(KYC, { foreignKey: "reviewedBy", as: "kycReviews" });
  user.hasMany(virtualCard, {
    foreignKey: "terminatedBy",
    as: "cardTerminations",
  });
  user.hasMany(auditLog, { foreignKey: "userId", as: "performedauditLogs" });

  // wallet Associations
  wallet.belongsTo(user, { foreignKey: "userId", as: "user" });
  wallet.hasMany(balance, { foreignKey: "walletId", as: "balances" });
  wallet.hasMany(transaction, {
    foreignKey: "fromwalletId",
    as: "senttransactions",
  });
  wallet.hasMany(transaction, {
    foreignKey: "towalletId",
    as: "receivedtransactions",
  });
  wallet.hasMany(staking, { foreignKey: "walletId", as: "stakings" });

  // token Associations
  token.hasMany(balance, { foreignKey: "tokenId", as: "balances" });
  token.hasMany(transaction, { foreignKey: "tokenId", as: "transactions" });
  token.hasMany(staking, { foreignKey: "tokenId", as: "stakings" });
  token.hasMany(investment, { foreignKey: "aimtokenId", as: "aiminvestments" });
  token.hasMany(reward, { foreignKey: "tokenId", as: "rewards" });

  // balance Associations
  balance.belongsTo(user, { foreignKey: "userId", as: "user" });
  balance.belongsTo(wallet, { foreignKey: "walletId", as: "wallet" });
  balance.belongsTo(token, { foreignKey: "tokenId", as: "token" });

  // transaction Associations
  transaction.belongsTo(user, { foreignKey: "fromuserId", as: "sender" });
  transaction.belongsTo(user, { foreignKey: "touserId", as: "recipient" });
  transaction.belongsTo(wallet, {
    foreignKey: "fromwalletId",
    as: "fromwallet",
  });
  transaction.belongsTo(wallet, { foreignKey: "towalletId", as: "towallet" });
  transaction.belongsTo(token, { foreignKey: "tokenId", as: "token" });

  // KYC Associations
  KYC.belongsTo(user, { foreignKey: "userId", as: "user" });
  KYC.belongsTo(user, { foreignKey: "reviewedBy", as: "reviewer" });

  // virtualCard Associations
  virtualCard.belongsTo(user, { foreignKey: "userId", as: "user" });
  virtualCard.belongsTo(user, { foreignKey: "terminatedBy", as: "terminator" });
  virtualCard.hasMany(cardTransaction, {
    foreignKey: "virtualCardId",
    as: "transactions",
  });

  // cardTransaction Associations
  cardTransaction.belongsTo(virtualCard, {
    foreignKey: "virtualCardId",
    as: "virtualCard",
  });
  cardTransaction.belongsTo(user, { foreignKey: "userId", as: "user" });

  // staking Associations
  staking.belongsTo(user, { foreignKey: "userId", as: "user" });
  staking.belongsTo(token, { foreignKey: "tokenId", as: "token" });
  staking.belongsTo(wallet, { foreignKey: "walletId", as: "wallet" });

  // investment Associations
  investment.belongsTo(user, { foreignKey: "userId", as: "user" });
  investment.belongsTo(token, { foreignKey: "aimtokenId", as: "aimtoken" });

  // reward Associations
  reward.belongsTo(user, { foreignKey: "userId", as: "user" });
  reward.belongsTo(token, { foreignKey: "tokenId", as: "token" });

  // userSession Associations
  userSession.belongsTo(user, { foreignKey: "userId", as: "user" });
  userSession.belongsTo(user, { foreignKey: "revokedBy", as: "revoker" });

  // notification Associations
  notification.belongsTo(user, { foreignKey: "userId", as: "user" });

  // auditLog Associations
  auditLog.belongsTo(user, { foreignKey: "userId", as: "user" });

  return models;
};
