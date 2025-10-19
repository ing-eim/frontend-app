import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-global-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="global-spinner-overlay" *ngIf="visible()">
      <div class="spinner-box">
        <div class="spinner"></div>
        <div class="spinner-text">Procesando...</div>
      </div>
    </div>
  `,
  styles: [
    `
    .global-spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    }
    .spinner-box {
      background: #222;
      padding: 1.5rem 2rem;
      border-radius: 8px;
      display:flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #fff;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 6px solid rgba(255,255,255,0.15);
      border-top-color: #4caf50;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .spinner-text { font-size: 0.95rem; }

    @keyframes spin { to { transform: rotate(360deg); } }
    `
  ]
})
export class GlobalSpinner {
  constructor(private loading: LoadingService) {}
  visible = () => this.loading.visible();
}
