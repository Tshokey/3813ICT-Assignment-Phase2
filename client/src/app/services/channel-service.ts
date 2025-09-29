import { Injectable, inject, signal, Signal} from '@angular/core';
import { AuthService } from './auth-service';
import { Channel } from '../models/channels';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  private http = inject(HttpClient);
  private channels = signal<Channel[]>([]);
  private apiUrl = "http://localhost:3000/api/channels";

  constructor(private auth: AuthService) {
    this.loadChannels();
  }

  get allChannels(): Signal<Channel[]> {
    return this.channels.asReadonly();
  }

  private async loadChannels() {
    try {
      const channels = await firstValueFrom(this.http.get<Channel[]>(this.apiUrl));
      this.channels.set(channels);
    } catch (error) {
      console.error("Error loading channels:", error);
    }
  }

  async createChannel(ch: Channel): Promise<boolean> {
    try{
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; channel?: Channel; message?: string }>(this.apiUrl, ch),
      )

      if (response.success && response.channel) {
        const channels = this.channels();
        channels.push(response.channel);
        this.channels.set(channels);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating channel:", error);
      return false;
    }
  }

  async JoinChannel(channelName: string, groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${channelName}/join`, {
          groupName,
          username,
        }),
      )

      if (response.success) {
        await this.loadChannels(); // Refresh channels
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error joining channel:", error);
      return false;
    }
  }

  async leaveChannel(channelName: string, groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${channelName}/leave`, {
          groupName,
          username,
        }),
      )

      if (response.success) {
        await this.loadChannels(); // Refresh channels
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error leaving channel:", error);
      return false;
    }
  }

  async deleteChannel(channelName: string, groupName: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message?: string }>(
          `${this.apiUrl}/${channelName}?groupName=${groupName}`,
        ),
      )

      if (response.success) {
        const channels = this.channels().filter((c) => !(c.name === channelName && c.groupName === groupName));
        this.channels.set(channels);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting channel:", error);
      return false;
    }
  }

  async banUser(channelName: string, groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${channelName}/ban`, {
          groupName,
          username,
        }),
      )

      if (response.success) {
        await this.loadChannels(); // Refresh channels
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error banning user:", error);
      return false;
    }
  }

  async reportUser(groupName: string, channelName: string, username: string, reason: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${channelName}/report`, {
          groupName,
          username,
          reason,
          reportedBy: this.auth.getCurrentuser()?.username,
        }),
      )

      return response.success;
    } catch (error) {
      console.error("Error reporting user:", error);
      return false; 
    }
  }

  async removeMember(channelName: string, groupName: string, username: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message?: string }>(
          `${this.apiUrl}/${channelName}/members/${username}?groupName=${groupName}`,
        ),
      )

      if (response.success) {
        await this.loadChannels(); // Refresh channels
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removing member:", error);
      return false;
    }
  }

  getChannelsByGroup(groupName: string): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${this.apiUrl}/group/${groupName}`);
  }

  getUserReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports`);
  }
}

  
