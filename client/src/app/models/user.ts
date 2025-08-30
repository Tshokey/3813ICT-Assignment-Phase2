export type Role = 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN'

export class User {
    id: number;
    username: string;
    email: string;
    password: string;
    roles: Role[];
    groups: string[];

    constructor(id: number = 0, username: string='', email:string='', password:string='', roles:Role[]=[], groups:string[]=[]){
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.roles = roles;
        this.groups = groups;
    }
}
