import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  username: string = '';
  password: string = '';
  errormsg: string = '';

  constructor(private router: Router, private auth: AuthService){}

  login() {
    const logged = this.auth.login(this.username.trim(), this.password.trim());
    if(logged){
      this.router.navigate(['/dashboard']);
      } else {
        this.errormsg = 'Invalid email or password';
      }
    }
  }

