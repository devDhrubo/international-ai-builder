const { INITIAL_BANKS, INITIAL_CUSTOMERS, TEST_SCENARIOS } = require('../data/seed');

class StoreRepository {
  constructor() {
    this.resetAll();
  }

  resetAll() {
    this.banks = JSON.parse(JSON.stringify(INITIAL_BANKS));
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.scenarios = JSON.parse(JSON.stringify(TEST_SCENARIOS));
    this.transactions = new Map();
    this.idempotencyIndex = new Map();
    this.ledgerEntries = [];
    this.alerts = [];
    this.cases = [];
    this.auditLogs = [];
    this.events = [];
    this.behavioralHistory = new Map();

    for (const c of this.customers) {
      this.behavioralHistory.set(c.customerId, [...c.baseBehaviorHistory]);
    }
  }

  getBanks() {
    return this.banks;
  }

  getBankById(bankId) {
    return this.banks.find((b) => b.bankId === bankId) || null;
  }

  getCustomers() {
    return this.customers;
  }

  getCustomerById(customerId) {
    return this.customers.find((c) => c.customerId === customerId) || null;
  }

  getCustomerByAccountRef(accountRef) {
    return this.customers.find((c) => c.accountRef === accountRef) || null;
  }

  getScenarios() {
    return this.scenarios;
  }

  getScenarioById(scenarioId) {
    return this.scenarios.find((s) => s.id === scenarioId) || null;
  }

  saveTransaction(txn) {
    this.transactions.set(txn.transactionId, txn);
    return txn;
  }

  getTransaction(transactionId) {
    return this.transactions.get(transactionId) || null;
  }

  listTransactions() {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getByIdempotencyKey(key) {
    const txnId = this.idempotencyIndex.get(key);
    return txnId ? this.getTransaction(txnId) : null;
  }

  setIdempotencyKey(key, txnId) {
    if (key) {
      this.idempotencyIndex.set(key, txnId);
    }
  }

  addLedgerEntry(entry) {
    this.ledgerEntries.unshift(entry);
    return entry;
  }

  getLedgerEntries() {
    return this.ledgerEntries;
  }

  addAlert(alert) {
    this.alerts.unshift(alert);
    return alert;
  }

  getAlerts() {
    return this.alerts;
  }

  addCase(investigationCase) {
    this.cases.unshift(investigationCase);
    return investigationCase;
  }

  getCases() {
    return this.cases;
  }

  updateCase(caseId, patch) {
    const target = this.cases.find((c) => c.caseId === caseId);
    if (!target) return null;
    Object.assign(target, patch);
    return target;
  }

  addAuditLog(log) {
    this.auditLogs.unshift(log);
    return log;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  addEvent(event) {
    this.events.push(event);
    return event;
  }

  getEventsForTransaction(transactionId) {
    return this.events.filter((e) => e.transactionId === transactionId);
  }

  appendBehavioralEvents(customerId, events) {
    const current = this.behavioralHistory.get(customerId) || [];
    const updated = [...current, ...events].slice(-40);
    this.behavioralHistory.set(customerId, updated);
    return updated;
  }

  getBehavioralHistory(customerId) {
    return this.behavioralHistory.get(customerId) || [];
  }
}

module.exports = new StoreRepository();
