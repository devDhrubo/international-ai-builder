import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Bot,
  Send,
  Copy,
  Sparkles,
  User,
  ShieldAlert,
} from 'lucide-angular';
import { FraudStoreService } from '../../core/state/fraud-store.service';
import { MockAiService } from '../../core/services/mock-ai.service';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  referencedTxnIds?: string[];
  followUps?: string[];
}

@Component({
  selector: 'app-analyst-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RiskBadgeComponent],
  template: `
    <div class="space-y-5 animate-page-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight gradient-text">
            Analyst Copilot
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            Context-aware fraud investigation assistant backed by live local telemetry (Ready for Gemini API)
          </p>
        </div>

        <select
          [ngModel]="store.selectedExplainTransactionId()"
          (ngModelChange)="store.selectedExplainTransactionId.set($event)"
          class="px-3.5 py-2 rounded-xl bg-[#10111D] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/50"
        >
          @for (t of store.transactions().slice(0, 20); track t.id) {
            <option [value]="t.id">Context: {{ t.id }} (\${{ t.amount | number: '1.0-0' }})</option>
          }
        </select>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <!-- Conversation Panel -->
        <div class="fs-card xl:col-span-8 flex flex-col h-[620px] overflow-hidden">
          <!-- Suggested Prompts -->
          <div class="px-4 py-3 border-b border-white/8 bg-[#090A16]/70 flex flex-wrap gap-2">
            @for (p of suggestedPrompts; track p) {
              <button
                type="button"
                (click)="sendPrompt(p)"
                class="px-2.5 py-1 rounded-lg bg-purple-500/12 hover:bg-purple-500/25 border border-purple-500/25 text-[11px] text-purple-200 transition-colors"
              >
                {{ p }}
              </button>
            }
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            @for (msg of messages(); track msg.id) {
              <div class="flex gap-3" [class.justify-end]="msg.role === 'user'">
                @if (msg.role === 'assistant') {
                  <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shrink-0">
                    <lucide-icon [img]="BotIcon" class="w-4 h-4 text-white" />
                  </div>
                }

                <div
                  class="max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2.5"
                  [ngClass]="
                    msg.role === 'user'
                      ? 'bg-purple-600/25 border border-purple-500/35 text-white'
                      : 'bg-[#090A16] border border-white/8 text-zinc-200'
                  "
                >
                  <div class="whitespace-pre-line">{{ msg.content }}</div>

                  @if (msg.referencedTxnIds?.length) {
                    <div class="flex flex-wrap items-center gap-1.5 pt-1">
                      <span class="text-[10px] text-zinc-500">Evidence:</span>
                      @for (id of msg.referencedTxnIds; track id) {
                        <button
                          type="button"
                          (click)="store.openTransactionDrawer(id)"
                          class="px-2 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/30 text-[10px] font-mono-num text-purple-300 border border-purple-500/25"
                        >
                          {{ id }}
                        </button>
                      }
                    </div>
                  }

                  @if (msg.followUps?.length) {
                    <div class="flex flex-wrap gap-1.5 pt-1">
                      @for (f of msg.followUps; track f) {
                        <button
                          type="button"
                          (click)="sendPrompt(f)"
                          class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-zinc-300 border border-white/8"
                        >
                          {{ f }}
                        </button>
                      }
                    </div>
                  }

                  <div class="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>{{ msg.timestamp | date: 'shortTime' }}</span>
                    @if (msg.role === 'assistant') {
                      <button
                        type="button"
                        (click)="copyText(msg.content)"
                        class="hover:text-white flex items-center gap-1"
                      >
                        <lucide-icon [img]="CopyIcon" class="w-3 h-3" />
                        Copy
                      </button>
                    }
                  </div>
                </div>

                @if (msg.role === 'user') {
                  <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <lucide-icon [img]="UserIcon" class="w-4 h-4 text-zinc-200" />
                  </div>
                }
              </div>
            }

            @if (isTyping()) {
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                  <lucide-icon [img]="BotIcon" class="w-4 h-4 text-white" />
                </div>
                <div class="px-4 py-3 rounded-2xl bg-[#090A16] border border-white/8 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                  <span class="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" style="animation-delay: 120ms"></span>
                  <span class="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style="animation-delay: 240ms"></span>
                </div>
              </div>
            }
          </div>

          <!-- Input Box -->
          <form (ngSubmit)="submitInput()" class="p-3.5 border-t border-white/8 bg-[#090A16] flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="draftPrompt"
              name="draftPrompt"
              placeholder="Ask Silicon-One Fraudshield Copilot about any transaction, mule cluster, or risk signal..."
              class="flex-1 px-4 py-2.5 rounded-xl bg-[#10111D] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              [disabled]="!draftPrompt.trim() || isTyping()"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <lucide-icon [img]="SendIcon" class="w-3.5 h-3.5" />
              Send
            </button>
          </form>
        </div>

        <!-- Context Panel -->
        <div class="fs-card p-5 xl:col-span-4 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
              <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-purple-400" />
              Active Investigation Context
            </h3>
          </div>

          @if (contextTxn(); as t) {
            <div class="p-4 rounded-xl bg-[#090A16] border border-white/8 space-y-3 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono-num font-bold text-purple-300">{{ t.id }}</span>
                <app-risk-badge [riskLevel]="t.prediction.riskLevel" [status]="t.status" />
              </div>
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span class="text-zinc-500">Sender</span>
                  <p class="text-white font-medium">{{ t.senderName }}</p>
                </div>
                <div>
                  <span class="text-zinc-500">Amount</span>
                  <p class="font-mono-num text-white font-semibold">\${{ t.amount | number: '1.2-2' }}</p>
                </div>
                <div>
                  <span class="text-zinc-500">Location</span>
                  <p class="text-zinc-300">{{ t.location.city }}, {{ t.location.countryCode }}</p>
                </div>
                <div>
                  <span class="text-zinc-500">Risk Score</span>
                  <p class="font-mono-num font-bold text-red-400">{{ t.prediction.riskScore }} / 100</p>
                </div>
              </div>
              <button
                type="button"
                (click)="store.openTransactionDrawer(t.id)"
                class="w-full py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 font-semibold border border-purple-500/30 transition-colors"
              >
                Open Full Transaction Drawer
              </button>
            </div>
          }

          <div class="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2.5">
            <lucide-icon [img]="AlertIcon" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              All Copilot responses are synthesized from the local Silicon-One Fraudshield mock dataset. No real bank or external API calls are executed.
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AnalystCopilotComponent {
  readonly store = inject(FraudStoreService);
  private readonly ai = inject(MockAiService);

  readonly BotIcon = Bot;
  readonly SendIcon = Send;
  readonly CopyIcon = Copy;
  readonly SparklesIcon = Sparkles;
  readonly UserIcon = User;
  readonly AlertIcon = ShieldAlert;

  draftPrompt = '';
  readonly isTyping = signal(false);

  readonly suggestedPrompts = [
    'Why was TXN-4821 blocked?',
    'Show me similar cases.',
    'Find suspicious accounts connected to this transaction.',
    'Summarize this fraud ring.',
    'Generate an investigation report.',
    'Explain the risk factors.',
  ];

  readonly contextTxn = computed(() => {
    const id = this.store.selectedExplainTransactionId();
    return this.store.transactions().find((t) => t.id === id) ?? this.store.transactions()[0];
  });

  readonly messages = signal<ChatMessage[]>([
    {
      id: 'MSG-0',
      role: 'assistant',
      content:
        'Hello Analyst. I am connected to the live Silicon-One Fraudshield mock telemetry store. Select any transaction context or click a suggested prompt above to begin.',
      timestamp: new Date().toISOString(),
      referencedTxnIds: ['TXN-4821'],
    },
  ]);

  submitInput(): void {
    const q = this.draftPrompt.trim();
    if (!q) return;
    this.draftPrompt = '';
    this.sendPrompt(q);
  }

  sendPrompt(prompt: string): void {
    const userMsg: ChatMessage = {
      id: `U-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    this.messages.update((m) => [...m, userMsg]);
    this.isTyping.set(true);

    setTimeout(() => {
      const res = this.ai.generateResponse(prompt, this.store.selectedExplainTransactionId());
      const aiMsg: ChatMessage = {
        id: `A-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toISOString(),
        referencedTxnIds: res.referencedTxnIds,
        followUps: res.followUps,
      };
      this.messages.update((m) => [...m, aiMsg]);
      this.isTyping.set(false);
    }, 600);
  }

  copyText(text: string): void {
    navigator.clipboard?.writeText(text);
    this.store.showToast('Copied', 'Copilot response copied to clipboard.', 'success');
  }
}
