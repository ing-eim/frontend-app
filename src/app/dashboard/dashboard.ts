import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '../login/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionExpiredService } from '../shared/session-expired.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { effect } from '@angular/core';
import { ExcelResultService } from '../shared/excel-result.service';
import { LoadingService } from '../shared/loading.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  menuOpen = false;
  sidebarCollapsed = false;
  operacionesMenuOpen = false;
  version: string = environment.version;
  
  // MODAL DE SESIÓN EXPIRADA
  // Session modal is handled by SessionExpiredModal component and SessionExpiredService
  private sessionExpiredSubscription: Subscription = new Subscription();
  
  // SISTEMA DE NOTIFICACIONES
  notificationsOpen = false;
  pendingNotifications: NotificationItem[] = [];
  // derived notification UI fields to avoid binding directly to array.length which may change
  notificationsCount = 0;
  hasNotifications = false;
  // Si el dashboard debe mostrar datos del excel procesado
  excelDataFromUpload: any = null;
  showExcelDetails = false;
  // Computed Date to display when a result arrives. It's a Date or null.
  excelProcessedAt: Date | null = null;
  
  // Cronograma cargado desde backend (/cronactivdiarias). Hay un fallback local si la petición falla.
  private scheduleData: ScheduleItem[] = [];

  // Fallback local (mismo contenido original) usado si la API no responde
  private readonly DEFAULT_SCHEDULE: ScheduleItem[] = [
    { name: 'Factoraje (Lupita)', days: [5], frequency: 'semanal' },
    { name: 'Relación de pagos (Lupita)', days: [2], frequency: 'semanal' },
    { name: 'Pipeline Transporte (Ricardo)', days: [1], frequency: 'semanal' },
    { name: 'Tarifario transporte (Ricardo)', days: [3], frequency: 'semanal' },
    { name: 'Reporte de evidencias pendientes (Blanquita)', days: [3], frequency: 'semanal' },
    { name: 'Pronóstico de cobranza (Chio)', days: [3], frequency: 'semanal' },
    { name: 'Balance general, estado de resultados y balanza de comprobación (SAICO)', days: [5], frequency: 'mensual', dayOfMonth: 10 },
    { name: 'Pipeline Comercial (Edgar)', days: [5], frequency: 'semanal' },
    { name: 'Cartera de clientes SAF', days: [5], frequency: 'semanal' },
    { name: 'OnTime', days: [5], frequency: 'semanal' }
  ];
  
  constructor(
    public auth: Auth, 
    private router: Router,
    private sessionExpiredService: SessionExpiredService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private excelResult: ExcelResultService,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      this.sidebarCollapsed = savedState === 'true';
    }

    // SessionExpiredModal reads SessionExpiredService directly; Dashboard does not mirror modal state
    // React to results (ExcelResultService uses a signal)
    // effect must be created in an injection context (constructor/factory/field)
    try {
      effect(() => {
        try {
          const res = this.excelResult.result();
          if (res) {
            // Defer to next macrotask and then trigger change detection
            setTimeout(() => {
              this.excelDataFromUpload = res;
              // Compute a displayable processed-at date. Prefer backend fields; fallback to current time.
              try {
                if (res.processed_at) {
                  // backend might send an ISO string
                  this.excelProcessedAt = new Date(res.processed_at);
                } else if (res.timestamp) {
                  // timestamp might be numeric (ms) or ISO string
                  const ts = res.timestamp;
                  this.excelProcessedAt = typeof ts === 'number' ? new Date(ts) : new Date(ts);
                } else if (res.rows_read !== undefined) {
                  // fallback: use now as processing time when backend doesn't provide it
                  this.excelProcessedAt = new Date();
                } else {
                  this.excelProcessedAt = null;
                }
              } catch (e) {
                this.excelProcessedAt = null;
              }
              if (isPlatformBrowser(this.platformId) && typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => requestAnimationFrame(() => this.loading.hide()));
              } else {
                setTimeout(() => this.loading.hide(), 0);
              }
              try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
            }, 0);
          }
        } catch (e) {
          // noop in SSR
        }
      });
    } catch (e) {
      // If effect cannot be created, ignore in SSR
    }

    // Attach a single document click listener in browser only (used to close menus/modal)
    if (isPlatformBrowser(this.platformId)) {
      try {
        const handler = (event: Event) => this.onDocumentClick(event as MouseEvent);
        document.addEventListener('click', handler);
        (this as any).__docClickHandler = handler;
      } catch (e) {
        // noop
      }
    }
  }

  ngOnInit() {
    // Intentar cargar el cronograma desde la API y luego generar notificaciones
    try {
      this.fetchScheduleFromServer()
        .then(() => setTimeout(() => this.loadNotifications(), 0))
        .catch(() => setTimeout(() => this.loadNotifications(), 0));
    } catch (e) {
      // En prerender o si algo falla, usar fallback de notificaciones
      setTimeout(() => this.loadNotifications(), 0);
    }


  }

  private async fetchScheduleFromServer(): Promise<void> {
    try {
      const url = `${environment.apiUrl}/cronactivdiarias`;
      const resp = await firstValueFrom(this.http.get<any[]>(url));

      if (Array.isArray(resp) && resp.length > 0) {
        // Mapear respuesta al formato interno
        this.scheduleData = resp.map(item => {
          const diasStr: string = item.dias_carga ?? '';
          const days = diasStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
          return {
            name: item.actividad_descripcion || item.archivo_nombre || 'Sin descripción',
            days: days.length ? days : [1],
            frequency: 'semanal'
          } as ScheduleItem;
        });
        return;
      }
    } catch (e) {
      // noop: usaremos el fallback
    }

    // Si llegamos aquí, usar el fallback local
    //this.scheduleData = this.DEFAULT_SCHEDULE.slice();
  }

  // (session-expired modal is handled by SessionExpiredService + effect in constructor)

  ngOnDestroy() {
    // Limpiar subscripción

    if (this.sessionExpiredSubscription) {
      this.sessionExpiredSubscription.unsubscribe();
    }

    // Remove manual document listener if attached (browser only)
    if (isPlatformBrowser(this.platformId)) {
      try {
        const handler = (this as any).__docClickHandler as EventListener | undefined;
        if (handler) {
          document.removeEventListener('click', handler);
          delete (this as any).__docClickHandler;
        }
      } catch (e) {
        // noop
      }
    }
  }

  toggleExcelDetails() {
    this.showExcelDetails = !this.showExcelDetails;
    try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Cerrar submenús cuando se colapsa el sidebar
    if (this.sidebarCollapsed) {
      this.operacionesMenuOpen = false;
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    }
  }

  toggleOperacionesMenu() {
    if (!this.sidebarCollapsed) {
      this.operacionesMenuOpen = !this.operacionesMenuOpen;
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.menuOpen = false;
  }

  onDocumentClick(event: MouseEvent) {
    // If recently opened via the notifications toggle, ignore this document click
    if ((this as any).__ignoreDocClose) {
      (this as any).__ignoreDocClose = false;
      return;
    }

    const target = event.target as HTMLElement;
    // Always close notifications on any click
    this.notificationsOpen = false;

    // Close menu only when clicking outside the user-info element
    if (!target.closest('.user-info')) {
      this.menuOpen = false;
    }
    try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
  }



  closeSessionExpiredModal() {
    // Delegate the finalization to the SessionExpiredService so it can clear intervals, dispatch events and navigate
    try {
      this.sessionExpiredService.finalizeLogout();
    } catch (e) {
      // fallback to auth if service call fails
      try { this.auth.finalizeLogout(); } catch (err) { /* noop */ }
    }
  }



  // MÉTODOS PARA EL SISTEMA DE NOTIFICACIONES
  toggleNotifications() {
    const next = !this.notificationsOpen;
    this.notificationsOpen = next;
    // Prevent immediate document click (same click) from immediately closing the just-opened notifications
    if (next && isPlatformBrowser(this.platformId)) {
      (this as any).__ignoreDocClose = true;
      setTimeout(() => { (this as any).__ignoreDocClose = false; }, 0);
    }
  }

  loadNotifications() {
    // assign notifications and update derived fields in next macrotask to avoid ExpressionChanged errors
    const items = this.generateNotifications();
    setTimeout(() => {
      this.pendingNotifications = items;
      this.notificationsCount = items.length;
      this.hasNotifications = items.length > 0;
      try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
    }, 0);
  }

  private generateNotifications(): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const currentDate = today.getDate();
    
    this.scheduleData.forEach(item => {
      if (item.frequency === 'semanal' && item.days.includes(currentDay)) {
        // Verificar si es el día de carga y simular que no se ha subido
        const isUploaded = Math.random() > 0.7; // 30% probabilidad de estar subido
        
        if (!isUploaded) {
          notifications.push({
            title: `Archivo pendiente: ${item.name}`,
            message: `Se debe cargar hoy (${this.getDayName(currentDay)})`,
            dueDate: this.formatDate(today),
            isUrgent: true,
            isWarning: false,
            fileName: item.name
          });
        }
      } else if (item.frequency === 'mensual' && item.dayOfMonth === currentDate) {
        // Para archivos mensuales
        const isUploaded = Math.random() > 0.8; // 20% probabilidad de estar subido
        
        if (!isUploaded) {
          notifications.push({
            title: `Archivo mensual pendiente: ${item.name}`,
            message: `Vencimiento: día ${item.dayOfMonth} del mes`,
            dueDate: this.formatDate(today),
            isUrgent: true,
            isWarning: false,
            fileName: item.name
          });
        }
      }
      
      // Agregar advertencias para archivos que vencen mañana
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = tomorrow.getDay();
      
      if (item.frequency === 'semanal' && item.days.includes(tomorrowDay)) {
        notifications.push({
          title: `Recordatorio: ${item.name}`,
          message: `Se debe cargar mañana (${this.getDayName(tomorrowDay)})`,
          dueDate: this.formatDate(tomorrow),
          isUrgent: false,
          isWarning: true,
          fileName: item.name
        });
      }
    });

    return notifications;
  }

  private getDayName(dayNumber: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber];
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

// Interface para las notificaciones
interface NotificationItem {
  title: string;
  message: string;
  dueDate: string;
  isUrgent: boolean;
  isWarning: boolean;
  fileName: string;
}

// Interfaz local para el cronograma
interface ScheduleItem {
  name: string;
  days: number[];
  frequency?: string;
  dayOfMonth?: number;
}
