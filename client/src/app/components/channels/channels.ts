import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { ChannelService } from '../../services/channel-service';
import { User } from '../../models/user';
import { Channel } from '../../models/channels';
import { GroupService } from '../../services/group-service';

@Component({
  selector: 'app-channels',
  imports: [FormsModule, CommonModule],
  templateUrl: './channels.html',
  styleUrls: ['./channels.css']
})
export class Channels {
  channels: Channel[] = [];
  channelName: string = '';
  user: User | null = null;
  selectedGroupName: string = '';
  errormsg: string = '';
  groups: any[] = [];
  groupAccessErr: string= '';

  constructor(
    public auth: AuthService, 
    private channelService: ChannelService,
    private groupService: GroupService) 
    {
      this.user = this.auth.getCurrentuser();

      const savedGroups = localStorage.getItem('groups');
      this.groups = this.groupService.groups();

      effect(() => {
        this.channels = this.channelService.allChannels();
    });
  }

  get visibleChannels(): Channel[] {
    this.groupAccessErr = '';

    if (!this.selectedGroupName) return [];
    if (!this.user) return [];

    const isAdmin = this.auth.hasRole('GROUP_ADMIN') || this.auth.hasRole('SUPER_ADMIN');
    const group = this.groups.find(g => g.name === this.selectedGroupName);
    const isMember = group?.members.includes(this.user.username);

    if (!isAdmin && !isMember) {
    this.groupAccessErr = `You must be a member of group "${this.selectedGroupName}" to join its channels.`;
    return [];
  }
    return this.channels.filter(ch => ch.groupName === this.selectedGroupName);
  }

  createChannel(): void {
    this.errormsg = '';
    if (!this.user) return;
    if (!(this.auth.hasRole('GROUP_ADMIN') || this.auth.hasRole('SUPER_ADMIN'))) {
      this.errormsg = 'Only admins can create channels';
      return;
    }
    if (!this.channelName.trim() || !this.selectedGroupName.trim()){
      this.errormsg = 'Select a group or enter a channel name';
      return;
    } 

    const newChannel = new Channel(this.channelName.trim(), this.selectedGroupName, [], []);
    this.channelService.createChannel(newChannel);
    this.channelName = '';
  }

  deleteChannel(channel: Channel): void {
    this.errormsg = '';
    if (!this.user) return;
    if (this.auth.hasRole('SUPER_ADMIN') || (this.auth.hasRole('GROUP_ADMIN'))) {
      this.channelService.deleteChannel(channel.name, channel.groupName);
    } else {
      this.errormsg = 'You cannot delete this channel';
    }
  }

  joinChannel(channel: Channel): void {
    this.errormsg = '';
    if (!this.user) return;
    const group = this.groups.find(g => g.name === channel.groupName);

    if (!group || !group.members.includes(this.user.username)) {
      this.errormsg = `You must be a member of group "${channel.groupName}" to join its channels.`;
      return;
    }
    this.channelService.JoinChannel(channel.name, channel.groupName, this.user.username);
  }

  leaveChannel(channel: Channel): void {
    if (!this.user) return;
    this.channelService.leaveChannel(channel.name, channel.groupName, this.user.username);
  }

  banUser(channel: Channel, username: string):void{
    if (!this.user) return;
    if (this.user && (this.auth.hasRole('GROUP_ADMIN') || this.auth.hasRole('SUPER_ADMIN'))) {
        this.channelService.banUser(channel.name, channel.groupName, username);
    }
  }

   reportUser(channel: Channel, username: string, reason: string): void {
    if (!this.user) return;
    if (this.user) {
      this.channelService.reportUser(channel.groupName, channel.name, username, reason);
      alert(`${username} has been reported to super admins.`);
    }
  }

}

