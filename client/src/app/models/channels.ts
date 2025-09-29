export class Channel {
    name: string;
    groupName: string;
    members: string[];
    bannedUsers: string[];

    constructor(
        name: string = '',
        groupName: string = '',
        members: string[] = [],
        bannedUsers: string[] = [],
    ){
        this.name = name;
        this.members = members;
        this.groupName = groupName;
        this.bannedUsers = bannedUsers;
    }
}

export { Channel as Channels }