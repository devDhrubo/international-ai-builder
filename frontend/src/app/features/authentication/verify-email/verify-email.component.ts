import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Mail, CheckCircle2, RefreshCw, ArrowRight, Edit3 } from 'lucide-angular';
import { AuthLayoutComponent } from '../auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <div class="fs-card p-7 sm:p-8 border-white/10 space-y-6 text-center">
        <div
          class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border"
          [ngClass]="
            verified()
              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
              : 'bg-purple-500/15 border-purple-500/35 text-purple-300'
          "
        >
          <lucide-icon [img]="verified() ? CheckIcon : MailIcon" class="w-8 h-8" />
        </div>

        <div>
          <h2 class="font-display text-2xl font-bold text-white">
            {{ verified() ? 'Email verified' : 'Verify your email address' }}
          </h2>
          <p class="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            {{
              verified()
                ? 'Your email address has been confirmed. You can now proceed to your workspace.'
                : 'Confirm the email address associated with your Silicon-One Fraudshield account:'
            }}
          </p>
          <p class="font-mono-num text-sm font-semibold text-purple-300 mt-2">{{ displayEmail() }}</p>
        </div>

        @if (statusMessage()) {
          <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200">
            {{ statusMessage() }}
          </div>
        }

        @if (editingEmail()) {
          <div class="flex gap-2">
            <input
              type="email"
              [(ngModel)]="newEmail"
              placeholder="Enter updated email"
              class="flex-1 px-3 py-2 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="button"
              (click)="saveNewEmail()"
              class="px-3.5 py-2 rounded-xl bg-purple-600 text-xs font-semibold text-white"
            >
              Update
            </button>
          </div>
        }

        @if (!verified()) {
          <div class="space-y-3">
            <button
              type="button"
              [disabled]="loading()"
              (click)="confirmVerification()"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-xs font-semibold text-white flex items-center justify-center gap-2"
            >
              <lucide-icon [img]="CheckIcon" class="w-4 h-4" />
              {{ loading() ? 'Verifying...' : 'Confirm Email Verification' }}
            </button>

            <div class="flex items-center justify-center gap-4 pt-1 text-xs">
              <button
                type="button"
                (click)="resend()"
                class="text-zinc-300 hover:text-white flex items-center gap-1"
              >
                <lucide-icon [img]="RefreshIcon" class="w-3.5 h-3.5 text-purple-400" />
                Resend verification
              </button>
              <span class="text-zinc-600">•</span>
              <button
                type="button"
                (click)="editingEmail.set(!editingEmail())"
                class="text-zinc-300 hover:text-white flex items-center gap-1"
              >
                <lucide-icon [img]="EditIcon" class="w-3.5 h-3.5 text-fuchsia-400" />
                Change email
              </button>
            </div>
          </div>
        } @else {
          <button
            type="button"
            (click)="continueAfterVerify()"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-xs font-semibold text-white flex items-center justify-center gap-2"
          >
            Continue
            <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4" />
          </button>
        }
      </div>
    </app-auth-layout>
  `,
})
export class VerifyEmailComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly MailIcon = Mail;
  readonly CheckIcon = CheckCircle2;
  readonly RefreshIcon = RefreshCw;
  readonly ArrowRightIcon = ArrowRight;
  readonly EditIcon = Edit3;

  readonly verified = signal(false);
  readonly loading = signal(false);
  readonly editingEmail = signal(false);
  readonly statusMessage = signal<string | null>(null);
  newEmail = '';

  readonly displayEmail = computed(
    () => this.auth.pendingVerificationEmail() ?? this.auth.currentUser()?.email ?? 'analyst@company.com'
  );

  async confirmVerification(): Promise<void> {
    this.loading.set(true);
    const res = await this.auth.verifyEmail();
    this.loading.set(false);
    if (res.verified) {
      this.verified.set(true);
      this.statusMessage.set(res.message);
    }
  }

  async resend(): Promise<void> {
    const res = await this.auth.resendVerificationEmail();
    this.statusMessage.set(res.message);
  }

  saveNewEmail(): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newEmail.trim())) {
      this.statusMessage.set('Please enter a valid email address.');
      return;
    }
    this.auth.updateVerificationEmail(this.newEmail);
    this.editingEmail.set(false);
    this.newEmail = '';
    this.statusMessage.set('Verification email address updated.');
  }

  continueAfterVerify(): void {
    if (this.auth.pendingOnboarding()) {
      this.router.navigate(['/onboarding']);
    } else {
      this.router.navigate(['/app']);
    }
  }
}
