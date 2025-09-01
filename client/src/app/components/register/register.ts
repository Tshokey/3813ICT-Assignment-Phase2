import { Component } from '@angular/core';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { User } from '../../models/user';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-register',
  imports: [RouterModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  username: string = '';
  email: string = '';
  password: string = '';
  errormsg: string = '';

  constructor(private router: Router){}

  register(){
    if(!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.errormsg = 'All fields are required';
      return;
    }
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    if(users.some((u: any) => u.email === this.email.trim())) {
      this.errormsg = 'Email already registered';
      return;
    }

    if(users.some((u: any) => u.username === this.username.trim())){
      this.errormsg = 'Username already exists';
      return;
    }

    const newUser = new User(
      users.length + 1,
      this.username.trim(),
      this.email.trim(),
      this.password.trim(),
      ['USER'],
      []
    );

    users.push(newUser);

    localStorage.setItem('users', JSON.stringify(users));

    this.router.navigate(['/login']);
  }
}

