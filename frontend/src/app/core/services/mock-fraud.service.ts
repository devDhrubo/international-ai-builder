import { Injectable } from '@angular/core';
import { LlmReasonCode, Transaction } from '../models/fraud.models';

@Injectable({ providedIn: 'root' })
export class MockFraudService {
  generateDeterministicReasonCode(txn: Transaction, variantIndex = 0): LlmReasonCode {
    const base = txn.explanation.reasonCode;
    const topShap = txn.explanation.shapContributions[0];
    const secondShap = txn.explanation.shapContributions[1];

    const templates = [
      `${txn.id} (${txn.type}, $${txn.amount.toLocaleString()}) scored ${txn.prediction.riskScore}/100. Primary risk driver is ${topShap?.label ?? 'Transaction Amount'} (${topShap?.value ?? 'elevated'}), compounded by ${secondShap?.label ?? 'Velocity'} from ${txn.location.city}, ${txn.location.country}.`,
      `Automated Silicon-One Fraudshield reasoning for ${txn.id}: Account ${txn.senderAccount} initiated a $${txn.amount.toLocaleString()} ${txn.type.toLowerCase()} to ${txn.receiverName}. Behavioral telemetry indicates ${txn.device.isNewDevice ? 'an unrecognized device fingerprint' : 'atypical session velocity'} (${txn.device.os}, IP ${txn.ipAddress}).`,
      `Risk synthesis [${base.code}]: Ensemble probability ${(txn.prediction.fraudProbability * 100).toFixed(0)}%. Top SHAP contributors (${topShap?.label} ${topShap?.contribution > 0 ? '+' : ''}${topShap?.contribution.toFixed(2)}, ${secondShap?.label} ${secondShap?.contribution > 0 ? '+' : ''}${secondShap?.contribution.toFixed(2)}) support ${txn.prediction.modelDecision} posture.`,
    ];

    return {
      ...base,
      narrative: templates[variantIndex % templates.length],
      generatedAt: new Date().toISOString(),
    };
  }
}
