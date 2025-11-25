import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toasts-container" *ngIf="(toasts$ | async) as toastList" [hidden]="!toastList.length">
      <div class="toast" *ngFor="let t of toastList" [attr.data-type]="t.type">
        <div class="toast-message">{{ t.message }}</div>
        <button class="toast-close" (click)="dismiss(t.id)" aria-label="Cerrar">×</button>
      </div>
    </div>
  `,
  styles: [
    `
    .toasts-container {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      z-index: 300000; /* above spinner */
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      min-width: 220px;
      max-width: 420px;
      background: #222;
      color: #fff;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transform-origin: bottom right;
      animation: toastIn 300ms cubic-bezier(.2,.9,.2,1) both;
    }
    .toast[data-type="success"] { background: linear-gradient(90deg,#2fb34a,#388E3C); }
    .toast[data-type="error"] { background: linear-gradient(90deg,#ff6b6b,#ff4444); }
    .toast-message { flex: 1; font-weight: 600; }
    .toast-close { background: transparent; border: none; color: rgba(255,255,255,0.9); font-size: 1.1rem; cursor: pointer; }

    @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1);} }
    `
  ]
})
export class ToastsComponent {
  toasts$;
  constructor(private toast: ToastService) {
    this.toasts$ = this.toast.toasts$;
  }
  dismiss(id: number) { this.toast.remove(id); }
}
