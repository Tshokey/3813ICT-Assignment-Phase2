import { Injectable,signal, inject,computed} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private router = inject(Router)
  private http = inject(HttpClient)
  private _loggedIn = signal(false)
  private _user = signal<User | null>(null)
  private apiUrl = "https://localhost:3000/api/auth"

  readonly currentUser = computed(() => this._user())
  readonly isLoggedIn = computed(() => this._loggedIn())

  constructor() {
    const saved = localStorage.getItem("currentUser")
    if (saved) {
      this._user.set(JSON.parse(saved))
      this._loggedIn.set(true)
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; user?: User; message?: string }>(`${this.apiUrl}/login`, {
          username,
          password,
        }),
      )

      if (response.success && response.user) {
        this.setCurrentUser(response.user)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  setCurrentUser(newUser: User | null) {
    this._user.set(newUser)
    this._loggedIn.set(!!newUser)
    if (newUser) {
      localStorage.setItem("currentUser", JSON.stringify(newUser))
    } else {
      localStorage.removeItem("currentUser")
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser()
  }

  hasRole(role: "USER" | "GROUP_ADMIN" | "SUPER_ADMIN"): boolean {
    const u = this._user()
    return !!u && u.roles.includes(role)
  }

  logout() {
    this.setCurrentUser(null)
    this.router.navigateByUrl("/login")
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`)
  }

  createUser(user: Partial<User>): Observable<{ success: boolean; user?: User; message?: string }> {
    return this.http.post<{ success: boolean; user?: User; message?: string }>(`${this.apiUrl}/users`, user)
  }

  updateUser(id: number, user: Partial<User>): Observable<{ success: boolean; user?: User; message?: string }> {
    return this.http.put<{ success: boolean; user?: User; message?: string }>(`${this.apiUrl}/users/${id}`, user)
  }

  deleteUser(id: number): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/users/${id}`)
  }
}

