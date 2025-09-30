import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Usuario y contraseña de ejemplo
  private readonly user = 'admin';
  private readonly pass = 'admin';
  private loggedIn = false;
  private username: string = '';

  login(username: string, password: string): boolean {
    const success = username === this.user && password === this.pass;
    this.loggedIn = success;
    if (success) {
      this.username = username;
    }
    return success;
  }

  getUsername(): string {
    return this.username;
  }

  isAuthenticated(): boolean {
    return this.loggedIn;
  }

  logout() {
    this.loggedIn = false;
  }
}
