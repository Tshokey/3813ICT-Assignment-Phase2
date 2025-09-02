import { Injectable, signal, Signal } from '@angular/core';
import { Group } from '../models/group';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private _groups = signal<Group[]>([]);

  constructor(private auth: AuthService) {
    const saved = localStorage.getItem('groups');
    this._groups.set(saved ? JSON.parse(saved) : []);
  }

  get groups(): Signal<Group[]> {
    return this._groups.asReadonly();
  }

  private save() {
    localStorage.setItem('groups', JSON.stringify(this._groups()));
  }

  createGroup(group: Group): void {
    const groups = this._groups();
     if (groups.some(g => g.name.toLowerCase() === group.name.toLowerCase())) return;
    groups.push(group);
    this._groups.set(groups);
    this.save();
  }

  sendJoinRequest(groupName: string, username: string) {
    const groups = this._groups();
    const g = groups.find(g => g.name === groupName);
    if (g && !g.interested.includes(username) && !g.members.includes(username)) {
      g.interested.push(username);
      this._groups.set(groups);
      this.save();
    }
  }

  approveUser(groupName: string, username: string) {
    const groups = this._groups();
    const g = groups.find(g => g.name === groupName);
    if (g) {
      g.members.push(username);
      g.interested = g.interested.filter(u => u !== username);
      this._groups.set(groups);
      this.save();
    }
  }

  rejectUser(groupName: string, username: string) {
    const groups = this._groups();
    const g = groups.find(g => g.name === groupName);
    if (g) {
      g.interested = g.interested.filter(u => u !== username);
      this._groups.set(groups);
      this.save();
    }
  }

  leaveGroup(groupName: string, username: string) {
    const groups = this._groups();
    const g = groups.find(g => g.name === groupName);
    if (g) {
      g.members = g.members.filter(u => u !== username);
      this._groups.set(groups);
      this.save();
    }
  }

  deleteGroup(groupName: string): void {
    const groups = this._groups().filter(g => g.name !== groupName);
    this._groups.set(groups);
    this.save();
  }

  removeMember(groupName: string, username: string): void{
    const groups = this._groups();
    const group = groups.find(g => g.name === groupName);

    if(group){
      group.members = group.members.filter(u => u !== username);

      group.interested = group.interested.filter(u=> u!== username);

      this._groups.set(groups);
      localStorage.setItem('groups', JSON.stringify(groups));
    }
  }

  

}
