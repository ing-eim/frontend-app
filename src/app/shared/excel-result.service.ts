import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExcelResultService {
  private _result = signal<any | null>(null);
  readonly result = this._result.asReadonly();

  set(result: any) {
    console.log('[ExcelResultService] set() called, result:', result);
    this._result.set(result);
  }

  clear() {
    console.log('[ExcelResultService] clear() called');
    this._result.set(null);
  }
}
