import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { LucideAngularModule, Globe2, AlertTriangle, MapPin } from 'lucide-angular';
import { FraudStoreService } from '../../core/state/fraud-store.service';
import { DEMO_LOCATIONS } from '../../core/data/mock-seed.data';

@Component({
  selector: 'app-geo-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5 animate-page-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight gradient-text">
            Global Fraud Intelligence
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            Cross-border transaction hotspots, impossible travel corridors, and regional risk telemetry (Demo Coordinates)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            [ngModel]="riskFilter()"
            (ngModelChange)="riskFilter.set($event)"
            class="px-3 py-2 rounded-xl bg-[#10111D] border border-white/10 text-xs text-zinc-200"
          >
            <option value="all">All Risk Tiers</option>
            <option value="high">High & Critical Only (60+)</option>
            <option value="critical">Critical Only (80+)</option>
          </select>
        </div>
      </div>

      <!-- Map + Side Panel -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div class="fs-card xl:col-span-8 overflow-hidden relative">
          <div #mapHost class="w-full h-[520px] z-10"></div>

          <div class="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl bg-[#090A16]/90 border border-white/10 text-[11px] text-zinc-300">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Hotspot</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High Risk</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low Risk</span>
            <span class="flex items-center gap-1.5"><span class="w-4 h-0.5 bg-fuchsia-400"></span> Cross-Border Route</span>
          </div>
        </div>

        <!-- Side Panel -->
        <div class="xl:col-span-4 space-y-4">
          <!-- Impossible Travel Alerts -->
          <div class="fs-card p-5 border-red-500/25 space-y-3">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
              <lucide-icon [img]="AlertIcon" class="w-4 h-4 text-red-400" />
              Impossible Travel Alerts
            </h3>
            <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs space-y-1">
              <p class="font-semibold text-red-200">ACC-77318: Dhaka (BD) → Dubai (AE)</p>
              <p class="text-zinc-300">3,520 km hop in 14 minutes • TXN-4821 ($18,450)</p>
              <button
                type="button"
                (click)="store.openTransactionDrawer('TXN-4821')"
                class="text-[11px] font-mono-num text-purple-300 hover:underline pt-1"
              >
                Inspect TXN-4821 →
              </button>
            </div>
          </div>

          <!-- Regional Breakdown -->
          <div class="fs-card p-5 space-y-3">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
              <lucide-icon [img]="GlobeIcon" class="w-4 h-4 text-purple-400" />
              Transactions by Region
            </h3>
            <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              @for (stat of regionStats(); track stat.city) {
                <div class="p-3 rounded-xl bg-[#090A16] border border-white/8 flex items-center justify-between text-xs">
                  <div>
                    <p class="font-semibold text-white flex items-center gap-1.5">
                      <lucide-icon [img]="PinIcon" class="w-3.5 h-3.5 text-purple-400" />
                      {{ stat.city }}, {{ stat.country }}
                    </p>
                    <p class="text-[11px] text-zinc-400 mt-0.5">
                      {{ stat.total }} txns • {{ stat.fraud }} high-risk
                    </p>
                  </div>
                  <span
                    class="font-mono-num font-bold px-2 py-0.5 rounded"
                    [ngClass]="
                      stat.avgRisk >= 60
                        ? 'bg-red-500/15 text-red-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    "
                  >
                    Avg {{ stat.avgRisk }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GeoIntelligenceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;
  readonly store = inject(FraudStoreService);

  readonly GlobeIcon = Globe2;
  readonly AlertIcon = AlertTriangle;
  readonly PinIcon = MapPin;

  readonly riskFilter = signal<'all' | 'high' | 'critical'>('all');

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;

  readonly regionStats = computed(() => {
    const filter = this.riskFilter();
    const txns = this.store.transactions().filter((t) => {
      if (filter === 'critical') return t.prediction.riskScore >= 80;
      if (filter === 'high') return t.prediction.riskScore >= 60;
      return true;
    });

    return DEMO_LOCATIONS.map((loc) => {
      const local = txns.filter((t) => t.location.city === loc.city);
      const fraud = local.filter((t) => t.prediction.riskScore >= 60).length;
      const avgRisk = local.length
        ? Math.round(local.reduce((s, t) => s + t.prediction.riskScore, 0) / local.length)
        : 0;
      return {
        ...loc,
        total: local.length,
        fraud,
        avgRisk,
      };
    }).sort((a, b) => b.avgRisk - a.avgRisk);
  });

  constructor() {
    effect(() => {
      const stats = this.regionStats();
      if (this.map && this.markerLayer) {
        this.renderMarkers(stats);
      }
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapHost.nativeElement, {
      center: [24, 55],
      zoom: 2,
      minZoom: 2,
      worldCopyJump: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers(this.regionStats());
  }

  private renderMarkers(stats: ReturnType<GeoIntelligenceComponent['regionStats']>): void {
    if (!this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const s of stats) {
      const color = s.avgRisk >= 75 ? '#EF4444' : s.avgRisk >= 50 ? '#F59E0B' : '#10B981';
      const circle = L.circleMarker([s.lat, s.lng], {
        radius: Math.max(7, Math.min(18, 6 + s.total * 1.1)),
        color,
        fillColor: color,
        fillOpacity: 0.45,
        weight: 2,
      });

      circle.bindPopup(
        `<div style="font-size:12px;">
          <strong>${s.city}, ${s.country}</strong><br/>
          Transactions: ${s.total}<br/>
          High-Risk: ${s.fraud}<br/>
          Avg Risk Score: ${s.avgRisk}/100
        </div>`
      );
      circle.addTo(this.markerLayer);
    }

    // Add demo route lines (e.g., Dhaka -> Dubai, London -> New York, Singapore -> San Francisco)
    const routes: [number, number][][] = [
      [[23.8103, 90.4125], [25.2048, 55.2708]],
      [[51.5074, -0.1278], [40.7128, -74.006]],
      [[1.3521, 103.8198], [37.7749, -122.4194]],
    ];

    for (const r of routes) {
      L.polyline(r, {
        color: '#D946EF',
        weight: 2,
        dashArray: '6, 8',
        opacity: 0.7,
      }).addTo(this.markerLayer);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
