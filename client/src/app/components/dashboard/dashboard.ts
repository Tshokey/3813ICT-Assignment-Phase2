import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {

  constructor(private auth: AuthService) {}

  get user(): User | null {
    return this.auth.getCurrentuser();
  }
    
  get isLoggedIn(): boolean{
    return this.auth.isloggedIn();
  }

  logout() {
    this.auth.logout();
  }

  get isSuperAdmin(){
    return this.auth.hasRole('SUPER_ADMIN');
  }

  get isGroupAdmin(){
    return this.auth.hasRole('GROUP_ADMIN');
  }
}
