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
}
