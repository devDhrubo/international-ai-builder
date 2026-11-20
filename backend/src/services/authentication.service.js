const store = require('../repositories/store.repository');

class AuthenticationService {
  verifyCustomerAuth({ customerId, pin, otp }) {
    const customer = store.getCustomerById(customerId);
    if (!customer) {
      return { ok: false, reason: 'Synthetic customer profile not found' };
    }
    if (customer.status !== 'ACTIVE') {
      return { ok: false, reason: `Customer account status is ${customer.status}` };
    }
    if (!pin || String(pin) !== customer.simulatedPin) {
      return { ok: false, reason: 'Invalid simulated PIN (use demo PIN 1234)' };
    }
    if (!otp || String(otp) !== customer.simulatedOtp) {
      return { ok: false, reason: 'Invalid simulated OTP (use demo OTP 482910)' };
    }
    return {
      ok: true,
      customer,
      method: 'SIMULATED_PIN_AND_OTP',
      verifiedAt: new Date().toISOString(),
    };
  }
}

module.exports = new AuthenticationService();
