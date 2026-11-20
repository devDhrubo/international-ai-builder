import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { firstValueFrom } from 'rxjs';
import { FraudStoreService } from '../state/fraud-store.service';
import { Transaction, TransactionStatus, RiskLevel } from '../models/fraud.models';
import {
  SimBootstrapResponse,
  SimTransaction,
} from '../../features/simulation/services/simulation.models';

@Injectable({ providedIn: 'root' })
export class SimulationDashboardBridgeService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly store = inject(FraudStoreService);
  private readonly backendUrl = 'http://127.0.0.1:4000';
  private socket: Socket | null = null;
  private readonly processedFinalIds = new Set<string>();

  constructor() {
    this.initBridge();
  }

  private initBridge(): void {
    this.syncExisting();

    this.socket = io(this.backendUrl, {
      auth: { role: 'CENTRAL_MONITOR' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.syncExisting();
    });

    this.socket.on('simulation.event', (evt: { eventType: string; transaction?: SimTransaction }) => {
      if (!evt?.transaction) return;
      const mapped = this.mapToDashboardTransaction(evt.transaction);
      this.store.upsertSimulationTransaction(mapped);

      if (
        (evt.eventType === 'transaction.settled' ||
          evt.eventType === 'transaction.blocked' ||
          evt.eventType === 'transaction.held') &&
        !this.processedFinalIds.has(evt.transaction.transactionId)
      ) {
        this.processedFinalIds.add(evt.transaction.transactionId);
        this.recordOutcomeInStore(evt.transaction, mapped);
      }
    });
  }

  async syncExisting(): Promise<void> {
    try {
      const headers = new HttpHeaders({ 'x-sim-role': 'CENTRAL_MONITOR' });
      const data = await firstValueFrom(
        this.http.get<SimBootstrapResponse>(`${this.backendUrl}/api/v1/bootstrap`, { headers })
      );
      for (const simTxn of [...data.transactions].reverse()) {
        const mapped = this.mapToDashboardTransaction(simTxn);
        this.store.upsertSimulationTransaction(mapped);
        if (['SETTLED', 'BLOCKED', 'HELD', 'FAILED'].includes(simTxn.status)) {
          this.processedFinalIds.add(simTxn.transactionId);
        }
      }
    } catch {
      // Simulation backend may not be running; fail silently so main dashboard keeps working
    }
  }

  private recordOutcomeInStore(simTxn: SimTransaction, mapped: Transaction): void {
    this.store.addActivity({
      type: simTxn.status === 'SETTLED' ? 'decision' : 'simulation',
      title: `Live Sim ${simTxn.status}: ${simTxn.transactionId}`,
      detail: `${simTxn.senderName} → ${simTxn.beneficiaryName} (${simTxn.currency} ${simTxn.amount.toLocaleString()})`,
      actor: 'DistilBERT Live Pipeline',
    });

    if (simTxn.status === 'BLOCKED' || simTxn.status === 'HELD') {
      this.store.addAlert({
        title: `Live Simulation ${simTxn.status}: ${simTxn.transactionId}`,
        description: `${simTxn.currency} ${simTxn.amount.toLocaleString()} (${simTxn.senderBankName} → ${simTxn.receiverBankName})`,
        severity: simTxn.status === 'BLOCKED' ? 'critical' : 'high',
        category: 'high_risk_txn',
        transactionId: simTxn.transactionId,
      });
      this.store.createCaseFromTransaction(mapped, true);
      this.store.showToast(
        `Simulation ${simTxn.status}`,
        `${simTxn.transactionId} (${simTxn.currency} ${simTxn.amount.toLocaleString()})`,
        simTxn.status === 'BLOCKED' ? 'critical' : 'warning'
      );
    } else if (simTxn.status === 'SETTLED') {
      this.store.showToast(
        'Simulation Settled',
        `${simTxn.transactionId} · ${simTxn.currency} ${simTxn.amount.toLocaleString()} approved`,
        'success'
      );
    }
  }

  private mapToDashboardTransaction(sim: SimTransaction): Transaction {
    const prob = sim.modelResult?.fraud_probability ?? 0;
    const riskScore = Math.round(prob * 100);

    let status: TransactionStatus = 'under_review';
    if (sim.status === 'SETTLED') status = 'approved';
    else if (sim.status === 'BLOCKED' || sim.status === 'FAILED') status = 'blocked';
    else if (sim.status === 'HELD' || sim.status === 'AI_UNAVAILABLE_HELD') status = 'flagged';

    let riskLevel: RiskLevel = 'low';
    if (sim.riskDecision?.riskLevel === 'HIGH') riskLevel = 'high';
    else if (sim.riskDecision?.riskLevel === 'MEDIUM') riskLevel = 'medium';

    const modelDecision =
      sim.riskDecision?.decision === 'BLOCK'
        ? 'BLOCK'
        : sim.riskDecision?.decision === 'HOLD'
          ? 'REVIEW'
          : 'APPROVE';

    return {
      id: sim.transactionId,
      senderAccount: sim.senderAccountRef,
      senderName: `${sim.senderName} (${sim.senderBankName})`,
      receiverAccount: sim.beneficiaryAccountRef,
      receiverName: `${sim.beneficiaryName} (${sim.receiverBankName})`,
      merchantCategory: 'Inter-Bank Simulation',
      amount: sim.amount,
      currency: sim.currency,
      type: 'Wire Transfer',
      location: {
        city: 'Dhaka',
        country: 'Bangladesh',
        countryCode: 'BD',
        lat: 23.8103,
        lng: 90.4125,
        region: 'South Asia',
      },
      device: {
        deviceId: 'SIM-LIVE-01',
        os: 'Web',
        browser: 'Simulation',
        fingerprintHash: 'SIM-LIVE-FP',
        isNewDevice: false,
        isEmulatorOrProxy: false,
      },
      ipAddress: '127.0.0.1',
      timestamp: sim.createdAt,
      prediction: {
        fraudProbability: prob,
        riskScore,
        riskLevel,
        modelDecision,
        latencyMs: Math.round(sim.modelResult?.latency_ms ?? 25),
        modelVersion: sim.modelResult?.model_version ?? 'distilbert-behavioral-v1',
      },
      status,
      explanation: {
        transactionId: sim.transactionId,
        summary: sim.customerMessage,
        evidenceSummary: [
          sim.modelResult?.sequence_preview || sim.description || 'Live behavioral sequence',
        ],
        shapContributions: [],
        reasonCode: {
          code: 'DISTILBERT-LIVE',
          headline: `DistilBERT: ${sim.modelResult?.prediction || sim.status}`,
          narrative: sim.customerMessage,
          riskIndicators: [sim.scenarioName || 'Live Simulation'],
          recommendedAction: sim.riskDecision?.recommendedAction || 'Monitor',
          confidence: prob,
          generatedAt: sim.updatedAt,
        },
        isMockExplanation: true,
      },
      isSimulated: true,
      simulationTag: sim.scenarioName || 'Live Simulation',
    };
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
