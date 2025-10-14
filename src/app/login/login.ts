import { Component } from '@angular/core';
import { Auth } from './auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private auth: Auth, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.error = 'Ingresa usuario y contraseña';
      return;
    }
    
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          this.error = '';
          
          // Iniciar sistema de auto-logout
          this.startAutoLogoutFromComponent();
          
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Usuario o contraseña incorrectos';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error de conexión';
      }
    });
  }

  // AUTO-LOGOUT CON DETECCIÓN DE ACTIVIDAD
  private logoutTimer: any = null;
  private readonly INACTIVITY_TIME = 1 * 60 * 1000; // 3 minutos en milisegundos

  startAutoLogoutFromComponent() {
    // console.log('⏰ Sistema de auto-logout iniciado (3 minutos de inactividad)');
    
    // Configurar listeners de actividad
    this.setupActivityListeners();
    
    // Iniciar timer
    this.startLogoutTimer();
  }

  private startLogoutTimer() {
    // Limpiar timer anterior si existe
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    
    // Crear nuevo timer
    this.logoutTimer = setTimeout(() => {
      // console.log('🚨 Sesión expirada por inactividad');
      alert('Su sesión ha expirado por inactividad después de 3 minutos. Será redirigido al login.');
      
      // Limpiar sessionStorage
      sessionStorage.removeItem('token');
      
      // Redirigir
      window.location.href = '/login';
      
    }, this.INACTIVITY_TIME);
  }

  private setupActivityListeners() {
    const resetTimer = () => {
      // console.log('🔄 Actividad detectada - reiniciando timer');
      this.startLogoutTimer();
    };

    // Agregar listeners para detectar actividad
    document.addEventListener('mousedown', resetTimer);
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('scroll', resetTimer);
    document.addEventListener('click', resetTimer);
  }
}
