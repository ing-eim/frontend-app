import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _visible = new BehaviorSubject<boolean>(false);
  readonly visible$ = this._visible.asObservable();

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

    this._visible.next(true);

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
    this._visible.next(false);
  }
}
