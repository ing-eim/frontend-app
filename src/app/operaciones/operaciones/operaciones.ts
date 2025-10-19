import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../../../app/shared/loading.service';
import { ExcelResultService } from '../../../app/shared/excel-result.service';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private loading: LoadingService, private excelResult: ExcelResultService, private router: Router, private cdr: ChangeDetectorRef) {}

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

      this.http.post<any>(`${environment.apiUrl}/procesar-excel`, formData).subscribe({
        next: (data) => {
          console.log('[Operaciones] upload success, received data:', data);
          // Defer UI updates to next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            console.log('[Operaciones] applying UI updates (setTimeout)');
            this.excelData = data;
            this.uploadMessage = 'Archivo procesado correctamente.';
            // Publicar resultado para que el Dashboard lo capture y oculte el spinner cuando pinte
            this.excelResult.set(data);
            // Navegar al dashboard para que el usuario vea el resultado
            try {
              this.router.navigate(['/dashboard']);
            } catch (e) {
              // noop
            }
            try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
          }, 0);
        },
        error: () => {
          console.log('[Operaciones] upload error');
          setTimeout(() => {
            this.uploadMessage = 'Error al procesar el archivo.';
            // En caso de error también ocultamos el spinner
            this.loading.hide();
            try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
          }, 0);
        }
      });
    }
  }
}
