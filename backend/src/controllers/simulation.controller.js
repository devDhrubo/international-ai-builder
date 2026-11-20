const store = require('../repositories/store.repository');
const config = require('../config/simulation.config');
const transactionService = require('../services/transaction.service');
const fraudDetectionService = require('../services/fraud-detection.service');
const riskDecisionService = require('../services/risk-decision.service');
const alertService = require('../services/alert.service');
const investigationService = require('../services/investigation.service');
const auditService = require('../services/audit.service');
const realtimeGateway = require('../realtime/realtime.gateway');

function filterTransactionsForTenant(transactions, tenant) {
  if (tenant.role === 'CENTRAL_MONITOR' || tenant.role === 'CONTROL_PANEL') {
    return transactions;
  }
  if (tenant.role === 'BANK') {
    return transactions.filter(
      (t) => t.senderBankId === tenant.bankId || t.receiverBankId === tenant.bankId
    );
  }
  if (tenant.role === 'CUSTOMER') {
    return transactions
      .filter(
        (t) =>
          t.senderCustomerId === tenant.customerId ||
          (t.beneficiaryCustomerId === tenant.customerId && t.status === 'SETTLED')
      )
      .map((t) => ({
        transactionId: t.transactionId,
        senderCustomerId: t.senderCustomerId,
        senderName: t.senderName,
        senderAccountRef: t.senderAccountRef,
        senderBankId: t.senderBankId,
        senderBankName: t.senderBankName,
        beneficiaryCustomerId: t.beneficiaryCustomerId,
        beneficiaryName: t.beneficiaryName,
        beneficiaryAccountRef: t.beneficiaryAccountRef,
        receiverBankId: t.receiverBankId,
        receiverBankName: t.receiverBankName,
        amount: t.amount,
        currency: t.currency,
        description: t.description,
        status: t.status,
        customerResultState: t.customerResultState,
        customerMessage: t.customerMessage,
        currentStage: t.currentStage,
        stages: t.stages,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
  }
  return [];
}

function computeOverviewMetrics(transactions, alerts) {
  const processingStatuses = ['PENDING', 'AUTHENTICATED', 'VALIDATED', 'AI_ANALYSIS'];
  return {
    totalTransactions: transactions.length,
    processingCount: transactions.filter((t) => processingStatuses.includes(t.status)).length,
    approvedCount: transactions.filter((t) => t.status === 'SETTLED').length,
    blockedCount: transactions.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length,
    underReviewCount: transactions.filter(
      (t) => t.status === 'HELD' || t.status === 'AI_UNAVAILABLE_HELD'
    ).length,
    fraudAlertsCount: alerts.length,
    totalVolume: transactions
      .filter((t) => t.status === 'SETTLED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0),
  };
}

class SimulationController {
  async health(req, res) {
    const aiHealth = await fraudDetectionService.checkHealth();
    res.json({
      backend: 'healthy',
      timestamp: new Date().toISOString(),
      aiService: aiHealth,
    });
  }

  async bootstrap(req, res) {
    const tenant = req.tenant;
    const allTransactions = store.listTransactions();
    const transactions = filterTransactionsForTenant(allTransactions, tenant);

    const alerts =
      tenant.role === 'CUSTOMER'
        ? []
        : alertService.listAlertsForTenant({
            role: tenant.role,
            bankId: tenant.bankId,
          });

    const cases =
      tenant.role === 'CUSTOMER'
        ? []
        : investigationService.listCasesForTenant({
            role: tenant.role,
            bankId: tenant.bankId,
          });

    const ledgerEntries =
      tenant.role === 'CUSTOMER'
        ? store
            .getLedgerEntries()
            .filter((e) => e.customerId === tenant.customerId)
        : tenant.role === 'BANK'
        ? store.getLedgerEntries().filter((e) => e.bankId === tenant.bankId)
        : store.getLedgerEntries();

    const auditLogs =
      tenant.role === 'CUSTOMER'
        ? []
        : auditService.list({
            bankId: tenant.role === 'BANK' ? tenant.bankId : 'CENTRAL_MONITOR',
          });

    // Sanitize customer profiles (never return PIN/OTP to frontend)
    const customers = store.getCustomers().map((c) => ({
      customerId: c.customerId,
      customerName: c.customerName,
      bankId: c.bankId,
      bankName: c.bankName,
      accountRef: c.accountRef,
      balance: c.balance,
      currency: c.currency,
      status: c.status,
      dailyLimit: c.dailyLimit,
      baseBehaviorHistory: c.baseBehaviorHistory,
    }));

    const aiHealth = await fraudDetectionService.checkHealth();

    res.json({
      banks: store.getBanks(),
      customers,
      scenarios: store.getScenarios(),
      riskPolicy: riskDecisionService.getPolicy(),
      infoSharingPolicy: config.infoSharingPolicy,
      aiHealth,
      metrics: computeOverviewMetrics(transactions, alerts),
      transactions,
      alerts,
      cases,
      ledgerEntries,
      auditLogs,
    });
  }

  async createTransaction(req, res) {
    const {
      idempotencyKey,
      senderCustomerId,
      receivingBankId,
      beneficiaryAccountRef,
      amount,
      currency,
      description,
      scenarioId,
      pin,
      otp,
    } = req.body || {};

    if (!senderCustomerId || !receivingBankId || !beneficiaryAccountRef || !amount) {
      return res.status(400).json({
        error: 'senderCustomerId, receivingBankId, beneficiaryAccountRef, and amount are required',
      });
    }

    const result = await transactionService.initiateAndProcess({
      idempotencyKey,
      senderCustomerId,
      receivingBankId,
      beneficiaryAccountRef,
      amount,
      currency: currency || 'BDT',
      description,
      scenarioId: scenarioId || 'normal_banking',
      pin,
      otp,
    });

    return res.status(result.duplicate ? 200 : 202).json(result);
  }

  getTransaction(req, res) {
    const txn = store.getTransaction(req.params.id);
    if (!txn) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const filtered = filterTransactionsForTenant([txn], req.tenant);
    if (filtered.length === 0) {
      return res.status(403).json({ error: 'Access denied for this tenant' });
    }
    return res.json({
      transaction: filtered[0],
      events: store.getEventsForTransaction(txn.transactionId),
    });
  }

  getRiskPolicy(req, res) {
    res.json(riskDecisionService.getPolicy());
  }

  updateCase(req, res) {
    if (req.tenant.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Customers cannot modify investigation cases' });
    }
    const { status, analystNote } = req.body || {};
    const updated = investigationService.updateCaseStatus({
      caseId: req.params.caseId,
      status,
      analystNote,
      actor: req.tenant.bankId || 'CENTRAL_ANALYST',
    });
    if (!updated) {
      return res.status(404).json({ error: 'Investigation case not found' });
    }
    auditService.record({
      actor: req.tenant.bankId || 'CENTRAL_ANALYST',
      role: req.tenant.role,
      action: 'CASE_UPDATED',
      entityType: 'CASE',
      entityId: updated.caseId,
      bankId: req.tenant.bankId || 'CENTRAL_MONITOR',
      details: { status, analystNote },
    });
    return res.json({ case: updated });
  }

  resetSimulation(req, res) {
    const adminKey = req.headers['x-demo-admin-key'];
    if (adminKey !== config.demoAdminKey) {
      return res.status(403).json({ error: 'Valid demonstration administrator key required' });
    }
    store.resetAll();
    if (realtimeGateway.io) {
      realtimeGateway.io.emit('simulation.reset', {
        timestamp: new Date().toISOString(),
      });
    }
    return res.json({ ok: true, message: 'Simulation ledger, transactions, alerts, and cases reset.' });
  }
}

module.exports = new SimulationController();
