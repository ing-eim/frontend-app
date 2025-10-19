import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _visible = signal(false);
  readonly visible = this._visible.asReadonly();

  // timer id for automatic hide fallback
  private autoHideTimer: any = null;

  /**
   * Show spinner. If timeoutMs is provided, the spinner will auto-hide after timeoutMs milliseconds.
   */
  show(timeoutMs?: number) {
    // clear any existing timer
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    this._visible.set(true);

    if (typeof timeoutMs === 'number' && timeoutMs > 0) {
      this.autoHideTimer = setTimeout(() => {
        this.hide();
        this.autoHideTimer = null;
      }, timeoutMs);
    }
  }

  hide() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    this._visible.set(false);
  }
}
