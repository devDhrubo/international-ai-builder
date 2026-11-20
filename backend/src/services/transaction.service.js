const { v4: uuidv4 } = require('uuid');
const store = require('../repositories/store.repository');
const authenticationService = require('./authentication.service');
const accountService = require('./account.service');
const behavioralEventService = require('./behavioral-event.service');
const fraudDetectionService = require('./fraud-detection.service');
const riskDecisionService = require('./risk-decision.service');
const ledgerService = require('./ledger.service');
const alertService = require('./alert.service');
const investigationService = require('./investigation.service');
const auditService = require('./audit.service');
const realtimeGateway = require('../realtime/realtime.gateway');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class TransactionService {
  createInitialStages() {
    const names = [
      'Customer Initiated Transaction',
      'Authentication & Authorization',
      'Transaction Validation',
      'AI Fraud Detection',
      'Risk-Based Decision',
      'Banking Transaction Processing',
      'Transaction Result',
      'Monitoring & Audit',
    ];
    return names.map((name, idx) => ({
      step: idx + 1,
      name,
      status: 'PENDING', // PENDING | IN_PROGRESS | COMPLETED | FAILED | SKIPPED
      timestamp: null,
      durationMs: null,
      result: null,
      error: null,
    }));
  }

  updateStage(txn, step, patch) {
    const stage = txn.stages.find((s) => s.step === step);
    if (stage) {
      Object.assign(stage, patch);
    }
    txn.currentStage = step;
    txn.updatedAt = new Date().toISOString();
    store.saveTransaction(txn);
  }

  async initiateAndProcess(payload) {
    const {
      idempotencyKey,
      senderCustomerId,
      receivingBankId,
      beneficiaryAccountRef,
      amount,
      currency = 'BDT',
      description = 'Inter-bank funds transfer',
      scenarioId = 'normal_banking',
      pin,
      otp,
    } = payload;

    // Idempotency check
    if (idempotencyKey) {
      const existing = store.getByIdempotencyKey(idempotencyKey);
      if (existing) {
        return { duplicate: true, transaction: existing };
      }
    }

    const sender = store.getCustomerById(senderCustomerId);
    const beneficiary = store.getCustomerByAccountRef(beneficiaryAccountRef);
    const senderBank = sender ? store.getBankById(sender.bankId) : null;
    const receiverBank = store.getBankById(receivingBankId);
    const scenario = store.getScenarioById(scenarioId);

    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const txn = {
      transactionId,
      idempotencyKey: idempotencyKey || null,
      senderCustomerId,
      senderName: sender ? sender.customerName : 'Unknown',
      senderAccountRef: sender ? sender.accountRef : 'UNKNOWN',
      senderBankId: sender ? sender.bankId : 'UNKNOWN',
      senderBankName: senderBank ? senderBank.name : 'Unknown Bank',
      beneficiaryCustomerId: beneficiary ? beneficiary.customerId : null,
      beneficiaryName: beneficiary ? beneficiary.customerName : 'Unknown',
      beneficiaryAccountRef,
      receiverBankId: receivingBankId,
      receiverBankName: receiverBank ? receiverBank.name : 'Unknown Bank',
      amount: Number(amount),
      currency,
      description,
      scenarioId: scenario ? scenario.id : 'normal_banking',
      scenarioName: scenario ? scenario.name : 'Normal Banking Activity',
      status: 'PENDING',
      customerResultState: 'Processing',
      customerMessage: 'Transaction submitted and queued for verification.',
      currentStage: 1,
      stages: this.createInitialStages(),
      behavioralSequence: null,
      modelResult: null,
      riskDecision: null,
      ledgerSettlement: null,
      alertId: null,
      caseId: null,
      createdAt: now,
      updatedAt: now,
    };

    store.saveTransaction(txn);
    if (idempotencyKey) {
      store.setIdempotencyKey(idempotencyKey, transactionId);
    }

    // Stage 1: Customer Initiated Transaction
    this.updateStage(txn, 1, {
      status: 'COMPLETED',
      timestamp: now,
      durationMs: 12,
      result: `Submitted by ${txn.senderName} (${txn.senderAccountRef})`,
    });
    auditService.record({
      actor: txn.senderCustomerId,
      role: 'CUSTOMER',
      action: 'TRANSACTION_INITIATED',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      bankId: txn.senderBankId,
      details: { amount: txn.amount, currency: txn.currency, scenarioId: txn.scenarioId },
    });
    realtimeGateway.publish({
      eventType: 'transaction.initiated',
      transaction: txn,
      payload: { stage: 1, status: txn.status },
    });

    // Run async lifecycle so HTTP returns immediately with PENDING transaction,
    // while Socket.IO streams each stage in real time!
    this.executeLifecycle(txn, { pin, otp }).catch((err) => {
      console.error(`Lifecycle error for ${transactionId}:`, err);
    });

    return { duplicate: false, transaction: txn };
  }

  async executeLifecycle(txn, { pin, otp }) {
    try {
      await sleep(300);

      // Stage 2: Authentication & Authorization
      const authStart = Date.now();
      this.updateStage(txn, 2, {
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
      });
      const authResult = authenticationService.verifyCustomerAuth({
        customerId: txn.senderCustomerId,
        pin,
        otp,
      });

      if (!authResult.ok) {
        this.updateStage(txn, 2, {
          status: 'FAILED',
          durationMs: Date.now() - authStart,
          error: authResult.reason,
        });
        txn.status = 'FAILED';
        txn.customerResultState = 'Failed';
        txn.customerMessage = authResult.reason;
        this.updateStage(txn, 7, {
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          error: authResult.reason,
        });
        realtimeGateway.publish({
          eventType: 'transaction.blocked',
          transaction: txn,
          payload: { reason: authResult.reason },
        });
        return;
      }

      this.updateStage(txn, 2, {
        status: 'COMPLETED',
        durationMs: Math.max(25, Date.now() - authStart),
        result: 'Simulated PIN & OTP verified',
      });
      txn.status = 'AUTHENTICATED';
      realtimeGateway.publish({
        eventType: 'transaction.authenticated',
        transaction: txn,
        payload: { method: authResult.method },
      });

      await sleep(300);

      // Stage 3: Transaction Validation
      const valStart = Date.now();
      this.updateStage(txn, 3, {
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
      });
      const validation = accountService.validateTransfer({
        senderCustomerId: txn.senderCustomerId,
        receivingBankId: txn.receiverBankId,
        beneficiaryAccountRef: txn.beneficiaryAccountRef,
        amount: txn.amount,
        currency: txn.currency,
      });

      if (!validation.ok) {
        this.updateStage(txn, 3, {
          status: 'FAILED',
          durationMs: Date.now() - valStart,
          error: validation.reason,
        });
        txn.status = 'FAILED';
        txn.customerResultState = 'Failed';
        txn.customerMessage = validation.reason;
        this.updateStage(txn, 7, {
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          error: validation.reason,
        });
        realtimeGateway.publish({
          eventType: 'transaction.blocked',
          transaction: txn,
          payload: { reason: validation.reason },
        });
        return;
      }

      this.updateStage(txn, 3, {
        status: 'COMPLETED',
        durationMs: Math.max(22, Date.now() - valStart),
        result: `Balance & limit verified (Beneficiary: ${validation.beneficiary.customerName})`,
      });
      txn.status = 'VALIDATED';
      realtimeGateway.publish({
        eventType: 'transaction.validated',
        transaction: txn,
        payload: { beneficiary: validation.beneficiary.accountRef },
      });

      await sleep(300);

      // Stage 4: AI Fraud Detection (Behavioral Event Adapter + Python DistilBERT)
      const aiStart = Date.now();
      txn.status = 'AI_ANALYSIS';
      txn.customerResultState = 'Processing';
      txn.customerMessage = 'Running real-time AI security verification...';
      this.updateStage(txn, 4, {
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
        result: 'Assembling behavioral sequence & calling DistilBERT service',
      });

      const behavioral = behavioralEventService.assembleSequence({
        customerId: txn.senderCustomerId,
        scenarioId: txn.scenarioId,
        currentLifecycleEvents: [
          'API_AUTH_PIN_OTP_PASS',
          'API_BENEFICIARY_ACCOUNT_VALIDATED',
          'API_TRANSFER_PRE_SETTLEMENT_CHECK',
        ],
      });
      txn.behavioralSequence = behavioral;
      store.saveTransaction(txn);

      realtimeGateway.publish({
        eventType: 'transaction.ai.started',
        transaction: txn,
        payload: {
          modelName: 'DistilBERT',
          sequenceLength: behavioral.sequenceTokens.length,
        },
      });

      let modelResult;
      try {
        modelResult = await fraudDetectionService.predict({
          transactionId: txn.transactionId,
          sequence: behavioral.sequenceString,
          metadata: {
            scenarioId: txn.scenarioId,
            senderBankId: txn.senderBankId,
            receiverBankId: txn.receiverBankId,
          },
        });
      } catch (aiErr) {
        // Safe failure handling: NEVER silently approve or fabricate a prediction!
        this.updateStage(txn, 4, {
          status: 'FAILED',
          durationMs: Date.now() - aiStart,
          error: aiErr.message,
        });
        txn.status = 'AI_UNAVAILABLE_HELD';
        txn.customerResultState = 'Additional Verification Required';
        txn.customerMessage =
          'Security verification service is temporarily unavailable. Transfer held safely without debiting your account.';
        this.updateStage(txn, 7, {
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          error: 'AI service unavailable - held safely',
        });
        auditService.record({
          actor: 'SYSTEM_ORCHESTRATOR',
          role: 'SYSTEM',
          action: 'AI_SERVICE_UNAVAILABLE_HOLD',
          entityType: 'TRANSACTION',
          entityId: txn.transactionId,
          bankId: txn.senderBankId,
          details: { error: aiErr.message },
        });
        realtimeGateway.publish({
          eventType: 'transaction.held',
          transaction: txn,
          payload: { reason: aiErr.message },
        });
        return;
      }

      txn.modelResult = modelResult;
      this.updateStage(txn, 4, {
        status: 'COMPLETED',
        durationMs: modelResult.latency_ms || Date.now() - aiStart,
        result: `${modelResult.prediction} (p=${modelResult.fraud_probability})`,
      });
      realtimeGateway.publish({
        eventType: 'transaction.ai.completed',
        transaction: txn,
        payload: modelResult,
      });

      await sleep(300);

      // Stage 5: Risk-Based Decision
      const riskStart = Date.now();
      this.updateStage(txn, 5, {
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
      });
      const riskDecision = riskDecisionService.evaluate({
        fraudProbability: modelResult.fraud_probability,
        modelPrediction: modelResult.prediction,
      });
      txn.riskDecision = riskDecision;
      this.updateStage(txn, 5, {
        status: 'COMPLETED',
        durationMs: Math.max(10, Date.now() - riskStart),
        result: `${riskDecision.riskLevel} -> ${riskDecision.decision}`,
      });
      realtimeGateway.publish({
        eventType: 'transaction.risk.decided',
        transaction: txn,
        payload: riskDecision,
      });

      await sleep(250);

      // Stage 6 & 7: Settlement or Hold/Block
      if (riskDecision.decision === 'APPROVE') {
        const settleStart = Date.now();
        this.updateStage(txn, 6, {
          status: 'IN_PROGRESS',
          timestamp: new Date().toISOString(),
        });
        const settlement = ledgerService.settleAtomic({
          transactionId: txn.transactionId,
          senderCustomerId: txn.senderCustomerId,
          beneficiaryCustomerId: txn.beneficiaryCustomerId,
          amount: txn.amount,
          currency: txn.currency,
        });

        if (!settlement.ok) {
          this.updateStage(txn, 6, {
            status: 'FAILED',
            durationMs: Date.now() - settleStart,
            error: settlement.reason,
          });
          txn.status = 'FAILED';
          txn.customerResultState = 'Failed';
          txn.customerMessage = settlement.reason;
          this.updateStage(txn, 7, {
            status: 'FAILED',
            timestamp: new Date().toISOString(),
            error: settlement.reason,
          });
          realtimeGateway.publish({
            eventType: 'transaction.blocked',
            transaction: txn,
            payload: { reason: settlement.reason },
          });
          return;
        }

        txn.ledgerSettlement = settlement;
        this.updateStage(txn, 6, {
          status: 'COMPLETED',
          durationMs: Math.max(18, Date.now() - settleStart),
          result: `Atomic debit/credit settled (${txn.currency} ${txn.amount.toLocaleString()})`,
        });

        txn.status = 'SETTLED';
        txn.customerResultState = 'Successful';
        txn.customerMessage = `Transfer of ${txn.currency} ${txn.amount.toLocaleString()} to ${txn.beneficiaryName} completed successfully.`;

        this.updateStage(txn, 7, {
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          durationMs: 8,
          result: 'Settled & Confirmed',
        });

        realtimeGateway.publish({
          eventType: 'transaction.settled',
          transaction: txn,
          payload: {
            senderBalanceAfter: settlement.senderBalanceAfter,
            beneficiaryBalanceAfter: settlement.beneficiaryBalanceAfter,
          },
        });
      } else {
        // HOLD or BLOCK before settlement! Balances remain untouched.
        const isBlock = riskDecision.decision === 'BLOCK';
        this.updateStage(txn, 6, {
          status: 'SKIPPED',
          timestamp: new Date().toISOString(),
          durationMs: 0,
          result: 'Settlement prevented by Risk Policy',
        });

        txn.status = isBlock ? 'BLOCKED' : 'HELD';
        txn.customerResultState = isBlock ? 'Rejected' : 'Additional Verification Required';
        txn.customerMessage = isBlock
          ? 'Security Notice: This transfer was blocked by our automated fraud protection system. No funds were debited.'
          : 'Security Notice: Additional verification is required before this transfer can be processed. Your account balance has not been debited.';

        this.updateStage(txn, 7, {
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          durationMs: 10,
          result: isBlock ? 'Blocked prior to settlement' : 'Held for analyst review',
        });

        // Create Fraud Alert & Investigation Case
        const alert = alertService.createAlert({
          transaction: txn,
          modelResult,
          riskDecision,
        });
        txn.alertId = alert.alertId;

        const investigationCase = investigationService.createCase({
          transaction: txn,
          alert,
          riskDecision,
        });
        txn.caseId = investigationCase.caseId;

        realtimeGateway.publish({
          eventType: isBlock ? 'transaction.blocked' : 'transaction.held',
          transaction: txn,
          payload: { riskDecision, alertId: alert.alertId, caseId: investigationCase.caseId },
        });
        realtimeGateway.publish({
          eventType: 'fraud.alert.created',
          transaction: txn,
          payload: alert,
        });
        realtimeGateway.publish({
          eventType: 'case.created',
          transaction: txn,
          payload: investigationCase,
        });
      }

      // Stage 8: Monitoring & Audit
      auditService.record({
        actor: 'TRANSACTION_ORCHESTRATOR',
        role: 'SYSTEM',
        action: `TRANSACTION_${txn.status}`,
        entityType: 'TRANSACTION',
        entityId: txn.transactionId,
        bankId: txn.senderBankId,
        details: {
          prediction: modelResult.prediction,
          fraudProbability: modelResult.fraud_probability,
          decision: riskDecision.decision,
          finalStatus: txn.status,
        },
      });
      this.updateStage(txn, 8, {
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        durationMs: 5,
        result: 'Audit trail & real-time telemetry persisted',
      });
    } catch (err) {
      txn.status = 'FAILED';
      txn.customerResultState = 'Failed';
      txn.customerMessage = 'Unexpected orchestration error occurred.';
      store.saveTransaction(txn);
    }
  }
}

module.exports = new TransactionService();
