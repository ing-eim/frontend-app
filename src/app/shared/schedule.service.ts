import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private _data = signal<any[] | null>(null);
  readonly data = this._data.asReadonly();

  constructor(private http: HttpClient) {}

  async fetch(): Promise<any[]> {
    // Return cached if available
    const cached = this._data();
    if (cached) {
      return cached;
    }

    try {
      const url = `${environment.apiUrl}/cronactivdiarias`;
      const resp = await firstValueFrom(this.http.get<any[]>(url));
      const arr = Array.isArray(resp) ? resp : [];
      this._data.set(arr);
      return arr;
    } catch (e) {
      // Log the error so callers can inspect console/network issues
      try { console.error('[ScheduleService] fetch error', e); } catch (err) { /* noop */ }
      this._data.set([]);
      return [];
    }
  }

  clear() {
    this._data.set(null);
  }
}
