import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../login/auth';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios {
  usuarios: any[] = [];
  roles: any[] = [];
  loading = false;
  error = '';

  nuevoUsuario = { nombre_usuario: '', correo_electronico: '', contrasena: '', rol_id: 1, activo: true };
  creando = false;
  crearError = '';

  editandoId: number | null = null;
  editUsuario = { nombre_usuario: '', correo_electronico: '', contrasena: '', rol_id: 1, activo: true };
  editError = '';

  constructor(private auth: Auth) {}

  ngOnInit() {
    this.listarUsuarios();
    this.listarRoles();
  }

  listarUsuarios() {
    this.loading = true;
    this.auth.listUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron obtener los usuarios';
        this.loading = false;
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
    this.auth.createUser(
      this.nuevoUsuario.nombre_usuario,
      this.nuevoUsuario.correo_electronico,
      this.nuevoUsuario.contrasena,
      this.nuevoUsuario.rol_id,
      this.nuevoUsuario.activo
    ).subscribe({
      next: () => {
        this.listarUsuarios();
        this.cancelarCrear();
      },
      error: () => {
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
          this.editError = 'No se pudo actualizar el usuario';
        }
      });
    }
  }

  eliminarUsuario(id: number) {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      this.auth.deleteUser(id).subscribe({
        next: () => this.listarUsuarios(),
        error: () => alert('No se pudo eliminar el usuario')
      });
    }
  }
}
