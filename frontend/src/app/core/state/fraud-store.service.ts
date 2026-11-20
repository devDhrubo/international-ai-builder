import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ActivityItem,
  Alert,
  AppNotification,
  CaseStatus,
  FraudCase,
  GraphEdge,
  GraphNode,
  ToastMessage,
  Transaction,
  TransactionStatus,
} from '../models/fraud.models';
import {
  createInitialActivities,
  createInitialAlerts,
  createInitialCases,
  createInitialGraphData,
  createInitialTransactions,
} from '../data/mock-seed.data';

@Injectable({ providedIn: 'root' })
export class FraudStoreService {
  private readonly initialTxns = createInitialTransactions();
  private readonly initialGraph = createInitialGraphData();

  // Primary reactive signals
  readonly transactions = signal<Transaction[]>(this.initialTxns);
  readonly alerts = signal<Alert[]>(createInitialAlerts(this.initialTxns));
  readonly cases = signal<FraudCase[]>(createInitialCases(this.initialTxns));
  readonly graphNodes = signal<GraphNode[]>(this.initialGraph.nodes);
  readonly graphEdges = signal<GraphEdge[]>(this.initialGraph.edges);
  readonly activities = signal<ActivityItem[]>(createInitialActivities());

  // RxJS streams for subscribers that prefer observables
  readonly transactions$ = new BehaviorSubject<Transaction[]>(this.initialTxns);

  // Global UI & drawer state
  readonly drawerTransactionId = signal<string | null>(null);
  readonly selectedExplainTransactionId = signal<string>('TXN-4821');
  readonly globalSearchQuery = signal<string>('');
  readonly dateRange = signal<'24h' | '7d' | '30d'>('24h');
  readonly activeThreshold = signal<number>(65);
  readonly liveTps = signal<number>(42.8);
  readonly streamPaused = signal<boolean>(false);
  readonly streamSpeed = signal<0.5 | 1 | 2 | 5>(1);

  // Settings preferences
  readonly settings = signal({
    analystName: 'Maya Lin',
    analystRole: 'Lead Fraud Intelligence Analyst',
    analystEmail: 'maya.lin@fraudshield.ai',
    compactMode: false,
    highContrastGlow: true,
    soundAlerts: false,
    autoBlockThreshold: 82,
    reviewThreshold: 60,
    emailAlerts: true,
    slackWebhookAlerts: true,
  });

  // Notifications & Toasts
  readonly notifications = signal<AppNotification[]>([
    {
      id: 'N-1',
      title: 'Critical Wire Blocked (TXN-4821)',
      message: '$18,450 wire to Mule Relay Pool #4 auto-blocked (Score: 94).',
      severity: 'critical',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      read: false,
      route: '/app/monitoring',
    },
    {
      id: 'N-2',
      title: 'Impossible Travel Alert',
      message: 'ACC-77318 switched from Dhaka (BD) to Dubai (AE) in 14m.',
      severity: 'warning',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      read: false,
      route: '/app/geo-intelligence',
    },
    {
      id: 'N-3',
      title: 'Mule Cluster Detected',
      message: '3 accounts linked to headless fingerprint DEV-9921-X.',
      severity: 'info',
      timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      read: true,
      route: '/app/fraud-network',
    },
  ]);

  readonly toasts = signal<ToastMessage[]>([]);

  // Derived KPI metrics computed from the live transaction store + historical baseline
  readonly baselineTotalOffset = 128447; // +45 initial = 128,492
  readonly baselineFraudOffset = 1266;
  readonly baselineExposureOffset = 168400;
  readonly baselineSavedOffset = 104200;

  readonly kpis = computed(() => {
    const txns = this.transactions();
    const suspicious = txns.filter((t) => t.prediction.riskScore >= this.activeThreshold());
    const blocked = txns.filter((t) => t.status === 'blocked');

    const totalProcessed = this.baselineTotalOffset + txns.length;
    const fraudDetected = this.baselineFraudOffset + suspicious.length;
    const exposureAmount =
      this.baselineExposureOffset + suspicious.reduce((sum, t) => sum + t.amount, 0);
    const moneySaved =
      this.baselineSavedOffset + blocked.reduce((sum, t) => sum + t.amount, 0);

    const avgLatency =
      txns.length > 0
        ? Math.round(txns.reduce((sum, t) => sum + t.prediction.latencyMs, 0) / txns.length)
        : 14;

    const falsePositiveRate = Number(
      Math.max(0.8, Math.min(6.2, 2.4 + (65 - this.activeThreshold()) * 0.045)).toFixed(1)
    );

    return {
      totalProcessed,
      fraudDetected,
      exposureAmount,
      moneySaved,
      falsePositiveRate,
      tps: this.liveTps(),
      avgLatency,
      suspiciousCount: suspicious.length,
    };
  });

  readonly unreadNotificationsCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  readonly drawerTransaction = computed(() => {
    const id = this.drawerTransactionId();
    if (!id) return null;
    return this.transactions().find((t) => t.id === id) ?? null;
  });

  openTransactionDrawer(id: string): void {
    this.drawerTransactionId.set(id);
  }

  closeTransactionDrawer(): void {
    this.drawerTransactionId.set(null);
  }

  prependTransactions(newTxns: Transaction[]): void {
    const flaggedNew = newTxns.map((t) => ({ ...t, isNew: true }));
    this.transactions.update((curr) => {
      const updated = [...flaggedNew, ...curr].slice(0, 200);
      this.transactions$.next(updated);
      return updated;
    });
  }

  upsertSimulationTransaction(txn: Transaction): void {
    this.transactions.update((curr) => {
      const idx = curr.findIndex((t) => t.id === txn.id);
      let updated: Transaction[];
      if (idx >= 0) {
        updated = [...curr];
        updated[idx] = { ...txn, isNew: true };
      } else {
        updated = [{ ...txn, isNew: true }, ...curr].slice(0, 200);
      }
      this.transactions$.next(updated);
      return updated;
    });
  }

  updateTransactionStatus(id: string, status: TransactionStatus, actor = 'Maya Lin'): void {
    this.transactions.update((list) => {
      const updated = list.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              prediction: {
                ...t.prediction,
                modelDecision:
                  status === 'blocked'
                    ? ('BLOCK' as const)
                    : status === 'approved'
                      ? ('APPROVE' as const)
                      : ('REVIEW' as const),
              },
            }
          : t
      );
      this.transactions$.next(updated);
      return updated;
    });

    this.addActivity({
      type: 'decision',
      title: `${status.toUpperCase()} ${id}`,
      detail: `Analyst ${actor} updated transaction status to ${status}.`,
      actor,
    });
  }

  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    this.alerts.update((curr) => [newAlert, ...curr].slice(0, 50));
    this.notifications.update((curr) => [
      {
        id: `N-${Date.now()}`,
        title: newAlert.title,
        message: newAlert.description,
        severity: newAlert.severity === 'critical' ? 'critical' : 'warning',
        timestamp: newAlert.timestamp,
        read: false,
        route: '/app/monitoring',
      },
      ...curr,
    ]);
  }

  acknowledgeAlert(id: string): void {
    this.alerts.update((curr) =>
      curr.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  }

  createCaseFromTransaction(txn: Transaction, isSimulated = false): FraudCase {
    const existing = this.cases().find((c) => c.transactionId === txn.id);
    if (existing) {
      this.showToast('Case Exists', `${existing.id} already tracks ${txn.id}.`, 'info');
      return existing;
    }

    const newCase: FraudCase = {
      id: `CASE-${2050 + this.cases().length}`,
      transactionId: txn.id,
      accountId: txn.senderAccount,
      accountName: txn.senderName,
      amount: txn.amount,
      riskScore: txn.prediction.riskScore,
      priority: txn.prediction.riskScore >= 80 ? 'Critical' : txn.prediction.riskScore >= 60 ? 'High' : 'Medium',
      assignedAnalyst: this.settings().analystName,
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: txn.explanation.summary,
      associatedTransactionIds: [txn.id],
      connectedNodeIds: [txn.senderAccount, txn.receiverAccount, txn.device.deviceId],
      notes: [],
      timeline: [
        {
          id: `TL-${Date.now()}`,
          title: isSimulated ? 'Simulation Case Created' : 'Case Opened by Analyst',
          detail: `Created for ${txn.id} ($${txn.amount.toLocaleString()}, Risk ${txn.prediction.riskScore}/100).`,
          timestamp: new Date().toISOString(),
          actor: isSimulated ? 'Attack Simulator' : this.settings().analystName,
        },
      ],
      decisions: [],
      isSimulated,
    };

    this.cases.update((curr) => [newCase, ...curr]);
    this.addActivity({
      type: 'investigation',
      title: `Opened ${newCase.id} for ${txn.id}`,
      detail: `Assigned to ${newCase.assignedAnalyst} (${newCase.priority} priority).`,
      actor: newCase.assignedAnalyst,
    });
    return newCase;
  }

  updateCaseStatus(
    caseId: string,
    status: CaseStatus,
    actionLabel: 'Approve' | 'Block' | 'Escalate' | 'Mark False Positive' | 'Close Case',
    note?: string
  ): void {
    const analyst = this.settings().analystName;
    const now = new Date().toISOString();

    this.cases.update((list) =>
      list.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          status,
          updatedAt: now,
          decisions: [
            {
              id: `DEC-${Date.now()}`,
              caseId,
              transactionId: c.transactionId,
              action: actionLabel,
              analyst,
              note,
              timestamp: now,
            },
            ...c.decisions,
          ],
          timeline: [
            {
              id: `TL-${Date.now()}`,
              title: `Decision: ${actionLabel}`,
              detail: note ? `${status} — ${note}` : `Status transitioned to ${status}.`,
              timestamp: now,
              actor: analyst,
            },
            ...c.timeline,
          ],
        };
      })
    );

    const target = this.cases().find((c) => c.id === caseId);
    if (target) {
      if (actionLabel === 'Block') this.updateTransactionStatus(target.transactionId, 'blocked', analyst);
      if (actionLabel === 'Approve' || actionLabel === 'Mark False Positive') {
        this.updateTransactionStatus(target.transactionId, 'approved', analyst);
      }
    }
  }

  addCaseNote(caseId: string, content: string): void {
    const analyst = this.settings().analystName;
    const now = new Date().toISOString();
    this.cases.update((list) =>
      list.map((c) =>
        c.id === caseId
          ? {
              ...c,
              updatedAt: now,
              notes: [
                { id: `NOTE-${Date.now()}`, author: analyst, content, timestamp: now },
                ...c.notes,
              ],
            }
          : c
      )
    );
  }

  injectGraphEntities(nodes: GraphNode[], edges: GraphEdge[]): void {
    this.graphNodes.update((curr) => {
      const existingIds = new Set(curr.map((n) => n.id));
      const fresh = nodes.filter((n) => !existingIds.has(n.id));
      return [...curr, ...fresh];
    });
    this.graphEdges.update((curr) => {
      const existingIds = new Set(curr.map((e) => e.id));
      const fresh = edges.filter((e) => !existingIds.has(e.id));
      return [...curr, ...fresh];
    });
  }

  addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    this.activities.update((curr) => [
      { ...item, id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() },
      ...curr,
    ].slice(0, 30));
  }

  markAllNotificationsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  showToast(title: string, message: string, type: ToastMessage['type'] = 'info'): void {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    this.toasts.update((curr) => [...curr, { id, title, message, type }]);
    setTimeout(() => {
      this.toasts.update((curr) => curr.filter((t) => t.id !== id));
    }, 4200);
  }

  dismissToast(id: string): void {
    this.toasts.update((curr) => curr.filter((t) => t.id !== id));
  }
}
