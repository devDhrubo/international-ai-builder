import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  LucideIconData,
  Send,
  ShieldCheck,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCcw,
  Building2,
  ArrowRight,
  Wifi,
  WifiOff,
  Server,
  KeyRound,
  FileCheck2,
  Scale,
  Landmark,
  ClipboardCheck,
  Loader2,
  Check,
  MinusCircle,
} from 'lucide-angular';
import { SimulationApiService } from './services/simulation-api.service';
import { SimTransaction } from './services/simulation.models';

@Component({
  selector: 'app-one-screen-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  providers: [SimulationApiService],
  template: `
    <div class="min-h-screen bg-[#050509] text-slate-100 relative">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <!-- Compact Top Bar -->
      <header class="relative z-10 border-b border-white/8 bg-[#080913]/90 backdrop-blur-xl">
        <div class="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <lucide-icon [img]="BrainIcon" class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="font-display font-bold text-base text-white">
                  One-Screen Live Transfer & AI Fraud Check
                </h1>
                <span class="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  DISTILBERT LIVE
                </span>
              </div>
              <p class="text-[11px] text-zinc-400">
                Send money, watch DistilBERT analyze the behavioral sequence, and see both banks update in real time
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
              <lucide-icon
                [img]="ServerIcon"
                class="w-3.5 h-3.5"
                [ngClass]="api.aiHealth()?.model_loaded ? 'text-emerald-400' : 'text-red-400'"
              />
              <span class="text-zinc-300">
                AI: {{ api.aiHealth()?.model_loaded ? 'Online' : 'Offline' }}
              </span>
            </div>

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
              (click)="quickReset()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 transition-colors"
              title="Reset balances and transactions"
            >
              <lucide-icon [img]="RotateIcon" class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Reset Demo</span>
            </button>

            <a
              routerLink="/simulation/control"
              class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300"
            >
              Multi-Screen Mode
            </a>
          </div>
        </div>
      </header>

      <main class="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- COLUMN 1: ONE-CLICK TRANSFER FORM (4 cols) -->
          <section class="lg:col-span-4 fs-card p-5 space-y-4">
            <div class="border-b border-white/8 pb-3">
              <h2 class="font-display font-bold text-sm text-white flex items-center gap-2">
                <lucide-icon [img]="SendIcon" class="w-4 h-4 text-purple-400" />
                1. Initiate Transfer
              </h2>
              <p class="text-[11px] text-zinc-400 mt-0.5">
                Single-step simulated transfer (PIN 1234 & OTP 482910 pre-filled)
              </p>
            </div>

            @if (formError()) {
              <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {{ formError() }}
              </div>
            }

            <!-- Sender -->
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">From (Sender)</label>
              <select
                [(ngModel)]="senderCustomerId"
                (ngModelChange)="onSenderChange($event)"
                class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
              >
                @for (c of api.customers(); track c.customerId) {
                  <option [value]="c.customerId">
                    {{ c.customerName }} ({{ c.bankName }}) — BDT {{ c.balance | number: '1.0-0' }}
                  </option>
                }
              </select>
            </div>

            <!-- Receiver -->
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">To (Beneficiary)</label>
              <select
                [(ngModel)]="beneficiaryCustomerId"
                class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
              >
                @for (b of eligibleBeneficiaries(); track b.customerId) {
                  <option [value]="b.customerId">
                    {{ b.customerName }} ({{ b.bankName }}) — {{ b.accountRef }}
                  </option>
                }
              </select>
            </div>

            <!-- Amount + Quick Presets -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-medium text-zinc-400">Amount (BDT)</label>
                <div class="flex gap-1.5">
                  @for (preset of [5000, 25000, 50000, 150000]; track preset) {
                    <button
                      type="button"
                      (click)="amount = preset"
                      class="px-2 py-0.5 rounded-md text-[10px] font-mono-num border transition-colors"
                      [ngClass]="
                        amount === preset
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      "
                    >
                      {{ preset | number }}
                    </button>
                  }
                </div>
              </div>
              <input
                type="number"
                min="1"
                [(ngModel)]="amount"
                class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-sm font-mono-num font-bold text-white focus:border-purple-500 outline-none"
              />
            </div>

            <!-- Test Scenario -->
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">
                Behavioral Scenario (Input to DistilBERT)
              </label>
              <select
                [(ngModel)]="scenarioId"
                (ngModelChange)="onScenarioChange($event)"
                class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
              >
                @for (sc of api.scenarios(); track sc.id) {
                  <option [value]="sc.id">{{ sc.name }} ({{ sc.category }})</option>
                }
              </select>
              @if (selectedScenario(); as sc) {
                <p class="text-[11px] text-zinc-400 mt-1.5">{{ sc.description }}</p>
              }
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">Reference Note</label>
              <input
                type="text"
                [(ngModel)]="description"
                class="w-full px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <button
              type="button"
              [disabled]="submitting()"
              (click)="sendTransfer()"
              class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg transition-all"
            >
              <lucide-icon [img]="ShieldIcon" class="w-4 h-4" />
              {{ submitting() ? 'Processing...' : 'Send Money & Run AI Check' }}
            </button>
          </section>

          <!-- COLUMN 2: LIVE PIPELINE & DISTILBERT INFERENCE (4 cols) -->
          <section class="lg:col-span-4 fs-card p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-white/8 pb-3">
              <h2 class="font-display font-bold text-sm text-white flex items-center gap-2">
                <lucide-icon [img]="BrainIcon" class="w-4 h-4 text-fuchsia-400" />
                2. Live AI Pipeline & Result
              </h2>
              @if (activeTransaction(); as txn) {
                <span class="text-[11px] font-mono-num text-purple-300">{{ txn.transactionId }}</span>
              }
            </div>

            @if (activeTransaction(); as txn) {
              <!-- Outcome Banner -->
              <div
                class="p-3.5 rounded-xl border flex items-start gap-3"
                [ngClass]="{
                  'bg-purple-500/10 border-purple-500/35': txn.customerResultState === 'Processing',
                  'bg-emerald-500/10 border-emerald-500/35': txn.customerResultState === 'Successful',
                  'bg-amber-500/10 border-amber-500/35': txn.customerResultState === 'Additional Verification Required',
                  'bg-red-500/10 border-red-500/35': txn.customerResultState === 'Rejected' || txn.customerResultState === 'Failed'
                }"
              >
                <div class="mt-0.5 shrink-0">
                  @if (txn.customerResultState === 'Successful') {
                    <lucide-icon [img]="CheckIcon" class="w-5 h-5 text-emerald-400" />
                  } @else if (txn.customerResultState === 'Processing') {
                    <lucide-icon [img]="ClockIcon" class="w-5 h-5 text-purple-400 animate-spin" />
                  } @else if (txn.customerResultState === 'Additional Verification Required') {
                    <lucide-icon [img]="AlertIcon" class="w-5 h-5 text-amber-400" />
                  } @else {
                    <lucide-icon [img]="XCircleIcon" class="w-5 h-5 text-red-400" />
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-white">{{ txn.customerResultState }}</p>
                  <p class="text-[11px] text-zinc-300 mt-0.5">{{ txn.customerMessage }}</p>
                </div>
              </div>

              <!-- Pipeline Progress Bar -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-zinc-400">Lifecycle Progress</span>
                  <span class="font-mono-num text-zinc-300">
                    {{ pipelineProgressPercent(txn) }}%
                  </span>
                </div>
                <div class="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    [style.width.%]="pipelineProgressPercent(txn)"
                    [ngClass]="{
                      'bg-gradient-to-r from-purple-500 to-fuchsia-500': txn.customerResultState === 'Processing',
                      'bg-emerald-500': txn.customerResultState === 'Successful',
                      'bg-amber-500': txn.customerResultState === 'Additional Verification Required',
                      'bg-red-500': txn.customerResultState === 'Rejected' || txn.customerResultState === 'Failed'
                    }"
                  ></div>
                </div>
              </div>

              <!-- Real-time Dynamic 8 Stages -->
              <div class="relative space-y-2 pt-1">
                @for (st of txn.stages; track st.step; let last = $last) {
                  <div class="relative flex items-stretch gap-3">
                    <!-- Timeline Node + Connector -->
                    <div class="flex flex-col items-center shrink-0">
                      <div
                        class="relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-300"
                        [ngClass]="{
                          'bg-purple-500/20 border-purple-400/70 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.45)]': st.status === 'IN_PROGRESS',
                          'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 animate-stage-pop': st.status === 'COMPLETED',
                          'bg-red-500/15 border-red-500/50 text-red-300 animate-stage-pop': st.status === 'FAILED',
                          'bg-amber-500/10 border-amber-500/30 text-amber-300/80': st.status === 'SKIPPED',
                          'bg-[#090A16] border-white/10 text-zinc-600': st.status === 'PENDING'
                        }"
                      >
                        <lucide-icon
                          [img]="stageIcon(st.step, txn)"
                          class="w-4 h-4"
                          [ngClass]="{ 'animate-pulse': st.status === 'IN_PROGRESS' }"
                        />

                        @if (st.status === 'IN_PROGRESS') {
                          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-600 border border-[#050509] flex items-center justify-center">
                            <lucide-icon [img]="LoaderIcon" class="w-2.5 h-2.5 text-white animate-spin" />
                          </span>
                        } @else if (st.status === 'COMPLETED') {
                          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-[#050509] flex items-center justify-center">
                            <lucide-icon [img]="CheckMiniIcon" class="w-2.5 h-2.5 text-[#050509]" />
                          </span>
                        } @else if (st.status === 'FAILED') {
                          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-[#050509] flex items-center justify-center">
                            <lucide-icon [img]="XCircleIcon" class="w-2.5 h-2.5 text-white" />
                          </span>
                        }
                      </div>

                      @if (!last) {
                        <div
                          class="w-0.5 flex-1 my-1 rounded-full transition-colors duration-300"
                          [ngClass]="{
                            'bg-emerald-500/50': st.status === 'COMPLETED',
                            'bg-purple-500/60 animate-pulse': st.status === 'IN_PROGRESS',
                            'bg-red-500/45': st.status === 'FAILED',
                            'bg-white/8': st.status === 'PENDING' || st.status === 'SKIPPED'
                          }"
                        ></div>
                      }
                    </div>

                    <!-- Stage Card -->
                    <div
                      class="flex-1 min-w-0 px-3 py-2 rounded-xl border transition-all duration-300 mb-0.5"
                      [ngClass]="{
                        'bg-purple-500/12 border-purple-500/45 text-white skeleton-shimmer': st.status === 'IN_PROGRESS',
                        'bg-emerald-500/6 border-emerald-500/25 text-emerald-100': st.status === 'COMPLETED',
                        'bg-red-500/10 border-red-500/35 text-red-100': st.status === 'FAILED',
                        'bg-amber-500/5 border-amber-500/20 text-amber-200/80': st.status === 'SKIPPED',
                        'bg-[#090A16]/70 border-white/6 text-zinc-500': st.status === 'PENDING'
                      }"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[11px] font-semibold truncate">
                          {{ st.step }}. {{ st.name }}
                        </span>
                        <span class="font-mono-num shrink-0 text-[10px] flex items-center gap-1.5">
                          @if (st.status === 'IN_PROGRESS') {
                            <span class="relative w-1.5 h-1.5 rounded-full bg-purple-400 live-dot"></span>
                            <span class="text-purple-300">RUNNING</span>
                          } @else {
                            <span>{{ st.status }}</span>
                            @if (st.durationMs !== null) {
                              <span class="text-zinc-400">· {{ st.durationMs }}ms</span>
                            }
                          }
                        </span>
                      </div>

                      @if (st.error) {
                        <p class="text-[10px] text-red-300 mt-1 leading-snug">{{ st.error }}</p>
                      } @else if (st.result && (st.status === 'COMPLETED' || st.status === 'SKIPPED')) {
                        <p class="text-[10px] text-zinc-400 mt-0.5 truncate">{{ st.result }}</p>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- DistilBERT Inference Summary -->
              @if (txn.modelResult; as mr) {
                <div class="p-3.5 rounded-xl bg-[#090A16] border border-white/10 space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] uppercase tracking-wider text-zinc-400">DistilBERT Output</span>
                    <span
                      class="font-mono-num font-bold"
                      [ngClass]="mr.prediction === 'FRAUD' ? 'text-red-400' : 'text-emerald-400'"
                    >
                      {{ mr.prediction }} ({{ (mr.fraud_probability * 100) | number: '1.2-2' }}%)
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Risk Decision: <strong class="text-white">{{ txn.riskDecision?.decision }}</strong></span>
                    <span class="font-mono-num">{{ mr.latency_ms }} ms · {{ mr.token_count }} tokens</span>
                  </div>
                  <p class="text-[10px] font-mono-num text-zinc-500 break-words pt-1 border-t border-white/6">
                    {{ mr.sequence_preview }}
                  </p>
                </div>
              }
            } @else {
              <div class="py-16 text-center text-xs text-zinc-500">
                Submit a transfer on the left to watch all 8 lifecycle stages and the live DistilBERT prediction here.
              </div>
            }
          </section>

          <!-- COLUMN 3: LIVE BANK LEDGER & RECENT ACTIVITY (4 cols) -->
          <section class="lg:col-span-4 space-y-5">
            <!-- Live Synthetic Balances -->
            <div class="fs-card p-5 space-y-3">
              <div class="flex items-center justify-between border-b border-white/8 pb-3">
                <h2 class="font-display font-bold text-sm text-white flex items-center gap-2">
                  <lucide-icon [img]="BuildingIcon" class="w-4 h-4 text-cyan-400" />
                  3. Live Bank Account Balances
                </h2>
                <span class="text-[10px] text-zinc-400">Atomic Ledger</span>
              </div>

              <div class="space-y-2">
                @for (c of api.customers(); track c.customerId) {
                  <div class="p-3 rounded-xl bg-[#090A16] border border-white/8 flex items-center justify-between">
                    <div>
                      <p class="text-xs font-semibold text-white">{{ c.customerName }}</p>
                      <p class="text-[10px] text-zinc-400">{{ c.bankName }} · {{ c.accountRef }}</p>
                    </div>
                    <span class="text-sm font-mono-num font-bold text-emerald-400">
                      BDT {{ c.balance | number: '1.2-2' }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Transfers & Alerts -->
            <div class="fs-card p-5 space-y-3">
              <div class="flex items-center justify-between border-b border-white/8 pb-3">
                <h3 class="font-display font-bold text-sm text-white">Recent Transfers</h3>
                <span class="text-xs font-mono-num text-zinc-400">
                  {{ api.transactions().length }} txns · {{ api.alerts().length }} alerts
                </span>
              </div>

              <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                @if (api.transactions().length === 0) {
                  <p class="text-xs text-zinc-500 text-center py-6">No transfers yet.</p>
                }
                @for (t of api.transactions(); track t.transactionId) {
                  <button
                    type="button"
                    (click)="activeTxnId.set(t.transactionId)"
                    class="w-full text-left p-2.5 rounded-xl bg-[#090A16] hover:bg-[#141526] border border-white/8 transition-colors"
                  >
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-mono-num font-bold text-white">{{ t.transactionId }}</span>
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        [ngClass]="{
                          'bg-emerald-500/15 text-emerald-300': t.status === 'SETTLED',
                          'bg-red-500/15 text-red-300': t.status === 'BLOCKED' || t.status === 'FAILED',
                          'bg-amber-500/15 text-amber-300': t.status === 'HELD',
                          'bg-purple-500/15 text-purple-300': !['SETTLED','BLOCKED','FAILED','HELD'].includes(t.status)
                        }"
                      >
                        {{ t.status }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                      <span class="truncate pr-2">{{ t.senderName }} → {{ t.beneficiaryName }}</span>
                      <span class="font-mono-num text-zinc-200">BDT {{ t.amount | number: '1.0-0' }}</span>
                    </div>
                  </button>
                }
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
})
export class OneScreenTransferComponent implements OnInit {
  readonly api = inject(SimulationApiService);

  senderCustomerId = 'CUST-A';
  beneficiaryCustomerId = 'CUST-B';
  amount = 5000;
  scenarioId = 'normal_banking';
  description = 'Inter-bank transfer';

  readonly submitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);
  readonly activeTxnId = signal<string | null>(null);

  readonly eligibleBeneficiaries = computed(() =>
    this.api.customers().filter((c) => c.customerId !== this.senderCustomerId)
  );

  readonly selectedScenario = computed(
    () => this.api.scenarios().find((s) => s.id === this.scenarioId) || null
  );

  readonly activeTransaction = computed<SimTransaction | null>(() => {
    const id = this.activeTxnId();
    const list = this.api.transactions();
    if (id) return list.find((t) => t.transactionId === id) || list[0] || null;
    return list[0] || null;
  });

  readonly SendIcon = Send;
  readonly ShieldIcon = ShieldCheck;
  readonly BrainIcon = BrainCircuit;
  readonly CheckIcon = CheckCircle2;
  readonly AlertIcon = AlertTriangle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly RotateIcon = RotateCcw;
  readonly BuildingIcon = Building2;
  readonly ArrowRightIcon = ArrowRight;
  readonly WifiIcon = Wifi;
  readonly WifiOffIcon = WifiOff;
  readonly ServerIcon = Server;
  readonly KeyIcon = KeyRound;
  readonly FileCheckIcon = FileCheck2;
  readonly ScaleIcon = Scale;
  readonly LandmarkIcon = Landmark;
  readonly ClipboardIcon = ClipboardCheck;
  readonly LoaderIcon = Loader2;
  readonly CheckMiniIcon = Check;
  readonly MinusIcon = MinusCircle;

  stageIcon(step: number, txn: SimTransaction): LucideIconData {
    switch (step) {
      case 1:
        return this.SendIcon;
      case 2:
        return this.KeyIcon;
      case 3:
        return this.FileCheckIcon;
      case 4:
        return this.BrainIcon;
      case 5:
        return this.ScaleIcon;
      case 6:
        return this.LandmarkIcon;
      case 7:
        if (txn.customerResultState === 'Successful') return this.CheckIcon;
        if (txn.customerResultState === 'Additional Verification Required') return this.AlertIcon;
        if (txn.customerResultState === 'Rejected' || txn.customerResultState === 'Failed') {
          return this.XCircleIcon;
        }
        return this.ClockIcon;
      case 8:
        return this.ClipboardIcon;
      default:
        return this.ClockIcon;
    }
  }

  pipelineProgressPercent(txn: SimTransaction): number {
    const done = txn.stages.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED' || s.status === 'FAILED'
    ).length;
    return Math.round((done / 8) * 100);
  }

  async ngOnInit(): Promise<void> {
    await this.api.connectAndSync({ role: 'CENTRAL_MONITOR' });
  }

  onSenderChange(custId: string): void {
    this.senderCustomerId = custId;
    const list = this.eligibleBeneficiaries();
    if (list.length > 0 && this.beneficiaryCustomerId === custId) {
      this.beneficiaryCustomerId = list[0].customerId;
    }
  }

  onScenarioChange(id: string): void {
    this.scenarioId = id;
    const sc = this.api.scenarios().find((s) => s.id === id);
    if (sc) {
      this.amount = sc.suggestedAmount;
    }
  }

  async sendTransfer(): Promise<void> {
    this.formError.set(null);
    const beneficiary = this.api
      .customers()
      .find((c) => c.customerId === this.beneficiaryCustomerId);
    if (!beneficiary) {
      this.formError.set('Please select a valid beneficiary.');
      return;
    }
    if (!this.amount || this.amount <= 0) {
      this.formError.set('Please enter a valid amount in BDT.');
      return;
    }

    this.submitting.set(true);
    try {
      const idempotencyKey = `ONE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const res = await this.api.submitTransfer({
        idempotencyKey,
        senderCustomerId: this.senderCustomerId,
        receivingBankId: beneficiary.bankId,
        beneficiaryAccountRef: beneficiary.accountRef,
        amount: Number(this.amount),
        currency: 'BDT',
        description: this.description || 'Inter-bank transfer',
        scenarioId: this.scenarioId,
        pin: '1234',
        otp: '482910',
      });
      this.activeTxnId.set(res.transaction.transactionId);
    } catch (err: unknown) {
      this.formError.set(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      this.submitting.set(false);
    }
  }

  async quickReset(): Promise<void> {
    await this.api.resetSimulation('FS-DEMO-ADMIN-2026');
    this.activeTxnId.set(null);
  }
}
