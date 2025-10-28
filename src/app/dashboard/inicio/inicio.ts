import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleService } from '../../shared/schedule.service';
import { LoadingService } from '../../shared/loading.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss']
})
export class Inicio implements OnInit {
  schedule: any[] = [];
  loading = true;
  errorMessage: string | null = null;
  // Day names mapping (1-based index expected)
  readonly dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  constructor(private scheduleService: ScheduleService, private loadingService: LoadingService, private cdr: ChangeDetectorRef,
              @Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit() {
    try {
      // Only fetch from browser (avoid server-side prerender making authenticated calls which will 401)
      if (!isPlatformBrowser(this.platformId)) {
        this.schedule = [];
        this.loading = false;
        this.errorMessage = null;
        return;
      }

      this.loadingService.show(5000);
      const data = await this.scheduleService.fetch();
      this.schedule = data || [];
      if (!this.schedule || this.schedule.length === 0) {
        // indicate empty or fetch issue (likely 401 if not logged in)
        this.errorMessage = 'No se encontraron actividades. Asegúrate de estar autenticado.';
      }
    } catch (e) {
      this.schedule = [];
      this.errorMessage = 'Error cargando actividades (ver consola).';
    } finally {
      // allow paint then hide spinner (safe for SSR)
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => requestAnimationFrame(() => this.loadingService.hide()));
      } else {
        // server/prerender: just hide on next tick
        setTimeout(() => this.loadingService.hide(), 0);
      }
      this.loading = false;
      try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
    }
  }

  /**
   * Convert various day representations into human-readable day names.
   * Accepts:
   * - array of numbers (e.g. [1,2,3])
   * - comma-separated string of numbers ("1,2,3")
   * - single number
   */
  mapDays(src: any): string {
    if (!src && src !== 0) return '';

    // Normalize to array of numbers
    let arr: number[] = [];
    if (Array.isArray(src)) {
      arr = src.map((v: any) => Number(v)).filter((n: number) => !isNaN(n));
    } else if (typeof src === 'string') {
      // split on non-digit characters
      arr = src.split(/[^0-9]+/).map(s => Number(s)).filter(n => !isNaN(n));
    } else if (typeof src === 'number') {
      arr = [src];
    }

    const names = arr.map(n => {
      // assume 1 -> Lunes, 7 -> Domingo; fallback for 0-based
      if (n >= 1 && n <= 7) return this.dayNames[n - 1];
      if (n >= 0 && n <= 6) return this.dayNames[n];
      return String(n);
    });

    return names.join(', ');
  }
}
