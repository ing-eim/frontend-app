import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../shared/loading.service';
import { ToastService } from '../../shared/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sincronizacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sincronizacion.html',
  styleUrls: ['./sincronizacion.scss']
})
export class Sincronizacion {
  isProcessing = false;
  message = '';

  constructor(
    private http: HttpClient,
    private loading: LoadingService,
    private toastService: ToastService
  ) {}

  sincronizarConSAF() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.message = '';
    this.loading.show();

    // Llamar al endpoint de sincronización
    // El AuthInterceptor agregará automáticamente el Bearer token
    this.http.post<{
      success: boolean;
      mensaje: string;
      total_clientes?: number;
      clientes_insertados?: number;
      stored_procedure_ejecutado?: boolean;
      datos_registrados_en_log?: boolean;
    }>(`${environment.apiUrl}/sincronizacion-data`, {}).subscribe({
      next: (response) => {
        this.loading.hide();
        this.isProcessing = false;
        this.message = response.mensaje || 'Sincronización completada';
        this.toastService.show(this.message, { type: 'success' });
      },
      error: (error) => {
        this.loading.hide();
        this.isProcessing = false;
        const errorMsg = error?.error?.mensaje || error?.error?.detail || 'Error en la sincronización. Intente nuevamente.';
        this.message = errorMsg;
        this.toastService.show(errorMsg, { type: 'error' });
      }
    });
  }
}
