import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../../../app/shared/loading.service';

@Component({
  selector: 'app-operaciones',
  imports: [CommonModule],
  templateUrl: './operaciones.html',
  styleUrl: './operaciones.scss'
})
export class Operaciones {
  selectedFile: File | null = null;
  uploadMessage: string = '';
  excelData: any = null;
  showExcelDetails = false;
  excelProcessedAt: Date | null = null;
  // Mapping from keyword -> endpoint
  private filenameEndpointMap: { [key: string]: string } = {
    'ontime': '/procesar-excel',
    'incidencias': '/procesar-incidencias',
    'pipelinetransporte':'/procesar-pipeline-transporte',
    'pipelinecomercial':'/procesar-pipeline-comercial',
    'disponibilidadtransporte':'/procesar-disponibilidad-transporte',
    'factoraje':'/procesar-factoraje',
    'relacionpago':'/procesar-relacion-pago'
  };

  constructor(private http: HttpClient, private loading: LoadingService, private cdr: ChangeDetectorRef) {}

  // Helper to safely update uploadMessage in the next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
  private setUploadMessage(msg: string) {
    setTimeout(() => {
      this.uploadMessage = msg;
      try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
    }, 0);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.setUploadMessage('');
    }
  }

  uploadFile() {
    if (!this.selectedFile) {
      return;
    }

    // Run the upload logic in the next macrotask so any UI changes (uploadMessage, ngIfs)
    // happen after the current change-detection cycle. This avoids ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      // Decide endpoint based on filename keywords
      const name = (this.selectedFile!.name || '').toLowerCase();
      let endpoint = `${environment.apiUrl}/procesar-excel`;
      let matchedKey: string | null = null;
      for (const key of Object.keys(this.filenameEndpointMap)) {
        console.log('[Operaciones] checking filename for key:', key);
        console.log('[Operaciones] filename:', name);
        if (name.includes(key)) {
          matchedKey = key;
          endpoint = `${environment.apiUrl}${this.filenameEndpointMap[key]}`;
          break;
        }
      }

      if (matchedKey) {
        this.setUploadMessage(`Procesand...: ${this.filenameEndpointMap[matchedKey]}`);
      } else {
        this.setUploadMessage(`Nombre de archivo no coincide con reglas; se usará endpoint por defecto /procesar-excel`);
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile!);
      // Mostrar spinner global. Auto-hide tras 20 segundos si nadie lo oculta.
      this.loading.show(20000);

      // Observe full response so we can validate HTTP status code
      this.http.post<any>(endpoint, formData, { observe: 'response' }).subscribe({
        next: (resp) => {
          // resp is HttpResponse<any>
          if (resp && resp.status === 200) {
            const data = resp.body;
            // Defer UI updates to next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
            setTimeout(() => {
              this.excelData = data;
              this.setUploadMessage('Archivo procesado correctamente.');
              // Compute a displayable processed-at date. Prefer backend fields; fallback to now.
              try {
                if (data.processed_at) {
                  this.excelProcessedAt = new Date(data.processed_at);
                } else if (data.timestamp) {
                  const ts = data.timestamp;
                  this.excelProcessedAt = typeof ts === 'number' ? new Date(ts) : new Date(ts);
                } else if (data.rows_read !== undefined || data.rows_inserted !== undefined) {
                  this.excelProcessedAt = new Date();
                } else {
                  this.excelProcessedAt = null;
                }
              } catch (e) {
                this.excelProcessedAt = null;
              }

              // Hide spinner only after the component has a chance to paint
              if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => requestAnimationFrame(() => this.loading.hide()));
              } else {
                setTimeout(() => this.loading.hide(), 0);
              }

              try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
            }, 0);
          } else {
            // Non-200 handled here
            console.log('[Operaciones] upload returned non-200 status', resp && resp.status);
            const detail = resp && (resp.body && (resp.body.detail || resp.body.message)) ? (resp.body.detail || resp.body.message) : null;
            setTimeout(() => {
              this.setUploadMessage(detail ? `Error: ${detail}` : `Error: servidor respondió con status ${resp.status}`);
              this.loading.hide();
            }, 0);
          }
        },
        error: (err) => {
          // err is HttpErrorResponse when status is 4xx/5xx or network error
          // upload error occurred; avoid printing error payload to console
          let message = 'Error al procesar el archivo.';
          try {
            if (err && err.error) {
              // err.error might be an object { detail: '...' } or a string
              if (typeof err.error === 'object' && err.error.detail) {
                message = `Error: ${err.error.detail}`;
              } else if (typeof err.error === 'string') {
                // try parse JSON
                try {
                  const parsed = JSON.parse(err.error);
                  if (parsed && parsed.detail) {
                    message = `Error: ${parsed.detail}`;
                  } else {
                    message = `Error: ${err.error}`;
                  }
                } catch (e) {
                  message = `Error: ${err.error}`;
                }
              } else if (err.message) {
                message = `Error: ${err.message}`;
              }
            } else if (err.status) {
              message = `Error: servidor respondió con status ${err.status}`;
            }
          } catch (e) {
            // fallback
            message = 'Error al procesar el archivo.';
          }

          setTimeout(() => {
            this.setUploadMessage(message);
            // En caso de error también ocultamos el spinner
            this.loading.hide();
          }, 0);
        }
      });
    }, 0);
  }

  toggleExcelDetails() {
    this.showExcelDetails = !this.showExcelDetails;
    try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
  }
}
