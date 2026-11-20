import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'auth/sign-in',
    loadComponent: () =>
      import('./features/authentication/sign-in/sign-in.component').then((m) => m.SignInComponent),
  },
  {
    path: 'auth/sign-up',
    loadComponent: () =>
      import('./features/authentication/sign-up/sign-up.component').then((m) => m.SignUpComponent),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/authentication/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/authentication/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'auth/verify-email',
    loadComponent: () =>
      import('./features/authentication/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      {
        path: 'monitoring',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST'] },
        loadComponent: () =>
          import('./features/monitoring/monitoring.component').then((m) => m.MonitoringComponent),
      },
      {
        path: 'transactions',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST', 'INVESTIGATOR'] },
        loadComponent: () =>
          import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent),
      },
      {
        path: 'explainability',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST', 'INVESTIGATOR'] },
        loadComponent: () =>
          import('./features/explainability/explainability.component').then(
            (m) => m.ExplainabilityComponent
          ),
      },
      {
        path: 'fraud-network',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST', 'INVESTIGATOR'] },
        loadComponent: () =>
          import('./features/fraud-network/fraud-network.component').then(
            (m) => m.FraudNetworkComponent
          ),
      },
      {
        path: 'behavioral-security',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST'] },
        loadComponent: () =>
          import('./features/behavioral-security/behavioral-security.component').then(
            (m) => m.BehavioralSecurityComponent
          ),
      },
      {
        path: 'copilot',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST', 'INVESTIGATOR'] },
        loadComponent: () =>
          import('./features/analyst-copilot/analyst-copilot.component').then(
            (m) => m.AnalystCopilotComponent
          ),
      },
      {
        path: 'analyst-copilot',
        redirectTo: 'copilot',
        pathMatch: 'full',
      },
      {
        path: 'simulator',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR'] },
        loadComponent: () =>
          import('./features/attack-simulator/attack-simulator.component').then(
            (m) => m.AttackSimulatorComponent
          ),
      },
      {
        path: 'attack-simulator',
        redirectTo: 'simulator',
        pathMatch: 'full',
      },
      {
        path: 'cases',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST', 'INVESTIGATOR'] },
        loadComponent: () =>
          import('./features/case-queue/case-queue.component').then((m) => m.CaseQueueComponent),
      },
      {
        path: 'case-queue',
        redirectTo: 'cases',
        pathMatch: 'full',
      },
      {
        path: 'geo-intelligence',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST'] },
        loadComponent: () =>
          import('./features/geo-intelligence/geo-intelligence.component').then(
            (m) => m.GeoIntelligenceComponent
          ),
      },
      {
        path: 'threshold-tuner',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST'] },
        loadComponent: () =>
          import('./features/threshold-tuner/threshold-tuner.component').then(
            (m) => m.ThresholdTunerComponent
          ),
      },
      {
        path: 'drift-monitor',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR', 'FRAUD_ANALYST'] },
        loadComponent: () =>
          import('./features/drift-monitor/drift-monitor.component').then(
            (m) => m.DriftMonitorComponent
          ),
      },
      {
        path: 'federated-learning',
        canActivate: [roleGuard],
        data: { roles: ['OWNER', 'ADMINISTRATOR'] },
        loadComponent: () =>
          import('./features/federated-learning/federated-learning.component').then(
            (m) => m.FederatedLearningComponent
          ),
      },
      {
        path: 'model-overview',
        loadComponent: () =>
          import('./features/model-overview/model-overview.component').then(
            (m) => m.ModelOverviewComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  {
    path: 'simulation',
    loadComponent: () =>
      import('./features/simulation/one-screen-transfer.component').then(
        (m) => m.OneScreenTransferComponent
      ),
  },
  {
    path: 'simulation/customer',
    loadComponent: () =>
      import('./features/simulation/customer-app.component').then((m) => m.CustomerAppComponent),
  },
  {
    path: 'simulation/monitor',
    loadComponent: () =>
      import('./features/simulation/central-monitor.component').then(
        (m) => m.CentralMonitorComponent
      ),
  },
  {
    path: 'simulation/bank',
    loadComponent: () =>
      import('./features/simulation/bank-dashboard.component').then(
        (m) => m.BankDashboardComponent
      ),
  },
  {
    path: 'simulation/control',
    loadComponent: () =>
      import('./features/simulation/presenter-control.component').then(
        (m) => m.PresenterControlComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
