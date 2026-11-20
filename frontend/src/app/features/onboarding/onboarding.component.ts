import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Building2,
  SlidersHorizontal,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
} from 'lucide-angular';
import { WorkspaceService } from '../../core/auth/services/workspace.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { IndustryType } from '../../core/auth/models/organization.model';
import { Role } from '../../core/auth/models/user.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[#050509] text-[#F8FAFC] relative overflow-x-hidden py-10 px-4 sm:px-8">
      <div class="ambient-backdrop"></div>
      <div class="grain-overlay"></div>

      <div class="relative z-10 max-w-3xl mx-auto space-y-8 animate-page-in">
        <!-- Brand Header -->
        <div class="flex items-center justify-between">
          <a routerLink="/" class="font-display font-bold text-lg text-white">
            Silicon-One <span class="text-purple-400">Fraudshield</span>
          </a>
          <span class="text-xs text-zinc-400 font-mono-num">Workspace Setup • Step {{ step() }} of 4</span>
        </div>

        <!-- Stepper -->
        <div class="grid grid-cols-4 gap-2">
          @for (s of steps; track s.num) {
            <div class="space-y-1.5">
              <div
                class="h-1.5 rounded-full transition-all"
                [ngClass]="step() >= s.num ? 'gradient-accent-bar' : 'bg-white/10'"
              ></div>
              <p class="text-[11px] font-medium truncate" [ngClass]="step() >= s.num ? 'text-white' : 'text-zinc-500'">
                {{ s.num }}. {{ s.label }}
              </p>
            </div>
          }
        </div>

        <!-- Main Card -->
        <div class="fs-card p-6 sm:p-8 border-white/10 space-y-6">
          <!-- STEP 1: Organization Profile -->
          @if (step() === 1) {
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <lucide-icon [img]="BuildingIcon" class="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h2 class="font-display text-xl font-bold text-white">Organization Profile</h2>
                <p class="text-xs text-zinc-400">Configure your institution's identity in Silicon-One Fraudshield.</p>
              </div>
            </div>

            <div class="space-y-4 text-xs">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-[#090A16] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  @if (orgLogoPreview()) {
                    <img [src]="orgLogoPreview()" alt="Organization logo" class="w-full h-full object-cover" />
                  } @else {
                    <lucide-icon [img]="BuildingIcon" class="w-6 h-6 text-zinc-500" />
                  }
                </div>
                <div>
                  <label class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/10 text-zinc-200 cursor-pointer">
                    <lucide-icon [img]="UploadIcon" class="w-3.5 h-3.5 text-purple-400" />
                    <span>Upload Organization Logo</span>
                    <input type="file" accept="image/*" (change)="onLogoSelected($event)" class="hidden" />
                  </label>
                  <p class="text-[11px] text-zinc-500 mt-1">PNG, JPG or SVG up to 2MB.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-zinc-300 mb-1.5">Organization name</label>
                  <input type="text" [(ngModel)]="orgName" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div>
                  <label class="block text-zinc-300 mb-1.5">Industry</label>
                  <select [(ngModel)]="industry" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white">
                    @for (ind of industries; track ind) {
                      <option [value]="ind">{{ ind }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-zinc-300 mb-1.5">Country</label>
                  <input type="text" [(ngModel)]="country" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white focus:outline-none focus:border-purple-500/60" />
                </div>
                <div>
                  <label class="block text-zinc-300 mb-1.5">Website</label>
                  <input type="text" [(ngModel)]="website" placeholder="https://company.com" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white focus:outline-none focus:border-purple-500/60" />
                </div>
              </div>

              <div>
                <label class="block text-zinc-300 mb-1.5">Organization description</label>
                <textarea [(ngModel)]="description" rows="3" placeholder="Brief overview of your financial operations and risk focus..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white focus:outline-none focus:border-purple-500/60"></textarea>
              </div>
            </div>
          }

          <!-- STEP 2: Workspace Configuration -->
          @if (step() === 2) {
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center">
                <lucide-icon [img]="SlidersIcon" class="w-5 h-5 text-fuchsia-300" />
              </div>
              <div>
                <h2 class="font-display text-xl font-bold text-white">Workspace Configuration</h2>
                <p class="text-xs text-zinc-400">Set regional defaults and operational alert preferences.</p>
              </div>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-zinc-300 mb-1.5">Workspace name</label>
                <input type="text" [(ngModel)]="workspaceName" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white focus:outline-none focus:border-purple-500/60" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-zinc-300 mb-1.5">Preferred timezone</label>
                  <select [(ngModel)]="timezone" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white">
                    <option value="UTC+00:00 (UTC)">UTC+00:00 (UTC)</option>
                    <option value="UTC-05:00 (America/New_York)">UTC-05:00 (America/New_York)</option>
                    <option value="UTC+06:00 (Asia/Dhaka)">UTC+06:00 (Asia/Dhaka)</option>
                    <option value="UTC+08:00 (Asia/Singapore)">UTC+08:00 (Asia/Singapore)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-zinc-300 mb-1.5">Preferred currency</label>
                  <select [(ngModel)]="currency" class="w-full px-3.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>
              </div>

              <label class="flex items-center justify-between p-3.5 rounded-xl bg-[#090A16] border border-white/8 cursor-pointer">
                <span>Enable real-time high-risk escalation notifications</span>
                <input type="checkbox" [(ngModel)]="notificationsEnabled" class="accent-purple-500 w-4 h-4" />
              </label>
            </div>
          }

          <!-- STEP 3: Team Setup -->
          @if (step() === 3) {
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <lucide-icon [img]="UsersIcon" class="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h2 class="font-display text-xl font-bold text-white">Team Setup</h2>
                <p class="text-xs text-zinc-400">Invite analysts and investigators with role-based access.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
              <input type="text" [(ngModel)]="memberName" placeholder="Full name" class="sm:col-span-4 px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white" />
              <input type="email" [(ngModel)]="memberEmail" placeholder="colleague@company.com" class="sm:col-span-4 px-3 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white" />
              <select [(ngModel)]="memberRole" class="sm:col-span-2 px-2.5 py-2.5 rounded-xl bg-[#090A16] border border-white/10 text-white">
                @for (r of roles; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
              <button
                type="button"
                (click)="addMember()"
                class="sm:col-span-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white flex items-center justify-center gap-1"
              >
                <lucide-icon [img]="PlusIcon" class="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div class="space-y-2 max-h-56 overflow-y-auto">
              @for (m of workspaceService.teamMembers(); track m.id) {
                <div class="p-3 rounded-xl bg-[#090A16] border border-white/8 flex items-center justify-between text-xs">
                  <div>
                    <p class="font-semibold text-white">{{ m.name }}</p>
                    <p class="text-[11px] text-zinc-400">{{ m.email }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-semibold">
                      {{ m.role }}
                    </span>
                    @if (m.role !== 'OWNER') {
                      <button type="button" (click)="workspaceService.removeTeamMember(m.id)" class="text-zinc-500 hover:text-red-400">
                        <lucide-icon [img]="TrashIcon" class="w-3.5 h-3.5" />
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- STEP 4: Completion -->
          @if (step() === 4) {
            <div class="py-6 text-center space-y-5">
              <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <lucide-icon [img]="CheckIcon" class="w-8 h-8 text-emerald-400" />
              </div>
              <h2 class="font-display text-3xl font-bold text-white">Your workspace is ready.</h2>
              <p class="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Your Silicon-One Fraudshield workspace has been configured. Access your financial intelligence command center.
              </p>
              <button
                type="button"
                (click)="finishOnboarding()"
                class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-sm font-semibold text-white inline-flex items-center gap-2 shadow-[0_0_32px_-6px_rgba(168,85,247,0.75)]"
              >
                Enter Command Center
                <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4" />
              </button>
            </div>
          }

          <!-- Step Navigation -->
          @if (step() < 4) {
            <div class="flex items-center justify-between pt-4 border-t border-white/8">
              <button
                type="button"
                [disabled]="step() === 1"
                (click)="prevStep()"
                class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-medium text-zinc-300 flex items-center gap-1.5"
              >
                <lucide-icon [img]="ArrowLeftIcon" class="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                (click)="nextStep()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                Continue
                <lucide-icon [img]="ArrowRightIcon" class="w-3.5 h-3.5" />
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  readonly workspaceService = inject(WorkspaceService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly BuildingIcon = Building2;
  readonly SlidersIcon = SlidersHorizontal;
  readonly UsersIcon = Users;
  readonly CheckIcon = CheckCircle2;
  readonly ArrowRightIcon = ArrowRight;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly UploadIcon = Upload;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;

  readonly step = signal<1 | 2 | 3 | 4>(1);
  readonly orgLogoPreview = signal<string | null>(
    this.workspaceService.activeOrganization()?.logoDataUrl ?? null
  );

  readonly steps = [
    { num: 1 as const, label: 'Organization Profile' },
    { num: 2 as const, label: 'Workspace Config' },
    { num: 3 as const, label: 'Team Setup' },
    { num: 4 as const, label: 'Completion' },
  ];

  readonly industries: IndustryType[] = ['Banking', 'Financial Services', 'FinTech', 'Insurance', 'E-commerce', 'Payment Services', 'Other'];
  readonly roles: { value: Role; label: string }[] = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'ADMINISTRATOR', label: 'Administrator' },
    { value: 'FRAUD_ANALYST', label: 'Fraud Analyst' },
    { value: 'INVESTIGATOR', label: 'Investigator' },
    { value: 'VIEWER', label: 'Viewer' },
  ];

  orgName = this.workspaceService.activeOrganization()?.name ?? 'Enterprise Workspace';
  industry: IndustryType = this.workspaceService.activeOrganization()?.industry ?? 'FinTech';
  country = this.workspaceService.activeOrganization()?.country ?? 'United States';
  website = this.workspaceService.activeOrganization()?.website ?? '';
  description = this.workspaceService.activeOrganization()?.description ?? '';

  workspaceName = this.workspaceService.activeWorkspace()?.name ?? 'Primary Fraud Ops';
  timezone = this.workspaceService.activeWorkspace()?.timezone ?? 'UTC+00:00 (UTC)';
  currency = this.workspaceService.activeWorkspace()?.currency ?? 'USD';
  notificationsEnabled = this.workspaceService.activeWorkspace()?.notificationsEnabled ?? true;

  memberName = '';
  memberEmail = '';
  memberRole: Role = 'FRAUD_ANALYST';

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.orgLogoPreview.set(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  addMember(): void {
    if (!this.memberName.trim() || !this.memberEmail.trim()) return;
    this.workspaceService.addTeamMember(this.memberName.trim(), this.memberEmail.trim(), this.memberRole);
    this.memberName = '';
    this.memberEmail = '';
  }

  prevStep(): void {
    const s = this.step();
    if (s > 1) this.step.set((s - 1) as 1 | 2 | 3 | 4);
  }

  nextStep(): void {
    const s = this.step();
    if (s === 1) {
      const org = this.workspaceService.activeOrganization();
      if (org) {
        this.workspaceService.updateOrganization(org.id, {
          name: this.orgName,
          industry: this.industry,
          country: this.country,
          website: this.website,
          description: this.description,
          logoDataUrl: this.orgLogoPreview() ?? undefined,
        });
      }
    } else if (s === 2) {
      const ws = this.workspaceService.activeWorkspace();
      if (ws) {
        this.workspaceService.updateWorkspace(ws.id, {
          name: this.workspaceName,
          timezone: this.timezone,
          currency: this.currency,
          notificationsEnabled: this.notificationsEnabled,
        });
      }
    }
    if (s < 4) this.step.set((s + 1) as 1 | 2 | 3 | 4);
  }

  finishOnboarding(): void {
    const ws = this.workspaceService.activeWorkspace();
    if (ws) {
      this.workspaceService.updateWorkspace(ws.id, { onboardingCompleted: true });
    }
    this.auth.pendingOnboarding.set(false);
    this.router.navigate(['/app']);
  }
}
