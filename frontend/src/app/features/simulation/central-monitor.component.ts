import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Activity,
  BrainCircuit,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Server,
  Layers,
  FileSearch,
  RefreshCw,
} from 'lucide-angular';
import { SimulationApiService } from './services/simulation-api.service';
import { SimAlert, SimTransaction } from './services/simulation.models';

@Component({
  selector: 'app-central-monitor',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [SimulationApiService],
  template: `
    <div class="min-h-screen bg-[#050509] text-slate-100 relative">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <!-- Command Center Header -->
      <header class="relative z-10 border-b border-white/8 bg-[#080913]/90 backdrop-blur-xl">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <lucide-icon [img]="BrainIcon" class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-base text-white">
                  Central AI Fraud Command Center
                </span>
                <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  DISTILBERT LIVE
                </span>
              </div>
              <p class="text-[11px] text-zinc-400">
                Application B · Cross-Bank Real-Time Telemetry & Inference Monitor
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <!-- AI Health Pill -->
            <div class="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
              <lucide-icon
                [img]="ServerIcon"
                class="w-3.5 h-3.5"
                [ngClass]="api.aiHealth()?.model_loaded ? 'text-emerald-400' : 'text-red-400'"
              />
              <span class="text-zinc-300">
                AI Service: {{ api.aiHealth()?.model_loaded ? 'Healthy' : 'Unavailable' }}
              </span>
            </div>

            <!-- Socket Status -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
              <lucide-icon
                [img]="api.connectionStatus() === 'connected' ? WifiIcon : WifiOffIcon"
                class="w-3.5 h-3.5"
                [ngClass]="api.connectionStatus() === 'connected' ? 'text-emerald-400' : 'text-amber-400'"
              />
              <span class="capitalize text-zinc-300">{{ api.connectionStatus() }}</span>
            </div>

            <button
              type="button"
              (click)="api.syncBootstrap()"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              title="Sync state"
            >
              <lucide-icon [img]="RefreshIcon" class="w-3.5 h-3.5" />
            </button>

            <a
              routerLink="/simulation/control"
              class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300"
            >
              Control Panel
            </a>
          </div>
        </div>
      </header>

      <main class="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <!-- A. Overview Metrics -->
        <section class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Total Txns</p>
            <p class="text-xl font-mono-num font-bold text-white mt-1">{{ api.metrics().totalTransactions }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Processing</p>
            <p class="text-xl font-mono-num font-bold text-purple-400 mt-1">{{ api.metrics().processingCount }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Approved</p>
            <p class="text-xl font-mono-num font-bold text-emerald-400 mt-1">{{ api.metrics().approvedCount }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Blocked</p>
            <p class="text-xl font-mono-num font-bold text-red-400 mt-1">{{ api.metrics().blockedCount }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Under Review</p>
            <p class="text-xl font-mono-num font-bold text-amber-400 mt-1">{{ api.metrics().underReviewCount }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Fraud Alerts</p>
            <p class="text-xl font-mono-num font-bold text-fuchsia-400 mt-1">{{ api.metrics().fraudAlertsCount }}</p>
          </div>
          <div class="fs-card p-3.5 col-span-2 sm:col-span-1">
            <p class="text-[10px] uppercase tracking-wider text-zinc-400">Settled Volume</p>
            <p class="text-lg font-mono-num font-bold text-white mt-1">
              BDT {{ api.metrics().totalVolume | number: '1.0-0' }}
            </p>
          </div>
        </section>

        <!-- Main Workspace Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- B. Live Transaction Feed (4 cols) -->
          <section class="lg:col-span-4 fs-card p-4 sm:p-5 flex flex-col">
            <div class="flex items-center justify-between border-b border-white/8 pb-3 mb-3">
              <div class="flex items-center gap-2">
                <lucide-icon [img]="ActivityIcon" class="w-4 h-4 text-purple-400" />
                <h2 class="font-display font-bold text-sm text-white">Live Transaction Feed</h2>
              </div>
              <span class="text-[11px] font-mono-num text-zinc-400">{{ api.transactions().length }} live</span>
            </div>

            <div class="space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
              @if (api.transactions().length === 0) {
                <div class="text-center py-12 text-xs text-zinc-500">
                  Waiting for incoming transactions from Customer Banking App...
                </div>
              }
              @for (txn of api.transactions(); track txn.transactionId) {
                <button
                  type="button"
                  (click)="selectTransaction(txn.transactionId)"
                  class="w-full text-left p-3.5 rounded-xl border transition-all"
                  [ngClass]="
                    activeTransaction()?.transactionId === txn.transactionId
                      ? 'bg-purple-500/15 border-purple-500/50'
                      : 'bg-[#090A16] border-white/8 hover:border-white/20'
                  "
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-mono-num font-bold text-white">{{ txn.transactionId }}</span>
                    <span
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      [ngClass]="{
                        'bg-emerald-500/15 text-emerald-300': txn.status === 'SETTLED',
                        'bg-red-500/15 text-red-300': txn.status === 'BLOCKED' || txn.status === 'FAILED',
                        'bg-amber-500/15 text-amber-300': txn.status === 'HELD' || txn.status === 'AI_UNAVAILABLE_HELD',
                        'bg-purple-500/15 text-purple-300': ['PENDING','AUTHENTICATED','VALIDATED','AI_ANALYSIS'].includes(txn.status)
                      }"
                    >
                      {{ txn.status }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs mt-1.5">
                    <span class="text-zinc-400">{{ txn.senderBankName }} → {{ txn.receiverBankName }}</span>
                  </div>

                  <div class="flex items-center justify-between mt-1.5">
                    <span class="text-sm font-mono-num font-bold text-white">
                      {{ txn.currency }} {{ txn.amount | number: '1.2-2' }}
                    </span>
                    <span class="text-[10px] text-zinc-500">{{ txn.createdAt | date: 'mediumTime' }}</span>
                  </div>

                  <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/6 text-[10px]">
                    <span class="text-zinc-400">Stage {{ txn.currentStage }}/8</span>
                    <div class="flex items-center gap-2">
                      @if (txn.modelResult) {
                        <span
                          class="font-mono-num font-semibold"
                          [ngClass]="txn.modelResult.prediction === 'FRAUD' ? 'text-red-300' : 'text-emerald-300'"
                        >
                          AI: {{ txn.modelResult.prediction }}
                        </span>
                      }
                      @if (txn.riskDecision) {
                        <span class="font-mono-num text-purple-300">
                          {{ txn.riskDecision.decision }}
                        </span>
                      }
                    </div>
                  </div>
                </button>
              }
            </div>
          </section>

          <!-- Center/Right: Timeline + AI Inference + Risk Decision (8 cols) -->
          <div class="lg:col-span-8 space-y-6">
            @if (activeTransaction(); as txn) {
              <!-- C. 8-Stage Transaction Processing Timeline -->
              <section class="fs-card p-5">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-3 mb-4">
                  <div>
                    <h2 class="font-display font-bold text-sm text-white flex items-center gap-2">
                      <lucide-icon [img]="LayersIcon" class="w-4 h-4 text-purple-400" />
                      Transaction Processing Timeline · {{ txn.transactionId }}
                    </h2>
                    <p class="text-[11px] text-zinc-400 mt-0.5">
                      {{ txn.senderName }} ({{ txn.senderAccountRef }}) → {{ txn.beneficiaryName }} ({{ txn.beneficiaryAccountRef }})
                    </p>
                  </div>
                  <span class="text-xs font-mono-num text-zinc-300">
                    Scenario: {{ txn.scenarioName || txn.scenarioId }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  @for (st of txn.stages; track st.step) {
                    <div
                      class="p-3 rounded-xl border transition-all"
                      [ngClass]="{
                        'bg-purple-500/15 border-purple-500/50 shadow-[0_0_20px_-8px_rgba(168,85,247,0.5)]': st.status === 'IN_PROGRESS',
                        'bg-emerald-500/5 border-emerald-500/25': st.status === 'COMPLETED',
                        'bg-red-500/10 border-red-500/35': st.status === 'FAILED',
                        'bg-[#090A16] border-white/8': st.status === 'PENDING' || st.status === 'SKIPPED'
                      }"
                    >
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-white">
                          {{ st.step }}. {{ st.name }}
                        </span>
                        <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-white/8 text-zinc-200">
                          {{ st.status }}
                        </span>
                      </div>
                      @if (st.result) {
                        <p class="text-[11px] text-zinc-300 mt-1">{{ st.result }}</p>
                      }
                      @if (st.error) {
                        <p class="text-[11px] text-red-300 mt-1">{{ st.error }}</p>
                      }
                      <div class="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 font-mono-num">
                        <span>{{ st.timestamp ? (st.timestamp | date: 'mediumTime') : '—' }}</span>
                        <span>{{ st.durationMs !== null ? st.durationMs + ' ms' : '' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </section>

              <!-- D. AI Model Inference Panel & E. Risk Decision Panel -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- D. AI Model Inference Panel -->
                <section class="fs-card p-5 space-y-3">
                  <div class="flex items-center justify-between border-b border-white/8 pb-3">
                    <h3 class="font-display font-bold text-sm text-white flex items-center gap-2">
                      <lucide-icon [img]="BrainIcon" class="w-4 h-4 text-fuchsia-400" />
                      AI Model Inference Panel
                    </h3>
                    <span class="text-[10px] font-mono-num px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">
                      DistilBERT
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2.5 text-xs">
                    <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                      <span class="text-[10px] text-zinc-500 block">Service Health</span>
                      <span class="font-semibold" [ngClass]="api.aiHealth()?.model_loaded ? 'text-emerald-400' : 'text-red-400'">
                        {{ api.aiHealth()?.model_loaded ? 'ONLINE' : 'UNAVAILABLE' }}
                      </span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                      <span class="text-[10px] text-zinc-500 block">Model Version</span>
                      <span class="font-mono-num text-zinc-200">
                        {{ txn.modelResult?.model_version || api.aiHealth()?.model_version || 'distilbert-behavioral-v1' }}
                      </span>
                    </div>
                  </div>

                  @if (txn.status === 'AI_ANALYSIS' && !txn.modelResult) {
                    <div class="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-xs text-purple-200">
                      <lucide-icon [img]="ClockIcon" class="w-4 h-4 animate-spin text-purple-400" />
                      Running DistilBERT transformer inference on behavioral API sequence...
                    </div>
                  }

                  @if (txn.modelResult; as mr) {
                    <div class="grid grid-cols-2 gap-2.5 text-xs">
                      <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                        <span class="text-[10px] text-zinc-500 block">Model Prediction</span>
                        <span
                          class="font-mono-num font-bold text-sm"
                          [ngClass]="mr.prediction === 'FRAUD' ? 'text-red-400' : 'text-emerald-400'"
                        >
                          {{ mr.prediction }}
                        </span>
                      </div>
                      <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                        <span class="text-[10px] text-zinc-500 block">Fraud Probability</span>
                        <span class="font-mono-num font-bold text-sm text-white">
                          {{ (mr.fraud_probability * 100) | number: '1.2-2' }}%
                        </span>
                      </div>
                      <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                        <span class="text-[10px] text-zinc-500 block">Inference Latency</span>
                        <span class="font-mono-num text-zinc-200">{{ mr.latency_ms }} ms</span>
                      </div>
                      <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                        <span class="text-[10px] text-zinc-500 block">Tokens (Max 256)</span>
                        <span class="font-mono-num text-zinc-200">{{ mr.token_count }} / {{ mr.max_sequence_length }}</span>
                      </div>
                    </div>

                    <div class="p-2.5 rounded-lg bg-[#090A16] border border-white/8">
                      <span class="text-[10px] text-zinc-500 block mb-1">Input Sequence Summary</span>
                      <p class="text-[11px] font-mono-num text-zinc-300 break-words leading-relaxed">
                        {{ mr.sequence_preview }}
                      </p>
                    </div>
                    <p class="text-[10px] text-zinc-500 font-mono-num">
                      Model Response: {{ mr.timestamp | date: 'medium' }}
                    </p>
                  } @else if (txn.status !== 'AI_ANALYSIS') {
                    <p class="text-xs text-zinc-500 py-4 text-center">
                      Awaiting AI inference result...
                    </p>
                  }
                </section>

                <!-- E. Risk Decision Panel -->
                <section class="fs-card p-5 space-y-3">
                  <div class="flex items-center justify-between border-b border-white/8 pb-3">
                    <h3 class="font-display font-bold text-sm text-white flex items-center gap-2">
                      <lucide-icon [img]="ShieldAlertIcon" class="w-4 h-4 text-amber-400" />
                      Risk Decision Engine
                    </h3>
                    @if (txn.riskDecision; as rd) {
                      <span
                        class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                        [ngClass]="{
                          'bg-emerald-500/15 text-emerald-300': rd.riskLevel === 'LOW',
                          'bg-amber-500/15 text-amber-300': rd.riskLevel === 'MEDIUM',
                          'bg-red-500/15 text-red-300': rd.riskLevel === 'HIGH'
                        }"
                      >
                        {{ rd.riskLevel }} · {{ rd.decision }}
                      </span>
                    }
                  </div>

                  @if (api.riskPolicy(); as policy) {
                    <div class="space-y-2 text-xs">
                      <div
                        class="p-2.5 rounded-lg border"
                        [ngClass]="
                          txn.riskDecision?.riskLevel === 'LOW'
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-[#090A16] border-white/8'
                        "
                      >
                        <div class="flex justify-between font-semibold text-emerald-300">
                          <span>LOW (&lt; {{ policy.lowMaxProbability }})</span>
                          <span>APPROVE</span>
                        </div>
                        <p class="text-[11px] text-zinc-400 mt-0.5">{{ policy.levels.LOW.action }}</p>
                      </div>

                      <div
                        class="p-2.5 rounded-lg border"
                        [ngClass]="
                          txn.riskDecision?.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-[#090A16] border-white/8'
                        "
                      >
                        <div class="flex justify-between font-semibold text-amber-300">
                          <span>MEDIUM ({{ policy.lowMaxProbability }} – {{ policy.mediumMaxProbability }})</span>
                          <span>HOLD</span>
                        </div>
                        <p class="text-[11px] text-zinc-400 mt-0.5">{{ policy.levels.MEDIUM.action }}</p>
                      </div>

                      <div
                        class="p-2.5 rounded-lg border"
                        [ngClass]="
                          txn.riskDecision?.riskLevel === 'HIGH'
                            ? 'bg-red-500/10 border-red-500/40'
                            : 'bg-[#090A16] border-white/8'
                        "
                      >
                        <div class="flex justify-between font-semibold text-red-300">
                          <span>HIGH (&ge; {{ policy.mediumMaxProbability }})</span>
                          <span>BLOCK</span>
                        </div>
                        <p class="text-[11px] text-zinc-400 mt-0.5">{{ policy.levels.HIGH.action }}</p>
                      </div>
                    </div>
                  }
                </section>
              </div>
            } @else {
              <section class="fs-card p-12 text-center text-xs text-zinc-500">
                Select a transaction from the Live Transaction Feed to inspect its 8-stage timeline, DistilBERT inference, and risk decision.
              </section>
            }

            <!-- F. Fraud Alert Center -->
            <section class="fs-card p-5">
              <div class="flex items-center justify-between border-b border-white/8 pb-3 mb-3">
                <h3 class="font-display font-bold text-sm text-white flex items-center gap-2">
                  <lucide-icon [img]="AlertIcon" class="w-4 h-4 text-red-400" />
                  Real-Time Fraud Alert Center
                </h3>
                <span class="text-xs font-mono-num text-zinc-400">{{ api.alerts().length }} alerts</span>
              </div>

              @if (api.alerts().length === 0) {
                <p class="text-xs text-zinc-500 py-6 text-center">
                  No fraud alerts generated yet.
                </p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead class="text-[10px] uppercase text-zinc-500 border-b border-white/8">
                      <tr>
                        <th class="py-2 pr-3">Transaction</th>
                        <th class="py-2 pr-3">Route</th>
                        <th class="py-2 pr-3">Amount</th>
                        <th class="py-2 pr-3">Prediction</th>
                        <th class="py-2 pr-3">Severity</th>
                        <th class="py-2 pr-3">Case</th>
                        <th class="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/6">
                      @for (al of api.alerts(); track al.alertId) {
                        <tr class="hover:bg-white/3">
                          <td class="py-2.5 pr-3 font-mono-num text-white">{{ al.transactionId }}</td>
                          <td class="py-2.5 pr-3 text-zinc-300">{{ al.senderBankName }} → {{ al.receiverBankName }}</td>
                          <td class="py-2.5 pr-3 font-mono-num text-white">{{ al.currency }} {{ al.amount | number: '1.2-2' }}</td>
                          <td class="py-2.5 pr-3 font-mono-num text-red-300">{{ al.modelPrediction }}</td>
                          <td class="py-2.5 pr-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-red-500/15 text-red-300">
                              {{ al.riskSeverity }}
                            </span>
                          </td>
                          <td class="py-2.5 pr-3 font-mono-num text-zinc-400">
                            {{ al.caseId || '—' }} ({{ al.investigationStatus }})
                          </td>
                          <td class="py-2.5 text-right">
                            <button
                              type="button"
                              (click)="openAlertTransaction(al)"
                              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-[11px]"
                            >
                              <lucide-icon [img]="FileSearchIcon" class="w-3 h-3" />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class CentralMonitorComponent implements OnInit {
  readonly api = inject(SimulationApiService);
  readonly selectedTxnId = signal<string | null>(null);

  readonly activeTransaction = computed<SimTransaction | null>(() => {
    const id = this.selectedTxnId();
    const list = this.api.transactions();
    if (id) {
      return list.find((t) => t.transactionId === id) || list[0] || null;
    }
    return list[0] || null;
  });

  readonly BrainIcon = BrainCircuit;
  readonly ActivityIcon = Activity;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly AlertIcon = AlertTriangle;
  readonly CheckIcon = CheckCircle2;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly WifiIcon = Wifi;
  readonly WifiOffIcon = WifiOff;
  readonly ServerIcon = Server;
  readonly LayersIcon = Layers;
  readonly FileSearchIcon = FileSearch;
  readonly RefreshIcon = RefreshCw;

  async ngOnInit(): Promise<void> {
    await this.api.connectAndSync({ role: 'CENTRAL_MONITOR' });
  }

  selectTransaction(transactionId: string): void {
    this.selectedTxnId.set(transactionId);
  }

  openAlertTransaction(alert: SimAlert): void {
    this.selectedTxnId.set(alert.transactionId);
  }
}
