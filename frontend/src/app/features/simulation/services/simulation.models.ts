export interface SimBank {
  bankId: string;
  name: string;
  shortName: string;
  swiftCode: string;
  country: string;
  accentColor: string;
}

export interface SimCustomer {
  customerId: string;
  customerName: string;
  bankId: string;
  bankName: string;
  accountRef: string;
  balance: number;
  currency: string;
  status: string;
  dailyLimit: number;
  baseBehaviorHistory: string[];
}

export interface SimScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  suggestedAmount: number;
  behavioralEvents: string[];
}

export interface SimTransactionStage {
  step: number;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  timestamp: string | null;
  durationMs: number | null;
  result: string | null;
  error: string | null;
}

export interface SimModelResult {
  transaction_id: string;
  model_name: string;
  model_version: string;
  prediction: 'FRAUD' | 'LEGITIMATE';
  fraud_probability: number;
  legitimate_probability: number;
  calibrated_threshold: number;
  token_count: number;
  max_sequence_length: number;
  sequence_preview: string;
  latency_ms: number;
  timestamp: string;
}

export interface SimRiskDecision {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  decision: 'APPROVE' | 'HOLD' | 'BLOCK';
  recommendedAction: string;
  modelPrediction: string;
  fraudProbability: number;
  thresholdsUsed: {
    lowMaxProbability: number;
    mediumMaxProbability: number;
  };
  evaluatedAt: string;
}

export interface SimTransaction {
  transactionId: string;
  idempotencyKey?: string | null;
  senderCustomerId: string;
  senderName: string;
  senderAccountRef: string;
  senderBankId: string;
  senderBankName: string;
  beneficiaryCustomerId: string | null;
  beneficiaryName: string;
  beneficiaryAccountRef: string;
  receiverBankId: string;
  receiverBankName: string;
  amount: number;
  currency: string;
  description: string;
  scenarioId?: string;
  scenarioName?: string;
  status: string;
  customerResultState:
    | 'Processing'
    | 'Additional Verification Required'
    | 'Successful'
    | 'Rejected'
    | 'Failed';
  customerMessage: string;
  currentStage: number;
  stages: SimTransactionStage[];
  behavioralSequence?: {
    sequenceTokens: string[];
    sequenceString: string;
    priorCount: number;
    scenarioId: string;
    scenarioName: string;
  } | null;
  modelResult?: SimModelResult | null;
  riskDecision?: SimRiskDecision | null;
  ledgerSettlement?: {
    ok: boolean;
    senderBalanceAfter: number;
    beneficiaryBalanceAfter: number;
  } | null;
  alertId?: string | null;
  caseId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimAlert {
  alertId: string;
  transactionId: string;
  senderBankId: string;
  senderBankName: string;
  receiverBankId: string;
  receiverBankName: string;
  amount: number;
  currency: string;
  modelPrediction: string;
  fraudProbability: number;
  riskSeverity: 'HIGH' | 'MEDIUM';
  riskDecision: string;
  createdAt: string;
  investigationStatus: string;
  caseId: string | null;
}

export interface SimCaseNote {
  noteId: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface SimCase {
  caseId: string;
  alertId: string;
  transactionId: string;
  senderBankId: string;
  receiverBankId: string;
  amount: number;
  currency: string;
  severity: string;
  status: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'CLOSED';
  assignedAnalyst: string;
  notes: SimCaseNote[];
  createdAt: string;
  updatedAt: string;
}

export interface SimLedgerEntry {
  entryId: string;
  transactionId: string;
  type: 'DEBIT' | 'CREDIT';
  accountRef: string;
  customerId: string;
  bankId: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
}

export interface SimAuditLog {
  auditId: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  bankId: string | null;
  details: Record<string, unknown>;
}

export interface SimRiskPolicy {
  lowMaxProbability: number;
  mediumMaxProbability: number;
  levels: {
    LOW: { decision: string; action: string };
    MEDIUM: { decision: string; action: string };
    HIGH: { decision: string; action: string };
  };
}

export interface SimOverviewMetrics {
  totalTransactions: number;
  processingCount: number;
  approvedCount: number;
  blockedCount: number;
  underReviewCount: number;
  fraudAlertsCount: number;
  totalVolume: number;
}

export interface SimAiHealth {
  status: string;
  model_loaded: boolean;
  model_name?: string;
  model_version?: string;
  device?: string;
  max_sequence_length?: number;
  calibrated_threshold?: number;
  error?: string;
}

export interface SimBootstrapResponse {
  banks: SimBank[];
  customers: SimCustomer[];
  scenarios: SimScenario[];
  riskPolicy: SimRiskPolicy;
  infoSharingPolicy: {
    shareIncomingAlertsWithReceivingBank: boolean;
    centralMonitorCrossBankAccess: boolean;
  };
  aiHealth: SimAiHealth;
  metrics: SimOverviewMetrics;
  transactions: SimTransaction[];
  alerts: SimAlert[];
  cases: SimCase[];
  ledgerEntries: SimLedgerEntry[];
  auditLogs: SimAuditLog[];
}
