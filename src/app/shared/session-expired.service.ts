import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SessionExpiredService {
  private _visible = signal(false);
  readonly visible = this._visible.asReadonly();

  // optional countdown value for UI
  private _countdown = signal<number | null>(null);
  readonly countdown = this._countdown.asReadonly();

  constructor(private router: Router) {}

  show(countdownSeconds = 5) {
    this._countdown.set(countdownSeconds);
    this._visible.set(true);
    // start automatic decrement interval
    try {
      this.startCountdownInterval();
    } catch (e) {
      // noop
    }
  }

  hide() {
    this._visible.set(false);
    this._countdown.set(null);
  }

  // decrement the countdown by one; if reaches 0 finalize logout
  decrementCountdown() {
    const cur = this._countdown();
    if (typeof cur === 'number' && cur > 0) {
      this._countdown.set(cur - 1);
      if (cur - 1 <= 0) {
        this.finalizeLogout();
      }
    }
  }

  finalizeLogout() {
    // stop interval and hide modal
    this.hide();
    // dispatch a global event so other services (Auth) can react and cleanup
    try {
      if (typeof window !== 'undefined' && typeof (window as any).CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('app:sessionExpired'));
      }
    } catch (e) {
      // noop
    }

    try {
      this.router.navigate(['/login']);
    } catch (e) {
      try {
        if (typeof window !== 'undefined') {
          (window as any).location.href = '/login';
        }
      } catch (err) {
        // noop
      }
    }
  }

  // internal interval management
  private _intervalId: any = null;

  private startCountdownInterval() {
    // clear any existing interval
    try {
      if (this._intervalId) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    } catch (e) {
      // noop
    }

    this._intervalId = setInterval(() => {
      try {
        this.decrementCountdown();
      } catch (e) {
        // noop
      }
    }, 1000);
  }

  private clearCountdownInterval() {
    try {
      if (this._intervalId) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    } catch (e) {
      // noop
    }
  }
}