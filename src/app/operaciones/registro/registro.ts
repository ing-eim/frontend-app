import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../shared/loading.service';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class Registro implements OnInit {
  logs: Array<{ fechaHora: string; tipo: string; message: string }> = [];
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Avoid making authenticated calls during server-side prerender (will 401). Only fetch in browser.
    if (!isPlatformBrowser(this.platformId)) {
      this.logs = [];
      return;
    }

    this.fetchLogs();
  }

  fetchLogs(): void {
    this.error = null;
  this.loading.show(5000);
  // Endpoint is protected with Bearer token. AuthInterceptor will attach token automatically.
  this.http.get<any[]>(`${environment.apiUrl}/logs/api-log`).subscribe({
      next: (resp) => {
        const raw = resp || [];
        this.logs = raw.map(item => ({
          fechaHora: (item['fecha y hora'] ?? item.fecha ?? item.timestamp ?? '').toString(),
          tipo: (item.tipo ?? item.level ?? 'INFO').toString(),
          message: (item.message ?? item.msg ?? '').toString()
        }));
        this.loading.hide();
        try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
      },
      error: (err) => {
        this.loading.hide();
        this.error = 'No se pudieron cargar los registros. Compruebe la conexión y sus permisos.';
        try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
      }
    });
  }

  refresh(): void {
    this.fetchLogs();
  }
}
