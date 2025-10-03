import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

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
      this.http.post<any>(`${environment.apiUrl}/procesar-excel`, formData).subscribe({
        next: (data) => {
          this.excelData = data;
          this.uploadMessage = 'Archivo procesado correctamente.';
        },
        error: () => {
          this.uploadMessage = 'Error al procesar el archivo.';
        }
      });
    }
  }
}
