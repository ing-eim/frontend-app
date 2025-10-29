import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScheduleService } from '../../shared/schedule.service';
import { LoadingService } from '../../shared/loading.service';
import { DashboardKpiService } from '../../shared/dashboard-kpi.service';
import { Auth } from '../../login/auth';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss']
})
export class Inicio implements OnInit, AfterViewInit {
  schedule: any[] = [];
  loading = true;
  errorMessage: string | null = null;
  // Day names mapping (1-based index expected)
  readonly dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  // KPIs reales del sistema
  systemStats: any = {
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    recentActivities: 0,
    systemStatus: 'Cargando...',
    lastActivityDate: 'Cargando...',
    // Nuevas métricas de rendimiento
    dataQualityPercent: 0,
    etlProcessesSuccess: 0,
    storageEfficiency: 0
  };
  
  activityTrend: any = {
    todayVsYesterday: 0
  };

  constructor(
    private scheduleService: ScheduleService, 
    private loadingService: LoadingService,
    private dashboardKpiService: DashboardKpiService,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
      
      // Cargar datos del cronograma y KPIs reales en paralelo
      const [scheduleData, kpiStats, trends] = await Promise.all([
        this.scheduleService.fetch().catch(() => []),
        this.dashboardKpiService.getRealSystemStats().catch(() => this.systemStats),
        this.dashboardKpiService.getActivityTrend().catch(() => this.activityTrend)
      ]);

      this.schedule = scheduleData || [];
      this.systemStats = kpiStats;
      this.activityTrend = trends;

      if (!this.schedule || this.schedule.length === 0) {
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
      // Actualizar círculos después de cargar los datos
      setTimeout(() => this.updateMetricCircles(), 200);
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

  // Métodos para el nuevo dashboard profesional
  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getTodayActivities(): number {
    if (!this.schedule || this.schedule.length === 0) return 0;
    // Simulación: contar actividades que podrían ejecutarse hoy
    return this.schedule.filter(item => 
      item.frecuencia === 'Diaria' || 
      item.frequency === 'Diaria'
    ).length || 3;
  }

  getPendingProcesses(): number {
    if (!this.schedule || this.schedule.length === 0) return 0;
    // Simulación: procesos pendientes basados en el cronograma
    return Math.ceil(this.schedule.length * 0.3) || 2;
  }

  async refreshSchedule(): Promise<void> {
    console.log('Actualizando cronograma y KPIs...');
    this.scheduleService.clear(); // Limpiar cache
    
    try {
      this.loadingService.show(3000);
      
      // Recargar datos reales
      const [scheduleData, kpiStats, trends] = await Promise.all([
        this.scheduleService.fetch().catch(() => []),
        this.dashboardKpiService.getRealSystemStats().catch(() => this.systemStats),
        this.dashboardKpiService.getActivityTrend().catch(() => this.activityTrend)
      ]);

      this.schedule = scheduleData || [];
      this.systemStats = kpiStats;
      this.activityTrend = trends;
      
      try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
    } catch (e) {
      console.error('Error actualizando dashboard:', e);
    } finally {
      this.loadingService.hide();
      // Actualizar círculos de progreso después de cambiar los datos
      setTimeout(() => this.updateMetricCircles(), 100);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Actualizar círculos después de que la vista esté lista
      setTimeout(() => this.updateMetricCircles(), 500);
    }
  }

  private updateMetricCircles(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const circles = document.querySelectorAll('.metric-circle');
      circles.forEach((circle: Element) => {
        const percentage = circle.getAttribute('data-percentage');
        if (percentage) {
          (circle as HTMLElement).style.setProperty('--percentage', percentage);
        }
      });
    } catch (error) {
      console.warn('Error actualizando círculos de métricas:', error);
    }
  }
}
