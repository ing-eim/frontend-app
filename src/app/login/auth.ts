import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private token: string | null = null;
  private nombre_usuario: string = '';
  private usuario_id: number | null = null;
  private loggedIn = false;

  constructor(private http: HttpClient, private router: Router) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedToken = window.sessionStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
        this.loggedIn = true;
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
    return this.http.post<any>(`${environment.apiUrl}/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(res => {
        if (res && res.access_token && res.usuario_id) {
          this.token = res.access_token;
          this.nombre_usuario = username;
          this.usuario_id = res.usuario_id;
          this.loggedIn = true;
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem('token', this.token ?? '');
          }
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

  logout() {
    this.loggedIn = false;
    this.token = null;
    this.nombre_usuario = '';
    this.usuario_id = null;
    this.router.navigate(['/login']);
  }
}
