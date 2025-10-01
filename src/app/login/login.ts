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
  loading: boolean = false;

  constructor(private auth: Auth, private router: Router) {}

  login() {
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe(success => {
      this.loading = false;
      if (success) {
        this.error = '';
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Usuario o contraseña incorrectos';
      }
    });
  }
}
