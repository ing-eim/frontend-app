import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionExpiredService {
  private sessionExpiredSubject = new Subject<void>();
  
  // Observable que pueden suscribirse los componentes
  sessionExpired$ = this.sessionExpiredSubject.asObservable();
  
  // Método para disparar la sesión expirada
  triggerSessionExpired() {
    console.log('🔥 SessionExpiredService: Disparando evento de sesión expirada');
    this.sessionExpiredSubject.next();
  }
}