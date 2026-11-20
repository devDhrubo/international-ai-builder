import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  LucideAngularModule,
  LucideIconData,
  LayoutDashboard,
  Activity,
  ArrowLeftRight,
  BrainCircuit,
  Share2,
  Fingerprint,
  Bot,
  Swords,
  FolderKanban,
  Globe2,
  SlidersHorizontal,
  TrendingUp,
  Network,
  Cpu,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Menu,
  Command,
  X,
  LogOut,
  User,
  Sparkles,
  CheckCheck,
} from 'lucide-angular';
import { FraudStoreService } from '../core/state/fraud-store.service';
import { MockTransactionService } from '../core/services/mock-transaction.service';
import { AuthService } from '../core/auth/services/auth.service';
import { SessionService } from '../core/auth/services/session.service';
import { WorkspaceService } from '../core/auth/services/workspace.service';
import { ToastContainerComponent } from '../shared/components/toast-container.component';
import { TransactionDrawerComponent } from '../shared/components/transaction-drawer.component';

interface NavItem {
  label: string;
  route: string;
  icon: LucideIconData;
  badge?: () => number | null;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    ToastContainerComponent,
    TransactionDrawerComponent,
  ],
  template: `
    <div class="ambient-backdrop"></div>
    <div class="grain-overlay"></div>

    <div class="relative z-10 flex h-screen overflow-hidden bg-transparent">
      <!-- Mobile Drawer Backdrop -->
      @if (mobileMenuOpen()) {
        <div
          class="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          (click)="mobileMenuOpen.set(false)"
        ></div>
      }

      <!-- Left Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-[#080913]/95 backdrop-blur-2xl border-r border-white/8 transition-all duration-300 ease-out"
        [class.w-64]="!collapsed()"
        [class.w-[76px]]="collapsed()"
        [class.-translate-x-full]="!mobileMenuOpen()"
        [class.translate-x-0]="mobileMenuOpen()"
        [class.lg:translate-x-0]="true"
      >
        <!-- Brand Header -->
        <div class="h-16 px-4 flex items-center justify-between border-b border-white/8 shrink-0">
          <a routerLink="/" class="flex items-center gap-3 overflow-hidden" title="Back to Silicon-One Fraudshield Home">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 p-[1px] shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <div class="w-full h-full rounded-[11px] bg-[#080913] flex items-center justify-center">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
                  <path
                    d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
                    stroke="url(#fsShieldGrad)"
                    stroke-width="1.8"
                  />
                  <circle cx="12" cy="11.5" r="2.2" fill="#D946EF" />
                  <path d="M12 7V9.3M12 13.7V16M8.5 11.5H9.8M14.2 11.5H15.5" stroke="#A855F7" stroke-width="1.5" stroke-linecap="round" />
                  <defs>
                    <linearGradient id="fsShieldGrad" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#A855F7" />
                      <stop offset="1" stop-color="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            @if (!collapsed()) {
              <div class="min-w-0">
                <div class="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1">
                  Silicon-One <span class="text-purple-400">Fraudshield</span>
                </div>
                <p class="text-[10px] text-zinc-500 truncate">Explainable Fraud AI</p>
              </div>
            }
          </a>

          <button
            type="button"
            (click)="collapsed.set(!collapsed())"
            class="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-zinc-400 hover:text-white hover:bg-white/6 transition-colors"
            [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <lucide-icon [img]="collapsed() ? ChevronRightIcon : ChevronLeftIcon" class="w-4 h-4" />
          </button>
        </div>

        <!-- Nav Groups (Role-Filtered) -->
        <nav class="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
          @for (group of visibleNavGroups(); track group.title) {
            <div>
              @if (!collapsed()) {
                <p class="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
                  {{ group.title }}
                </p>
              }
              <div class="space-y-1">
                @for (item of group.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    [routerLinkActiveOptions]="{ exact: item.route === '/app' }"
                    routerLinkActive="bg-purple-500/15 text-white border-purple-500/35 shadow-[0_0_20px_-6px_rgba(168,85,247,0.5)]"
                    (click)="mobileMenuOpen.set(false)"
                    [title]="collapsed() ? item.label : ''"
                    class="group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-150"
                  >
                    <lucide-icon
                      [img]="item.icon"
                      class="w-4 h-4 shrink-0 transition-colors group-hover:text-purple-300"
                    />
                    @if (!collapsed()) {
                      <span class="truncate flex-1">{{ item.label }}</span>
                      @if (item.badge && item.badge(); as count) {
                        <span class="px-1.5 py-0.5 text-[10px] font-mono-num font-semibold rounded-md bg-purple-500/20 text-purple-300">
                          {{ count }}
                        </span>
                      }
                    }
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <!-- Sidebar Bottom Workspace Status -->
        @if (!collapsed()) {
          <div class="p-3 m-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <div class="flex items-center justify-between text-[11px] font-semibold text-purple-300">
              <span class="flex items-center gap-1.5">
                <lucide-icon [img]="SparklesIcon" class="w-3.5 h-3.5" />
                {{ workspaceService.activeOrganization() ? 'Enterprise Workspace' : 'Personal Workspace' }}
              </span>
            </div>
            <p class="text-[10px] text-zinc-400 mt-1 leading-relaxed truncate">
              Role: <span class="text-zinc-200 font-medium">{{ session.activeRole() }}</span>
            </p>
          </div>
        }
      </aside>

      <!-- Main Column -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navigation -->
        <header class="h-16 px-4 lg:px-6 border-b border-white/8 bg-[#050509]/80 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0 z-20">
          <!-- Left: Mobile Menu + Breadcrumb -->
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              (click)="mobileMenuOpen.set(true)"
              class="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/6"
              aria-label="Open menu"
            >
              <lucide-icon [img]="MenuIcon" class="w-5 h-5" />
            </button>

            <div class="hidden sm:flex items-center gap-2 text-xs">
              <span class="text-zinc-500">Silicon-One Fraudshield</span>
              <span class="text-zinc-600">/</span>
              <span class="text-zinc-400">{{ currentBreadcrumb().group }}</span>
              <span class="text-zinc-600">/</span>
              <span class="font-semibold text-white">{{ currentBreadcrumb().label }}</span>
            </div>
          </div>

          <!-- Center: Global Search + Ctrl+K -->
          <div class="flex-1 max-w-md hidden md:block">
            <button
              type="button"
              (click)="openCommandPalette()"
              class="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#10111D] hover:bg-[#151626] border border-white/8 hover:border-purple-500/35 text-xs text-zinc-400 transition-all"
            >
              <span class="flex items-center gap-2">
                <lucide-icon [img]="SearchIcon" class="w-3.5 h-3.5 text-zinc-500" />
                <span>Search transactions, accounts, or jump to page...</span>
              </span>
              <kbd class="px-1.5 py-0.5 text-[10px] font-mono-num rounded bg-white/6 text-zinc-300 border border-white/10">
                Ctrl K
              </kbd>
            </button>
          </div>

          <!-- Right: Workspace Selector, Live Status, Clock, Notifications, Profile -->
          <div class="flex items-center gap-2.5 sm:gap-3">
            <!-- Workspace Selector Dropdown -->
            <div class="relative hidden sm:block">
              <button
                type="button"
                (click)="workspaceMenuOpen.set(!workspaceMenuOpen()); notificationsOpen.set(false); profileOpen.set(false)"
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10111D] hover:bg-[#151626] border border-white/8 text-xs text-zinc-200 transition-colors"
              >
                <lucide-icon [img]="BuildingIcon" class="w-3.5 h-3.5 text-purple-400" />
                <span class="max-w-[140px] truncate font-medium">
                  {{ workspaceService.activeWorkspace()?.name || 'Workspace' }}
                </span>
                <lucide-icon [img]="ChevronDownIcon" class="w-3.5 h-3.5 text-zinc-500" />
              </button>

              @if (workspaceMenuOpen()) {
                <div class="absolute right-0 mt-2 w-64 fs-elevated shadow-2xl z-50 py-1.5 animate-page-in">
                  <p class="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Switch Workspace
                  </p>
                  @for (ws of workspaceService.workspaces(); track ws.id) {
                    <button
                      type="button"
                      (click)="selectWorkspace(ws.id)"
                      class="w-full text-left px-3.5 py-2 text-xs hover:bg-white/6 flex items-center justify-between transition-colors"
                      [class.text-purple-300]="ws.id === workspaceService.activeWorkspace()?.id"
                    >
                      <div class="min-w-0">
                        <p class="font-medium truncate">{{ ws.name }}</p>
                        <p class="text-[10px] text-zinc-500 capitalize">{{ ws.type }} workspace</p>
                      </div>
                      @if (ws.id === workspaceService.activeWorkspace()?.id) {
                        <span class="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                      }
                    </button>
                  }
                </div>
              }
            </div>

            <div class="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-300">
              <span class="relative w-2 h-2 rounded-full bg-emerald-400 live-dot"></span>
              <span>SYSTEM LIVE</span>
            </div>

            <div class="hidden lg:block text-right">
              <p class="font-mono-num text-[11px] text-zinc-300">{{ currentTime() }}</p>
              <p class="text-[10px] text-zinc-500">UTC+6 • Live Engine</p>
            </div>

            <!-- Mobile Search Trigger -->
            <button
              type="button"
              (click)="openCommandPalette()"
              class="md:hidden p-2 rounded-xl bg-white/5 text-zinc-300 hover:text-white"
              aria-label="Command Palette"
            >
              <lucide-icon [img]="SearchIcon" class="w-4 h-4" />
            </button>

            <!-- Notifications Dropdown -->
            <div class="relative">
              <button
                type="button"
                (click)="notificationsOpen.set(!notificationsOpen()); profileOpen.set(false)"
                class="relative p-2 rounded-xl bg-[#10111D] hover:bg-[#151626] border border-white/8 text-zinc-300 hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <lucide-icon [img]="BellIcon" class="w-4 h-4" />
                @if (store.unreadNotificationsCount() > 0) {
                  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fuchsia-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {{ store.unreadNotificationsCount() }}
                  </span>
                }
              </button>

              @if (notificationsOpen()) {
                <div class="absolute right-0 mt-2 w-80 sm:w-96 fs-elevated shadow-2xl z-50 overflow-hidden animate-page-in">
                  <div class="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                    <span class="text-xs font-semibold text-white">Notifications</span>
                    <button
                      type="button"
                      (click)="store.markAllNotificationsRead()"
                      class="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <lucide-icon [img]="CheckCheckIcon" class="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  </div>
                  <div class="max-h-80 overflow-y-auto divide-y divide-white/6">
                    @for (n of store.notifications(); track n.id) {
                      <button
                        type="button"
                        (click)="navigateFromNotification(n.route)"
                        class="w-full text-left px-4 py-3 hover:bg-white/4 transition-colors flex items-start gap-3"
                        [class.opacity-60]="n.read"
                      >
                        <span
                          class="mt-1.5 w-2 h-2 rounded-full shrink-0"
                          [ngClass]="{
                            'bg-red-400': n.severity === 'critical',
                            'bg-amber-400': n.severity === 'warning',
                            'bg-purple-400': n.severity === 'info',
                            'bg-emerald-400': n.severity === 'success'
                          }"
                        ></span>
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-semibold text-white truncate">{{ n.title }}</p>
                          <p class="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{{ n.message }}</p>
                          <p class="text-[10px] text-zinc-500 mt-1">{{ n.timestamp | date: 'shortTime' }}</p>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Profile Dropdown -->
            <div class="relative">
              <button
                type="button"
                (click)="profileOpen.set(!profileOpen()); notificationsOpen.set(false); workspaceMenuOpen.set(false)"
                class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-[#10111D] hover:bg-[#151626] border border-white/8 transition-colors"
              >
                <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  @if (session.currentUser()?.avatarUrl; as url) {
                    <img [src]="url" alt="Profile" class="w-full h-full object-cover" />
                  } @else {
                    {{ session.currentUser()?.avatarInitials || 'ML' }}
                  }
                </div>
                <div class="hidden sm:block text-left">
                  <p class="text-xs font-semibold text-white leading-none">
                    {{ session.currentUser()?.fullName || store.settings().analystName }}
                  </p>
                  <p class="text-[10px] text-zinc-400 mt-0.5">{{ session.activeRole() }}</p>
                </div>
              </button>

              @if (profileOpen()) {
                <div class="absolute right-0 mt-2 w-60 fs-elevated shadow-2xl z-50 py-1.5 animate-page-in">
                  <div class="px-4 py-2.5 border-b border-white/8">
                    <p class="text-xs font-semibold text-white">
                      {{ session.currentUser()?.fullName || store.settings().analystName }}
                    </p>
                    <p class="text-[11px] text-zinc-400 truncate">
                      {{ session.currentUser()?.email || store.settings().analystEmail }}
                    </p>
                    @if (workspaceService.activeOrganization(); as org) {
                      <p class="text-[10px] text-purple-300 mt-1 truncate">{{ org.name }}</p>
                    }
                  </div>
                  <a
                    routerLink="/app/settings"
                    (click)="profileOpen.set(false)"
                    class="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5"
                  >
                    <lucide-icon [img]="UserIcon" class="w-3.5 h-3.5" />
                    Account & Org Settings
                  </a>
                  <a
                    routerLink="/app/model-overview"
                    (click)="profileOpen.set(false)"
                    class="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5"
                  >
                    <lucide-icon [img]="CpuIcon" class="w-3.5 h-3.5" />
                    Model Registry
                  </a>
                  <button
                    type="button"
                    (click)="profileOpen.set(false); auth.signOut()"
                    class="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-400 hover:text-red-300 hover:bg-white/5"
                  >
                    <lucide-icon [img]="LogOutIcon" class="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Command Palette (Ctrl+K) -->
    @if (commandPaletteOpen()) {
      <div
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
        (click)="commandPaletteOpen.set(false)"
      >
        <div
          class="w-full max-w-xl fs-elevated shadow-2xl overflow-hidden animate-page-in"
          (click)="$event.stopPropagation()"
        >
          <div class="px-4 py-3 border-b border-white/8 flex items-center gap-3">
            <lucide-icon [img]="CommandIcon" class="w-4 h-4 text-purple-400" />
            <input
              type="text"
              [(ngModel)]="paletteQuery"
              placeholder="Type a page name or transaction ID (e.g. TXN-4821)..."
              class="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              autofocus
            />
            <button
              type="button"
              (click)="commandPaletteOpen.set(false)"
              class="text-zinc-500 hover:text-white"
            >
              <lucide-icon [img]="CloseIcon" class="w-4 h-4" />
            </button>
          </div>

          <div class="max-h-96 overflow-y-auto p-2 space-y-3">
            @if (matchingTransactions().length > 0) {
              <div>
                <p class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Matching Transactions
                </p>
                @for (t of matchingTransactions(); track t.id) {
                  <button
                    type="button"
                    (click)="selectPaletteTxn(t.id)"
                    class="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-purple-500/15 text-xs transition-colors"
                  >
                    <span class="flex items-center gap-2.5">
                      <span class="font-mono-num font-semibold text-purple-300">{{ t.id }}</span>
                      <span class="text-zinc-300">{{ t.senderName }}</span>
                    </span>
                    <span class="font-mono-num text-zinc-400">\${{ t.amount | number: '1.0-0' }} • Risk {{ t.prediction.riskScore }}</span>
                  </button>
                }
              </div>
            }

            <div>
              <p class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Navigation
              </p>
              @for (item of matchingNavItems(); track item.route) {
                <button
                  type="button"
                  (click)="navigatePalette(item.route)"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/6 text-xs text-zinc-200 transition-colors"
                >
                  <lucide-icon [img]="item.icon" class="w-4 h-4 text-purple-400" />
                  <span>{{ item.label }}</span>
                  <span class="ml-auto text-[10px] text-zinc-500">{{ item.route }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <app-transaction-drawer />
    <app-toast-container />
  `,
})
export class AppShellComponent implements OnInit, OnDestroy {
  readonly store = inject(FraudStoreService);
  readonly auth = inject(AuthService);
  readonly session = inject(SessionService);
  readonly workspaceService = inject(WorkspaceService);
  private readonly txnService = inject(MockTransactionService);
  private readonly router = inject(Router);

  readonly collapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly workspaceMenuOpen = signal(false);
  readonly commandPaletteOpen = signal(false);
  readonly currentUrl = signal('/app');
  readonly currentTime = signal('');
  paletteQuery = '';

  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private routerSub: Subscription | null = null;

  // Icons
  readonly SearchIcon = Search;
  readonly BellIcon = Bell;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly ChevronDownIcon = ChevronDown;
  readonly BuildingIcon = Building2;
  readonly MenuIcon = Menu;
  readonly CommandIcon = Command;
  readonly CloseIcon = X;
  readonly LogOutIcon = LogOut;
  readonly UserIcon = User;
  readonly CpuIcon = Cpu;
  readonly SparklesIcon = Sparkles;
  readonly CheckCheckIcon = CheckCheck;

  readonly navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Command Center', route: '/app', icon: LayoutDashboard },
        { label: 'Live Monitoring', route: '/app/monitoring', icon: Activity },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Transactions', route: '/app/transactions', icon: ArrowLeftRight },
        { label: 'Explainable AI', route: '/app/explainability', icon: BrainCircuit },
        { label: 'Fraud Network', route: '/app/fraud-network', icon: Share2 },
        { label: 'Behavioral Security', route: '/app/behavioral-security', icon: Fingerprint },
        { label: 'AI Investigation', route: '/app/copilot', icon: Bot },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Attack Simulator', route: '/app/simulator', icon: Swords },
        {
          label: 'Case Queue',
          route: '/app/cases',
          icon: FolderKanban,
          badge: () => this.store.cases().filter((c) => c.status === 'New' || c.status === 'Escalated').length,
        },
        { label: 'Geographic Intelligence', route: '/app/geo-intelligence', icon: Globe2 },
      ],
    },
    {
      title: 'MODEL INTELLIGENCE',
      items: [
        { label: 'Threshold Tuner', route: '/app/threshold-tuner', icon: SlidersHorizontal },
        { label: 'Drift Monitor', route: '/app/drift-monitor', icon: TrendingUp },
        { label: 'Federated Learning', route: '/app/federated-learning', icon: Network },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Model Overview', route: '/app/model-overview', icon: Cpu },
        { label: 'Settings', route: '/app/settings', icon: Settings },
      ],
    },
  ];

  readonly visibleNavGroups = computed(() => {
    this.session.activeRole();
    return this.navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => this.auth.canAccessRoute(item.route)),
      }))
      .filter((g) => g.items.length > 0);
  });

  readonly allNavItems = this.navGroups.flatMap((g) =>
    g.items.map((i) => ({ ...i, group: g.title }))
  );

  selectWorkspace(wsId: string): void {
    this.auth.switchWorkspace(wsId);
    this.workspaceMenuOpen.set(false);
    this.store.showToast('Workspace Switched', 'Active workspace context updated.', 'info');
  }

  readonly currentBreadcrumb = computed(() => {
    const url = this.currentUrl().split('?')[0];
    if (url === '/app' || url === '/app/dashboard') {
      return { group: 'OVERVIEW', label: 'Command Center' };
    }
    const found = this.allNavItems.find((i) => i.route !== '/app' && url.startsWith(i.route));
    return found ?? { group: 'OVERVIEW', label: 'Command Center' };
  });

  ngOnInit(): void {
    this.txnService.startLiveStream();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.currentUrl.set(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.notificationsOpen.set(false);
        this.profileOpen.set(false);
      });
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openCommandPalette();
    } else if (event.key === 'Escape') {
      this.commandPaletteOpen.set(false);
      this.notificationsOpen.set(false);
      this.profileOpen.set(false);
    }
  }

  openCommandPalette(): void {
    this.paletteQuery = '';
    this.commandPaletteOpen.set(true);
  }

  matchingNavItems() {
    const q = this.paletteQuery.trim().toLowerCase();
    if (!q) return this.allNavItems;
    return this.allNavItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
    );
  }

  matchingTransactions() {
    const q = this.paletteQuery.trim().toLowerCase();
    if (!q) return this.store.transactions().slice(0, 3);
    return this.store
      .transactions()
      .filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.senderName.toLowerCase().includes(q) ||
          t.senderAccount.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }

  navigatePalette(route: string): void {
    this.commandPaletteOpen.set(false);
    this.router.navigate([route]);
  }

  selectPaletteTxn(id: string): void {
    this.commandPaletteOpen.set(false);
    this.store.openTransactionDrawer(id);
  }

  navigateFromNotification(route?: string): void {
    this.notificationsOpen.set(false);
    if (route) this.router.navigate([route]);
  }

  private updateClock(): void {
    this.currentTime.set(
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.routerSub?.unsubscribe();
  }
}
