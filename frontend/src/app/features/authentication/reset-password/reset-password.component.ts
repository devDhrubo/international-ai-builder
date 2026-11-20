import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-angular';
import { AuthLayoutComponent } from '../auth-layout.component';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    AuthLayoutComponent,
    PasswordStrengthComponent,
  ],
  template: `
    <app-auth-layout>
      <div class="fs-card p-7 sm:p-8 border-white/10 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <lucide-icon [img]="LockIcon" class="w-5 h-5 text-purple-300" />
        </div>

        <div>
          <h2 class="font-display text-2xl font-bold text-white">Reset your password</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            Choose a strong password to protect your Silicon-One Fraudshield workspace.
          </p>
        </div>

        @if (!done()) {
          <form (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-zinc-300 mb-1.5">New password</label>
              <div class="relative">
                <input
                  [type]="showPass() ? 'text' : 'password'"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  placeholder="Minimum 8 characters"
                  class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
                <button
                  type="button"
                  (click)="showPass.set(!showPass())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  <lucide-icon [img]="showPass() ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
                </button>
              </div>
              <app-password-strength [password]="newPassword" />
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-300 mb-1.5">Confirm new password</label>
              <input
                [type]="showPass() ? 'text' : 'password'"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter new password"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>

            @if (error()) {
              <p class="text-[11px] text-red-400">{{ error() }}</p>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 disabled:opacity-60 text-xs font-semibold text-white"
            >
              {{ loading() ? 'Updating Password...' : 'Update Password' }}
            </button>
          </form>
        } @else {
          <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
            <div class="flex items-center gap-2 font-semibold text-emerald-300">
              <lucide-icon [img]="CheckIcon" class="w-4 h-4" />
              Password Updated
            </div>
            <p class="text-zinc-300">{{ successMsg() }}</p>
          </div>

          <a
            routerLink="/auth/sign-in"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-semibold text-white flex items-center justify-center gap-2"
          >
            Return to Sign In
            <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5" />
          </a>
        }
      </div>
    </app-auth-layout>
  `,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);

  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly CheckIcon = CheckCircle2;
  readonly ArrowRightIcon = ArrowRight;

  newPassword = '';
  confirmPassword = '';

  readonly showPass = signal(false);
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal('');

  async submit(): Promise<void> {
    if (this.newPassword.length < 8) {
      this.error.set('Password must be at least 8 characters long.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const res = await this.auth.resetPassword(this.newPassword);
    this.loading.set(false);
    this.successMsg.set(res.message);
    this.done.set(true);
  }
}
