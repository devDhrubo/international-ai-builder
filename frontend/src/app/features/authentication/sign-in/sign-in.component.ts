import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-angular';
import { AuthLayoutComponent } from '../auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <div class="fs-card p-7 sm:p-8 border-white/10 space-y-6">
        <div>
          <h2 class="font-display text-2xl font-bold text-white">Welcome back</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Sign in to your Silicon-One Fraudshield workspace.</p>
        </div>

        @if (errorMessage()) {
          <div class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <lucide-icon [img]="AlertIcon" class="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (successMessage()) {
          <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <lucide-icon [img]="CheckIcon" class="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{{ successMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1.5">Email address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="name@company.com"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              [ngClass]="submitted() && emailError() ? 'border-red-500/50' : 'border-white/10'"
            />
            @if (submitted() && emailError()) {
              <p class="text-[11px] text-red-400 mt-1">{{ emailError() }}</p>
            }
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-medium text-zinc-300">Password</label>
              <a routerLink="/auth/forgot-password" class="text-[11px] text-purple-400 hover:text-purple-300">
                Forgot password?
              </a>
            </div>
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="Enter your password"
                class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#090A16] border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                [ngClass]="submitted() && passwordError() ? 'border-red-500/50' : 'border-white/10'"
              />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                aria-label="Toggle password visibility"
              >
                <lucide-icon [img]="showPassword() ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
              </button>
            </div>
            @if (submitted() && passwordError()) {
              <p class="text-[11px] text-red-400 mt-1">{{ passwordError() }}</p>
            }
          </div>

          <!-- Remember me -->
          <label class="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" class="accent-purple-500 w-3.5 h-3.5 rounded" />
            <span>Remember me for 7 days</span>
          </label>

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-[0_0_28px_-6px_rgba(168,85,247,0.7)] transition-all"
          >
            <span>{{ loading() ? 'Signing in...' : 'Sign In' }}</span>
            @if (!loading()) {
              <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5" />
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="relative flex items-center py-1">
          <div class="flex-1 border-t border-white/8"></div>
          <span class="px-3 text-[10px] uppercase tracking-wider text-zinc-500">Or continue with</span>
          <div class="flex-1 border-t border-white/8"></div>
        </div>

        <!-- Continue with Google -->
        <button
          type="button"
          (click)="signInWithGoogle()"
          [disabled]="loading()"
          class="w-full py-2.5 rounded-xl bg-[#090A16] hover:bg-white/6 border border-white/10 text-xs font-medium text-zinc-200 flex items-center justify-center gap-2.5 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.3H12z"/>
          </svg>
          Continue with Google
        </button>

        <p class="text-center text-xs text-zinc-400">
          Don't have an account?
          <a routerLink="/auth/sign-up" class="text-purple-400 hover:text-purple-300 font-semibold ml-1">
            Create Account
          </a>
        </p>
      </div>
    </app-auth-layout>
  `,
})
export class SignInComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ArrowRightIcon = ArrowRight;
  readonly AlertIcon = AlertCircle;
  readonly CheckIcon = CheckCircle2;

  email = '';
  password = '';
  rememberMe = true;

  readonly showPassword = signal(false);
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  emailError(): string | null {
    const val = this.email.trim();
    if (!val) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
    return null;
  }

  passwordError(): string | null {
    if (!this.password) return 'Password is required.';
    if (this.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set(null);
    if (this.emailError() || this.passwordError()) return;

    this.loading.set(true);
    const res = await this.auth.signIn({
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe,
    });
    this.loading.set(false);

    if (!res.success) {
      this.errorMessage.set(res.message ?? 'Unable to sign in.');
      return;
    }

    this.successMessage.set('Authentication confirmed. Redirecting to workspace...');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app';
    setTimeout(() => this.router.navigateByUrl(returnUrl), 350);
  }

  async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    const res = await this.auth.signInWithGoogle();
    this.loading.set(false);
    if (res.success) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app';
      this.router.navigateByUrl(returnUrl);
    }
  }
}
