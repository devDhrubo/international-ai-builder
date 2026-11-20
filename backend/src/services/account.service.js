const store = require('../repositories/store.repository');

class AccountService {
  validateTransfer({ senderCustomerId, receivingBankId, beneficiaryAccountRef, amount, currency }) {
    const sender = store.getCustomerById(senderCustomerId);
    if (!sender) {
      return { ok: false, reason: 'Sender account not found' };
    }
    if (sender.status !== 'ACTIVE') {
      return { ok: false, reason: `Sender account is ${sender.status}` };
    }

    const receivingBank = store.getBankById(receivingBankId);
    if (!receivingBank) {
      return { ok: false, reason: 'Receiving bank not found' };
    }

    const beneficiary = store.getCustomerByAccountRef(beneficiaryAccountRef);
    if (!beneficiary) {
      return { ok: false, reason: 'Beneficiary account not found in simulation registry' };
    }
    if (beneficiary.bankId !== receivingBankId) {
      return { ok: false, reason: 'Beneficiary account does not belong to the selected receiving bank' };
    }
    if (beneficiary.customerId === sender.customerId) {
      return { ok: false, reason: 'Sender and beneficiary accounts must be different' };
    }
    if (beneficiary.status !== 'ACTIVE') {
      return { ok: false, reason: `Beneficiary account is ${beneficiary.status}` };
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return { ok: false, reason: 'Transfer amount must be greater than zero' };
    }
    if (currency !== 'BDT') {
      return { ok: false, reason: 'Only BDT currency is supported in this simulation' };
    }
    if (numericAmount > sender.dailyLimit) {
      return {
        ok: false,
        reason: `Amount exceeds daily transfer limit of BDT ${sender.dailyLimit.toLocaleString()}`,
      };
    }
    if (numericAmount > sender.balance) {
      return {
        ok: false,
        reason: `Insufficient balance (Available: BDT ${sender.balance.toLocaleString()})`,
      };
    }

    return {
      ok: true,
      sender,
      beneficiary,
      receivingBank,
      amount: numericAmount,
    };
  }
}

module.exports = new AccountService();
