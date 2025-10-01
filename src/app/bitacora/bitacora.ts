import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../login/auth';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bitacora-container">
      <h2>Bitácora de Acciones</h2>
      <form (ngSubmit)="registrarAccion()" class="bitacora-form">
        <input [(ngModel)]="accion" name="accion" placeholder="Acción" required />
        <input [(ngModel)]="ip_origen" name="ip_origen" placeholder="IP de origen" required />
        <button type="submit">Registrar Acción</button>
        <div *ngIf="registrarError" class="error">{{ registrarError }}</div>
      </form>
      <h3>Historial</h3>
      <label>
        Filtrar por usuario:
        <input [(ngModel)]="filtroUsuarioId" name="filtroUsuarioId" type="number" min="1" />
        <button type="button" (click)="consultarBitacora()">Consultar</button>
      </label>
      <ul>
        <li *ngFor="let log of bitacora">
          <strong>{{ log.accion }}</strong> por usuario {{ log.usuario_id }} desde {{ log.ip_origen }}
        </li>
      </ul>
    </div>
  `,
  styleUrl: './bitacora.scss'
})
export class Bitacora {
  accion = '';
  ip_origen = '';
  registrarError = '';
  filtroUsuarioId: number | null = null;
  bitacora: any[] = [];

  constructor(private auth: Auth) {}

  registrarAccion() {
    const usuario_id = this.auth.getUserId();
    if (!usuario_id) {
      this.registrarError = 'No hay usuario autenticado.';
      return;
    }
    this.auth.logAction(usuario_id, this.accion, this.ip_origen).subscribe({
      next: () => {
        this.registrarError = '';
        this.accion = '';
        this.ip_origen = '';
        this.consultarBitacora();
      },
      error: () => {
        this.registrarError = 'No se pudo registrar la acción.';
      }
    });
  }

  consultarBitacora() {
    this.auth.listBitacora(this.filtroUsuarioId || undefined).subscribe({
      next: (data) => {
        this.bitacora = data;
      },
      error: () => {
        this.bitacora = [];
      }
    });
  }

  ngOnInit() {
    this.consultarBitacora();
  }
}
