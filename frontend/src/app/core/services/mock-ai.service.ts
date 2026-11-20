import { Injectable, inject } from '@angular/core';
import { FraudStoreService } from '../state/fraud-store.service';

export interface CopilotResponse {
  answer: string;
  referencedTxnIds: string[];
  followUps: string[];
}

@Injectable({ providedIn: 'root' })
export class MockAiService {
  private readonly store = inject(FraudStoreService);

  generateResponse(prompt: string, selectedTxnId: string): CopilotResponse {
    const q = prompt.toLowerCase();
    const txns = this.store.transactions();
    const cases = this.store.cases();
    const nodes = this.store.graphNodes();

    // Check if a specific TXN-XXXX or SIM-XXXX is mentioned
    const txnMatch = prompt.match(/(TXN-\d+|SIM-\d+)/i);
    const targetId = txnMatch ? txnMatch[1].toUpperCase() : selectedTxnId;
    const txn = txns.find((t) => t.id === targetId) ?? txns[0];

    if (q.includes('why') || q.includes('blocked') || q.includes('explain') || q.includes('risk factor')) {
      const topDrivers = txn.explanation.shapContributions
        .slice(0, 3)
        .map((s) => `• **${s.label}** (${s.value}): SHAP ${s.contribution > 0 ? '+' : ''}${s.contribution.toFixed(2)}`)
        .join('\n');

      return {
        answer: `**Analysis for ${txn.id}** *(Demo Local Dataset)*\n\n**Decision:** ${txn.prediction.modelDecision} (Risk Score: **${txn.prediction.riskScore}/100**, Probability: ${(txn.prediction.fraudProbability * 100).toFixed(0)}%)\n\n**Reason Code:** \`${txn.explanation.reasonCode.code}\` — ${txn.explanation.reasonCode.headline}\n\n**Top Contributing Signals:**\n${topDrivers}\n\n**Summary:** ${txn.explanation.summary}\n\n**Recommended Action:** ${txn.explanation.reasonCode.recommendedAction}`,
        referencedTxnIds: [txn.id],
        followUps: [
          `Show me similar cases to ${txn.id}`,
          `Find suspicious accounts connected to ${txn.id}`,
          `Generate an investigation report for ${txn.id}`,
        ],
      };
    }

    if (q.includes('similar')) {
      const similar = txns
        .filter((t) => t.id !== txn.id && (t.type === txn.type || Math.abs(t.prediction.riskScore - txn.prediction.riskScore) <= 12))
        .slice(0, 4);
      const listStr = similar
        .map((s) => `• **${s.id}** — $${s.amount.toLocaleString()} (${s.type}, ${s.location.city}) | Score: **${s.prediction.riskScore}/100** (${s.status})`)
        .join('\n');

      return {
        answer: `**Similar High-Signal Transactions to ${txn.id}**\n\nFound **${similar.length}** comparable records sharing transaction type (\`${txn.type}\`) or risk band:\n\n${listStr}\n\nNotice: These patterns are derived from the local Silicon-One Fraudshield mock dataset and have not been executed against any external banking system.`,
        referencedTxnIds: [txn.id, ...similar.map((s) => s.id)],
        followUps: ['Summarize this fraud ring', 'Generate an investigation report', `Why was ${similar[0]?.id ?? txn.id} flagged?`],
      };
    }

    if (q.includes('connected') || q.includes('account') || q.includes('ring')) {
      const suspiciousNodes = nodes.filter((n) => n.type === 'suspicious_account' || n.riskScore >= 75).slice(0, 5);
      const nodeStr = suspiciousNodes
        .map((n) => `• **${n.id}** (${n.investigationStatus}) — Risk **${n.riskScore}/100**, ${n.connections} graph edges, cluster \`${n.clusterId}\``)
        .join('\n');

      return {
        answer: `**Connected Entity & Fraud Ring Summary**\n\nGraph topology analysis around **${txn.senderAccount}** and **${txn.receiverAccount}** highlights **${suspiciousNodes.length}** elevated-risk entities:\n\n${nodeStr}\n\n**Topology Insight:** Shared headless/rooted device fingerprints (\`DEV-9921-X\`, \`DEV-4412\`) link multiple mule relay accounts into a coordinated layering ring.`,
        referencedTxnIds: [txn.id, ...suspiciousNodes.flatMap((n) => n.relatedTransactions).slice(0, 3)],
        followUps: ['Generate an investigation report', 'Show me similar cases', 'Explain the risk factors'],
      };
    }

    if (q.includes('report')) {
      const linkedCase = cases.find((c) => c.transactionId === txn.id) ?? cases[0];
      return {
        answer: `**Silicon-One Fraudshield Investigation Brief (Simulated)**\n\n• **Case Reference:** ${linkedCase?.id ?? 'N/A'} (${linkedCase?.status ?? 'New'})\n• **Primary Transaction:** ${txn.id} — $${txn.amount.toLocaleString()} ${txn.type}\n• **Originating Account:** ${txn.senderAccount} (${txn.senderName})\n• **Beneficiary:** ${txn.receiverAccount} (${txn.receiverName})\n• **Geo / Device:** ${txn.location.city}, ${txn.location.country} | ${txn.device.deviceId} (${txn.device.os})\n• **Composite Score:** ${txn.prediction.riskScore}/100 (${txn.prediction.riskLevel.toUpperCase()})\n\n**Executive Finding:** ${txn.explanation.reasonCode.narrative}\n\n**Next Step:** ${txn.explanation.reasonCode.recommendedAction}`,
        referencedTxnIds: [txn.id],
        followUps: ['Find suspicious accounts connected to this transaction', 'Show me similar cases'],
      };
    }

    // Default contextual answer
    const highRiskCount = txns.filter((t) => t.prediction.riskScore >= 70).length;
    return {
      answer: `**Silicon-One Fraudshield Copilot Context**\n\nCurrently monitoring **${txns.length}** active stream transactions (**${highRiskCount}** high/critical risk) and **${cases.length}** investigation cases.\n\nFor selected transaction **${txn.id}** ($${txn.amount.toLocaleString()}, Risk **${txn.prediction.riskScore}/100**): ${txn.explanation.summary}`,
      referencedTxnIds: [txn.id],
      followUps: [`Why was ${txn.id} flagged?`, 'Summarize this fraud ring', 'Generate an investigation report'],
    };
  }
}
