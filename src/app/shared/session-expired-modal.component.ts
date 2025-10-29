import { Component, OnInit, OnDestroy, effect, ChangeDetectorRef } from '@angular/core';
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
     .session-expired-modal .icon{font-size:2.5rem;margin-bottom:1rem}
     .session-expired-modal button{
       font-family: 'Montserrat', 'Inter', 'Segoe UI', sans-serif;
       background: linear-gradient(135deg, #388E3C 0%, #2E7D32 50%, #1B5E20 100%);
       color: #ffffff;
       border: none;
       border-radius: 12px;
       padding: 12px 24px;
       font-size: 15px;
       font-weight: 700;
       text-transform: uppercase;
       letter-spacing: 1px;
       cursor: pointer;
       transition: all 0.3s ease;
       box-shadow: 0 6px 20px rgba(56, 142, 60, 0.35);
       min-width: 180px;
       margin-top: 1rem;
     }
     .session-expired-modal button:hover{
       background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #0D4715 100%);
       transform: translateY(-2px);
       box-shadow: 0 10px 30px rgba(56, 142, 60, 0.5);
       letter-spacing: 1.5px;
     }
     .session-expired-modal button:active{
       transform: translateY(-1px);
       box-shadow: 0 6px 20px rgba(56, 142, 60, 0.4);
     }
     .session-expired-modal button:focus{
       outline: none;
       box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.4);
     }`
  ]
})
export class SessionExpiredModal implements OnInit, OnDestroy {
  visible = false;
  countdown: number | null = null;
  defaultCountdown = 5;
  private effectRef: any = null;
  constructor(private svc: SessionExpiredService, private cdr: ChangeDetectorRef) {
    // Create an effect in the constructor (valid injection context)
    try {
      this.effectRef = effect(() => {
        // Read signals synchronously, but defer UI mutation to next macrotask to avoid NG0100
        const vis = this.svc.visible();
        const cd = this.svc.countdown();

        // Defer changes so Angular's change detection stabilizes
        try {
          setTimeout(() => {
            this.visible = !!vis;
            this.countdown = (typeof cd === 'number') ? cd : null;
            try { this.cdr.detectChanges(); } catch (err) { /* noop */ }
          }, 0);
        } catch (e) {
          // fallback: assign immediately
          this.visible = !!vis;
          this.countdown = (typeof cd === 'number') ? cd : null;
        }
      });
    } catch (e) {
      // fallback to initial read if effect cannot be created
      this.visible = this.svc.visible();
      this.countdown = this.svc.countdown();
    }
  }

  ngOnInit() {
    // no-op: effect created in constructor
  }

  ngOnDestroy() {
    if (this.effectRef) {
      try {
        // effect() may return a destroy callback or an object with destroy()
        if (typeof this.effectRef === 'function') {
          this.effectRef();
        } else if (this.effectRef.destroy) {
          this.effectRef.destroy();
        }
      } catch (e) { /* noop */ }
      this.effectRef = null;
    }
  }

  goNow() {
    this.svc.finalizeLogout();
  }
}
