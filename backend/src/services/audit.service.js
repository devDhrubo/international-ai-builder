const { v4: uuidv4 } = require('uuid');
const store = require('../repositories/store.repository');

class AuditService {
  record({ actor, role, action, entityType, entityId, details = {}, bankId = null }) {
    const entry = {
      auditId: `AUD-${uuidv4().slice(0, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      entityType,
      entityId,
      bankId,
      details,
    };
    return store.addAuditLog(entry);
  }

  list({ bankId = null } = {}) {
    const logs = store.getAuditLogs();
    if (!bankId || bankId === 'CENTRAL_MONITOR') {
      return logs;
    }
    return logs.filter((l) => l.bankId === bankId);
  }
}

module.exports = new AuditService();
