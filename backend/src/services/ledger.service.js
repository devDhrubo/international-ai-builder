const { v4: uuidv4 } = require('uuid');
const store = require('../repositories/store.repository');

class LedgerService {
  /**
   * Executes an atomic simulated debit & credit for an APPROVED transaction.
   * Never settles the same transaction twice and prevents overdrafts.
   */
  settleAtomic({ transactionId, senderCustomerId, beneficiaryCustomerId, amount, currency }) {
    const existingForTxn = store
      .getLedgerEntries()
      .find((entry) => entry.transactionId === transactionId);
    if (existingForTxn) {
      return { ok: false, reason: 'Duplicate settlement prevented: transaction already settled' };
    }

    const sender = store.getCustomerById(senderCustomerId);
    const beneficiary = store.getCustomerById(beneficiaryCustomerId);

    if (!sender || !beneficiary) {
      return { ok: false, reason: 'Ledger accounts not found' };
    }
    if (sender.balance < amount) {
      return { ok: false, reason: 'Insufficient funds during atomic settlement' };
    }

    // Atomic in-memory debit & credit with rollback safety
    const senderPrev = sender.balance;
    const beneficiaryPrev = beneficiary.balance;

    try {
      sender.balance = Number((senderPrev - amount).toFixed(2));
      beneficiary.balance = Number((beneficiaryPrev + amount).toFixed(2));

      const timestamp = new Date().toISOString();
      const debitEntry = store.addLedgerEntry({
        entryId: `LDG-${uuidv4().slice(0, 8).toUpperCase()}`,
        transactionId,
        type: 'DEBIT',
        accountRef: sender.accountRef,
        customerId: sender.customerId,
        bankId: sender.bankId,
        amount,
        currency,
        balanceBefore: senderPrev,
        balanceAfter: sender.balance,
        timestamp,
      });

      const creditEntry = store.addLedgerEntry({
        entryId: `LDG-${uuidv4().slice(0, 8).toUpperCase()}`,
        transactionId,
        type: 'CREDIT',
        accountRef: beneficiary.accountRef,
        customerId: beneficiary.customerId,
        bankId: beneficiary.bankId,
        amount,
        currency,
        balanceBefore: beneficiaryPrev,
        balanceAfter: beneficiary.balance,
        timestamp,
      });

      return {
        ok: true,
        debitEntry,
        creditEntry,
        senderBalanceAfter: sender.balance,
        beneficiaryBalanceAfter: beneficiary.balance,
      };
    } catch (err) {
      // Rollback on unexpected failure
      sender.balance = senderPrev;
      beneficiary.balance = beneficiaryPrev;
      return { ok: false, reason: `Atomic ledger failure: ${err.message}` };
    }
  }
}

module.exports = new LedgerService();
