import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { firstValueFrom } from 'rxjs';
import {
  SimAiHealth,
  SimAlert,
  SimAuditLog,
  SimBank,
  SimBootstrapResponse,
  SimCase,
  SimCustomer,
  SimLedgerEntry,
  SimOverviewMetrics,
  SimRiskPolicy,
  SimScenario,
  SimTransaction,
} from './simulation.models';

export interface SimTenantAuth {
  role: 'CUSTOMER' | 'BANK' | 'CENTRAL_MONITOR' | 'CONTROL_PANEL';
  bankId?: string;
  customerId?: string;
}

export interface SimRealtimeEvent {
  eventId: string;
  transactionId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
  transaction?: SimTransaction;
}

@Injectable()
export class SimulationApiService implements OnDestroy {
  private readonly http = inject(HttpClient);
  readonly backendUrl = 'http://127.0.0.1:4000';

  private socket: Socket | null = null;
  private currentTenant: SimTenantAuth = { role: 'CENTRAL_MONITOR' };
  private readonly seenEventIds = new Set<string>();

  readonly connectionStatus = signal<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly banks = signal<SimBank[]>([]);
  readonly customers = signal<SimCustomer[]>([]);
  readonly scenarios = signal<SimScenario[]>([]);
  readonly riskPolicy = signal<SimRiskPolicy | null>(null);
  readonly aiHealth = signal<SimAiHealth | null>(null);
  readonly metrics = signal<SimOverviewMetrics>({
    totalTransactions: 0,
    processingCount: 0,
    approvedCount: 0,
    blockedCount: 0,
    underReviewCount: 0,
    fraudAlertsCount: 0,
    totalVolume: 0,
  });
  readonly transactions = signal<SimTransaction[]>([]);
  readonly alerts = signal<SimAlert[]>([]);
  readonly cases = signal<SimCase[]>([]);
  readonly ledgerEntries = signal<SimLedgerEntry[]>([]);
  readonly auditLogs = signal<SimAuditLog[]>([]);
  readonly eventLog = signal<SimRealtimeEvent[]>([]);

  private buildHeaders(tenant: SimTenantAuth): HttpHeaders {
    let headers = new HttpHeaders({ 'x-sim-role': tenant.role });
    if (tenant.bankId) headers = headers.set('x-sim-bank-id', tenant.bankId);
    if (tenant.customerId) headers = headers.set('x-sim-customer-id', tenant.customerId);
    return headers;
  }

  async connectAndSync(tenant: SimTenantAuth): Promise<void> {
    this.currentTenant = tenant;
    await this.syncBootstrap();
    this.initSocket(tenant);
  }

  async switchTenant(tenant: SimTenantAuth): Promise<void> {
    this.currentTenant = tenant;
    if (this.socket && this.socket.connected) {
      if (tenant.role === 'CUSTOMER' && tenant.customerId) {
        this.socket.emit('subscribe.customer', tenant.customerId);
      } else if (tenant.role === 'BANK' && tenant.bankId) {
        this.socket.emit('subscribe.bank', tenant.bankId);
      }
    } else {
      this.initSocket(tenant);
    }
    await this.syncBootstrap();
  }

  async syncBootstrap(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<SimBootstrapResponse>(`${this.backendUrl}/api/v1/bootstrap`, {
          headers: this.buildHeaders(this.currentTenant),
        })
      );
      this.banks.set(data.banks);
      this.customers.set(data.customers);
      this.scenarios.set(data.scenarios);
      this.riskPolicy.set(data.riskPolicy);
      this.aiHealth.set(data.aiHealth);
      this.metrics.set(data.metrics);
      this.transactions.set(data.transactions);
      this.alerts.set(data.alerts);
      this.cases.set(data.cases);
      this.ledgerEntries.set(data.ledgerEntries);
      this.auditLogs.set(data.auditLogs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to simulation backend';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  private initSocket(tenant: SimTenantAuth): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(this.backendUrl, {
      auth: {
        role: tenant.role,
        bankId: tenant.bankId,
        customerId: tenant.customerId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus.set('connected');
      // Initial/reconnect state sync via REST
      this.syncBootstrap();
    });

    this.socket.on('reconnect_attempt', () => {
      this.connectionStatus.set('reconnecting');
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus.set('disconnected');
    });

    this.socket.on('simulation.event', (evt: SimRealtimeEvent) => {
      this.handleRealtimeEvent(evt);
    });

    this.socket.on('simulation.reset', () => {
      this.seenEventIds.clear();
      this.eventLog.set([]);
      this.syncBootstrap();
    });
  }

  private handleRealtimeEvent(evt: SimRealtimeEvent): void {
    if (!evt || !evt.eventId) return;
    // Duplicate-event guard
    if (this.seenEventIds.has(evt.eventId)) return;
    this.seenEventIds.add(evt.eventId);
    if (this.seenEventIds.size > 500) {
      const first = this.seenEventIds.values().next().value;
      if (first) this.seenEventIds.delete(first);
    }

    this.eventLog.update((list) => [evt, ...list].slice(0, 80));

    if (evt.transaction) {
      const incoming = evt.transaction;
      this.transactions.update((list) => {
        const idx = list.findIndex((t) => t.transactionId === incoming.transactionId);
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = incoming;
          return copy;
        }
        return [incoming, ...list];
      });
    }

    if (
      evt.eventType === 'fraud.alert.created' ||
      evt.eventType === 'case.created' ||
      evt.eventType === 'transaction.settled' ||
      evt.eventType === 'transaction.blocked' ||
      evt.eventType === 'transaction.held'
    ) {
      // Refresh authoritative balances, metrics, alerts, cases, and audit logs from REST
      this.syncBootstrap();
    } else {
      this.recomputeLocalMetrics();
    }
  }

  private recomputeLocalMetrics(): void {
    const txns = this.transactions();
    const processingStatuses = ['PENDING', 'AUTHENTICATED', 'VALIDATED', 'AI_ANALYSIS'];
    this.metrics.set({
      totalTransactions: txns.length,
      processingCount: txns.filter((t) => processingStatuses.includes(t.status)).length,
      approvedCount: txns.filter((t) => t.status === 'SETTLED').length,
      blockedCount: txns.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length,
      underReviewCount: txns.filter(
        (t) => t.status === 'HELD' || t.status === 'AI_UNAVAILABLE_HELD'
      ).length,
      fraudAlertsCount: this.alerts().length,
      totalVolume: txns
        .filter((t) => t.status === 'SETTLED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    });
  }

  async submitTransfer(payload: {
    idempotencyKey: string;
    senderCustomerId: string;
    receivingBankId: string;
    beneficiaryAccountRef: string;
    amount: number;
    currency: string;
    description: string;
    scenarioId: string;
    pin: string;
    otp: string;
  }): Promise<{ duplicate: boolean; transaction: SimTransaction }> {
    return firstValueFrom(
      this.http.post<{ duplicate: boolean; transaction: SimTransaction }>(
        `${this.backendUrl}/api/v1/transactions`,
        payload,
        { headers: this.buildHeaders(this.currentTenant) }
      )
    );
  }

  async updateCase(
    caseId: string,
    payload: { status?: string; analystNote?: string }
  ): Promise<{ case: SimCase }> {
    const res = await firstValueFrom(
      this.http.patch<{ case: SimCase }>(`${this.backendUrl}/api/v1/cases/${caseId}`, payload, {
        headers: this.buildHeaders(this.currentTenant),
      })
    );
    await this.syncBootstrap();
    return res;
  }

  async resetSimulation(adminKey: string): Promise<{ ok: boolean; message: string }> {
    const headers = new HttpHeaders({ 'x-demo-admin-key': adminKey });
    const res = await firstValueFrom(
      this.http.post<{ ok: boolean; message: string }>(
        `${this.backendUrl}/api/v1/admin/reset`,
        {},
        { headers }
      )
    );
    await this.syncBootstrap();
    return res;
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
