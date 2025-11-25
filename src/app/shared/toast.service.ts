import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastItem {
  id: number;
  message: string;
  createdAt: number;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<ToastItem[]>([]);
  readonly toasts$ = this._toasts.asObservable();
  private nextId = 1;

  show(message: string, opts?: { duration?: number; type?: ToastItem['type'] }) {
    const id = this.nextId++;
    const duration = opts?.duration ?? 3000;
    const toast: ToastItem = { id, message, createdAt: Date.now(), duration, type: opts?.type ?? 'info' };
    this._toasts.next([...this._toasts.value, toast]);

    // Auto remove
    setTimeout(() => this.remove(id), duration);
    return id;
  }

  remove(id: number) {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }
}
