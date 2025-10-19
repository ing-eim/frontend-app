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
  
  // MODAL DE SESIÓN EXPIRADA
  showSessionExpiredModal: boolean = false;
  countdown: number = 5;
  private sessionExpiredSubscription: Subscription = new Subscription();
  
  // SISTEMA DE NOTIFICACIONES
  notificationsOpen = false;
  pendingNotifications: NotificationItem[] = [];
  // Si el dashboard debe mostrar datos del excel procesado
  excelDataFromUpload: any = null;
  
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
      
      // Suscribirse al servicio de sesión expirada
      this.setupSessionExpiredSubscription();
    }
    // React to results (ExcelResultService uses a signal)
    // effect must be created in an injection context (constructor/factory/field)
    try {
      effect(() => {
      // Attach manual document click listener in browser only
      if (isPlatformBrowser(this.platformId)) {
        try {
          const handler = (event: Event) => this.onDocumentClick(event as MouseEvent);
          document.addEventListener('click', handler);
          // store handler for removal
          (this as any).__docClickHandler = handler;
        } catch (e) {
          // noop
        }
      }
        try {
          const res = this.excelResult.result();
          if (res) {
            console.log('[Dashboard] excel result observed in effect():', res);
            // Defer to next macrotask and then trigger change detection
            setTimeout(() => {
              console.log('[Dashboard] assigning excelDataFromUpload in setTimeout');
              this.excelDataFromUpload = res;
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
  }

  ngOnInit() {
    // Intentar cargar el cronograma desde la API y luego generar notificaciones
    try {
      this.fetchScheduleFromServer().then(() => this.loadNotifications()).catch(() => this.loadNotifications());
    } catch (e) {
      // En prerender o si algo falla, usar fallback de notificaciones
      this.loadNotifications();
    }

    // ngOnInit used only for async startup tasks (fetchScheduleFromServer handled above)
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
    this.scheduleData = this.DEFAULT_SCHEDULE.slice();
  }

  // Configurar función global para mostrar modal
  private setupSessionExpiredSubscription() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Crear función global que puede ser llamada desde cualquier lugar
    (window as any).showSessionExpiredModal = () => {
      // Mostrar modal
      this.showSessionExpiredModal = true;
      this.countdown = 5;
      
      // Iniciar cuenta regresiva
      this.startCountdown();
    };
  }

  ngOnDestroy() {
    // Limpiar subscripción
    if (this.sessionExpiredSubscription) {
      this.sessionExpiredSubscription.unsubscribe();
    }
    
    // Limpiar función global (solo si estamos en navegador)
    if (isPlatformBrowser(this.platformId)) {
      try {
        delete (window as any).showSessionExpiredModal;
      } catch (e) {
        // noop
      }

      // Remove manual document listener if attached
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
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.menuOpen = false;
    }
    if (!target.closest('.topbar-right .topbar-notifications')) {
      this.notificationsOpen = false;
    }
  }



  closeSessionExpiredModal() {
    this.showSessionExpiredModal = false;
    
    // Usar el método del auth service para finalizar el logout
    this.auth.finalizeLogout();
  }

  // MÉTODO DE PRUEBA PARA LA MODAL
  testModal() {
    this.showSessionExpiredModal = true;
    this.countdown = 30;
    this.startCountdown();
  }

  private startCountdown() {
    const countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(countdownInterval);
        if (this.showSessionExpiredModal) {
          this.closeSessionExpiredModal();
        }
      }
    }, 1000);
  }

  // MÉTODOS PARA EL SISTEMA DE NOTIFICACIONES
  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
  }

  loadNotifications() {
    this.pendingNotifications = this.generateNotifications();
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
