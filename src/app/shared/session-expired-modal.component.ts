import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionExpiredService } from './session-expired.service';

@Component({
  selector: 'app-session-expired-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="session-expired-overlay">
      <div class="session-expired-modal">
        <div class="icon">⚠️</div>
        <h3>SESIÓN EXPIRADA</h3>
        <p>Su sesión ha expirado por inactividad.</p>
        <p>Será redirigido en {{ countdown ?? defaultCountdown }} segundos.</p>
        <button (click)="goNow()">IR AL LOGIN AHORA</button>
      </div>
    </div>
  `,
  styles: [
    `.session-expired-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999}
     .session-expired-modal{background:#2a2a2a;color:#fff;padding:2rem;border-radius:1rem;min-width:320px;max-width:480px;text-align:center}
     .session-expired-modal .icon{font-size:2.5rem;margin-bottom:1rem}`
  ]
})
export class SessionExpiredModal implements OnInit, OnDestroy {
  visible = false;
  countdown: number | null = null;
  defaultCountdown = 5;
  private intervalId: any = null;

  constructor(private svc: SessionExpiredService) {}

  ngOnInit() {
    // subscribe to signals
    this.visible = this.svc.visible();
    this.countdown = this.svc.countdown();

    // simple polling on signal changes (signals not directly subscribable here without effect)
    this.intervalId = setInterval(() => {
      this.visible = this.svc.visible();
      this.countdown = this.svc.countdown();
    }, 200);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  goNow() {
    this.svc.finalizeLogout();
  }
}
