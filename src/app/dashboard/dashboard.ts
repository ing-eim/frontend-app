import { Component, HostListener, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '../login/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionExpiredService } from '../shared/session-expired.service';
import { Subscription } from 'rxjs';

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
  
  // Simulación de cronograma basado en la imagen
  private scheduleData = [
    { name: 'Factoraje (Lupita)', days: [5] as number[], frequency: 'semanal' },
    { name: 'Relación de pagos (Lupita)', days: [2] as number[], frequency: 'semanal' },
    { name: 'Pipeline Transporte (Ricardo)', days: [1] as number[], frequency: 'semanal' },
    { name: 'Tarifario transporte (Ricardo)', days: [3] as number[], frequency: 'semanal' },
    { name: 'Reporte de evidencias pendientes (Blanquita)', days: [3] as number[], frequency: 'semanal' },
    { name: 'Pronóstico de cobranza (Chio)', days: [3] as number[], frequency: 'semanal' },
    { name: 'Balance general, estado de resultados y balanza de comprobación (SAICO)', days: [5] as number[], frequency: 'mensual', dayOfMonth: 10 },
    { name: 'Pipeline Comercial (Edgar)', days: [5] as number[], frequency: 'semanal' },
    { name: 'Cartera de clientes SAF', days: [5] as number[], frequency: 'semanal' },
    { name: 'OnTime', days: [5] as number[], frequency: 'semanal' }
  ];
  
  constructor(
    public auth: Auth, 
    private router: Router,
    private sessionExpiredService: SessionExpiredService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      this.sidebarCollapsed = savedState === 'true';
      
      // Suscribirse al servicio de sesión expirada
      this.setupSessionExpiredSubscription();
    }
  }

  ngOnInit() {
    this.loadNotifications();
  }

  // Configurar función global para mostrar modal
  private setupSessionExpiredSubscription() {
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
    
    // Limpiar función global
    delete (window as any).showSessionExpiredModal;
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

  @HostListener('document:click', ['$event'])
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
