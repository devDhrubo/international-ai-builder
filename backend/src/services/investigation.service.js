const { v4: uuidv4 } = require('uuid');
const store = require('../repositories/store.repository');
const config = require('../config/simulation.config');

class InvestigationService {
  createCase({ transaction, alert, riskDecision }) {
    const investigationCase = {
      caseId: `CASE-${uuidv4().slice(0, 8).toUpperCase()}`,
      alertId: alert.alertId,
      transactionId: transaction.transactionId,
      senderBankId: transaction.senderBankId,
      receiverBankId: transaction.receiverBankId,
      amount: transaction.amount,
      currency: transaction.currency,
      severity: riskDecision.riskLevel,
      status: 'OPEN',
      assignedAnalyst: 'Auto-Triage Queue',
      notes: [
        {
          noteId: `NOTE-${uuidv4().slice(0, 6).toUpperCase()}`,
          author: 'Risk Decision Engine',
          text: `Case opened automatically: ${riskDecision.decision} (${riskDecision.riskLevel} risk).`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    alert.caseId = investigationCase.caseId;
    return store.addCase(investigationCase);
  }

  listCasesForTenant({ role, bankId }) {
    const all = store.getCases();
    if (role === 'CENTRAL_MONITOR' || bankId === 'CENTRAL_MONITOR') {
      return all;
    }
    if (!bankId) return [];

    return all.filter((c) => {
      if (c.senderBankId === bankId) return true;
      if (
        config.infoSharingPolicy.shareIncomingAlertsWithReceivingBank &&
        c.receiverBankId === bankId
      ) {
        return true;
      }
      return false;
    });
  }

  updateCaseStatus({ caseId, status, analystNote, actor }) {
    const existing = store.getCases().find((c) => c.caseId === caseId);
    if (!existing) return null;

    if (status) {
      existing.status = status;
    }
    if (analystNote) {
      existing.notes.push({
        noteId: `NOTE-${uuidv4().slice(0, 6).toUpperCase()}`,
        author: actor || 'Bank Fraud Analyst',
        text: analystNote,
        timestamp: new Date().toISOString(),
      });
    }
    existing.updatedAt = new Date().toISOString();

    const linkedAlert = store.getAlerts().find((a) => a.caseId === caseId);
    if (linkedAlert && status) {
      linkedAlert.investigationStatus = status;
    }

    return existing;
  }
}

module.exports = new InvestigationService();
