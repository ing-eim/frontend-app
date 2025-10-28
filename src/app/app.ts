import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './login/auth';
import { GlobalSpinner } from './shared/global-spinner.component';
import { SessionExpiredModal } from './shared/session-expired-modal.component';
import { ToastsComponent } from './shared/toasts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalSpinner, SessionExpiredModal, ToastsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend-app');

  constructor(private auth: Auth) {}
}
