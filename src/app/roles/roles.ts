import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../login/auth';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="roles-container">
      <h2>Gestión de Roles</h2>
      <form (ngSubmit)="crearRol()" class="rol-form">
        <input [(ngModel)]="nuevoRol.nombre" name="nombre" placeholder="Nombre del rol" required />
        <input [(ngModel)]="nuevoRol.descripcion" name="descripcion" placeholder="Descripción" required />
        <button type="submit">Crear Rol</button>
        <div *ngIf="crearError" class="error">{{ crearError }}</div>
      </form>
      <h3>Lista de Roles</h3>
      <ul>
        <li *ngFor="let rol of roles">
          <strong>{{ rol.nombre }}</strong>: {{ rol.descripcion }}
        </li>
      </ul>
    </div>
  `,
  styleUrl: './roles.scss'
})
export class Roles {
  roles: any[] = [];
  nuevoRol = { nombre: '', descripcion: '' };
  crearError = '';

  constructor(private auth: Auth) {}

  ngOnInit() {
    this.listarRoles();
  }

  listarRoles() {
    this.auth.listRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: () => {
        this.roles = [];
      }
    });
  }

  crearRol() {
    this.auth.createRole(this.nuevoRol.nombre, this.nuevoRol.descripcion).subscribe({
      next: () => {
        this.listarRoles();
        this.nuevoRol = { nombre: '', descripcion: '' };
        this.crearError = '';
      },
      error: () => {
        this.crearError = 'No se pudo crear el rol';
      }
    });
  }
}
