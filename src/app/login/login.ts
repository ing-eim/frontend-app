import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Auth } from './auth';
import { ScheduleService } from '../shared/schedule.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;
  showSessionExpiredModal: boolean = false;
  countdown: number = 5;

  constructor(private auth: Auth, private router: Router, private scheduleService: ScheduleService, @Inject(PLATFORM_ID) private platformId: Object) {
    // console.log('🏗️ Login component constructor ejecutado');
  }

  // Método de prueba para verificar que el click funciona
  testClick() {
    // console.log('🧪 TEST: Click detectado en el botón');
  }

  login(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    // console.log('🚀 Login component - método login() ejecutado');
    // console.log('👤 Username:', this.username);
    // console.log('🔒 Password length:', this.password?.length || 0);
    
    if (!this.username || !this.password) {
      // console.log('❌ Login component - faltan credenciales');
      this.error = 'Ingresa usuario y contraseña';
      return;
    }
    
    // console.log('📞 Login component - llamando auth.login()');
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: (success) => {
        // console.log('✅ Login component - respuesta recibida:', success);
        this.loading = false;
        if (success) {
          // console.log('🎉 Login component - login exitoso, priming schedule cache and navigating to dashboard');
          this.error = '';
          // Prime schedule cache so Inicio component can show data immediately
          try {
            this.scheduleService.fetch().then(() => {
              try { this.router.navigate(['/dashboard','inicio']); } catch (e) { /* noop */ }
            }).catch(() => {
              // Even if fetch fails, proceed to dashboard inicio
              try { this.router.navigate(['/dashboard','inicio']); } catch (e) { /* noop */ }
            });
          } catch (e) {
            try { this.router.navigate(['/dashboard','inicio']); } catch (err) { /* noop */ }
          }
        } else {
          // console.log('❌ Login component - login fallido');
          this.error = 'Usuario o contraseña incorrectos';
        }
      },
      error: (error) => {
        // console.log('💥 Login component - error en login:', error);
        this.loading = false;
        this.error = 'Error de conexión';
      }
    });
  }

  // AUTO-LOGOUT CON DETECCIÓN DE ACTIVIDAD
  private logoutTimer: any = null;
  private readonly INACTIVITY_TIME = 10 * 1000; 
  private activityListeners: Array<() => void> = [];

  startAutoLogoutFromComponent() {
    // console.log('⏰ Sistema de auto-logout iniciado (10 segundos de inactividad para testing)');
    
    // Configurar listeners de actividad (solo en navegador)
    if (isPlatformBrowser(this.platformId)) {
      this.setupActivityListeners();
    }
    
    // Iniciar timer
    this.startLogoutTimer();
    // console.log('Timer de logout configurado correctamente');
  }

  private startLogoutTimer() {
    // Limpiar timer anterior si existe
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      // console.log('Timer anterior limpiado');
    }
    
    // console.log('Configurando nuevo timer de', this.INACTIVITY_TIME, 'ms');
    
    // Crear nuevo timer
    this.logoutTimer = setTimeout(() => {
      // console.log('🚨 Sesión expirada por inactividad - mostrando modal');
      
      // Remover listeners de actividad para evitar interferencias
      this.removeActivityListeners();
      
      // Mostrar modal
      this.showSessionExpiredModal = true;
      this.countdown = 5;
      // console.log('Modal mostrada:', this.showSessionExpiredModal);
      
      // Iniciar cuenta regresiva
      this.startCountdown();
    }, this.INACTIVITY_TIME);
  }

  private setupActivityListeners() {
    const resetTimer = () => {
      // Solo reiniciar timer si la modal no está visible
      if (!this.showSessionExpiredModal) {
        // console.log('🔄 Actividad detectada - reiniciando timer');
        this.startLogoutTimer();
      }
    };

    // Limpiar listeners anteriores
    this.removeActivityListeners();

    // Agregar listeners para detectar actividad
    this.activityListeners = [resetTimer, resetTimer, resetTimer, resetTimer, resetTimer];
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('mousedown', resetTimer);
      document.addEventListener('mousemove', resetTimer);
      document.addEventListener('keypress', resetTimer);
      document.addEventListener('scroll', resetTimer);
      document.addEventListener('click', resetTimer);
    }
  }

  private removeActivityListeners() {
    if (this.activityListeners.length > 0) {
      if (isPlatformBrowser(this.platformId)) {
        document.removeEventListener('mousedown', this.activityListeners[0]);
        document.removeEventListener('mousemove', this.activityListeners[1]);
        document.removeEventListener('keypress', this.activityListeners[2]);
        document.removeEventListener('scroll', this.activityListeners[3]);
        document.removeEventListener('click', this.activityListeners[4]);
      }
      this.activityListeners = [];
    }
  }

  closeSessionExpiredModal() {
    this.showSessionExpiredModal = false;
    
    // Limpiar timers
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    
    // Remover listeners
    this.removeActivityListeners();
    
    // Limpiar sessionStorage
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem('token');
      } catch (e) {
        // noop
      }
      try {
        window.location.href = '/login';
      } catch (e) {
        // noop
      }
    }
  }

  private startCountdown() {
    // console.log('Iniciando cuenta regresiva desde:', this.countdown);
    const countdownInterval = setInterval(() => {
      this.countdown--;
      // console.log('Countdown:', this.countdown);
      
      if (this.countdown <= 0) {
        // console.log('Countdown terminado, cerrando modal');
        clearInterval(countdownInterval);
        if (this.showSessionExpiredModal) {
          this.closeSessionExpiredModal();
        }
      }
    }, 1000);
  }
}
