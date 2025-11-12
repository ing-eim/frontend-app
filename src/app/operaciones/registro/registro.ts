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
  // Filter state
  filterText: string = '';
  filteredLogs: Array<{ fechaHora: string; tipo: string; message: string }> = [];
  // Pagination state
  pageSize = 10;
  pageIndex = 0; // zero-based
  pageSizes = [10, 20, 50];
  displayedLogs: Array<{ fechaHora: string; tipo: string; message: string }> = [];
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
        // initialize filtered view
        this.applyFilter();
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

  onFilterChange(value: string) {
    this.filterText = value || '';
    this.applyFilter();
  }

  private applyFilter() {
    const q = (this.filterText || '').trim().toLowerCase();
    if (!q) {
      this.filteredLogs = this.logs.slice();
      // reset pagination
      this.pageIndex = 0;
      this.updateDisplayed();
      return;
    }
    this.filteredLogs = this.logs.filter(l => (l.message || '').toLowerCase().includes(q));
    // reset pagination
    this.pageIndex = 0;
    this.updateDisplayed();
  }

  private updateDisplayed() {
    // ensure pageIndex is within bounds
    const total = this.filteredLogs.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.pageIndex >= totalPages) this.pageIndex = totalPages - 1;
    if (this.pageIndex < 0) this.pageIndex = 0;
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.displayedLogs = this.filteredLogs.slice(start, end);
  }

  changePage(delta: number) {
    this.pageIndex += delta;
    this.updateDisplayed();
  }

  setPage(index: number) {
    this.pageIndex = Math.max(0, index);
    this.updateDisplayed();
  }

  changePageSize(size: any) {
    // coerce from template value (may be string)
    const n = Number(size) || 10;
    this.pageSize = n;
    this.pageIndex = 0;
    this.updateDisplayed();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredLogs.length / this.pageSize));
  }
}
