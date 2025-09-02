export class Group {
  name: string;
  createdBy: string;
  admins: string[]; 
  members: string[];
  channels: string[];
  interested: string[]; 

  constructor(
  name: string = '',
  createdBy: string = '',
  admins: string[] = [], 
  members: string[] = [],
  channels: string[] = [],
  interested: string[]= [],
  ){
    this.name = name;
    this.createdBy = createdBy;
    this.admins = admins;
    this.members = members;
    this.channels =channels;
    this.interested = interested;
  }
}
