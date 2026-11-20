import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  FolderKanban,
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-angular';
import { SimulationApiService } from './services/simulation-api.service';
import { SimCase, SimTransaction } from './services/simulation.models';

@Component({
  selector: 'app-bank-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  providers: [SimulationApiService],
  template: `
    <div class="min-h-screen bg-[#050509] text-slate-100 relative">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <!-- Bank Header -->
      <header class="relative z-10 border-b border-white/8 bg-[#080913]/90 backdrop-blur-xl">
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/35 flex items-center justify-center">
              <lucide-icon [img]="BuildingIcon" class="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-base text-white">
                  {{ activeBank()?.name || 'Bank Operations' }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  TENANT ISOLATED
                </span>
              </div>
              <p class="text-[11px] text-zinc-400">
                Application C · Multi-Bank Operations & Fraud Alert Workspace
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <!-- Bank Workspace Switcher -->
            <div class="flex rounded-xl bg-[#090A16] border border-white/10 p-1">
              @for (b of api.banks(); track b.bankId) {
                <button
                  type="button"
                  (click)="switchBank(b.bankId)"
                  class="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  [ngClass]="
                    selectedBankId() === b.bankId
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  "
                >
                  {{ b.shortName }}
                </button>
              }
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
              (click)="api.syncBootstrap()"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              title="Refresh"
            >
              <lucide-icon [img]="RefreshIcon" class="w-3.5 h-3.5" />
            </button>

            <a
              routerLink="/simulation/control"
              class="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300"
            >
              Control Panel
            </a>
          </div>
        </div>
      </header>

      <main class="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <!-- Bank Overview Metrics -->
        <section class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase text-zinc-400">Outgoing</p>
            <p class="text-xl font-mono-num font-bold text-white mt-1">{{ bankMetrics().outgoing }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase text-zinc-400">Incoming</p>
            <p class="text-xl font-mono-num font-bold text-cyan-300 mt-1">{{ bankMetrics().incoming }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase text-zinc-400">Successful</p>
            <p class="text-xl font-mono-num font-bold text-emerald-400 mt-1">{{ bankMetrics().settled }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase text-zinc-400">Blocked</p>
            <p class="text-xl font-mono-num font-bold text-red-400 mt-1">{{ bankMetrics().blocked }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase text-zinc-400">Under Review</p>
            <p class="text-xl font-mono-num font-bold text-amber-400 mt-1">{{ bankMetrics().held }}</p>
          </div>
          <div class="fs-card p-3.5">
            <p class="text-[10px] uppercase text-zinc-400">Fraud Alerts</p>
            <p class="text-xl font-mono-num font-bold text-fuchsia-400 mt-1">{{ api.alerts().length }}</p>
          </div>
          <div class="fs-card p-3.5 col-span-2 sm:col-span-1">
            <p class="text-[10px] uppercase text-zinc-400">Bank Liquidity</p>
            <p class="text-base font-mono-num font-bold text-white mt-1">
              BDT {{ bankLiquidity() | number: '1.0-0' }}
            </p>
          </div>
        </section>

        <!-- Main Grid: Transactions + Alerts/Cases -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Bank Transaction Management (7 cols) -->
          <section class="lg:col-span-7 fs-card p-5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
              <div>
                <h2 class="font-display font-bold text-sm text-white">Bank Transaction Management</h2>
                <p class="text-[11px] text-zinc-400">
                  Authorized view for {{ activeBank()?.name }} only
                </p>
              </div>

              <div class="flex items-center gap-1.5 bg-[#090A16] p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  (click)="directionFilter.set('ALL')"
                  class="px-2.5 py-1 rounded-lg"
                  [ngClass]="directionFilter() === 'ALL' ? 'bg-purple-600 text-white' : 'text-zinc-400'"
                >
                  All
                </button>
                <button
                  type="button"
                  (click)="directionFilter.set('OUTGOING')"
                  class="px-2.5 py-1 rounded-lg"
                  [ngClass]="directionFilter() === 'OUTGOING' ? 'bg-purple-600 text-white' : 'text-zinc-400'"
                >
                  Outgoing
                </button>
                <button
                  type="button"
                  (click)="directionFilter.set('INCOMING')"
                  class="px-2.5 py-1 rounded-lg"
                  [ngClass]="directionFilter() === 'INCOMING' ? 'bg-purple-600 text-white' : 'text-zinc-400'"
                >
                  Incoming
                </button>
              </div>
            </div>

            <!-- Search & Filters -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div class="relative sm:col-span-1">
                <lucide-icon [img]="SearchIcon" class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search ID or account..."
                  class="w-full pl-8 pr-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>
              <select
                [ngModel]="statusFilter()"
                (ngModelChange)="statusFilter.set($event)"
                class="px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SETTLED">Settled</option>
                <option value="BLOCKED">Blocked</option>
                <option value="HELD">Held / Review</option>
                <option value="AI_ANALYSIS">In AI Analysis</option>
              </select>
              <input
                type="date"
                [ngModel]="dateFilter()"
                (ngModelChange)="dateFilter.set($event)"
                class="px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white outline-none"
              />
            </div>

            <!-- Transaction List -->
            <div class="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              @if (filteredTransactions().length === 0) {
                <p class="text-xs text-zinc-500 text-center py-10">
                  No matching transactions for {{ activeBank()?.name }}.
                </p>
              }
              @for (txn of filteredTransactions(); track txn.transactionId) {
                <div
                  (click)="selectedTxn.set(txn)"
                  class="p-3.5 rounded-xl bg-[#090A16] hover:bg-[#121324] border border-white/8 cursor-pointer transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      @if (txn.senderBankId === selectedBankId()) {
                        <lucide-icon [img]="ArrowUpIcon" class="w-4 h-4 text-amber-400" />
                      } @else {
                        <lucide-icon [img]="ArrowDownIcon" class="w-4 h-4 text-cyan-400" />
                      }
                      <span class="text-xs font-mono-num font-bold text-white">{{ txn.transactionId }}</span>
                      <span class="text-[10px] text-zinc-500">
                        {{ txn.senderBankId === selectedBankId() ? 'OUTGOING' : 'INCOMING' }}
                      </span>
                    </div>
                    <span
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      [ngClass]="{
                        'bg-emerald-500/15 text-emerald-300': txn.status === 'SETTLED',
                        'bg-red-500/15 text-red-300': txn.status === 'BLOCKED' || txn.status === 'FAILED',
                        'bg-amber-500/15 text-amber-300': txn.status === 'HELD',
                        'bg-purple-500/15 text-purple-300': !['SETTLED','BLOCKED','FAILED','HELD'].includes(txn.status)
                      }"
                    >
                      {{ txn.status }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between mt-1.5 text-xs">
                    <span class="text-zinc-400">
                      {{ txn.senderAccountRef }} → {{ txn.beneficiaryAccountRef }}
                    </span>
                    <span class="font-mono-num font-bold text-white">
                      {{ txn.currency }} {{ txn.amount | number: '1.2-2' }}
                    </span>
                  </div>
                </div>
              }
            </div>

            @if (selectedTxn(); as st) {
              <div class="p-4 rounded-xl bg-purple-950/15 border border-purple-500/25 text-xs space-y-1.5">
                <div class="flex justify-between font-semibold text-white">
                  <span>Transaction Detail · {{ st.transactionId }}</span>
                  <span class="text-purple-300">{{ st.status }}</span>
                </div>
                <p class="text-zinc-400">
                  {{ st.senderName }} ({{ st.senderBankName }}) → {{ st.beneficiaryName }} ({{ st.receiverBankName }})
                </p>
                @if (st.modelResult) {
                  <p class="text-zinc-300 font-mono-num">
                    DistilBERT: {{ st.modelResult.prediction }} (p={{ st.modelResult.fraud_probability }})
                    · Decision: {{ st.riskDecision?.decision }}
                  </p>
                }
              </div>
            }
          </section>

          <!-- Right: Fraud Alerts & Investigation Cases (5 cols) -->
          <div class="lg:col-span-5 space-y-6">
            <!-- Fraud Alerts -->
            <section class="fs-card p-5 space-y-3">
              <div class="flex items-center justify-between border-b border-white/8 pb-3">
                <h3 class="font-display font-bold text-sm text-white flex items-center gap-2">
                  <lucide-icon [img]="ShieldAlertIcon" class="w-4 h-4 text-red-400" />
                  Bank Fraud Alerts
                </h3>
                <span class="text-xs font-mono-num text-zinc-400">{{ api.alerts().length }}</span>
              </div>

              @if (api.alerts().length === 0) {
                <p class="text-xs text-zinc-500 py-4 text-center">No alerts for this bank.</p>
              } @else {
                <div class="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  @for (al of api.alerts(); track al.alertId) {
                    <div class="p-3 rounded-xl bg-red-500/5 border border-red-500/25 text-xs space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="font-mono-num font-bold text-white">{{ al.alertId }}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300">
                          {{ al.riskSeverity }} · {{ al.riskDecision }}
                        </span>
                      </div>
                      <p class="text-zinc-300">
                        Txn {{ al.transactionId }} · {{ al.currency }} {{ al.amount | number: '1.2-2' }}
                      </p>
                      <p class="text-[11px] text-zinc-400">
                        Model: {{ al.modelPrediction }} · Case: {{ al.caseId || 'Pending' }}
                      </p>
                    </div>
                  }
                </div>
              }
            </section>

            <!-- Investigation Cases -->
            <section class="fs-card p-5 space-y-3">
              <div class="flex items-center justify-between border-b border-white/8 pb-3">
                <h3 class="font-display font-bold text-sm text-white flex items-center gap-2">
                  <lucide-icon [img]="FolderIcon" class="w-4 h-4 text-purple-400" />
                  Investigation Cases
                </h3>
                <span class="text-xs font-mono-num text-zinc-400">{{ api.cases().length }}</span>
              </div>

              @if (api.cases().length === 0) {
                <p class="text-xs text-zinc-500 py-4 text-center">No open investigation cases.</p>
              } @else {
                <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  @for (c of api.cases(); track c.caseId) {
                    <div class="p-3.5 rounded-xl bg-[#090A16] border border-white/10 text-xs space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="font-mono-num font-bold text-white">{{ c.caseId }}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-300">
                          {{ c.status }}
                        </span>
                      </div>
                      <p class="text-zinc-400">
                        Txn {{ c.transactionId }} · {{ c.currency }} {{ c.amount | number: '1.2-2' }}
                      </p>
                      <div class="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          (click)="updateCase(c, 'IN_REVIEW')"
                          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-[11px] text-zinc-200"
                        >
                          Mark In Review
                        </button>
                        <button
                          type="button"
                          (click)="updateCase(c, 'CLOSED')"
                          class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[11px] text-emerald-300"
                        >
                          Resolve & Close
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class BankDashboardComponent implements OnInit {
  readonly api = inject(SimulationApiService);
  private readonly route = inject(ActivatedRoute);

  readonly selectedBankId = signal<string>('ABC_BANK');
  readonly directionFilter = signal<'ALL' | 'OUTGOING' | 'INCOMING'>('ALL');
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');
  readonly dateFilter = signal<string>('');
  readonly selectedTxn = signal<SimTransaction | null>(null);

  readonly activeBank = computed(
    () => this.api.banks().find((b) => b.bankId === this.selectedBankId()) || null
  );

  readonly bankLiquidity = computed(() =>
    this.api
      .customers()
      .filter((c) => c.bankId === this.selectedBankId())
      .reduce((sum, c) => sum + c.balance, 0)
  );

  readonly bankMetrics = computed(() => {
    const bankId = this.selectedBankId();
    const txns = this.api.transactions();
    return {
      outgoing: txns.filter((t) => t.senderBankId === bankId).length,
      incoming: txns.filter((t) => t.receiverBankId === bankId).length,
      settled: txns.filter((t) => t.status === 'SETTLED').length,
      blocked: txns.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length,
      held: txns.filter((t) => t.status === 'HELD' || t.status === 'AI_UNAVAILABLE_HELD').length,
    };
  });

  readonly filteredTransactions = computed(() => {
    const bankId = this.selectedBankId();
    const dir = this.directionFilter();
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.statusFilter();
    const dt = this.dateFilter();

    return this.api.transactions().filter((t) => {
      if (dir === 'OUTGOING' && t.senderBankId !== bankId) return false;
      if (dir === 'INCOMING' && t.receiverBankId !== bankId) return false;
      if (st !== 'ALL' && t.status !== st) return false;
      if (dt && !t.createdAt.startsWith(dt)) return false;
      if (
        q &&
        !t.transactionId.toLowerCase().includes(q) &&
        !t.senderAccountRef.toLowerCase().includes(q) &&
        !t.beneficiaryAccountRef.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  });

  readonly BuildingIcon = Building2;
  readonly ArrowUpIcon = ArrowUpRight;
  readonly ArrowDownIcon = ArrowDownLeft;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly FolderIcon = FolderKanban;
  readonly SearchIcon = Search;
  readonly WifiIcon = Wifi;
  readonly WifiOffIcon = WifiOff;
  readonly RefreshIcon = RefreshCw;

  async ngOnInit(): Promise<void> {
    const bankParam = this.route.snapshot.queryParamMap.get('bankId');
    if (bankParam === 'ABC_BANK' || bankParam === 'XYZ_BANK') {
      this.selectedBankId.set(bankParam);
    }
    await this.api.connectAndSync({
      role: 'BANK',
      bankId: this.selectedBankId(),
    });
  }

  async switchBank(bankId: string): Promise<void> {
    this.selectedBankId.set(bankId);
    this.selectedTxn.set(null);
    await this.api.switchTenant({ role: 'BANK', bankId });
  }

  async updateCase(c: SimCase, status: string): Promise<void> {
    await this.api.updateCase(c.caseId, {
      status,
      analystNote: `Status updated to ${status} from ${this.selectedBankId()} workspace.`,
    });
  }
}
