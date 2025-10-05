import { Injectable, inject, signal, Signal } from '@angular/core';
import { Group } from '../models/group';
import { AuthService } from './auth-service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: "root" })
export class GroupService {
  private http = inject(HttpClient)
  private _groups = signal<Group[]>([])
  private apiUrl = "https://localhost:3000/api/groups"

  constructor(private auth: AuthService) {
    this.loadGroups()
  }

  get groups(): Signal<Group[]> {
    return this._groups.asReadonly()
  }

  private async loadGroups() {
    try {
      const groups = await firstValueFrom(this.http.get<Group[]>(this.apiUrl))
      this._groups.set(groups)
    } catch (error) {
      console.error("Error loading groups:", error)
    }
  }

  async createGroup(group: Group): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; group?: Group; message?: string }>(this.apiUrl, group),
      )

      if (response.success && response.group) {
        const groups = this._groups()
        groups.push(response.group)
        this._groups.set(groups)
        return true
      }
      return false
    } catch (error) {
      console.error("Error creating group:", error)
      return false
    }
  }

  async sendJoinRequest(groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${groupName}/join`, { username }),
      )

      if (response.success) {
        await this.loadGroups() // Refresh groups
        return true
      }
      return false
    } catch (error) {
      console.error("Error sending join request:", error)
      return false
    }
  }

  async approveUser(groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${groupName}/approve`, { username }),
      )

      if (response.success) {
        await this.loadGroups() // Refresh groups
        return true
      }
      return false
    } catch (error) {
      console.error("Error approving user:", error)
      return false
    }
  }

  async rejectUser(groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${groupName}/reject`, { username }),
      )

      if (response.success) {
        await this.loadGroups() // Refresh groups
        return true
      }
      return false
    } catch (error) {
      console.error("Error rejecting user:", error)
      return false
    }
  }

  async leaveGroup(groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${groupName}/leave`, { username }),
      )

      if (response.success) {
        await this.loadGroups() // Refresh groups
        return true
      }
      return false
    } catch (error) {
      console.error("Error leaving group:", error)
      return false
    }
  }

  async deleteGroup(groupName: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${groupName}`),
      )

      if (response.success) {
        const groups = this._groups().filter((g) => g.name !== groupName)
        this._groups.set(groups)
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting group:", error)
      return false
    }
  }

  async removeMember(groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${groupName}/members/${username}`),
      )

      if (response.success) {
        await this.loadGroups() // Refresh groups
        return true
      }
      return false
    } catch (error) {
      console.error("Error removing member:", error)
      return false
    }
  }
}
