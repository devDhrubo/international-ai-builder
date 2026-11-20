import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ExternalLink,
  RotateCcw,
  Server,
  Sparkles,
  Building2,
  UserCheck,
  Activity,
  Terminal,
  ArrowLeft,
} from 'lucide-angular';
import { SimulationApiService } from './services/simulation-api.service';

@Component({
  selector: 'app-presenter-control',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  providers: [SimulationApiService],
  template: `
    <div class="min-h-screen bg-[#050509] text-slate-100 relative">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <header class="relative z-10 border-b border-white/8 bg-[#080913]/90 backdrop-blur-xl">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
              <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 class="font-display font-bold text-base text-white">
                Presenter Control & Scenario Console
              </h1>
              <p class="text-[11px] text-zinc-400">
                Launch synchronized multi-bank & AI fraud simulation screens
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a
              routerLink="/simulation"
              class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white"
            >
              One-Screen Mode
            </a>
            <a
              routerLink="/"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300"
            >
              <lucide-icon [img]="ArrowLeftIcon" class="w-3.5 h-3.5" />
              Back to Silicon-One Fraudshield
            </a>
          </div>
        </div>
      </header>

      <main class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <!-- Service Health & Quick Launch -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Configure & Launch -->
          <section class="lg:col-span-7 fs-card p-6 space-y-5">
            <h2 class="font-display font-bold text-base text-white">
              Synchronized Demonstration Setup
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Synthetic Customer</label>
                <select
                  [(ngModel)]="selectedCustomerId"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white"
                >
                  @for (c of api.customers(); track c.customerId) {
                    <option [value]="c.customerId">
                      {{ c.customerId }} · {{ c.customerName }} ({{ c.bankName }})
                    </option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Receiving Bank</label>
                <select
                  [(ngModel)]="selectedReceivingBankId"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white"
                >
                  @for (b of api.banks(); track b.bankId) {
                    <option [value]="b.bankId">{{ b.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">
                Controlled Test Scenario (Supplies behavioral events only — never forces prediction)
              </label>
              <select
                [(ngModel)]="selectedScenarioId"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white"
              >
                @for (sc of api.scenarios(); track sc.id) {
                  <option [value]="sc.id">{{ sc.name }} — {{ sc.category }}</option>
                }
              </select>
            </div>

            <!-- Launch Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                (click)="openCustomerApp()"
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-semibold text-white"
              >
                <span class="flex items-center gap-2">
                  <lucide-icon [img]="UserCheckIcon" class="w-4 h-4" />
                  Open App A: Customer Banking
                </span>
                <lucide-icon [img]="ExternalLinkIcon" class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                (click)="openRoute('/simulation/monitor')"
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-[#151626] hover:bg-[#1e2036] border border-purple-500/35 text-xs font-semibold text-white"
              >
                <span class="flex items-center gap-2">
                  <lucide-icon [img]="ActivityIcon" class="w-4 h-4 text-purple-400" />
                  Open App B: Central AI Monitor
                </span>
                <lucide-icon [img]="ExternalLinkIcon" class="w-3.5 h-3.5 text-zinc-400" />
              </button>

              <button
                type="button"
                (click)="openRoute('/simulation/bank', { bankId: 'ABC_BANK' })"
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-[#090A16] hover:bg-[#151626] border border-white/12 text-xs font-semibold text-zinc-200"
              >
                <span class="flex items-center gap-2">
                  <lucide-icon [img]="BuildingIcon" class="w-4 h-4 text-purple-400" />
                  Open App C: ABC Bank Dashboard
                </span>
                <lucide-icon [img]="ExternalLinkIcon" class="w-3.5 h-3.5 text-zinc-400" />
              </button>

              <button
                type="button"
                (click)="openRoute('/simulation/bank', { bankId: 'XYZ_BANK' })"
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-[#090A16] hover:bg-[#151626] border border-white/12 text-xs font-semibold text-zinc-200"
              >
                <span class="flex items-center gap-2">
                  <lucide-icon [img]="BuildingIcon" class="w-4 h-4 text-cyan-400" />
                  Open App C: XYZ Bank Dashboard
                </span>
                <lucide-icon [img]="ExternalLinkIcon" class="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
          </section>

          <!-- Right: Model Service Health & Reset -->
          <section class="lg:col-span-5 fs-card p-6 space-y-5">
            <h2 class="font-display font-bold text-base text-white flex items-center gap-2">
              <lucide-icon [img]="ServerIcon" class="w-4 h-4 text-emerald-400" />
              System & Model Service Health
            </h2>

            <div class="space-y-2.5 text-xs">
              <div class="p-3 rounded-xl bg-[#090A16] border border-white/8 flex justify-between">
                <span class="text-zinc-400">Node.js Orchestrator</span>
                <span class="font-semibold" [ngClass]="api.error() ? 'text-red-400' : 'text-emerald-400'">
                  {{ api.error() ? 'DISCONNECTED' : 'HEALTHY (Port 4000)' }}
                </span>
              </div>
              <div class="p-3 rounded-xl bg-[#090A16] border border-white/8 flex justify-between">
                <span class="text-zinc-400">Python DistilBERT Service</span>
                <span class="font-semibold" [ngClass]="api.aiHealth()?.model_loaded ? 'text-emerald-400' : 'text-red-400'">
                  {{ api.aiHealth()?.model_loaded ? 'LOADED (Port 8001)' : 'UNAVAILABLE' }}
                </span>
              </div>
              @if (api.aiHealth(); as health) {
                <div class="p-3 rounded-xl bg-[#090A16] border border-white/8 flex justify-between font-mono-num">
                  <span class="text-zinc-400">Threshold / Max Seq</span>
                  <span class="text-zinc-200">{{ health.calibrated_threshold | number: '1.4-4' }} / {{ health.max_sequence_length }}</span>
                </div>
              }
            </div>

            <!-- Admin Reset -->
            <div class="pt-3 border-t border-white/8 space-y-2.5">
              <label class="block text-xs font-medium text-zinc-400">
                Reset Synthetic Balances & Simulation Data (Admin Only)
              </label>
              <div class="flex gap-2">
                <input
                  type="password"
                  [(ngModel)]="adminKey"
                  placeholder="Demo Admin Key"
                  class="flex-1 px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white font-mono-num"
                />
                <button
                  type="button"
                  (click)="resetAll()"
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-xs font-semibold text-red-300"
                >
                  <lucide-icon [img]="RotateIcon" class="w-3.5 h-3.5" />
                  Reset Data
                </button>
              </div>
              @if (resetMessage()) {
                <p class="text-[11px] text-emerald-300">{{ resetMessage() }}</p>
              }
            </div>
          </section>
        </div>

        <!-- Test Scenario Management & Behavioral Sequences -->
        <section class="fs-card p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-white/8 pb-3">
            <div>
              <h2 class="font-display font-bold text-base text-white flex items-center gap-2">
                <lucide-icon [img]="TerminalIcon" class="w-4 h-4 text-purple-400" />
                Test Scenario Behavioral Sequences
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">
                Inspect the exact anonymized banking API action sequences supplied to the DistilBERT model for each scenario
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (sc of api.scenarios(); track sc.id) {
              <div class="p-4 rounded-xl bg-[#090A16] border border-white/8 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-white">{{ sc.name }}</span>
                  <span class="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/15 text-purple-300">
                    {{ sc.category }}
                  </span>
                </div>
                <p class="text-[11px] text-zinc-400">{{ sc.description }}</p>
                <div class="p-2.5 rounded-lg bg-black/40 border border-white/6 font-mono-num text-[10px] text-zinc-300 break-words">
                  {{ sc.behavioralEvents.join(' ') }}
                </div>
              </div>
            }
          </div>
        </section>
      </main>
    </div>
  `,
})
export class PresenterControlComponent implements OnInit {
  readonly api = inject(SimulationApiService);

  selectedCustomerId = 'CUST-A';
  selectedReceivingBankId = 'XYZ_BANK';
  selectedScenarioId = 'normal_banking';
  adminKey = 'FS-DEMO-ADMIN-2026';
  readonly resetMessage = signal<string | null>(null);

  readonly ExternalLinkIcon = ExternalLink;
  readonly RotateIcon = RotateCcw;
  readonly ServerIcon = Server;
  readonly SparklesIcon = Sparkles;
  readonly BuildingIcon = Building2;
  readonly UserCheckIcon = UserCheck;
  readonly ActivityIcon = Activity;
  readonly TerminalIcon = Terminal;
  readonly ArrowLeftIcon = ArrowLeft;

  async ngOnInit(): Promise<void> {
    await this.api.connectAndSync({ role: 'CONTROL_PANEL' });
  }

  openCustomerApp(): void {
    this.openRoute('/simulation/customer', {
      customerId: this.selectedCustomerId,
      receivingBankId: this.selectedReceivingBankId,
      scenarioId: this.selectedScenarioId,
    });
  }

  openRoute(path: string, queryParams: Record<string, string> = {}): void {
    const qs = new URLSearchParams(queryParams).toString();
    const url = qs ? `${path}?${qs}` : path;
    window.open(url, '_blank', 'noopener');
  }

  async resetAll(): Promise<void> {
    this.resetMessage.set(null);
    try {
      const res = await this.api.resetSimulation(this.adminKey);
      this.resetMessage.set(res.message);
    } catch (err: unknown) {
      this.resetMessage.set(err instanceof Error ? err.message : 'Reset failed');
    }
  }
}
