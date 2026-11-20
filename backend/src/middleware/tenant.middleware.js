function extractTenantContext(req, res, next) {
  const role = (req.headers['x-sim-role'] || req.query.role || 'CENTRAL_MONITOR').toUpperCase();
  const bankId = req.headers['x-sim-bank-id'] || req.query.bankId || null;
  const customerId = req.headers['x-sim-customer-id'] || req.query.customerId || null;

  const allowedRoles = ['CUSTOMER', 'BANK', 'CENTRAL_MONITOR', 'CONTROL_PANEL'];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Invalid simulation role' });
  }
  if (role === 'BANK' && !['ABC_BANK', 'XYZ_BANK'].includes(bankId)) {
    return res.status(403).json({ error: 'Bank tenant ID is required for BANK role' });
  }
  if (role === 'CUSTOMER' && !customerId) {
    return res.status(403).json({ error: 'Customer ID is required for CUSTOMER role' });
  }

  req.tenant = { role, bankId, customerId };
  return next();
}

module.exports = { extractTenantContext };
