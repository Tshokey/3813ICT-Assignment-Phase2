import { Injectable, signal, Signal} from '@angular/core';
import { AuthService } from './auth-service';
import { Channel } from '../models/channels';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

    private channels = signal<Channel[]>([]);

    constructor(private auth: AuthService) {
      const saved = localStorage.getItem('channels');
      this.channels.set(saved ? JSON.parse(saved) : []);
    }

    get allChannels(): Signal<Channel[]> {
      return this.channels.asReadonly();
    }

    private save() {
      localStorage.setItem('channels', JSON.stringify(this.channels()));
    }


    createChannel(ch: Channel): void {
        const chl = this.channels();
        if (chl.some(c => c.name.toLowerCase() === ch.name.toLowerCase() && c.groupName === ch.groupName)) return;
        
        chl.push(ch);
        this.channels.set(chl);
        this.save();
      }

    JoinChannel(channelName: string, groupName: string, username: string): void {
      const chl = this.channels();
      const ch = chl.find(c => c.name === channelName && c.groupName === groupName);
      
      if (ch && !ch.members.includes(username) && !ch.bannedUsers.includes(username)) {
        ch.members.push(username);
        this.channels.set(chl);
        this.save();
      }
    }

    leaveChannel(channelName: string, groupName: string, username: string): void {
      const chl = this.channels();
      const ch = chl.find(c => c.name === channelName && c.groupName === groupName);
      if (ch) {
        ch.members = ch.members.filter(u => u !== username);
        this.channels.set(chl);
        this.save();
      }
    }

    deleteChannel(channelName: string, groupName: string): void {
      const chl = this.channels().filter(c => !(c.name === channelName && c.groupName === groupName));
      this.channels.set(chl);
      this.save();
    }
    
    banUser(channelName: string, groupName: string, username: string): void{
      const chl = this.channels();
      const ch = chl.find(c => c.name === channelName && c.groupName === groupName);
  
      if (ch && ch.members.includes(username)) {
        ch.members = ch.members.filter(u => u !== username);
        if (!ch.bannedUsers.includes(username)){
          ch.bannedUsers.push(username);
        } 
      this.channels.set(chl);
      this.save();
    }
  }

    reportUser(groupName: string, channelName: string, username: string, reason: string) {
      const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
      reports.push({
        groupName,
        channelName,
        username,
        reason,
        reportedBy: this.auth.getCurrentuser()?.username
    });
    localStorage.setItem('userReports', JSON.stringify(reports));
  }

  removeMember(groupName: string, username: string): void{
    const groups = this.channels();
    const group = groups.find(g => g.name === groupName);

    if(group){
      group.members = group.members.filter(u => u !== username);

      this.channels.set(groups);
      localStorage.setItem('groups', JSON.stringify(groups));
    }
  }

}

  
