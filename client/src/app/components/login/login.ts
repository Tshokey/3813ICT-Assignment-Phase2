import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit{
  username = '';
  password = '';
  errormsg = '';

  private router = inject(Router); 
  private auth = inject(AuthService)
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Added ngOnInit to check for error query parameter
    this.route.queryParams.subscribe((params) => {
      if (params["error"]) {
        this.errormsg = params["error"]
      }
    })
  }

  async login() {
    const logged = await this.auth.login(this.username.trim(), this.password.trim());
    if(logged){
      this.router.navigate(['/dashboard']);
      } else {
        this.errormsg = 'Invalid username or password';
      }
      
    }
    
  }

