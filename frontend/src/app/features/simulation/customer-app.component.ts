import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ShieldCheck,
  Send,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Building2,
  UserCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
} from 'lucide-angular';
import { SimulationApiService } from './services/simulation-api.service';
import { SimTransaction } from './services/simulation.models';

@Component({
  selector: 'app-customer-sim',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  providers: [SimulationApiService],
  template: `
    <div class="min-h-screen bg-[#050509] text-slate-100 relative">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <!-- Top Bar -->
      <header class="relative z-10 border-b border-white/8 bg-[#080913]/90 backdrop-blur-xl">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center border border-white/15"
              [style.background]="activeBank()?.accentColor === '#06B6D4' ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.18)'"
            >
              <lucide-icon [img]="BuildingIcon" class="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-sm sm:text-base text-white">
                  {{ activeCustomer()?.bankName || 'Digital Banking' }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  SIMULATED BANKING
                </span>
              </div>
              <p class="text-[11px] text-zinc-400">Application A · Customer Internet Banking</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Connection Status -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
              <lucide-icon
                [img]="api.connectionStatus() === 'connected' ? WifiIcon : WifiOffIcon"
                class="w-3.5 h-3.5"
                [ngClass]="api.connectionStatus() === 'connected' ? 'text-emerald-400' : 'text-amber-400'"
              />
              <span class="capitalize text-zinc-300">{{ api.connectionStatus() }}</span>
            </div>

            <a
              routerLink="/simulation/control"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 transition-colors"
            >
              Control Panel
            </a>
          </div>
        </div>
      </header>

      <main class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <!-- Customer Profile Selector -->
        <section class="fs-card p-4 sm:p-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Synthetic Customer Profile
              </h2>
              <p class="text-xs text-zinc-500 mt-0.5">
                Select a synthetic customer account (no real banking credentials used)
              </p>
            </div>
            <button
              type="button"
              (click)="api.syncBootstrap()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 self-start"
            >
              <lucide-icon [img]="RefreshIcon" class="w-3.5 h-3.5" />
              Refresh Balance
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (cust of api.customers(); track cust.customerId) {
              <button
                type="button"
                (click)="selectCustomer(cust.customerId)"
                class="text-left p-3.5 rounded-xl border transition-all"
                [ngClass]="
                  selectedCustomerId() === cust.customerId
                    ? 'bg-purple-500/15 border-purple-500/50 shadow-[0_0_24px_-8px_rgba(168,85,247,0.5)]'
                    : 'bg-[#090A16] border-white/8 hover:border-white/20'
                "
              >
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono-num text-purple-300 font-semibold">
                    {{ cust.customerId }}
                  </span>
                  <span class="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/15 text-emerald-300">
                    {{ cust.status }}
                  </span>
                </div>
                <p class="text-sm font-semibold text-white mt-1">{{ cust.customerName }}</p>
                <p class="text-[11px] text-zinc-400">{{ cust.bankName }}</p>
                <p class="text-[11px] font-mono-num text-zinc-500 mt-0.5">{{ cust.accountRef }}</p>
                <p class="text-sm font-mono-num font-bold text-emerald-400 mt-2">
                  {{ cust.currency }} {{ cust.balance | number: '1.2-2' }}
                </p>
              </button>
            }
          </div>
        </section>

        <!-- Main Grid: Send Money + Live Progress / Recent Transactions -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Send Money Wizard -->
          <section class="lg:col-span-7 fs-card p-5 sm:p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <h1 class="font-display font-bold text-lg text-white flex items-center gap-2">
                  <lucide-icon [img]="SendIcon" class="w-4 h-4 text-purple-400" />
                  Send Money (Inter-Bank Transfer)
                </h1>
                <p class="text-xs text-zinc-400 mt-0.5">
                  Protected by real-time DistilBERT behavioral fraud intelligence
                </p>
              </div>
              @if (activeCustomer(); as c) {
                <div class="text-right">
                  <span class="text-[10px] uppercase tracking-wider text-zinc-500 block">Available</span>
                  <span class="text-base font-mono-num font-bold text-white">
                    BDT {{ c.balance | number: '1.2-2' }}
                  </span>
                </div>
              }
            </div>

            <!-- Stepper Indicator -->
            <div class="flex items-center gap-2 text-xs">
              <span
                class="px-2.5 py-1 rounded-lg font-medium"
                [ngClass]="wizardStep() === 'form' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-zinc-400'"
              >
                1. Transfer Details
              </span>
              <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5 text-zinc-600" />
              <span
                class="px-2.5 py-1 rounded-lg font-medium"
                [ngClass]="wizardStep() === 'auth' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-zinc-400'"
              >
                2. Review & Authenticate
              </span>
              <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5 text-zinc-600" />
              <span
                class="px-2.5 py-1 rounded-lg font-medium"
                [ngClass]="wizardStep() === 'progress' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-zinc-400'"
              >
                3. Live Processing
              </span>
            </div>

            @if (formError()) {
              <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {{ formError() }}
              </div>
            }

            <!-- STEP 1: FORM -->
            @if (wizardStep() === 'form') {
              <div class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-zinc-400 mb-1.5">Sender Account</label>
                    <div class="px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-zinc-200 font-mono-num">
                      {{ activeCustomer()?.accountRef }} · {{ activeCustomer()?.customerName }}
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-zinc-400 mb-1.5">Receiving Bank</label>
                    <select
                      [(ngModel)]="receivingBankId"
                      (ngModelChange)="onReceivingBankChange($event)"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
                    >
                      @for (bank of api.banks(); track bank.bankId) {
                        <option [value]="bank.bankId">{{ bank.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-zinc-400 mb-1.5">Beneficiary Account</label>
                    <select
                      [(ngModel)]="beneficiaryAccountRef"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white font-mono-num focus:border-purple-500 outline-none"
                    >
                      @for (b of eligibleBeneficiaries(); track b.customerId) {
                        <option [value]="b.accountRef">
                          {{ b.accountRef }} · {{ b.customerName }}
                        </option>
                      }
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-zinc-400 mb-1.5">Amount (BDT)</label>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="amount"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white font-mono-num focus:border-purple-500 outline-none"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-zinc-400 mb-1.5">Transaction Description</label>
                  <input
                    type="text"
                    [(ngModel)]="description"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
                    placeholder="Supplier invoice settlement"
                  />
                </div>

                <!-- Controlled Testing Scenario -->
                <div class="p-4 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2">
                  <label class="block text-xs font-semibold text-purple-300">
                    Behavioral Test Scenario (Controlled Testing)
                  </label>
                  <select
                    [(ngModel)]="scenarioId"
                    (ngModelChange)="onScenarioChange($event)"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:border-purple-500 outline-none"
                  >
                    @for (sc of api.scenarios(); track sc.id) {
                      <option [value]="sc.id">{{ sc.name }} ({{ sc.category }})</option>
                    }
                  </select>
                  @if (selectedScenario(); as sc) {
                    <p class="text-[11px] text-zinc-400">{{ sc.description }}</p>
                  }
                </div>

                <div class="flex justify-end pt-2">
                  <button
                    type="button"
                    (click)="proceedToReview()"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-semibold text-white shadow-lg transition-all"
                  >
                    Review Transfer
                    <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            }

            <!-- STEP 2: REVIEW & AUTHENTICATE -->
            @if (wizardStep() === 'auth') {
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-[#090A16] border border-white/10 space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-zinc-400">From</span>
                    <span class="font-mono-num text-white">{{ activeCustomer()?.accountRef }} ({{ activeCustomer()?.bankName }})</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">To</span>
                    <span class="font-mono-num text-white">{{ beneficiaryAccountRef }} ({{ receivingBankName() }})</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Amount</span>
                    <span class="font-mono-num font-bold text-purple-300">BDT {{ amount | number: '1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Scenario</span>
                    <span class="text-zinc-200">{{ selectedScenario()?.name }}</span>
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div class="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <lucide-icon [img]="LockIcon" class="w-4 h-4" />
                    Simulated PIN & OTP Verification (Demo Only)
                  </div>
                  <p class="text-[11px] text-zinc-400">
                    Enter synthetic demo PIN (<code class="text-zinc-200">1234</code>) and OTP (<code class="text-zinc-200">482910</code>). Never enter real banking credentials.
                  </p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Simulated PIN</label>
                      <input
                        type="password"
                        [(ngModel)]="pin"
                        class="w-full px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white font-mono-num"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Simulated OTP</label>
                      <input
                        type="text"
                        [(ngModel)]="otp"
                        class="w-full px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white font-mono-num"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    (click)="wizardStep.set('form')"
                    class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    [disabled]="submitting()"
                    (click)="submitTransfer()"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg"
                  >
                    <lucide-icon [img]="ShieldIcon" class="w-4 h-4" />
                    {{ submitting() ? 'Submitting...' : 'Authenticate & Send Money' }}
                  </button>
                </div>
              </div>
            }

            <!-- STEP 3: LIVE TRANSACTION PROGRESS -->
            @if (wizardStep() === 'progress' && activeTransaction(); as txn) {
              <div class="space-y-4">
                <!-- Result Banner -->
                <div
                  class="p-4 rounded-xl border flex items-start gap-3"
                  [ngClass]="{
                    'bg-purple-500/10 border-purple-500/30': txn.customerResultState === 'Processing',
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
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold text-white">{{ txn.customerResultState }}</span>
                      <span class="text-xs font-mono-num text-zinc-400">{{ txn.transactionId }}</span>
                    </div>
                    <p class="text-xs text-zinc-300 mt-1">{{ txn.customerMessage }}</p>
                  </div>
                </div>

                <!-- 7-Stage Customer Progress -->
                <div class="space-y-2">
                  @for (st of customerStages(txn); track st.step) {
                    <div
                      class="flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs"
                      [ngClass]="{
                        'bg-emerald-500/5 border-emerald-500/25 text-emerald-200': st.status === 'COMPLETED',
                        'bg-purple-500/12 border-purple-500/40 text-white': st.status === 'IN_PROGRESS',
                        'bg-red-500/10 border-red-500/30 text-red-200': st.status === 'FAILED',
                        'bg-[#090A16] border-white/6 text-zinc-500': st.status === 'PENDING' || st.status === 'SKIPPED'
                      }"
                    >
                      <div class="flex items-center gap-2.5">
                        <span class="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center text-[10px] font-mono-num">
                          {{ st.step }}
                        </span>
                        <span class="font-medium">{{ st.label }}</span>
                      </div>
                      <span class="text-[11px] font-mono-num">{{ st.status }}</span>
                    </div>
                  }
                </div>

                <div class="flex justify-end pt-2">
                  <button
                    type="button"
                    (click)="startNewTransfer()"
                    class="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-semibold text-white"
                  >
                    New Transfer
                  </button>
                </div>
              </div>
            }
          </section>

          <!-- Right: Recent Transactions -->
          <section class="lg:col-span-5 fs-card p-5 sm:p-6 flex flex-col">
            <div class="flex items-center justify-between border-b border-white/8 pb-4 mb-4">
              <div>
                <h2 class="font-display font-bold text-base text-white">Recent Transactions</h2>
                <p class="text-xs text-zinc-400">Live synchronized account history</p>
              </div>
              <span class="text-xs font-mono-num text-zinc-400">
                {{ api.transactions().length }} items
              </span>
            </div>

            <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[520px] pr-1">
              @if (api.transactions().length === 0) {
                <div class="text-center py-12 text-xs text-zinc-500">
                  No transactions yet for this customer. Initiate a transfer to begin.
                </div>
              }
              @for (txn of api.transactions(); track txn.transactionId) {
                <div
                  (click)="inspectTransaction(txn)"
                  class="p-3.5 rounded-xl bg-[#090A16] hover:bg-[#121324] border border-white/8 cursor-pointer transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono-num font-semibold text-white">
                      {{ txn.transactionId }}
                    </span>
                    <span
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      [ngClass]="{
                        'bg-emerald-500/15 text-emerald-300': txn.customerResultState === 'Successful',
                        'bg-purple-500/15 text-purple-300': txn.customerResultState === 'Processing',
                        'bg-amber-500/15 text-amber-300': txn.customerResultState === 'Additional Verification Required',
                        'bg-red-500/15 text-red-300': txn.customerResultState === 'Rejected' || txn.customerResultState === 'Failed'
                      }"
                    >
                      {{ txn.customerResultState }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between mt-1.5 text-xs">
                    <span class="text-zinc-400 truncate max-w-[180px]">
                      To: {{ txn.beneficiaryName }} ({{ txn.receiverBankName }})
                    </span>
                    <span class="font-mono-num font-bold text-white">
                      {{ txn.currency }} {{ txn.amount | number: '1.2-2' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between mt-1 text-[10px] text-zinc-500">
                    <span>{{ txn.createdAt | date: 'mediumTime' }}</span>
                    <span class="inline-flex items-center gap-1 text-purple-300">
                      <lucide-icon [img]="EyeIcon" class="w-3 h-3" />
                      View progress
                    </span>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
})
export class CustomerAppComponent implements OnInit {
  readonly api = inject(SimulationApiService);
  private readonly route = inject(ActivatedRoute);

  readonly selectedCustomerId = signal<string>('CUST-A');
  readonly wizardStep = signal<'form' | 'auth' | 'progress'>('form');
  readonly activeTxnId = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);

  receivingBankId = 'XYZ_BANK';
  beneficiaryAccountRef = 'XYZ-2004-3190';
  amount = 5000;
  description = 'Supplier payment';
  scenarioId = 'normal_banking';
  pin = '1234';
  otp = '482910';

  readonly activeCustomer = computed(
    () => this.api.customers().find((c) => c.customerId === this.selectedCustomerId()) || null
  );

  readonly activeBank = computed(() => {
    const c = this.activeCustomer();
    return c ? this.api.banks().find((b) => b.bankId === c.bankId) || null : null;
  });

  readonly eligibleBeneficiaries = computed(() =>
    this.api
      .customers()
      .filter(
        (c) => c.bankId === this.receivingBankId && c.customerId !== this.selectedCustomerId()
      )
  );

  readonly selectedScenario = computed(
    () => this.api.scenarios().find((s) => s.id === this.scenarioId) || null
  );

  readonly activeTransaction = computed(
    () => this.api.transactions().find((t) => t.transactionId === this.activeTxnId()) || null
  );

  // Icons
  readonly BuildingIcon = Building2;
  readonly WifiIcon = Wifi;
  readonly WifiOffIcon = WifiOff;
  readonly RefreshIcon = RefreshCw;
  readonly SendIcon = Send;
  readonly ArrowRightIcon = ArrowRight;
  readonly LockIcon = Lock;
  readonly ShieldIcon = ShieldCheck;
  readonly CheckIcon = CheckCircle2;
  readonly AlertIcon = AlertTriangle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly UserCheckIcon = UserCheck;
  readonly EyeIcon = Eye;

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const custParam = params.get('customerId');
    const bankParam = params.get('receivingBankId');
    const scenParam = params.get('scenarioId');

    if (custParam) this.selectedCustomerId.set(custParam);
    if (bankParam) this.receivingBankId = bankParam;
    if (scenParam) this.scenarioId = scenParam;

    await this.api.connectAndSync({
      role: 'CUSTOMER',
      customerId: this.selectedCustomerId(),
    });
    this.ensureValidBeneficiary();
  }

  async selectCustomer(customerId: string): Promise<void> {
    this.selectedCustomerId.set(customerId);
    this.wizardStep.set('form');
    this.activeTxnId.set(null);
    await this.api.switchTenant({ role: 'CUSTOMER', customerId });
    this.ensureValidBeneficiary();
  }

  onReceivingBankChange(bankId: string): void {
    this.receivingBankId = bankId;
    this.ensureValidBeneficiary();
  }

  onScenarioChange(id: string): void {
    this.scenarioId = id;
    const sc = this.api.scenarios().find((s) => s.id === id);
    if (sc) {
      this.amount = sc.suggestedAmount;
    }
  }

  private ensureValidBeneficiary(): void {
    const list = this.eligibleBeneficiaries();
    if (list.length > 0 && !list.some((b) => b.accountRef === this.beneficiaryAccountRef)) {
      this.beneficiaryAccountRef = list[0].accountRef;
    }
  }

  receivingBankName(): string {
    return this.api.banks().find((b) => b.bankId === this.receivingBankId)?.name || this.receivingBankId;
  }

  proceedToReview(): void {
    this.formError.set(null);
    if (!this.amount || this.amount <= 0) {
      this.formError.set('Please enter a valid transfer amount in BDT.');
      return;
    }
    if (!this.beneficiaryAccountRef) {
      this.formError.set('Please select a beneficiary account.');
      return;
    }
    this.wizardStep.set('auth');
  }

  async submitTransfer(): Promise<void> {
    this.formError.set(null);
    this.submitting.set(true);
    try {
      const idempotencyKey = `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await this.api.submitTransfer({
        idempotencyKey,
        senderCustomerId: this.selectedCustomerId(),
        receivingBankId: this.receivingBankId,
        beneficiaryAccountRef: this.beneficiaryAccountRef,
        amount: Number(this.amount),
        currency: 'BDT',
        description: this.description || 'Inter-bank funds transfer',
        scenarioId: this.scenarioId,
        pin: this.pin,
        otp: this.otp,
      });
      this.activeTxnId.set(res.transaction.transactionId);
      this.wizardStep.set('progress');
    } catch (err: unknown) {
      this.formError.set(err instanceof Error ? err.message : 'Transfer submission failed');
    } finally {
      this.submitting.set(false);
    }
  }

  inspectTransaction(txn: SimTransaction): void {
    this.activeTxnId.set(txn.transactionId);
    this.wizardStep.set('progress');
  }

  startNewTransfer(): void {
    this.activeTxnId.set(null);
    this.wizardStep.set('form');
  }

  customerStages(txn: SimTransaction): { step: number; label: string; status: string }[] {
    const labels = [
      'Transaction Submitted',
      'Authentication',
      'Transaction Validation',
      'AI Fraud Analysis',
      'Risk Decision',
      'Banking Processing',
      'Transaction Result',
    ];
    return labels.map((label, i) => {
      const st = txn.stages.find((s) => s.step === i + 1);
      return {
        step: i + 1,
        label,
        status: st ? st.status : 'PENDING',
      };
    });
  }
}
