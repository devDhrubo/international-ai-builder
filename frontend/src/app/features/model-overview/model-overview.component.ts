import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Cpu, CheckCircle2, Layers, Database, Plug } from 'lucide-angular';
import { ARTIFACT_MODEL_BENCHMARKS } from '../../core/data/mock-seed.data';

@Component({
  selector: 'app-model-overview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-page-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight gradient-text">
            Model Overview & Registry
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            Evaluation metrics (demo data) & pretrained artifact benchmarks from local model suite
          </p>
        </div>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start">
          <lucide-icon [img]="CheckIcon" class="w-3.5 h-3.5" />
          MODEL READY (DEMO)
        </span>
      </div>

      <!-- Model Metadata + Demo Evaluation Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div class="fs-card p-6 lg:col-span-5 space-y-4">
          <h2 class="text-sm font-semibold text-white flex items-center gap-2">
            <lucide-icon [img]="CpuIcon" class="w-4 h-4 text-purple-400" />
            Active Ensemble Profile
          </h2>
          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between py-2 border-b border-white/6">
              <span class="text-zinc-400">Model Name</span>
              <span class="font-semibold text-white">Silicon-One Fraudshield Hybrid Ensemble</span>
            </div>
            <div class="flex justify-between py-2 border-b border-white/6">
              <span class="text-zinc-400">Architecture</span>
              <span class="text-zinc-200">RFM + NLP + GNN Signal Fusion</span>
            </div>
            <div class="flex justify-between py-2 border-b border-white/6">
              <span class="text-zinc-400">Version</span>
              <span class="font-mono-num text-purple-300">v3.4.0-demo</span>
            </div>
            <div class="flex justify-between py-2 border-b border-white/6">
              <span class="text-zinc-400">Benchmark Dataset</span>
              <span class="text-zinc-200">IEEE-CIS + Synthetic FinTech Stream</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-zinc-400">Last Updated</span>
              <span class="font-mono-num text-zinc-300">2026-11-18</span>
            </div>
          </div>
        </div>

        <div class="fs-card p-6 lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-white flex items-center gap-2">
              <lucide-icon [img]="LayersIcon" class="w-4 h-4 text-fuchsia-400" />
              Demo Evaluation Metrics
            </h2>
            <span class="text-[10px] px-2 py-0.5 rounded bg-white/6 text-zinc-400">Placeholder Demo Evaluation Data</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div class="p-3 rounded-xl bg-[#090A16] border border-white/8">
              <p class="text-[10px] text-zinc-400">Precision</p>
              <p class="font-mono-num text-lg font-bold text-purple-300 mt-0.5">93.8%</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090A16] border border-white/8">
              <p class="text-[10px] text-zinc-400">Recall</p>
              <p class="font-mono-num text-lg font-bold text-emerald-400 mt-0.5">94.5%</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090A16] border border-white/8">
              <p class="text-[10px] text-zinc-400">F1-Score</p>
              <p class="font-mono-num text-lg font-bold text-fuchsia-300 mt-0.5">94.1%</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090A16] border border-white/8">
              <p class="text-[10px] text-zinc-400">ROC-AUC</p>
              <p class="font-mono-num text-lg font-bold text-white mt-0.5">0.923</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090A16] border border-white/8">
              <p class="text-[10px] text-zinc-400">PR-AUC</p>
              <p class="font-mono-num text-lg font-bold text-white mt-0.5">0.908</p>
            </div>
          </div>

          <!-- Confusion Matrix Summary -->
          <div class="grid grid-cols-4 gap-2 text-center text-xs pt-1">
            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div class="text-[10px] text-emerald-300">TP</div>
              <div class="font-mono-num font-bold text-white mt-0.5">1,214</div>
            </div>
            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div class="text-[10px] text-amber-300">FP</div>
              <div class="font-mono-num font-bold text-white mt-0.5">80</div>
            </div>
            <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div class="text-[10px] text-red-300">FN</div>
              <div class="font-mono-num font-bold text-white mt-0.5">71</div>
            </div>
            <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div class="text-[10px] text-purple-300">TN</div>
              <div class="font-mono-num font-bold text-white mt-0.5">18,635</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pretrained Artifact Benchmarks Table -->
      <div class="fs-card p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-semibold text-white flex items-center gap-2">
              <lucide-icon [img]="DbIcon" class="w-4 h-4 text-purple-400" />
              Pretrained Artifact Benchmarks (fraud_artifacts/metrics.json)
            </h2>
            <p class="text-[11px] text-zinc-400">
              Recorded offline evaluation metrics from the workspace's pretrained DistilBERT, GRU, LSTM, RFM+NLP, and classical models
            </p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-white/8 text-[11px] uppercase tracking-wider text-zinc-500">
                <th class="py-2.5 px-3 font-medium">Model</th>
                <th class="py-2.5 px-3 font-medium">Track</th>
                <th class="py-2.5 px-3 font-medium">Threshold</th>
                <th class="py-2.5 px-3 font-medium">F1-Score</th>
                <th class="py-2.5 px-3 font-medium">ROC-AUC</th>
                <th class="py-2.5 px-3 font-medium">F0.5</th>
                <th class="py-2.5 px-3 font-medium">F2</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/6">
              @for (m of benchmarks; track m.name) {
                <tr class="hover:bg-white/4">
                  <td class="py-2.5 px-3 font-semibold text-white">{{ m.name }}</td>
                  <td class="py-2.5 px-3 text-zinc-400">{{ m.group }}</td>
                  <td class="py-2.5 px-3 font-mono-num text-zinc-300">{{ m.threshold !== undefined ? m.threshold.toFixed(3) : '—' }}</td>
                  <td class="py-2.5 px-3 font-mono-num font-semibold text-purple-300">{{ m.f1.toFixed(4) }}</td>
                  <td class="py-2.5 px-3 font-mono-num font-semibold text-emerald-300">{{ m.rocAuc.toFixed(4) }}</td>
                  <td class="py-2.5 px-3 font-mono-num text-zinc-400">{{ m.f05 !== undefined ? m.f05.toFixed(4) : '—' }}</td>
                  <td class="py-2.5 px-3 font-mono-num text-zinc-400">{{ m.f2 !== undefined ? m.f2.toFixed(4) : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Future API Integration Readiness -->
      <div class="fs-card p-5 border-purple-500/25 flex items-start gap-3 text-xs text-zinc-300">
        <lucide-icon [img]="PlugIcon" class="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-white">Pretrained ML Model Integration Readiness</p>
          <p class="text-zinc-400 mt-1">
            All frontend services (<code>MockTransactionService</code>, <code>MockFraudService</code>, <code>MockAnalyticsService</code>) use typed TypeScript interfaces (<code>FraudPrediction</code>, <code>RiskExplanation</code>, <code>ShapContribution</code>) so a FastAPI/PyTorch inference endpoint serving <code>user_rfm_nlp_rf.joblib</code> or <code>distilbert/model.safetensors</code> can be wired in without UI refactoring.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ModelOverviewComponent {
  readonly CpuIcon = Cpu;
  readonly CheckIcon = CheckCircle2;
  readonly LayersIcon = Layers;
  readonly DbIcon = Database;
  readonly PlugIcon = Plug;

  readonly benchmarks = ARTIFACT_MODEL_BENCHMARKS;
}
