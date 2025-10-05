import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { ChannelService } from '../../services/channel-service';
import { User } from '../../models/user';
import { Channel } from '../../models/channels';
import { GroupService } from '../../services/group-service';
import { Chat } from '../chat/chat';

@Component({
  selector: "app-channels",
  imports: [FormsModule, CommonModule, Chat],
  templateUrl: "./channels.html",
  styleUrls: ["./channels.css"],
})
export class Channels {
  channels: Channel[] = []
  channelName = ""
  user: User | null = null
  selectedGroupName = ""
  errormsg = ""
  groups: any[] = []
  groupAccessErr = ""
  selectedChannel: Channel | null = null

  expandedChannels: Set<string> = new Set()
  selectedMembers: Map<string, Set<string>> = new Map()

  constructor(
    public auth: AuthService,
    private channelService: ChannelService,
    private groupService: GroupService,
  ) {
    this.user = this.auth.getCurrentUser()

    const savedGroups = localStorage.getItem("groups")
    this.groups = this.groupService.groups()

    effect(() => {
      this.channels = this.channelService.allChannels()
    })
  }

  toggleMembers(channelName: string): void {
    if (this.expandedChannels.has(channelName)) {
      this.expandedChannels.delete(channelName)
      this.selectedMembers.delete(channelName)
    } else {
      this.expandedChannels.add(channelName)
    }
  }

  isMembersExpanded(channelName: string): boolean {
    return this.expandedChannels.has(channelName)
  }

  toggleMemberSelection(channelName: string, member: string): void {
    if (!this.selectedMembers.has(channelName)) {
      this.selectedMembers.set(channelName, new Set())
    }
    const members = this.selectedMembers.get(channelName)!
    if (members.has(member)) {
      members.delete(member)
    } else {
      members.add(member)
    }
  }

  isMemberSelected(channelName: string, member: string): boolean {
    return this.selectedMembers.get(channelName)?.has(member) || false
  }

  getSelectedMembers(channelName: string): string[] {
    return Array.from(this.selectedMembers.get(channelName) || [])
  }

  async removeSelectedMembers(channel: Channel): Promise<void> {
    const selected = this.getSelectedMembers(channel.name)
    if (selected.length === 0) return

    const confirmMsg = `Are you sure you want to remove ${selected.length} member(s)?`
    if (!confirm(confirmMsg)) return

    for (const member of selected) {
      await this.channelService.removeMember(channel.name, channel.groupName, member)
    }

    this.selectedMembers.delete(channel.name)
    this.errormsg = ""
  }

  get visibleChannels(): Channel[] {
    this.groupAccessErr = ""

    if (!this.selectedGroupName) return []
    if (!this.user) return []

    const isAdmin = this.auth.hasRole("GROUP_ADMIN") || this.auth.hasRole("SUPER_ADMIN")
    const group = this.groups.find((g) => g.name === this.selectedGroupName)
    const isMember = group?.members.includes(this.user.username)

    if (!isAdmin && !isMember) {
      this.groupAccessErr = `You must be a member of group "${this.selectedGroupName}" to join its channels.`
      return []
    }
    return this.channels.filter((ch) => ch.groupName === this.selectedGroupName)
  }

  createChannel(): void {
    this.errormsg = ""
    if (!this.user) return
    if (!(this.auth.hasRole("GROUP_ADMIN") || this.auth.hasRole("SUPER_ADMIN"))) {
      this.errormsg = "Only admins can create channels"
      return
    }
    if (!this.channelName.trim() || !this.selectedGroupName.trim()) {
      this.errormsg = "Select a group or enter a channel name"
      return
    }

    const newChannel = new Channel(this.channelName.trim(), this.selectedGroupName, [], [])
    this.channelService.createChannel(newChannel)
    this.channelName = ""
  }

  deleteChannel(channel: Channel): void {
    this.errormsg = ""
    if (!this.user) return
    if (this.auth.hasRole("SUPER_ADMIN") || this.auth.hasRole("GROUP_ADMIN")) {
      this.channelService.deleteChannel(channel.name, channel.groupName)
    } else {
      this.errormsg = "You cannot delete this channel"
    }
  }

  joinChannel(channel: Channel): void {
    this.errormsg = ""
    if (!this.user) return
    const group = this.groups.find((g) => g.name === channel.groupName)

    if (!group || !group.members.includes(this.user.username)) {
      this.errormsg = `You must be a member of group "${channel.groupName}" to join its channels.`
      return
    }
    this.channelService.JoinChannel(channel.name, channel.groupName, this.user.username)
  }

  leaveChannel(channel: Channel): void {
    if (!this.user) return
    this.channelService.leaveChannel(channel.name, channel.groupName, this.user.username)
  }

  banUser(channel: Channel, username: string): void {
    if (!this.user) return
    if (this.user && (this.auth.hasRole("GROUP_ADMIN") || this.auth.hasRole("SUPER_ADMIN"))) {
      this.channelService.banUser(channel.name, channel.groupName, username)
    }
  }

  reportUser(channel: Channel, username: string, reason: string): void {
    if (!this.user) return
    if (this.user) {
      this.channelService.reportUser(channel.groupName, channel.name, username, reason)
      alert(`${username} has been reported to super admins.`)
    }
  }

  removeMember(channel: Channel, username: string): void {
    if (!this.user) return

    if (this.auth.hasRole("SUPER_ADMIN") || this.auth.hasRole("GROUP_ADMIN")) {
      this.channelService.removeMember(channel.name, channel.groupName, username)
    } else {
      this.errormsg = "You don't have permission to remove members from this group."
    }
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel = channel
  }

  closeChat(): void {
    this.selectedChannel = null
  }
}
