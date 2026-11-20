import {
  ActivityItem,
  Alert,
  ArtifactModelBenchmark,
  EvaluationSample,
  FraudCase,
  GeoCoordinate,
  GraphEdge,
  GraphNode,
  LlmReasonCode,
  RiskExplanation,
  RiskLevel,
  ShapContribution,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../models/fraud.models';

export const DEMO_LOCATIONS: GeoCoordinate[] = [
  { city: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', lat: 23.8103, lng: 90.4125, region: 'South Asia' },
  { city: 'Chittagong', country: 'Bangladesh', countryCode: 'BD', lat: 22.3569, lng: 91.7832, region: 'South Asia' },
  { city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.076, lng: 72.8777, region: 'South Asia' },
  { city: 'Bengaluru', country: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946, region: 'South Asia' },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198, region: 'Southeast Asia' },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278, region: 'Europe' },
  { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.006, region: 'North America' },
  { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lng: -122.4194, region: 'North America' },
  { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708, region: 'Middle East' },
];

export function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function buildExplanationForTransaction(
  id: string,
  amount: number,
  type: TransactionType,
  location: GeoCoordinate,
  riskScore: number,
  isNewDevice: boolean,
  isProxy: boolean,
  velocityMultiplier: number
): RiskExplanation {
  const highRisk = riskScore >= 60;
  const amountContrib = amount > 4000 ? +(0.18 + Math.min(amount / 45000, 0.28)).toFixed(3) : +(amount > 1200 ? 0.08 : -0.11).toFixed(3);
  const freqContrib = velocityMultiplier > 2 ? +(0.15 + Math.min(velocityMultiplier * 0.03, 0.22)).toFixed(3) : -0.09;
  const deviceContrib = isNewDevice || isProxy ? +(isProxy ? 0.24 : 0.16).toFixed(3) : -0.12;
  const locContrib = riskScore >= 70 ? 0.19 : riskScore >= 40 ? 0.07 : -0.14;
  const ageContrib = riskScore >= 65 ? 0.11 : -0.13;

  const dir = (val: number): 'increases_risk' | 'decreases_risk' =>
    val >= 0 ? 'increases_risk' : 'decreases_risk';

  const shapContributions: ShapContribution[] = [
    {
      feature: 'transaction_amount_zscore',
      label: 'Transaction Amount',
      value: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      contribution: amountContrib,
      direction: dir(amountContrib),
    },
    {
      feature: 'velocity_1h_count',
      label: 'Transaction Frequency',
      value: `${velocityMultiplier.toFixed(1)}x baseline`,
      contribution: freqContrib,
      direction: dir(freqContrib),
    },
    {
      feature: 'device_fingerprint_anomaly',
      label: 'Device Anomaly',
      value: isProxy ? 'VPN / Proxy + Unseen Device' : isNewDevice ? 'New Unverified Device' : 'Trusted Device',
      contribution: deviceContrib,
      direction: dir(deviceContrib),
    },
    {
      feature: 'geo_distance_deviation',
      label: 'Location Deviation',
      value: `${location.city}, ${location.countryCode}`,
      contribution: locContrib,
      direction: dir(locContrib),
    },
    {
      feature: 'account_tenure_days',
      label: 'Account Age',
      value: riskScore >= 65 ? '19 days (Thin file)' : '642 days (Established)',
      contribution: ageContrib,
      direction: dir(ageContrib),
    },
  ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const summary = highRisk
    ? `This ${type.toLowerCase()} was flagged because its amount ($${amount.toLocaleString()}) and ${
        isNewDevice ? 'unrecognized device fingerprint' : 'transaction velocity'
      } from ${location.city}, ${location.country} deviate sharply from the account's historical baseline.`
    : `This ${type.toLowerCase()} aligns with established account behavior, originating from a trusted device in ${location.city}, ${location.country} within normal spending limits.`;

  const evidenceSummary: string[] = [];
  if (amountContrib > 0) {
    evidenceSummary.push(`Transaction amount ($${amount.toLocaleString()}) exceeds 90-day account median.`);
  } else {
    evidenceSummary.push(`Transaction amount ($${amount.toLocaleString()}) falls within expected account range.`);
  }
  if (isNewDevice || isProxy) {
    evidenceSummary.push(
      isProxy
        ? 'Session routed through anonymized proxy/VPN with unseen browser fingerprint.'
        : 'First-time device fingerprint observed without prior MFA enrollment.'
    );
  } else {
    evidenceSummary.push('Device fingerprint matches previously verified customer sessions.');
  }
  if (velocityMultiplier > 2) {
    evidenceSummary.push(`Rapid burst velocity detected (${velocityMultiplier.toFixed(1)}x normal hourly frequency).`);
  }

  const code =
    riskScore >= 80
      ? 'RC-CRIT-409'
      : riskScore >= 60
        ? 'RC-HIGH-302'
        : riskScore >= 30
          ? 'RC-MED-204'
          : 'RC-LOW-101';

  const reasonCode: LlmReasonCode = {
    code,
    headline:
      riskScore >= 80
        ? 'Critical Multi-Signal Anomaly: Velocity + Device + Amount Outlier'
        : riskScore >= 60
          ? 'Elevated Cross-Border / Behavioral Deviation'
          : riskScore >= 30
            ? 'Moderate Velocity Variance — Soft Review'
            : 'Verified Low-Risk Baseline Transaction',
    narrative: `${summary} Composite ensemble probability is ${(riskScore / 100).toFixed(2)} (${type} via ${location.city}).`,
    riskIndicators: evidenceSummary,
    recommendedAction:
      riskScore >= 80
        ? 'Block transaction immediately, freeze outbound transfers, and escalate to Tier-2 Fraud Ops.'
        : riskScore >= 60
          ? 'Place temporary hold and trigger step-up biometric / OTP verification.'
          : riskScore >= 30
            ? 'Allow with passive monitoring and log device telemetry.'
            : 'Auto-approve transaction.',
    confidence: Math.min(98, Math.max(76, Math.round(74 + Math.abs(riskScore - 45) * 0.42))),
    generatedAt: new Date().toISOString(),
  };

  return {
    transactionId: id,
    summary,
    evidenceSummary,
    shapContributions,
    reasonCode,
    isMockExplanation: true,
  };
}

const SENDERS = [
  { acc: 'ACC-90412', name: 'Aarav Mehta' },
  { acc: 'ACC-77318', name: 'Nadia Rahman' },
  { acc: 'ACC-55109', name: 'Liam Chen' },
  { acc: 'ACC-33821', name: 'Sofia Al-Mansoor' },
  { acc: 'ACC-61904', name: 'Ethan Brooks' },
  { acc: 'ACC-84210', name: 'Priya Nair' },
  { acc: 'ACC-41029', name: 'Tariq Mahmud' },
  { acc: 'ACC-29514', name: 'Elena Rostova' },
  { acc: 'ACC-11840', name: 'Marcus Vance' },
  { acc: 'ACC-66291', name: 'Zara Chowdhury' },
];

const RECEIVERS = [
  { acc: 'MER-4410', name: 'Apex Digital Exchange', cat: 'Crypto & Digital Assets' },
  { acc: 'ACC-88120', name: 'Vanguard Offshore Ltd', cat: 'Cross-Border Wire' },
  { acc: 'MER-2209', name: 'LuxeGlobal Retail', cat: 'Luxury E-Commerce' },
  { acc: 'ACC-71044', name: 'K. Takahashi', cat: 'P2P Settlement' },
  { acc: 'MER-8931', name: 'CloudScale Hosting', cat: 'SaaS / Infrastructure' },
  { acc: 'ACC-99301', name: 'Mule Relay Pool #4', cat: 'Unverified Beneficiary' },
  { acc: 'MER-1042', name: 'SwiftPay Remit', cat: 'Remittance Corridor' },
  { acc: 'MER-5580', name: 'AeroJet Charters', cat: 'Travel & Aviation' },
];

const TYPES: TransactionType[] = [
  'Wire Transfer',
  'Card Payment',
  'ACH Transfer',
  'Crypto Swap',
  'P2P Transfer',
  'International Remittance',
];

export function createInitialTransactions(): Transaction[] {
  const now = Date.now();
  const list: Transaction[] = [];

  // Anchor famous TXN-4821 for Copilot & Demo
  const loc4821 = DEMO_LOCATIONS[8]; // Dubai
  const dest4821 = DEMO_LOCATIONS[0]; // Dhaka
  list.push({
    id: 'TXN-4821',
    senderAccount: 'ACC-77318',
    senderName: 'Nadia Rahman',
    receiverAccount: 'ACC-99301',
    receiverName: 'Mule Relay Pool #4',
    merchantName: 'Vanguard Offshore Ltd',
    merchantCategory: 'Cross-Border Wire',
    amount: 18450.0,
    currency: 'USD',
    type: 'Wire Transfer',
    location: loc4821,
    destinationLocation: dest4821,
    device: {
      deviceId: 'DEV-9921-X',
      os: 'Linux x86_64',
      browser: 'Headless Chrome 129',
      fingerprintHash: 'fp_9f82c1a04e',
      isNewDevice: true,
      isEmulatorOrProxy: true,
    },
    ipAddress: '185.220.101.44',
    timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
    prediction: {
      fraudProbability: 0.94,
      riskScore: 94,
      riskLevel: 'critical',
      modelDecision: 'BLOCK',
      latencyMs: 14,
      modelVersion: 'FraudShield-Ensemble v3.4',
    },
    status: 'blocked',
    explanation: buildExplanationForTransaction('TXN-4821', 18450, 'Wire Transfer', loc4821, 94, true, true, 5.4),
  });

  const presetScores = [
    88, 12, 74, 19, 91, 45, 22, 67, 8, 83,
    15, 52, 95, 11, 64, 28, 79, 14, 38, 86,
    9, 41, 72, 18, 89, 25, 61, 13, 49, 82,
    16, 33, 76, 21, 92, 10, 58, 69, 17, 44,
    85, 27, 63, 14,
  ];

  for (let i = 0; i < presetScores.length; i++) {
    const score = presetScores[i];
    const id = `TXN-${4820 - i}`;
    const sender = SENDERS[i % SENDERS.length];
    const receiver = RECEIVERS[(i * 3) % RECEIVERS.length];
    const loc = DEMO_LOCATIONS[i % DEMO_LOCATIONS.length];
    const dest = DEMO_LOCATIONS[(i + 3) % DEMO_LOCATIONS.length];
    const type = TYPES[i % TYPES.length];
    const amount =
      score >= 80
        ? Math.round(6200 + ((i * 1739) % 19000))
        : score >= 60
          ? Math.round(1800 + ((i * 871) % 6500))
          : score >= 30
            ? Math.round(380 + ((i * 419) % 1400))
            : Math.round(28 + ((i * 197) % 450));

    const isNewDevice = score >= 60;
    const isProxy = score >= 82;
    const velocity = score >= 80 ? 4.2 + (i % 3) : score >= 60 ? 2.5 : 1.1;
    const riskLevel = classifyRiskLevel(score);
    const status: TransactionStatus =
      score >= 82 ? 'blocked' : score >= 60 ? 'flagged' : score >= 45 ? 'under_review' : 'approved';

    list.push({
      id,
      senderAccount: sender.acc,
      senderName: sender.name,
      receiverAccount: receiver.acc,
      receiverName: receiver.name,
      merchantName: receiver.acc.startsWith('MER') ? receiver.name : undefined,
      merchantCategory: receiver.cat,
      amount,
      currency: 'USD',
      type,
      location: loc,
      destinationLocation: dest,
      device: {
        deviceId: `DEV-${1000 + ((i * 37) % 8999)}`,
        os: isProxy ? 'Android 14 (Rooted)' : i % 2 === 0 ? 'macOS 15.1' : 'iOS 18.2',
        browser: isProxy ? 'Tor Browser' : i % 2 === 0 ? 'Chrome 131' : 'Safari 18',
        fingerprintHash: `fp_${(100000 + i * 7919).toString(16)}`,
        isNewDevice,
        isEmulatorOrProxy: isProxy,
      },
      ipAddress: `${103 + (i % 90)}.${24 + (i % 180)}.${10 + (i % 200)}.${12 + (i % 220)}`,
      timestamp: new Date(now - (i + 3) * 4 * 60 * 1000).toISOString(),
      prediction: {
        fraudProbability: Number((score / 100).toFixed(2)),
        riskScore: score,
        riskLevel,
        modelDecision: score >= 80 ? 'BLOCK' : score >= 60 ? 'REVIEW' : 'APPROVE',
        latencyMs: 9 + (i % 18),
        modelVersion: 'FraudShield-Ensemble v3.4',
      },
      status,
      explanation: buildExplanationForTransaction(id, amount, type, loc, score, isNewDevice, isProxy, velocity),
    });
  }

  return list;
}

export function createInitialAlerts(txns: Transaction[]): Alert[] {
  const criticalTxns = txns.filter((t) => t.prediction.riskScore >= 80).slice(0, 5);
  const alerts: Alert[] = criticalTxns.map((t, idx) => ({
    id: `ALT-${901 + idx}`,
    title: idx === 0 ? `Critical Block: ${t.id} ($${t.amount.toLocaleString()})` : `High-Risk ${t.type} Flagged (${t.id})`,
    description: `${t.senderName} (${t.senderAccount}) -> ${t.receiverName} in ${t.location.city}, ${t.location.countryCode}. Score ${t.prediction.riskScore}/100.`,
    severity: t.prediction.riskScore >= 85 ? 'critical' : 'high',
    category: idx === 1 ? 'impossible_travel' : idx === 2 ? 'account_cluster' : 'high_risk_txn',
    transactionId: t.id,
    accountId: t.senderAccount,
    timestamp: t.timestamp,
    acknowledged: idx > 2,
  }));

  alerts.splice(1, 0, {
    id: 'ALT-900',
    title: 'Impossible Travel Velocity: ACC-77318',
    description: 'Session authenticated in Dhaka (BD) and attempted $18,450 wire from Dubai (AE) within 14 minutes.',
    severity: 'critical',
    category: 'impossible_travel',
    transactionId: 'TXN-4821',
    accountId: 'ACC-77318',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    acknowledged: false,
  });

  return alerts;
}

export function createInitialCases(txns: Transaction[]): FraudCase[] {
  const highRisk = txns.filter((t) => t.prediction.riskScore >= 65).slice(0, 10);
  const statuses: FraudCase['status'][] = [
    'New',
    'Under Investigation',
    'Escalated',
    'New',
    'Under Investigation',
    'Resolved',
    'False Positive',
    'Escalated',
    'New',
    'Resolved',
  ];
  const analysts = ['Maya Lin', 'Tariq Hassan', 'Elena Vance', 'Devon Patel'];

  return highRisk.map((t, idx) => {
    const status = statuses[idx % statuses.length];
    return {
      id: `CASE-${2041 + idx}`,
      transactionId: t.id,
      accountId: t.senderAccount,
      accountName: t.senderName,
      amount: t.amount,
      riskScore: t.prediction.riskScore,
      priority: t.prediction.riskScore >= 85 ? 'Critical' : t.prediction.riskScore >= 70 ? 'High' : 'Medium',
      assignedAnalyst: analysts[idx % analysts.length],
      status,
      createdAt: t.timestamp,
      updatedAt: t.timestamp,
      summary: t.explanation.summary,
      associatedTransactionIds: [t.id, txns[(idx + 4) % txns.length].id],
      connectedNodeIds: [t.senderAccount, t.receiverAccount, t.device.deviceId],
      notes: [
        {
          id: `NOTE-${idx}-1`,
          author: analysts[idx % analysts.length],
          content: `Initial triage: ${t.explanation.reasonCode.headline}. Reviewing device fingerprint ${t.device.fingerprintHash}.`,
          timestamp: t.timestamp,
        },
      ],
      timeline: [
        {
          id: `TL-${idx}-1`,
          title: 'Case Auto-Created by Silicon-One Fraudshield Engine',
          detail: `Triggered by ${t.id} exceeding risk threshold (${t.prediction.riskScore}/100).`,
          timestamp: t.timestamp,
          actor: 'Silicon-One Fraudshield AI',
        },
      ],
      decisions: [],
    };
  });
}

export function createInitialGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    // Cluster 1: Mule Account Network (Red Ring)
    { id: 'ACC-77318', label: 'ACC-77318\n(Nadia R.)', type: 'suspicious_account', riskScore: 94, clusterId: 'mule_ring', connections: 4, investigationStatus: 'Flagged', relatedTransactions: ['TXN-4821'], associatedDevices: ['DEV-9921-X'] },
    { id: 'ACC-99301', label: 'ACC-99301\n(Mule Pool #4)', type: 'suspicious_account', riskScore: 96, clusterId: 'mule_ring', connections: 5, investigationStatus: 'Investigating', relatedTransactions: ['TXN-4821', 'TXN-4816'], associatedDevices: ['DEV-9921-X', 'DEV-4412'] },
    { id: 'ACC-88120', label: 'ACC-88120\n(Offshore)', type: 'suspicious_account', riskScore: 89, clusterId: 'mule_ring', connections: 3, investigationStatus: 'Flagged', relatedTransactions: ['TXN-4819'], associatedDevices: ['DEV-4412'] },
    { id: 'ACC-55201', label: 'ACC-55201\n(Relay B)', type: 'suspicious_account', riskScore: 84, clusterId: 'mule_ring', connections: 3, investigationStatus: 'Monitoring', relatedTransactions: ['TXN-4812'], associatedDevices: ['DEV-9921-X'] },
    { id: 'DEV-9921-X', label: 'DEV-9921-X\n(Headless)', type: 'device', riskScore: 92, clusterId: 'mule_ring', connections: 3, investigationStatus: 'Flagged', relatedTransactions: ['TXN-4821'], associatedDevices: [] },

    // Cluster 2: Shared Device Cluster
    { id: 'DEV-4412', label: 'DEV-4412\n(Rooted Android)', type: 'device', riskScore: 87, clusterId: 'shared_device', connections: 4, investigationStatus: 'Flagged', relatedTransactions: ['TXN-4815'], associatedDevices: [] },
    { id: 'ACC-41029', label: 'ACC-41029\n(Tariq M.)', type: 'suspicious_account', riskScore: 78, clusterId: 'shared_device', connections: 2, investigationStatus: 'Investigating', relatedTransactions: ['TXN-4811'], associatedDevices: ['DEV-4412'] },
    { id: 'ACC-29514', label: 'ACC-29514\n(Elena R.)', type: 'suspicious_account', riskScore: 81, clusterId: 'shared_device', connections: 2, investigationStatus: 'Investigating', relatedTransactions: ['TXN-4808'], associatedDevices: ['DEV-4412'] },

    // Cluster 3: Merchant Hub
    { id: 'MER-4410', label: 'Apex Digital\nExchange', type: 'merchant', riskScore: 76, clusterId: 'merchant_hub', connections: 4, investigationStatus: 'Monitoring', relatedTransactions: ['TXN-4814', 'TXN-4805'], associatedDevices: [] },
    { id: 'ACC-90412', label: 'ACC-90412\n(Aarav M.)', type: 'normal_account', riskScore: 22, clusterId: 'merchant_hub', connections: 2, investigationStatus: 'Clear', relatedTransactions: ['TXN-4818'], associatedDevices: ['DEV-1037'] },
    { id: 'ACC-55109', label: 'ACC-55109\n(Liam C.)', type: 'normal_account', riskScore: 18, clusterId: 'merchant_hub', connections: 2, investigationStatus: 'Clear', relatedTransactions: ['TXN-4817'], associatedDevices: ['DEV-1074'] },
    { id: 'DEV-1037', label: 'DEV-1037\n(macOS)', type: 'device', riskScore: 14, clusterId: 'merchant_hub', connections: 1, investigationStatus: 'Clear', relatedTransactions: ['TXN-4818'], associatedDevices: [] },

    // Cluster 4: Transfer Chain
    { id: 'ACC-61904', label: 'ACC-61904\n(Ethan B.)', type: 'normal_account', riskScore: 29, clusterId: 'transfer_chain', connections: 2, investigationStatus: 'Clear', relatedTransactions: ['TXN-4813'], associatedDevices: [] },
    { id: 'MER-2209', label: 'LuxeGlobal\nRetail', type: 'merchant', riskScore: 34, clusterId: 'transfer_chain', connections: 2, investigationStatus: 'Clear', relatedTransactions: ['TXN-4810'], associatedDevices: [] },
  ];

  const edges: GraphEdge[] = [
    { id: 'E-1', source: 'ACC-77318', target: 'ACC-99301', type: 'TRANSFERRED_TO', amount: 18450, suspicious: true, clusterId: 'mule_ring' },
    { id: 'E-2', source: 'ACC-99301', target: 'ACC-88120', type: 'TRANSFERRED_TO', amount: 14200, suspicious: true, clusterId: 'mule_ring' },
    { id: 'E-3', source: 'ACC-99301', target: 'ACC-55201', type: 'TRANSFERRED_TO', amount: 4100, suspicious: true, clusterId: 'mule_ring' },
    { id: 'E-4', source: 'ACC-55201', target: 'ACC-88120', type: 'TRANSFERRED_TO', amount: 3950, suspicious: true, clusterId: 'mule_ring' },
    { id: 'E-5', source: 'ACC-77318', target: 'DEV-9921-X', type: 'USED_DEVICE', suspicious: true, clusterId: 'mule_ring' },
    { id: 'E-6', source: 'ACC-99301', target: 'DEV-9921-X', type: 'USED_DEVICE', suspicious: true, clusterId: 'mule_ring' },
    { id: 'E-7', source: 'ACC-55201', target: 'DEV-9921-X', type: 'USED_DEVICE', suspicious: true, clusterId: 'mule_ring' },

    { id: 'E-8', source: 'ACC-41029', target: 'DEV-4412', type: 'USED_DEVICE', suspicious: true, clusterId: 'shared_device' },
    { id: 'E-9', source: 'ACC-29514', target: 'DEV-4412', type: 'USED_DEVICE', suspicious: true, clusterId: 'shared_device' },
    { id: 'E-10', source: 'ACC-88120', target: 'DEV-4412', type: 'USED_DEVICE', suspicious: true, clusterId: 'shared_device' },
    { id: 'E-11', source: 'ACC-41029', target: 'ACC-29514', type: 'CONNECTED_TO', suspicious: true, clusterId: 'shared_device' },

    { id: 'E-12', source: 'ACC-99301', target: 'MER-4410', type: 'PAID_MERCHANT', amount: 7200, suspicious: true, clusterId: 'merchant_hub' },
    { id: 'E-13', source: 'ACC-90412', target: 'MER-4410', type: 'PAID_MERCHANT', amount: 320, suspicious: false, clusterId: 'merchant_hub' },
    { id: 'E-14', source: 'ACC-55109', target: 'MER-4410', type: 'PAID_MERCHANT', amount: 185, suspicious: false, clusterId: 'merchant_hub' },
    { id: 'E-15', source: 'ACC-90412', target: 'DEV-1037', type: 'USED_DEVICE', suspicious: false, clusterId: 'merchant_hub' },

    { id: 'E-16', source: 'ACC-61904', target: 'MER-2209', type: 'PAID_MERCHANT', amount: 440, suspicious: false, clusterId: 'transfer_chain' },
    { id: 'E-17', source: 'ACC-55109', target: 'ACC-61904', type: 'TRANSFERRED_TO', amount: 210, suspicious: false, clusterId: 'transfer_chain' },
  ];

  return { nodes, edges };
}

export function createInitialActivities(): ActivityItem[] {
  const now = Date.now();
  return [
    {
      id: 'ACT-1',
      type: 'decision',
      title: 'Blocked TXN-4821 ($18,450)',
      detail: 'Auto-blocked by Silicon-One Fraudshield Ensemble v3.4; escalated to CASE-2041.',
      actor: 'Silicon-One Fraudshield Engine',
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'ACT-2',
      type: 'investigation',
      title: 'Graph Cluster Flagged: Mule Ring #4',
      detail: '3 accounts sharing headless fingerprint DEV-9921-X identified.',
      actor: 'Maya Lin',
      timestamp: new Date(now - 14 * 60 * 1000).toISOString(),
    },
    {
      id: 'ACT-3',
      type: 'system',
      title: 'Threshold Policy Synced (65/100)',
      detail: 'Active production threshold calibrated for 2.4% target FPR.',
      actor: 'System Policy',
      timestamp: new Date(now - 38 * 60 * 1000).toISOString(),
    },
  ];
}

// Deterministic 120-sample held-out evaluation dataset for Threshold Tuner
export const HELD_OUT_EVALUATION_DATASET: EvaluationSample[] = Array.from({ length: 120 }, (_, i) => {
  // 28 actual fraud cases, 92 legitimate cases with realistic overlapping probability distributions
  const actualFraud = i < 28;
  let prob: number;
  if (actualFraud) {
    // Fraud probabilities mostly 0.45..0.98 with a few hard cases around 0.25..0.44
    const base = 0.42 + ((i * 19) % 56) / 100;
    prob = i % 7 === 0 ? 0.28 + (i % 15) / 100 : Math.min(0.98, base);
  } else {
    // Legitimate probabilities mostly 0.02..0.48 with a few borderline cases up to 0.74
    const j = i - 28;
    const base = 0.03 + ((j * 13) % 44) / 100;
    prob = j % 11 === 0 ? 0.52 + (j % 22) / 100 : base;
  }
  return {
    id: `EVAL-${1001 + i}`,
    actualFraud,
    probability: Number(prob.toFixed(2)),
    amount: actualFraud ? 1400 + (i * 310) % 14000 : 45 + (i * 95) % 1200,
  };
});

// Pretrained artifact metrics imported from fraud_artifacts/metrics.json
export const ARTIFACT_MODEL_BENCHMARKS: ArtifactModelBenchmark[] = [
  { group: 'User Behavioral / Hybrid Models', name: 'RFM + NLP Hybrid (Random Forest)', f1: 0.9414, rocAuc: 0.9226 },
  { group: 'User Behavioral / Hybrid Models', name: 'NLP Only Classifier', f1: 0.9396, rocAuc: 0.9145 },
  { group: 'User Behavioral / Hybrid Models', name: 'RFM Only Behavioral Model', f1: 0.9186, rocAuc: 0.8850 },
  { group: 'Text / Sequence Models', name: 'GRU Sequence Model', threshold: 0.5534, f1: 0.2612, rocAuc: 0.6486, f05: 0.2239, f2: 0.3134 },
  { group: 'Text / Sequence Models', name: 'Logistic Regression', threshold: 0.5128, f1: 0.2318, rocAuc: 0.6007, f05: 0.2214, f2: 0.2432 },
  { group: 'Text / Sequence Models', name: 'Support Vector Machine (SVM)', threshold: 0.1477, f1: 0.2305, rocAuc: 0.6003, f05: 0.2722, f2: 0.1999 },
  { group: 'Text / Sequence Models', name: 'Random Forest (Text)', threshold: 0.07, f1: 0.2108, rocAuc: 0.5915, f05: 0.1445, f2: 0.3894 },
  { group: 'Text / Sequence Models', name: 'LSTM Sequence Model', threshold: 0.5809, f1: 0.1784, rocAuc: 0.5712, f05: 0.2960, f2: 0.1277 },
  { group: 'Text / Sequence Models', name: 'DistilBERT Transformer', threshold: 0.4376, f1: 0.1751, rocAuc: 0.5418, f05: 0.2819, f2: 0.1270 },
];
