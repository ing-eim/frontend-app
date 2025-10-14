import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

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
  private readonly SESSION_TIMEOUT_SECONDS = 180; // 3 minutos

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // console.log('🔧 AuthService constructor ejecutado');
    // console.log('🖥️ Plataforma:', isPlatformBrowser(this.platformId) ? 'Browser' : 'Server');
    
    // Solo ejecutar en el navegador, no en el servidor
    if (isPlatformBrowser(this.platformId)) {
      // console.log('🌐 Ejecutándose en el navegador');
      
      if (window.sessionStorage) {
        // console.log('📦 SessionStorage disponible');
        const storedToken = window.sessionStorage.getItem('token');
        // console.log('🔍 Token en storage:', storedToken ? 'encontrado' : 'no encontrado');
        
        if (storedToken) {
          // console.log('🔑 Token encontrado en sessionStorage, iniciando sistema de auto-logout');
          this.token = storedToken;
          this.loggedIn = true;
          // Iniciar el sistema de auto-logout después de que el componente esté listo
          setTimeout(() => {
            // console.log('⏰ Iniciando sistema auto-logout desde constructor...');
            this.startInactivityTimer();
            this.setupActivityListeners();
          }, 2000); // Aumenté el tiempo para asegurar que el DOM esté listo
        } else {
          // console.log('❌ No hay token en sessionStorage');
        }
      }
    } else {
      // console.log('🖥️ Ejecutándose en el servidor (SSR) - saltando inicialización');
    }
  }

  /**
   * IMPLEMENTACIÓN SIMPLE Y DIRECTA - Timer de inactividad
   */
  private startInactivityTimer() {
    if (!this.loggedIn) return;
    
    // console.log(`⏰ TIMER SIMPLE: ${this.SESSION_TIMEOUT_SECONDS} segundos`);
    
    // Limpiar timer anterior si existe
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    // Crear nuevo timer
    this.inactivityTimeout = setTimeout(() => {
      // console.log('🚨 ¡TIMEOUT! Ejecutando auto-logout AHORA');
      this.executeAutoLogout();
    }, this.SESSION_TIMEOUT_SECONDS * 1000);
    
    // console.log('✅ Timer creado exitosamente');
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
    // console.log('🔥 EJECUTANDO AUTO-LOGOUT SIMPLE');
    
    // Mostrar alerta
    alert('Sesión expirada por inactividad. Redirigiendo al login...');
    
    // Limpiar todo
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar storage si estamos en navegador
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('token');
    }
    
    // Limpiar timer
    this.clearInactivityTimer();
    
    // Ir al login
    location.href = '/login';
    
    // console.log('✅ AUTO-LOGOUT SIMPLE COMPLETADO');
  }

  /**
   * LISTENERS SIMPLES para detectar actividad
   */
  private setupActivityListeners() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    console.log('� Configurando listeners simples...');
    
    // Función simple para reiniciar timer
    const resetTimer = () => {
      if (this.loggedIn) {
        console.log('🔄 ACTIVIDAD - Reiniciando timer');
        this.startInactivityTimer();
      }
    };
    
    // Solo eventos básicos
    document.addEventListener('click', resetTimer);
    document.addEventListener('keydown', resetTimer);
    
    console.log('✅ Listeners básicos configurados');
  }

  /**
   * Reinicia el temporizador de inactividad cuando se detecta actividad
   */
  private resetInactivityTimer() {
    if (this.loggedIn) {
      console.log('🔄 Actividad detectada, reiniciando temporizador');
      this.startInactivityTimer();
    }
  }

  /**
   * Fuerza el cierre de sesión por inactividad
   */
  private forceAutoLogout() {
    console.log('🚨 EJECUTANDO FORCE AUTO LOGOUT');
    
    // Limpiar estado inmediatamente
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar sessionStorage solo en el navegador
    if (isPlatformBrowser(this.platformId) && window.sessionStorage) {
      window.sessionStorage.removeItem('token');
      console.log('🧹 SessionStorage limpiado');
    }
    
    // Limpiar timer
    this.clearInactivityTimer();
    
    // Redirigir al login
    try {
      this.router.navigate(['/login']);
      console.log('✅ Navegación con router exitosa');
    } catch (error) {
      console.log('⚠️ Error con router:', error);
      if (isPlatformBrowser(this.platformId)) {
        window.location.href = '/login';
      }
    }
    
    console.log('✅ AUTO-LOGOUT COMPLETADO');
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
    console.log('🔐 AuthService.login() llamado');
    console.log('👤 Username:', username);
    console.log('🌐 API URL:', environment.apiUrl);
    
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    
    console.log('📡 Enviando petición POST a:', `${environment.apiUrl}/token`);
    
    return this.http.post<any>(`${environment.apiUrl}/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(res => {
        console.log('📨 Respuesta del servidor recibida:', res);
        
        if (res && res.access_token && res.usuario_id) {
          console.log('✅ Login exitoso, configurando sesión y temporizadores');
          console.log('🔑 Token recibido:', res.access_token ? 'sí' : 'no');
          console.log('👤 Usuario ID:', res.usuario_id);
          
          this.token = res.access_token;
          this.nombre_usuario = username;
          this.usuario_id = res.usuario_id;
          this.loggedIn = true;
          
          if (isPlatformBrowser(this.platformId) && window.sessionStorage) {
            window.sessionStorage.setItem('token', this.token ?? '');
            console.log('💾 Token guardado en sessionStorage');
          }
          
          console.log('⏰ INICIANDO SISTEMA SIMPLE DE AUTO-LOGOUT...');
          
          // Iniciar sistema simplificado
          this.startInactivityTimer();
          this.setupActivityListeners();
          
          // MÉTODO DE PRUEBA INMEDIATA - Para verificar que funciona
          console.log('🧪 INICIANDO PRUEBA INMEDIATA EN 5 SEGUNDOS...');
          setTimeout(() => {
            console.log('🧪 EJECUTANDO LOGOUT DE PRUEBA AHORA');
            this.executeAutoLogout();
          }, 5000); // 5 segundos después del login
        } else {
          console.log('❌ Respuesta del servidor no válida:', {
            access_token: res?.access_token,
            usuario_id: res?.usuario_id
          });
        }
      }),
      catchError(() => of(false)),
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
    console.log('🚪 Ejecutando logout manual...');
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    
    // Limpiar datos del navegador solo si estamos en el navegador
    if (isPlatformBrowser(this.platformId) && window.sessionStorage) {
      window.sessionStorage.removeItem('token');
      console.log('🧹 SessionStorage limpiado en logout manual');
    }
    
    // Limpiar temporizador de inactividad
    this.clearInactivityTimer();
    
    // Navegar al login
    this.router.navigate(['/login']);
    console.log('✅ Logout manual completado, redirigiendo a login');
  }
}
