import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthAdapter,
  AuthResponse,
  AuthSession,
  EmailVerificationResult,
  LoginRequest,
  RegisterRequest,
} from '../models/auth-response.model';
import { Role, TeamMember, User } from '../models/user.model';
import { Membership, Organization, Workspace } from '../models/organization.model';
import { SessionService } from './session.service';
import { WorkspaceService } from './workspace.service';

class LocalAuthAdapter implements AuthAdapter {
  private delay(ms = 550): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  async signIn(request: LoginRequest): Promise<AuthResponse> {
    await this.delay(650);

    const normalizedEmail = request.email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@') || request.password.length < 6) {
      return {
        success: false,
        message: 'Invalid email address or password. Password must be at least 6 characters.',
      };
    }

    if (request.password === 'invalid' || normalizedEmail === 'invalid@fraudshield.ai') {
      return {
        success: false,
        message: 'The credentials provided do not match an active Silicon-One Fraudshield account.',
      };
    }

    const displayName =
      normalizedEmail.startsWith('maya')
        ? 'Maya Lin'
        : normalizedEmail
            .split('@')[0]
            .split(/[._-]/)
            .filter(Boolean)
            .map((p) => p[0].toUpperCase() + p.slice(1))
            .join(' ') || 'Security Analyst';

    const user: User = {
      id: 'USR-1001',
      fullName: displayName,
      email: normalizedEmail,
      emailVerified: true,
      accountType: 'organization',
      avatarInitials: this.initials(displayName),
      country: 'United States',
      jobTitle: 'Lead Fraud Intelligence Analyst',
      twoFactorEnabled: true,
      createdAt: new Date().toISOString(),
    };

    const expiresAt = new Date(
      Date.now() + (request.rememberMe ? 7 * 24 : 8) * 60 * 60 * 1000
    ).toISOString();

    const session: AuthSession = {
      token: `fs_tok_${btoa(normalizedEmail).replace(/=/g, '').slice(0, 16)}`,
      expiresAt,
      rememberMe: request.rememberMe,
      user,
      activeWorkspaceId: 'WS-901',
      activeRole: 'OWNER',
    };

    return {
      success: true,
      session,
    };
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    await this.delay(500);
    const user: User = {
      id: 'USR-1001',
      fullName: 'Maya Lin',
      email: 'maya.lin@aegiscapital.com',
      emailVerified: true,
      accountType: 'organization',
      avatarInitials: 'ML',
      country: 'United States',
      jobTitle: 'Lead Fraud Intelligence Analyst',
      twoFactorEnabled: true,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      session: {
        token: `fs_oauth_${Date.now().toString(36)}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: true,
        user,
        activeWorkspaceId: 'WS-901',
        activeRole: 'OWNER',
      },
    };
  }

  async signUp(request: RegisterRequest): Promise<AuthResponse> {
    await this.delay(700);

    if (request.accountType === 'individual') {
      const userId = `USR-${Date.now()}`;
      const wsId = `WS-${Date.now()}`;
      const user: User = {
        id: userId,
        fullName: request.fullName.trim(),
        email: request.email.trim().toLowerCase(),
        emailVerified: false,
        accountType: 'individual',
        avatarInitials: this.initials(request.fullName),
        country: request.country,
        jobTitle: request.jobTitle?.trim() || 'Independent Fraud Analyst',
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
      };

      const workspace: Workspace = {
        id: wsId,
        name: `${request.fullName.split(' ')[0]}'s Intelligence Workspace`,
        type: 'personal',
        timezone: 'UTC+00:00 (UTC)',
        currency: 'USD',
        notificationsEnabled: true,
        onboardingCompleted: true,
      };

      const membership: Membership = {
        id: `MEM-${Date.now()}`,
        userId,
        workspaceId: wsId,
        role: 'OWNER',
      };

      return {
        success: true,
        requiresEmailVerification: true,
        requiresOnboarding: false,
        session: {
          token: `fs_reg_${Date.now().toString(36)}`,
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          rememberMe: true,
          user,
          activeWorkspaceId: wsId,
          activeRole: 'OWNER',
        },
        organizations: [],
        workspaces: [workspace],
        memberships: [membership],
      };
    }

    // Organization Registration
    const userId = `USR-${Date.now()}`;
    const orgId = `ORG-${Math.floor(1000 + Math.random() * 9000)}`;
    const wsId = `WS-${Date.now()}`;

    const user: User = {
      id: userId,
      fullName: request.adminFullName.trim(),
      email: request.organizationEmail.trim().toLowerCase(),
      emailVerified: false,
      accountType: 'organization',
      avatarInitials: this.initials(request.adminFullName),
      country: request.country,
      jobTitle: 'Organization Administrator',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
    };

    const org: Organization = {
      id: orgId,
      name: request.organizationName.trim(),
      email: request.organizationEmail.trim().toLowerCase(),
      industry: request.industry,
      size: request.organizationSize,
      country: request.country,
      website: request.website?.trim(),
    };

    const workspace: Workspace = {
      id: wsId,
      name: `${request.organizationName.trim()} Workspace`,
      type: 'organization',
      organizationId: orgId,
      timezone: 'UTC+00:00 (UTC)',
      currency: 'USD',
      notificationsEnabled: true,
      onboardingCompleted: false,
    };

    const membership: Membership = {
      id: `MEM-${Date.now()}`,
      userId,
      workspaceId: wsId,
      organizationId: orgId,
      role: 'OWNER',
    };

    return {
      success: true,
      requiresEmailVerification: true,
      requiresOnboarding: true,
      session: {
        token: `fs_org_${Date.now().toString(36)}`,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        rememberMe: true,
        user,
        activeWorkspaceId: wsId,
        activeRole: 'OWNER',
      },
      organizations: [org],
      workspaces: [workspace],
      memberships: [membership],
    };
  }

  async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    await this.delay(550);
    return {
      ok: true,
      message: `If an account exists for ${email}, password recovery instructions have been queued for dispatch.`,
    };
  }

  async resetPassword(_newPassword: string): Promise<{ ok: boolean; message: string }> {
    await this.delay(600);
    return {
      ok: true,
      message: 'Your password has been updated. You may now sign in with your new credentials.',
    };
  }

  async verifyEmail(_code?: string): Promise<EmailVerificationResult> {
    await this.delay(550);
    return {
      verified: true,
      message: 'Email address confirmed successfully.',
    };
  }

  async resendVerification(email: string): Promise<{ ok: boolean; message: string }> {
    await this.delay(450);
    return {
      ok: true,
      message: `A new verification request has been prepared for ${email}.`,
    };
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionService = inject(SessionService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);

  // Replaceable adapter: swap LocalAuthAdapter with an HttpAuthAdapter when backend APIs connect
  private readonly adapter: AuthAdapter = new LocalAuthAdapter();

  readonly pendingOnboarding = signal<boolean>(false);
  readonly pendingVerificationEmail = signal<string | null>(null);

  readonly session = this.sessionService.session;
  readonly isAuthenticated = this.sessionService.isAuthenticated;
  readonly currentUser = this.sessionService.currentUser;
  readonly activeRole = this.sessionService.activeRole;

  async signIn(request: LoginRequest): Promise<AuthResponse> {
    const res = await this.adapter.signIn(request);
    if (res.success && res.session) {
      this.sessionService.setSession(res.session);
      this.pendingOnboarding.set(false);
    }
    return res;
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    const res = await this.adapter.signInWithGoogle();
    if (res.success && res.session) {
      this.sessionService.setSession(res.session);
      this.pendingOnboarding.set(false);
    }
    return res;
  }

  async signUp(request: RegisterRequest): Promise<AuthResponse> {
    const res = await this.adapter.signUp(request);
    if (res.success && res.session) {
      this.sessionService.setSession(res.session);
      this.pendingVerificationEmail.set(res.session.user.email);
      this.pendingOnboarding.set(!!res.requiresOnboarding);

      if (res.workspaces && res.memberships) {
        const ownerMember: TeamMember = {
          id: `TM-${Date.now()}`,
          name: res.session.user.fullName,
          email: res.session.user.email,
          role: 'OWNER',
          status: 'Active',
          joinedAt: new Date().toISOString(),
        };
        this.workspaceService.registerWorkspaceBundle(
          res.organizations ?? [],
          res.workspaces,
          res.memberships,
          [ownerMember]
        );
      }
    }
    return res;
  }

  signOut(): void {
    this.sessionService.clearSession();
    this.pendingOnboarding.set(false);
    this.pendingVerificationEmail.set(null);
    this.router.navigate(['/auth/sign-in']);
  }

  getCurrentUser(): User | null {
    return this.sessionService.currentUser();
  }

  getCurrentSession(): AuthSession | null {
    return this.sessionService.session();
  }

  async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    return this.adapter.requestPasswordReset(email);
  }

  async resetPassword(newPassword: string): Promise<{ ok: boolean; message: string }> {
    return this.adapter.resetPassword(newPassword);
  }

  async verifyEmail(code?: string): Promise<EmailVerificationResult> {
    const res = await this.adapter.verifyEmail(code);
    if (res.verified) {
      this.sessionService.updateUser({ emailVerified: true });
    }
    return res;
  }

  async resendVerificationEmail(): Promise<{ ok: boolean; message: string }> {
    const email = this.pendingVerificationEmail() ?? this.currentUser()?.email ?? 'user@company.com';
    return this.adapter.resendVerification(email);
  }

  updateVerificationEmail(newEmail: string): void {
    const clean = newEmail.trim().toLowerCase();
    this.pendingVerificationEmail.set(clean);
    this.sessionService.updateUser({ email: clean, emailVerified: false });
  }

  getWorkspaces(): Workspace[] {
    return this.workspaceService.workspaces();
  }

  switchWorkspace(workspaceId: string): void {
    this.workspaceService.switchWorkspace(workspaceId);
  }

  hasRole(allowedRoles: Role[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(this.activeRole());
  }

  /**
   * Frontend presentation-level route visibility helper.
   * Server-side APIs must enforce actual authorization.
   */
  canAccessRoute(route: string): boolean {
    const role = this.activeRole();
    if (role === 'OWNER' || role === 'ADMINISTRATOR') return true;

    const clean = route.split('?')[0];
    if (role === 'VIEWER') {
      return ['/app', '/app/model-overview', '/app/settings'].includes(clean);
    }
    if (role === 'FRAUD_ANALYST') {
      return ![
        '/app/simulator',
        '/app/attack-simulator',
        '/app/federated-learning',
      ].includes(clean);
    }
    if (role === 'INVESTIGATOR') {
      return [
        '/app',
        '/app/fraud-network',
        '/app/cases',
        '/app/case-queue',
        '/app/copilot',
        '/app/analyst-copilot',
        '/app/explainability',
        '/app/settings',
      ].includes(clean);
    }
    return true;
  }
}
