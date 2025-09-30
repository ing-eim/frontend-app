import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-operaciones',
  imports: [CommonModule],
  templateUrl: './operaciones.html',
  styleUrl: './operaciones.scss'
})
export class Operaciones {
  selectedFile: File | null = null;
  uploadMessage: string = '';

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadMessage = '';
    }
  }

  uploadFile() {
    if (this.selectedFile) {
      // Aquí puedes agregar la lógica para procesar el archivo Excel
      this.uploadMessage = `Archivo '${this.selectedFile.name}' cargado correctamente.`;
      // Resetear el archivo seleccionado si lo deseas
      // this.selectedFile = null;
    }
  }
}
