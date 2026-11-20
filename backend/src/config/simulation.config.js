module.exports = {
  port: Number(process.env.PORT || 4000),
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 12000),
  riskPolicy: {
    lowMaxProbability: 0.437568,
    mediumMaxProbability: 0.65,
    levels: {
      LOW: {
        decision: 'APPROVE',
        action: 'Continue to simulated settlement',
      },
      MEDIUM: {
        decision: 'HOLD',
        action: 'Additional verification / Hold for analyst review',
      },
      HIGH: {
        decision: 'BLOCK',
        action: 'Block before settlement, generate fraud alert & investigation case',
      },
    },
  },
  infoSharingPolicy: {
    shareIncomingAlertsWithReceivingBank: true,
    centralMonitorCrossBankAccess: true,
  },
  demoAdminKey: process.env.DEMO_ADMIN_KEY || 'FS-DEMO-ADMIN-2026',
};
