import { Component, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../login/auth';
import { LoadingService } from '../shared/loading.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios {
  usuarios: any[] = [];
  roles: any[] = [];
  // local loading flag is no longer used; we rely on LoadingService for global spinner
  error = '';

  nuevoUsuario = { nombre_usuario: '', correo_electronico: '', contrasena: '', rol_id: 1, activo: true };
  creando = false;
  crearError = '';

  editandoId: number | null = null;
  editUsuario = { nombre_usuario: '', correo_electronico: '', contrasena: '', rol_id: 1, activo: true };
  editError = '';

  constructor(private auth: Auth, public loadingService: LoadingService, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.listarUsuarios();
    this.listarRoles();
  }

  listarUsuarios() {
    // Show global spinner with a sensible fallback timeout (20s)
    try { this.loadingService.show(20000); } catch (e) { /* noop in SSR */ }

    this.auth.listUsers().subscribe({
      next: (data) => {
        // Defer UI assignment to next macrotask and then hide spinner after paint
        setTimeout(() => {
          this.usuarios = data;
          if (isPlatformBrowser(this.platformId) && typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => requestAnimationFrame(() => this.loadingService.hide()));
          } else {
            setTimeout(() => this.loadingService.hide(), 0);
          }
          try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
        }, 0);
      },
      error: () => {
        // Hide spinner and show error
        try { this.loadingService.hide(); } catch (e) { /* noop */ }
        this.error = 'No se pudieron obtener los usuarios';
        try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
      }
    });
  }

  listarRoles() {
    this.auth.listRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: () => {
        // No mostrar error en UI, solo dejar roles vacío
        this.roles = [];
      }
    });
  }

  mostrarCrear() {
    this.creando = true;
    this.crearError = '';
  }

  cancelarCrear() {
    this.creando = false;
    this.nuevoUsuario = { nombre_usuario: '', correo_electronico: '', contrasena: '', rol_id: 1, activo: true };
    this.crearError = '';
  }

  crearUsuario() {
    try { this.loadingService.show(10000); } catch (e) { /* noop */ }
    this.auth.createUser(
      this.nuevoUsuario.nombre_usuario,
      this.nuevoUsuario.correo_electronico,
      this.nuevoUsuario.contrasena,
      this.nuevoUsuario.rol_id,
      this.nuevoUsuario.activo
    ).subscribe({
      next: () => {
        // listarUsuarios mostrará/ocultará el spinner apropiadamente
        this.listarUsuarios();
        this.cancelarCrear();
      },
      error: () => {
        try { this.loadingService.hide(); } catch (e) { /* noop */ }
        this.crearError = 'No se pudo crear el usuario';
      }
    });
  }

  mostrarEditar(u: any) {
    this.editandoId = u.id;
    this.editUsuario = {
      nombre_usuario: u.nombre_usuario,
      correo_electronico: u.correo_electronico,
      contrasena: '',
      rol_id: u.rol_id,
      activo: u.activo
    };
    this.editError = '';
  }

  cancelarEditar() {
    this.editandoId = null;
    this.editUsuario = { nombre_usuario: '', correo_electronico: '', contrasena: '', rol_id: 1, activo: true };
    this.editError = '';
  }

  actualizarUsuario() {
    if (this.editandoId !== null) {
      try { this.loadingService.show(10000); } catch (e) { /* noop */ }
      this.auth.updateUser(
        this.editandoId,
        this.editUsuario.nombre_usuario,
        this.editUsuario.correo_electronico,
        this.editUsuario.contrasena,
        this.editUsuario.rol_id,
        this.editUsuario.activo
      ).subscribe({
        next: () => {
          this.listarUsuarios();
          this.cancelarEditar();
        },
        error: () => {
          try { this.loadingService.hide(); } catch (e) { /* noop */ }
          this.editError = 'No se pudo actualizar el usuario';
        }
      });
    }
  }

  eliminarUsuario(id: number) {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      try { this.loadingService.show(10000); } catch (e) { /* noop */ }
      this.auth.deleteUser(id).subscribe({
        next: () => this.listarUsuarios(),
        error: () => {
          try { this.loadingService.hide(); } catch (e) { /* noop */ }
          alert('No se pudo eliminar el usuario');
        }
      });
    }
  }
}
