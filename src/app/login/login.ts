import { Component } from '@angular/core';
import { Auth } from './auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username: string = '';
  password: string = '';
  error: string = '';

  constructor(private auth: Auth, private router: Router) {}

  login() {
    if (!this.auth.login(this.username, this.password)) {
      this.error = 'Usuario o contraseña incorrectos';
    } else {
      this.error = '';
      this.router.navigate(['/dashboard']);
    }
  }
}
