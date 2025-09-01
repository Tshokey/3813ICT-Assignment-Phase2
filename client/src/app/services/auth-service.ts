import { Injectable,signal, inject,computed} from '@angular/core';
import { User } from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private router = inject(Router);
  private _loggedIn = signal(false);
  private _user = signal<User | null>(null);
  private users: User[] = [];

  readonly currentUser = computed(()=>this._user());
  readonly isloggedIn = computed(()=>this._loggedIn());
  
  private superUser: User = {
    id: 1,
    username: 'super',
    password: '123',
    email: 'super@gmail.com',
    roles: ['SUPER_ADMIN'],
    groups: []
  };

  constructor() {
    const savedUsers = localStorage.getItem('users');
    this.users = savedUsers ? JSON.parse(savedUsers) : [];

    if (!this.users.find(u => u.username === this.superUser.username)) {
      this.users.push(this.superUser);
      localStorage.setItem('users', JSON.stringify(this.users));
    }

    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this._user.set(JSON.parse(saved));
      this._loggedIn.set(true);
    }
  }


  login(username:string,password:string):boolean{
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u=> u.username === username && u.password === password);
    if(found){
      this.setCurrentuser(found);
      return true;
    }
    return false;
  }

   register(newUser: User): boolean {
    if (this.users.find(u => u.username === newUser.username)) {
      return false; 
    }
    newUser.id = this.users.length + 1;
    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));
    return true;
  }

  setCurrentuser(newuser:User | null){
   
    this._user.set(newuser);
    this._loggedIn.set(!!newuser);
    if(newuser){
      localStorage.setItem('currentUser',JSON.stringify(newuser));
    }else{
      localStorage.removeItem('currentUser');
    }
    
  }

  getCurrentuser(): User | null {
    return this.currentUser();
  }

  hasRole(role: 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN'): boolean {
    const u = this._user();
    return !!u && u.roles.includes(role);
  }

  logout(){
    this.setCurrentuser(null);
    this.router.navigateByUrl('/login');
  }
}