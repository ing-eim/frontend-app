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

  constructor(private http: HttpClient, private loading: LoadingService, private cdr: ChangeDetectorRef) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadMessage = '';
    }
  }

  uploadFile() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
  // Mostrar spinner global. Auto-hide tras 20 segundos si nadie lo oculta.
  this.loading.show(20000);

      // Observe full response so we can validate HTTP status code
      this.http.post<any>(`${environment.apiUrl}/procesar-excel`, formData, { observe: 'response' }).subscribe({
        next: (resp) => {
          // resp is HttpResponse<any>
          if (resp && resp.status === 200) {
            const data = resp.body;
            // Defer UI updates to next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
            setTimeout(() => {
              this.excelData = data;
              this.uploadMessage = 'Archivo procesado correctamente.';
              // Compute a displayable processed-at date. Prefer backend fields; fallback to now.
              try {
                if (data.processed_at) {
                  this.excelProcessedAt = new Date(data.processed_at);
                } else if (data.timestamp) {
                  const ts = data.timestamp;
                  this.excelProcessedAt = typeof ts === 'number' ? new Date(ts) : new Date(ts);
                } else if (data.rows_read !== undefined) {
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
              this.uploadMessage = detail ? `Error: ${detail}` : `Error: servidor respondió con status ${resp?.status}`;
              this.loading.hide();
              try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
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
            this.uploadMessage = message;
            // En caso de error también ocultamos el spinner
            this.loading.hide();
            try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
          }, 0);
        }
      });
    }
  }

  toggleExcelDetails() {
    this.showExcelDetails = !this.showExcelDetails;
    try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
  }
}
