import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-admins',
  imports: [FormsModule, CommonModule],
  templateUrl: './admins.html',
  styleUrls: ['./admins.css']
})
export class Admins {
  users: User[] = [];

  constructor(private auth: AuthService){
    this.loadUsers();
  }

  loadUsers(){
    this.users = JSON.parse(localStorage.getItem('users') || '[]');
  }

  canPromoteGroup(u: User){
    return this.auth.hasRole('SUPER_ADMIN') && !u.roles.includes('GROUP_ADMIN');
  }

  canPromoteSuper(u: User){
    return this.auth.hasRole('SUPER_ADMIN') && !u.roles.includes('SUPER_ADMIN');
  }


    promoteSelected() {
    this.users.forEach(u => {
      if (u.toPromoteGroup) {
        if (!u.roles.includes('GROUP_ADMIN')) {
          u.roles.push('GROUP_ADMIN');
        }
        u.toPromoteGroup = false;
      }

      if (u.toPromoteSuper) {
        if (!u.roles.includes('SUPER_ADMIN')) {
          u.roles.push('SUPER_ADMIN');
        }
        u.toPromoteSuper = false;
      }
    });

    this.saveUsers();
  }

  canRemove(u: User){
    return this.auth.hasRole('SUPER_ADMIN') && u.username !== 'super';
  }

  removeUser(u: User){
    this.users = this.users.filter(user => user.username !== u.username);
    this.saveUsers();
  }

  saveUsers(){
    localStorage.setItem('users', JSON.stringify(this.users));
    this.loadUsers();
  }

}
