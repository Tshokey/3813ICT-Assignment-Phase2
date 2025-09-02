export class Group {
  name: string;
  createdBy: string;
  admins: string[]; 
  members: string[];
  channels: string[];
  interested: string[]; 
  bannedUsers: { [channel: string]: string[]}

  constructor(
  name: string = '',
  createdBy: string = '',
  admins: string[] = [], 
  members: string[] = [],
  channels: string[] = [],
  interested: string[]= [],
  bannedUsers: { [channel: string]: string[]} = {}
  ){
    this.name = name;
    this.createdBy = createdBy;
    this.admins = admins;
    this.members = members;
    this.channels =channels;
    this.interested = interested;
    this.bannedUsers = bannedUsers;
  }
}
