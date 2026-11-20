import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#050509] text-[#F8FAFC] relative overflow-hidden flex flex-col lg:flex-row">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <!-- Left Panel: Brand, 3D Shield & Telemetry Visual -->
      <div class="relative z-10 lg:w-[46%] xl:w-[48%] p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/8 bg-[#080913]/70 backdrop-blur-2xl">
        <!-- Brand Logo -->
        <a routerLink="/" class="inline-flex items-center gap-3 self-start group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 p-[1px] shadow-[0_0_24px_rgba(168,85,247,0.45)]">
            <div class="w-full h-full rounded-[11px] bg-[#080913] flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
                <path
                  d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
                  stroke="url(#authShieldGrad)"
                  stroke-width="1.8"
                />
                <circle cx="12" cy="11.5" r="2.2" fill="#D946EF" />
                <path d="M12 7V9.3M12 13.7V16M8.5 11.5H9.8M14.2 11.5H15.5" stroke="#A855F7" stroke-width="1.5" stroke-linecap="round" />
                <defs>
                  <linearGradient id="authShieldGrad" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#A855F7" />
                    <stop offset="1" stop-color="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div>
            <span class="font-display font-bold text-lg tracking-tight text-white">
              Silicon-One <span class="text-purple-400">Fraudshield</span>
            </span>
            <span class="block text-[10px] tracking-widest uppercase text-zinc-500">Financial Intelligence</span>
          </div>
        </a>

        <!-- Center Visual + Copy -->
        <div class="my-10 lg:my-0 space-y-8">
          <div class="space-y-3 max-w-md">
            <h1 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Intelligence that protects <span class="gradient-text">every transaction.</span>
            </h1>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Access your financial intelligence workspace and stay ahead of evolving fraud threats.
            </p>
          </div>

          <!-- Abstract 3D Shield & Subtle Financial Telemetry -->
          <div class="relative max-w-md">
            <div class="absolute -inset-6 bg-gradient-to-tr from-purple-600/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative fs-card p-6 border-purple-500/25 flex items-center gap-6">
              <svg viewBox="0 0 120 136" class="w-24 h-28 shrink-0 drop-shadow-[0_12px_28px_rgba(168,85,247,0.45)]" fill="none">
                <path
                  d="M60 6 L110 26 V64 C110 96 88 122 60 131 C32 122 10 96 10 64 V26 L60 6 Z"
                  fill="url(#authGlass)"
                  stroke="url(#authEdge)"
                  stroke-width="1.8"
                />
                <circle cx="60" cy="66" r="21" stroke="rgba(217,70,239,0.5)" stroke-width="1.2" stroke-dasharray="4 3" />
                <circle cx="60" cy="66" r="9" fill="#D946EF" fill-opacity="0.35" />
                <circle cx="60" cy="66" r="3.5" fill="#F8FAFC" />
                <defs>
                  <linearGradient id="authGlass" x1="10" y1="6" x2="110" y2="131" gradientUnits="userSpaceOnUse">
                    <stop stop-color="rgba(168,85,247,0.28)" />
                    <stop offset="1" stop-color="rgba(236,72,153,0.16)" />
                  </linearGradient>
                  <linearGradient id="authEdge" x1="10" y1="6" x2="110" y2="131" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#E9D5FF" />
                    <stop offset="1" stop-color="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>

              <div class="flex-1 space-y-3 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Real-Time Scoring</span>
                  <span class="font-mono-num font-semibold text-emerald-400">99.98% Uptime</span>
                </div>
                <div class="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div class="h-full w-4/5 gradient-accent-bar rounded-full"></div>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div class="p-2 rounded-xl bg-[#090A16] border border-white/6">
                    <p class="text-[10px] text-zinc-500">Avg Latency</p>
                    <p class="font-mono-num font-bold text-white">12 ms</p>
                  </div>
                  <div class="p-2 rounded-xl bg-[#090A16] border border-white/6">
                    <p class="text-[10px] text-zinc-500">Explainability</p>
                    <p class="font-mono-num font-bold text-purple-300">SHAP + GNN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Meta -->
        <div class="hidden lg:flex items-center justify-between text-[11px] text-zinc-500">
          <span>Enterprise Financial Risk Platform</span>
          <span>TLS 1.3 • Workspace Isolation</span>
        </div>
      </div>

      <!-- Right Panel: Form Content -->
      <div class="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div class="w-full max-w-md animate-page-in">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
