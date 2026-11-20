import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-angular';
import { AuthLayoutComponent } from '../auth-layout.component';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AccountType } from '../../../core/auth/models/user.model';
import { IndustryType, OrganizationSize } from '../../../core/auth/models/organization.model';

@Component({
  selector: 'app-sign-up',
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
        <div>
          <h2 class="font-display text-2xl font-bold text-white">Create your Silicon-One Fraudshield account</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            Start building a smarter financial security workflow.
          </p>
        </div>

        <!-- Step 0: Account Type Selection -->
        @if (!accountType()) {
          <div class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              What type of account are you creating?
            </p>

            <button
              type="button"
              (click)="selectType('individual')"
              class="w-full p-5 rounded-2xl bg-[#090A16] hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/45 text-left transition-all group flex items-start gap-4"
            >
              <div class="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <lucide-icon [img]="UserIcon" class="w-5 h-5 text-purple-300" />
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Individual</h3>
                  <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4 text-zinc-500 group-hover:text-purple-300" />
                </div>
                <p class="text-xs text-zinc-400 mt-1 leading-relaxed">
                  For independent professionals and individual fraud analysts.
                </p>
              </div>
            </button>

            <button
              type="button"
              (click)="selectType('organization')"
              class="w-full p-5 rounded-2xl bg-[#090A16] hover:bg-fuchsia-500/10 border border-white/10 hover:border-fuchsia-500/45 text-left transition-all group flex items-start gap-4"
            >
              <div class="w-11 h-11 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <lucide-icon [img]="BuildingIcon" class="w-5 h-5 text-fuchsia-300" />
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Organization</h3>
                  <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4 text-zinc-500 group-hover:text-fuchsia-300" />
                </div>
                <p class="text-xs text-zinc-400 mt-1 leading-relaxed">
                  For banks, fintech companies, financial institutions and security teams.
                </p>
              </div>
            </button>

            <p class="text-center text-xs text-zinc-400 pt-2">
              Already have an account?
              <a routerLink="/auth/sign-in" class="text-purple-400 hover:text-purple-300 font-semibold ml-1">Sign In</a>
            </p>
          </div>
        } @else if (completed()) {
          <!-- Registration Complete Screen -->
          <div class="py-4 text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <lucide-icon [img]="CheckIcon" class="w-7 h-7 text-emerald-400" />
            </div>
            <h3 class="font-display text-xl font-bold text-white">Account Created</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Your {{ accountType() }} profile has been registered. Proceed to confirm your email address before entering your workspace.
            </p>
            <button
              type="button"
              (click)="goToVerify()"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-semibold text-white flex items-center justify-center gap-2"
            >
              Continue to Email Verification
              <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5" />
            </button>
          </div>
        } @else {
          <!-- Step Indicator -->
          <div class="flex items-center justify-between text-[11px]">
            <span class="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 font-semibold capitalize">
              {{ accountType() }} Account
            </span>
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-1.5 rounded-full" [ngClass]="step() >= 1 ? 'bg-purple-500' : 'bg-white/10'"></span>
              <span class="w-6 h-1.5 rounded-full" [ngClass]="step() >= 2 ? 'bg-fuchsia-500' : 'bg-white/10'"></span>
              <span class="text-zinc-400 ml-1 font-mono-num">Step {{ step() }}/2</span>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <lucide-icon [img]="AlertIcon" class="w-4 h-4 shrink-0" />
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <!-- INDIVIDUAL REGISTRATION -->
          @if (accountType() === 'individual') {
            @if (step() === 1) {
              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Full name *</label>
                  <input type="text" [(ngModel)]="ind.fullName" placeholder="Jordan Taylor" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Work email *</label>
                  <input type="email" [(ngModel)]="ind.email" placeholder="jordan@domain.com" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Password *</label>
                  <div class="relative">
                    <input [type]="showPass() ? 'text' : 'password'" [(ngModel)]="ind.password" placeholder="Minimum 8 characters" class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                    <button type="button" (click)="showPass.set(!showPass())" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <lucide-icon [img]="showPass() ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
                    </button>
                  </div>
                  <app-password-strength [password]="ind.password" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Confirm password *</label>
                  <input [type]="showPass() ? 'text' : 'password'" [(ngModel)]="ind.confirmPassword" placeholder="Re-enter password" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
              </div>
            } @else {
              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Country *</label>
                  <select [(ngModel)]="ind.country" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white">
                    @for (c of countries; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Job title (optional)</label>
                  <input type="text" [(ngModel)]="ind.jobTitle" placeholder="Senior Fraud Risk Analyst" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <label class="flex items-start gap-2.5 text-xs text-zinc-400 pt-1 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="ind.terms" class="accent-purple-500 mt-0.5" />
                  <span>I accept the Silicon-One Fraudshield Terms of Service and Privacy Policy.</span>
                </label>
              </div>
            }
          }

          <!-- ORGANIZATION REGISTRATION -->
          @if (accountType() === 'organization') {
            @if (step() === 1) {
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Organization name *</label>
                  <input type="text" [(ngModel)]="org.organizationName" placeholder="Aegis Capital Financial" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Organization email *</label>
                  <input type="email" [(ngModel)]="org.organizationEmail" placeholder="security@aegiscapital.com" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-zinc-300 mb-1">Industry *</label>
                    <select [(ngModel)]="org.industry" class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white">
                      @for (i of industries; track i) {
                        <option [value]="i">{{ i }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-zinc-300 mb-1">Organization size *</label>
                    <select [(ngModel)]="org.organizationSize" class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white">
                      @for (s of orgSizes; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-zinc-300 mb-1">Country *</label>
                    <select [(ngModel)]="org.country" class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white">
                      @for (c of countries; track c) {
                        <option [value]="c">{{ c }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-zinc-300 mb-1">Website (optional)</label>
                    <input type="text" [(ngModel)]="org.website" placeholder="https://..." class="w-full px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                  </div>
                </div>
              </div>
            } @else {
              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Administrator full name *</label>
                  <input type="text" [(ngModel)]="org.adminFullName" placeholder="Maya Lin" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Password *</label>
                  <div class="relative">
                    <input [type]="showPass() ? 'text' : 'password'" [(ngModel)]="org.password" placeholder="Minimum 8 characters" class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                    <button type="button" (click)="showPass.set(!showPass())" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <lucide-icon [img]="showPass() ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
                    </button>
                  </div>
                  <app-password-strength [password]="org.password" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-zinc-300 mb-1">Confirm password *</label>
                  <input [type]="showPass() ? 'text' : 'password'" [(ngModel)]="org.confirmPassword" placeholder="Re-enter password" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <label class="flex items-start gap-2.5 text-xs text-zinc-400 pt-1 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="org.terms" class="accent-purple-500 mt-0.5" />
                  <span>I accept the Silicon-One Fraudshield Enterprise Terms and Data Processing Addendum.</span>
                </label>
              </div>
            }
          }

          <!-- Controls -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              (click)="goBack()"
              class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <lucide-icon [img]="ArrowLeftIcon" class="w-3.5 h-3.5" />
              Back
            </button>

            @if (step() === 1) {
              <button
                type="button"
                (click)="nextStep()"
                class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
              >
                Continue
                <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5" />
              </button>
            } @else {
              <button
                type="button"
                [disabled]="loading()"
                (click)="submitRegistration()"
                class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 disabled:opacity-60 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
              >
                {{ loading() ? 'Creating Account...' : 'Create Account' }}
              </button>
            }
          </div>
        }
      </div>
    </app-auth-layout>
  `,
})
export class SignUpComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly UserIcon = User;
  readonly BuildingIcon = Building2;
  readonly ArrowRightIcon = ArrowRight;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly CheckIcon = CheckCircle2;
  readonly AlertIcon = AlertCircle;

  readonly accountType = signal<AccountType | null>(null);
  readonly step = signal<1 | 2>(1);
  readonly showPass = signal(false);
  readonly loading = signal(false);
  readonly completed = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly countries = ['United States', 'United Kingdom', 'Singapore', 'Bangladesh', 'India', 'United Arab Emirates', 'Germany', 'Canada'];
  readonly industries: IndustryType[] = ['Banking', 'Financial Services', 'FinTech', 'Insurance', 'E-commerce', 'Payment Services', 'Other'];
  readonly orgSizes: OrganizationSize[] = ['1–10 employees', '11–50 employees', '51–200 employees', '201–500 employees', '500+ employees'];

  ind = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'United States',
    jobTitle: '',
    terms: false,
  };

  org = {
    organizationName: '',
    organizationEmail: '',
    adminFullName: '',
    password: '',
    confirmPassword: '',
    industry: 'FinTech' as IndustryType,
    organizationSize: '51–200 employees' as OrganizationSize,
    country: 'United States',
    website: '',
    terms: false,
  };

  selectType(type: AccountType): void {
    this.accountType.set(type);
    this.step.set(1);
    this.errorMsg.set(null);
  }

  goBack(): void {
    this.errorMsg.set(null);
    if (this.step() === 2) {
      this.step.set(1);
    } else {
      this.accountType.set(null);
    }
  }

  nextStep(): void {
    this.errorMsg.set(null);
    if (this.accountType() === 'individual') {
      if (!this.ind.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.ind.email.trim())) {
        this.errorMsg.set('Please enter your full name and a valid work email.');
        return;
      }
      if (this.ind.password.length < 8 || this.ind.password !== this.ind.confirmPassword) {
        this.errorMsg.set('Password must be at least 8 characters and match confirmation.');
        return;
      }
    } else {
      if (!this.org.organizationName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.org.organizationEmail.trim())) {
        this.errorMsg.set('Please enter your organization name and a valid organization email.');
        return;
      }
    }
    this.step.set(2);
  }

  async submitRegistration(): Promise<void> {
    this.errorMsg.set(null);
    if (this.accountType() === 'individual') {
      if (!this.ind.terms) {
        this.errorMsg.set('Please accept the Terms of Service to continue.');
        return;
      }
      this.loading.set(true);
      await this.auth.signUp({
        accountType: 'individual',
        fullName: this.ind.fullName,
        email: this.ind.email,
        password: this.ind.password,
        country: this.ind.country,
        jobTitle: this.ind.jobTitle,
        termsAccepted: this.ind.terms,
      });
      this.loading.set(false);
      this.completed.set(true);
    } else {
      if (!this.org.adminFullName.trim() || this.org.password.length < 8 || this.org.password !== this.org.confirmPassword) {
        this.errorMsg.set('Please enter administrator name and matching passwords (min 8 characters).');
        return;
      }
      if (!this.org.terms) {
        this.errorMsg.set('Please accept the Enterprise Terms to continue.');
        return;
      }
      this.loading.set(true);
      await this.auth.signUp({
        accountType: 'organization',
        organizationName: this.org.organizationName,
        organizationEmail: this.org.organizationEmail,
        adminFullName: this.org.adminFullName,
        password: this.org.password,
        industry: this.org.industry,
        organizationSize: this.org.organizationSize,
        country: this.org.country,
        website: this.org.website,
        termsAccepted: this.org.terms,
      });
      this.loading.set(false);
      this.completed.set(true);
    }
  }

  goToVerify(): void {
    this.router.navigate(['/auth/verify-email']);
  }
}
