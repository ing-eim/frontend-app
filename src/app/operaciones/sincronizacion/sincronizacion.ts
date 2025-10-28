import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../shared/loading.service';
import { ToastService } from '../../shared/toast.service';

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

  constructor(private loading: LoadingService, private cdr: ChangeDetectorRef, private toastService: ToastService) {}

  sincronizarConSAF() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.message = '';

    // Mostrar spinner (con fallback)
    try {
      this.loading.show(5000);
    } catch (e) {
      // noop in SSR
    }

    // Simular trabajo asíncrono
    setTimeout(() => {
      try { this.loading.hide(); } catch (e) { /* noop */ }
      // Update UI state in next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
  this.isProcessing = false;
  // Mostrar feedback tipo toast usando ToastService
  try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
  try { this.toastService.show('Sincronización completada con SAF', { type: 'success' }); } catch (e) { /* noop */ }
      }, 0);
    }, 2000);
  }
}
