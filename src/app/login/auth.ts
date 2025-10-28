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
  // Elementos/intervalos del modal de sesión expirado para poder limpiarlos
  private sessionModalOverlay: HTMLElement | null = null;
  private sessionModalInterval: any = null;
  private sessionModalCountdownElement: HTMLElement | null = null;
  private isAutoLogoutActive: boolean = false;
  private activityListenersAttached: boolean = false;
  // Tiempo de inactividad en SEGUNDOS
  private readonly SESSION_TIMEOUT_SECONDS = 15 * 60; // 15 minutos

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
          console.log('[Auth] constructor - token found in sessionStorage');
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

    // Attach global listener so service can trigger logout even if modal handles countdown
    if (isPlatformBrowser(this.platformId)) {
      try {
        window.addEventListener('app:sessionExpired', this.handleGlobalSessionExpired as EventListener);
      } catch (e) {
        // noop
      }
    }
  }

  private handleGlobalSessionExpired = (ev: Event) => {
    console.log('[Auth] global sessionExpired event received');
    try {
      this.finalizeLogout();
    } catch (e) {
      // noop
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
    console.log('[Auth] startInactivityTimer - setting timeout for', this.SESSION_TIMEOUT_SECONDS, 'seconds');
    this.inactivityTimeout = setTimeout(() => {
      console.log('[Auth] inactivity timer expired -> executeAutoLogout');
      this.executeAutoLogout();
    }, this.SESSION_TIMEOUT_SECONDS * 1000);
  }

  /**
   * Limpia el temporizador de inactividad activo
   */
  private clearInactivityTimer() {
    if (this.inactivityTimeout) {
      console.log('[Auth] clearInactivityTimer');
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * MÉTODO SIMPLE PARA EJECUTAR AUTO-LOGOUT
   */
  private executeAutoLogout() {
    // Si estamos en servidor, no podemos manipular el DOM: forzamos el logout
    if (!isPlatformBrowser(this.platformId)) {
      this.forceAutoLogout();
      return;
    }

    // Mostrar modal/component Angular de sesión expirada (si estamos en navegador)
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.sessionExpiredService.show(5);
      } catch (e) {
        // fallback a logout
        this.forceAutoLogout();
        return;
      }
    } else {
      this.forceAutoLogout();
      return;
    }

    // Limpiar timer
    this.clearInactivityTimer();
  }

  // Modal DOM creation removed: we now rely on SessionExpiredService + component

  // Método público para finalizar el logout desde la modal
  public finalizeLogout() {
    // Limpiar todo
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar modal si está presente
    this.clearSessionModal();

    // Limpiar storage si estamos en navegador
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem('token');
      } catch (e) {
        // noop
      }

      // Ir al login usando el router si está disponible
      try {
        this.router.navigate(['/login']);
        return;
      } catch (e) {
        // fallback
        try {
          (window as any).location.href = '/login';
        } catch (err) {
          // noop
        }
      }
    }

    // remove global listener
    if (isPlatformBrowser(this.platformId)) {
      try { window.removeEventListener('app:sessionExpired', this.handleGlobalSessionExpired as EventListener); } catch (e) { /* noop */ }
    }
  }

  // Limpia el modal de sesión expirado si existe (overlay e interval)
  private clearSessionModal() {
    // We don't manage DOM modal here anymore; nothing to do.
    try {
      if (this.sessionModalInterval) {
        clearInterval(this.sessionModalInterval);
      }
    } catch (e) {
      // noop
    }
    this.sessionModalInterval = null;
    this.sessionModalOverlay = null;
    this.sessionModalCountdownElement = null;
  }

  /**
   * LISTENERS SIMPLES para detectar actividad
   */
  private setupActivityListeners() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.activityListenersAttached) {
      console.log('[Auth] setupActivityListeners - already attached, skipping');
      return;
    }

    // Función simple para reiniciar timer
    const resetTimer = (ev?: Event) => {
      console.log('[Auth] activity detected:', ev?.type || 'unknown');
      if (this.loggedIn) {
        this.startInactivityTimer();
      }
    };

    // Solo eventos básicos
    document.addEventListener('click', resetTimer);
    document.addEventListener('keydown', resetTimer);
    this.activityListenersAttached = true;
    console.log('[Auth] setupActivityListeners - listeners attached');
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
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem('token');
      } catch (e) {
        // noop
      }
    }
    
    // Limpiar timer
    this.clearInactivityTimer();
    
    // Limpiar modal si existe
    this.clearSessionModal();

    // Redirigir al login
    try {
      this.router.navigate(['/login']);
    } catch (error) {
      if (isPlatformBrowser(this.platformId)) {
        try {
          (window as any).location.href = '/login';
        } catch (e) {
          // noop
        }
      }
    }

    // remove global listener
    if (isPlatformBrowser(this.platformId)) {
      try { window.removeEventListener('app:sessionExpired', this.handleGlobalSessionExpired as EventListener); } catch (e) { /* noop */ }
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
    return this.http.get<any[]>(`${environment.apiUrl}/usuarios/`);
  }

  // 4. Consultar usuario por ID
  getUser(id: number) {
    return this.http.get<any>(`${environment.apiUrl}/usuarios/${id}`);
  }

  // 5. Actualizar usuario
  updateUser(id: number, nombre_usuario: string, correo_electronico: string, contrasena: string, rol_id: number, activo: boolean) {
    return this.http.put<any>(`${environment.apiUrl}/usuarios/${id}`, {
      nombre_usuario,
      correo_electronico,
      contrasena,
      rol_id,
      activo
    });
  }

  // 6. Eliminar usuario
  deleteUser(id: number) {
    return this.http.delete<any>(`${environment.apiUrl}/usuarios/${id}`);
  }

  // 7. Crear rol
  createRole(nombre: string, descripcion: string) {
    return this.http.post<any>(`${environment.apiUrl}/roles/`, {
      nombre,
      descripcion
    });
  }

  // 8. Listar roles
  listRoles() {
    return this.http.get<any[]>(`${environment.apiUrl}/roles/`);
  }

  // 9. Registrar acción en bitácora
  logAction(usuario_id: number, accion: string, ip_origen: string) {
    return this.http.post<any>(`${environment.apiUrl}/bitacora/`, {
      usuario_id,
      accion,
      ip_origen
    });
  }

  // 10. Consultar bitácora
  listBitacora(usuario_id?: number) {
    let url = `${environment.apiUrl}/bitacora/`;
    if (usuario_id) {
      url += `?usuario_id=${usuario_id}`;
    }
    return this.http.get<any[]>(url);
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
    
    // Limpiar modal si existe
    this.clearSessionModal();

    // Navegar al login
    this.router.navigate(['/login']);
  }
}
