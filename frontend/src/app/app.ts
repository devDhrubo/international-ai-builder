import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DynamicCursorComponent } from './shared/components/dynamic-cursor.component';
import { SimulationDashboardBridgeService } from './core/services/simulation-dashboard-bridge.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DynamicCursorComponent],
  template: `
    <app-dynamic-cursor />
    <router-outlet />
  `,
})
export class App {
  private readonly _simBridge = inject(SimulationDashboardBridgeService);
}
