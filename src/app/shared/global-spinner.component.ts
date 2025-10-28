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
        <div class="spinner">
          <div class="spinner-inner"></div>
        </div>
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
      /* entrance animation */
      animation: overlayFadeIn 220ms ease both;
    }
    .spinner-box {
      background: linear-gradient(180deg, rgba(34,34,34,0.98), rgba(20,20,20,0.98));
      padding: 1.25rem 1.75rem;
      border-radius: 10px;
      display:flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      color: #fff;
      box-shadow: 0 6px 18px rgba(0,0,0,0.45);
      transform: translateY(-6px);
      animation: boxPop 240ms cubic-bezier(.2,.9,.2,1) both;
    }
    .spinner {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      position: relative;
      background: conic-gradient(from 0deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
      box-shadow: inset 0 -4px 10px rgba(0,0,0,0.4);
      animation: spinSlow 1100ms linear infinite;
    }
    .spinner::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 6px solid rgba(255,255,255,0.09);
    }
    .spinner-inner {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #7ef6a2, #2fb34a 60%);
      box-shadow: 0 6px 18px rgba(47,179,74,0.28), 0 1px 0 rgba(255,255,255,0.04) inset;
      transform-origin: center;
      animation: innerPulse 1200ms ease-in-out infinite;
    }
    .spinner-text { font-size: 0.95rem; opacity: 0.95; }

    @keyframes spinSlow { to { transform: rotate(360deg); } }
    @keyframes innerPulse {
      0% { transform: scale(0.9); filter: saturate(0.9); }
      50% { transform: scale(1.1); filter: saturate(1.2); }
      100% { transform: scale(0.9); filter: saturate(0.9); }
    }
    @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes boxPop { from { transform: translateY(-10px) scale(.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    `
  ]
})
export class GlobalSpinner {
  constructor(private loading: LoadingService) {}
  visible = () => this.loading.visible();
}
