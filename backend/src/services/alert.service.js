const { v4: uuidv4 } = require('uuid');
const store = require('../repositories/store.repository');
const config = require('../config/simulation.config');

class AlertService {
  createAlert({ transaction, modelResult, riskDecision }) {
    const severity = riskDecision.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
    const alert = {
      alertId: `ALT-${uuidv4().slice(0, 8).toUpperCase()}`,
      transactionId: transaction.transactionId,
      senderBankId: transaction.senderBankId,
      senderBankName: transaction.senderBankName,
      receiverBankId: transaction.receiverBankId,
      receiverBankName: transaction.receiverBankName,
      amount: transaction.amount,
      currency: transaction.currency,
      modelPrediction: modelResult.prediction,
      fraudProbability: modelResult.fraud_probability,
      riskSeverity: severity,
      riskDecision: riskDecision.decision,
      createdAt: new Date().toISOString(),
      investigationStatus: 'OPEN',
      caseId: null,
    };

    return store.addAlert(alert);
  }

  listAlertsForTenant({ role, bankId }) {
    const all = store.getAlerts();
    if (role === 'CENTRAL_MONITOR' || bankId === 'CENTRAL_MONITOR') {
      return all;
    }
    if (!bankId) return [];

    return all.filter((alert) => {
      if (alert.senderBankId === bankId) return true;
      if (
        config.infoSharingPolicy.shareIncomingAlertsWithReceivingBank &&
        alert.receiverBankId === bankId
      ) {
        return true;
      }
      return false;
    });
  }
}

module.exports = new AlertService();
