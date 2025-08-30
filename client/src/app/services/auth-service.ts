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
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this._user.set(JSON.parse(saved));
      this._loggedIn.set(true);
    }
  }

  login(username:string,password:string):boolean{
    if(username === 'super' && password === '123'){
      this.setCurrentuser(this.superUser);
      return true;
    }
    return false;
  }

  setCurrentuser(user:User | null){
   
    this._user.set(user);
    this._loggedIn.set(!!user);
    if(user){
      localStorage.setItem('currentUser',JSON.stringify(user));
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