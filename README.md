# ChatApp - Phase 1
---
## 1. Git Repository Organization
**Repository Structures:**
- The **root** holds project configurations and documentation.
- `src/app/components/` consists of each UI page as a standalone component.
- `src/app/models/` stores the TypeScript model definitions for `User`, `Group` and `Channel`.
- `src/app/services/` contains  logic for authentication and data manipulation which is stored via localStorage.

**Version Control**
- The project development is tracked in `main` branch, it is updated with meaningful, incremental commits.
- Commits describe each feature addition or fix for the smooth working.
- Frequent commits ensure strong traceability of devlopment progress.

---

## 2. Data Structures

All application data is stored in browser's **localStorage** for Phase 1:

### `User` (models/user.ts)
```
export class User {
    id: number;
    username: string;
    password: string;
    email: string;
    roles: Role[]; 
    groups: string[];
}
```
The `roles` entity includes 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN' which is accessed `export type Role = 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN'`

### `Group` (models/groups.ts)
```
export class Group {
  name: string;
  createdBy: string;
  admins: string[]; 
  members: string[];
  channels: string[];
  interested: string[]; 
  bannedUsers: { [channel: string]: string[]}
}
```
### `Channel` (models/channel.ts)
```
export class Channel {
    name: string;
    groupName: string;
    members: string[];
    bannedUsers: string[];
}
```
### 3. REST API
- Phase 1 usese no server API; localStorage is used instead. The following displays the planned RESTful API structure for backend integration in Phase 2:

Method | Route | Parameters | Return Values | Purpose
----- | ----- | ----- | ----- | ----- |
POST | /api/users/register | {username, email, password} | {user} | Register a new user
POST | /api/users/login | {username, password} | {user, token} | Authenticate user & return session token
GET | /api/groups | - | Group[] | Fetch list of all available groups
POST | /api/groups | {name} | {group} | Create a new group
POST | /api/groups/:id/join | {userId} | {success} | Add a user to a group
GET | /api/groups/:id/channels | - | Channel[] | Fetch channels ina group
POST | /api/channels | {name, groupId} | {channel} | Create a new channel
POST | /api/channels/:id/join | {userId} | {success) | Add a user to a channel

### 4. Angular Architecture

Components
- Register (/register): Handles user registration form.
- Login (/login): Handles user login form.
- Dashboard (/dashboard): Displays user information and links based on role.
- Groups (/groups): Manage display, creation, joining, leaving and deleting groups according to their role.
- Channels (/channels): List, create, join, leavr and delete functionalities for channels.
- Admins (/admins): For 'Super' to manage user roles.

Services
- AuthService: Manages authetication state, login/logout and role checks.
- GroupService: CRUD (Create, Read, Update, Delete) operations for groups stored in localStorage.
- ChannelService: CRUD operations for channels stored in localStorage.

Models
- User, Group and Channel classes define data entities used across components and services.

Routes
```
export const routes: Routes = [
    { path: '', component: Login,}, 
    { path: 'dashboard', component: Dashboard,}, 
    { path: 'login', component: Login,},
    { path: 'register', component: Register,},
    { path: 'groups', component: Groups,},
    { path: 'channels', component: Channels,},
    { path: 'admins', component: Admins,}
];
```
- The default link opens the login page.

Component-Service Interaction
- Login/Register: `AuthService` updates current user and persists in lcalStorage.
- Groups/Channels: UI components call GroupService and ChannelService to manipulate localStorage, updating lists and UI reactively.
- Role-based UI: Views conditionally dispay actions such as create group/channel based on roles via AuthService.




