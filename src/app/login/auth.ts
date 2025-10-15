import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { SessionExpiredService } from '../shared/session-expired.service';

interface LoginResponse {
  access_token?: string;
  token_type?: string;
  usuario_id?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private token: string | null = null;
  private nombre_usuario: string = '';
  private usuario_id: number | null = null;
  private loggedIn = false;
  private inactivityTimeout: any = null;
  private isAutoLogoutActive: boolean = false;
  // Tiempo de inactividad en SEGUNDOS
  private readonly SESSION_TIMEOUT_SECONDS = 10; // 3 minutos

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private ngZone: NgZone,
    private sessionExpiredService: SessionExpiredService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo ejecutar en el navegador, no en el servidor
    if (isPlatformBrowser(this.platformId)) {
      if (window.sessionStorage) {
        const storedToken = window.sessionStorage.getItem('token');
        
        if (storedToken) {
          this.token = storedToken;
          this.loggedIn = true;
          // Iniciar el sistema de auto-logout después de que el componente esté listo
          setTimeout(() => {
            this.startInactivityTimer();
            this.setupActivityListeners();
          }, 2000); // Aumenté el tiempo para asegurar que el DOM esté listo
        }
      }
    }
  }

  /**
   * IMPLEMENTACIÓN SIMPLE Y DIRECTA - Timer de inactividad
   */
  private startInactivityTimer() {
    if (!this.loggedIn) return;
    
    // Limpiar timer anterior si existe
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    // Crear nuevo timer
    this.inactivityTimeout = setTimeout(() => {
      this.executeAutoLogout();
    }, this.SESSION_TIMEOUT_SECONDS * 1000);
  }

  /**
   * Limpia el temporizador de inactividad activo
   */
  private clearInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * MÉTODO SIMPLE PARA EJECUTAR AUTO-LOGOUT
   */
  private executeAutoLogout() {
    // SOLUCIÓN ULTRA SIMPLE: Crear modal directamente en el DOM
    this.createAndShowModal();
    
    // Limpiar timer
    this.clearInactivityTimer();
  }

  private createAndShowModal() {
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'session-expired-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: rgba(0, 0, 0, 0.7) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 99999 !important;
      font-family: Arial, sans-serif !important;
    `;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #2a2a2a !important;
      border-radius: 1rem !important;
      border-top: 4px solid #388E3C !important;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4) !important;
      min-width: 400px !important;
      max-width: 500px !important;
      width: 90% !important;
      position: relative !important;
      padding: 2rem !important;
      text-align: center !important;
      color: white !important;
    `;
    
    modal.innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="color: white; font-size: 1.4rem; font-weight: bold; margin: 0 0 1rem 0; text-transform: uppercase;">SESIÓN EXPIRADA</h3>
      <p style="color: white; font-size: 1rem; margin: 0.5rem 0;">Su sesión ha expirado por inactividad después de 3 minutos.</p>
      <p style="color: #cccccc; font-size: 1rem; margin: 0.5rem 0;">Será redirigido al login automáticamente en <span id="countdown">5</span> segundos.</p>
      <button id="login-now-btn" style="
        background: #388E3C !important;
        color: white !important;
        border: none !important;
        border-radius: 0.6rem !important;
        padding: 1rem 2rem !important;
        font-size: 1rem !important;
        font-weight: bold !important;
        cursor: pointer !important;
        margin-top: 1rem !important;
        text-transform: uppercase !important;
      ">IR AL LOGIN AHORA</button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Configurar countdown
    let countdown = 5;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown.toString();
      }
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        this.finalizeLogout();
      }
    }, 1000);
    
    // Configurar botón
    const button = document.getElementById('login-now-btn');
    if (button) {
      button.onclick = () => {
        clearInterval(countdownInterval);
        this.finalizeLogout();
      };
    }
    
    console.log('🎯 Modal creada y mostrada en el DOM');
  }

  // Método público para finalizar el logout desde la modal
  public finalizeLogout() {
    // Limpiar todo
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar storage si estamos en navegador
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('token');
    }
    
    // Ir al login
    location.href = '/login';
  }

  /**
   * LISTENERS SIMPLES para detectar actividad
   */
  private setupActivityListeners() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Función simple para reiniciar timer
    const resetTimer = () => {
      if (this.loggedIn) {
        this.startInactivityTimer();
      }
    };
    
    // Solo eventos básicos
    document.addEventListener('click', resetTimer);
    document.addEventListener('keydown', resetTimer);
  }

  /**
   * Reinicia el temporizador de inactividad cuando se detecta actividad
   */
  private resetInactivityTimer() {
    if (this.loggedIn) {
      this.startInactivityTimer();
    }
  }

  /**
   * Fuerza el cierre de sesión por inactividad
   */
  private forceAutoLogout() {
    // Limpiar estado inmediatamente
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar sessionStorage solo en el navegador
    if (isPlatformBrowser(this.platformId) && window.sessionStorage) {
      window.sessionStorage.removeItem('token');
    }
    
    // Limpiar timer
    this.clearInactivityTimer();
    
    // Redirigir al login
    try {
      this.router.navigate(['/login']);
    } catch (error) {
      if (isPlatformBrowser(this.platformId)) {
        window.location.href = '/login';
      }
    }
  }



  // 1. Crear usuario
  createUser(nombre_usuario: string, correo_electronico: string, contrasena: string, rol_id: number, activo: boolean) {
    return this.http.post<any>(`${environment.apiUrl}/usuarios/`, {
      nombre_usuario,
      correo_electronico,
      contrasena,
      rol_id,
      activo
    });
  }

  // 2. Login (obtener token)
  login(username: string, password: string): Observable<boolean> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    
    return this.http.post<LoginResponse>(`${environment.apiUrl}/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap((res: LoginResponse) => {
        if (res && res.access_token) {
          this.token = res.access_token;
          this.nombre_usuario = username;
          this.usuario_id = res.usuario_id || null; // Permitir que sea null si no viene en la respuesta
          this.loggedIn = true;
          
          if (isPlatformBrowser(this.platformId) && window.sessionStorage) {
            window.sessionStorage.setItem('token', this.token ?? '');
          }
          
          // Iniciar sistema simplificado
          this.startInactivityTimer();
          this.setupActivityListeners();
        }
      }),
      map((res: LoginResponse) => {
        return !!(res && res.access_token);
      }),
      catchError(() => {
        return of(false);
      }),
      tap(success => {
        if (!success) {
          this.loggedIn = false;
          this.token = null;
          this.usuario_id = null;
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem('token');
          }
          this.clearInactivityTimer();
        }
      })
    );
  }

  // 3. Listar usuarios
  listUsers() {
    return this.http.get<any[]>(`${environment.apiUrl}/usuarios/`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 4. Consultar usuario por ID
  getUser(id: number) {
    return this.http.get<any>(`${environment.apiUrl}/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 5. Actualizar usuario
  updateUser(id: number, nombre_usuario: string, correo_electronico: string, contrasena: string, rol_id: number, activo: boolean) {
    return this.http.put<any>(`${environment.apiUrl}/usuarios/${id}`, {
      nombre_usuario,
      correo_electronico,
      contrasena,
      rol_id,
      activo
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 6. Eliminar usuario
  deleteUser(id: number) {
    return this.http.delete<any>(`${environment.apiUrl}/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 7. Crear rol
  createRole(nombre: string, descripcion: string) {
    return this.http.post<any>(`${environment.apiUrl}/roles/`, {
      nombre,
      descripcion
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 8. Listar roles
  listRoles() {
    return this.http.get<any[]>(`${environment.apiUrl}/roles/`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 9. Registrar acción en bitácora
  logAction(usuario_id: number, accion: string, ip_origen: string) {
    return this.http.post<any>(`${environment.apiUrl}/bitacora/`, {
      usuario_id,
      accion,
      ip_origen
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // 10. Consultar bitácora
  listBitacora(usuario_id?: number) {
    let url = `${environment.apiUrl}/bitacora/`;
    if (usuario_id) {
      url += `?usuario_id=${usuario_id}`;
    }
    return this.http.get<any[]>(url, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  getToken(): string | null {
    return this.token;
  }

  getUsername(): string {
    return this.nombre_usuario;
  }

  getUserId(): number | null {
    return this.usuario_id;
  }

  isAuthenticated(): boolean {
    return this.loggedIn;
  }

  /**
   * Cierra la sesión del usuario y limpia todos los datos de autenticación
   */
  logout() {
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar datos del navegador solo si estamos en el navegador
    if (isPlatformBrowser(this.platformId) && window.sessionStorage) {
      window.sessionStorage.removeItem('token');
    }
    
    // Limpiar temporizador de inactividad
    this.clearInactivityTimer();
    
    // Navegar al login
    this.router.navigate(['/login']);
  }
}
