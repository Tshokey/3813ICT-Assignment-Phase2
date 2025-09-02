import { Component,effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { GroupService } from '../../services/group-service';
import { User } from '../../models/user';
import { Group } from '../../models/group';

@Component({
  selector: 'app-groups',
  imports: [FormsModule, CommonModule],
  templateUrl: './groups.html',
  styleUrls: ['./groups.css']
})
export class Groups {
  user: User | null = null;
  newGroupName: string = '';
  errormsg: string = '';

  /** reactive groups array */
  groups: Group[] = [];

  constructor(public auth: AuthService, private groupService: GroupService) {
    this.user = this.auth.getCurrentuser();

    // update local groups whenever the service signal changes
    effect(() => {
      this.groups = this.groupService.groups();
    });
  }

  createGroup(): void {
    if (!this.user){
      this.errormsg = 'You must be logged in to create a group';
      return;
    }

    if (!this.auth.hasRole('GROUP_ADMIN') && !this.auth.hasRole('SUPER_ADMIN')) {
      this.errormsg = 'Only admins can create groups';
      return;
    }

    if (!this.newGroupName.trim()) {
      this.errormsg = 'Group name cannot be empty';
      return;
    }

    const exists = this.groups.some(g => g.name.toLowerCase() === this.newGroupName.trim().toLowerCase());
      if (exists) {
        this.errormsg = 'A group with this name already exists';
        return;
      }

    const group = new Group(
      this.newGroupName.trim(),
      this.user.username,
      [this.user.username],
      [],
      [],
      []
    );

    this.groupService.createGroup(group);
    this.newGroupName = '';
    this.errormsg = '';
  }

  registerInterest(group: Group) {
    if (this.user && !group.interested.includes(this.user.username) && !group.members.includes(this.user.username)) {
      group.interested.push(this.user.username);
    }
  }

  approveUser(group: Group, username: string) {
    this.groupService.approveUser(group.name, username);
  }

  joinGroup(group: Group): void {
    if (this.user){
      this.groupService.sendJoinRequest(group.name, this.user.username);
    }
  }

  rejectUser(group: Group, username: string): void {
    this.groupService.rejectUser(group.name, username);
  }

  deleteGroup(group: Group): void {
    if (!this.user) return;

    if (this.auth.hasRole('SUPER_ADMIN') || (this.auth.hasRole('GROUP_ADMIN') && group.createdBy === this.user.username)) {
      this.groupService.deleteGroup(group.name);
    } else {
      this.errormsg = 'You cannot delete this group';
    }
  }

  leaveGroup(group: Group): void {
    if (this.user) this.groupService.leaveGroup(group.name, this.user.username);
  }

  removeMember(group: Group, username: string): void{
    if (!this.user) return;

    if (this.auth.hasRole('SUPER_ADMIN') || (this.auth.hasRole('GROUP_ADMIN') && group.createdBy === this.user.username)) {
      this.groupService.removeMember(group.name, username);
    } else {
      this.errormsg = "You don't have permission to remove members from this group.";
    }
  }
}

