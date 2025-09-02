# ChatApp - Phase 1

## 1. Git Repository Organization
**Repository Structures:**

The project is organized to keep code modular, maintainable, and easy to navigate:

- The **root** directory holds project configurations and documentation.
- Components folder (`src/app/components/`) - consists of each UI page as a standalone component. This separation allows each page to be developed and tested independently.
- Models folder (`src/app/models/`) - stores TypeScript classes that define the data entities for User, Group and Channel. Models centralize the data structure definitions for consistent use across the application.
- Services folder (`src/app/services/`) - contains services for authentication, group, and channel management. These services handle data operations and state management, currently using localStorage.

**Version Control**
- Development is tracked on the `main` branch.
- Commits are incremental and meaningful, each describing a feature addition or bug fix.
- Frequent commits ensure clear traceability and make it easier to review and revert changes if needed.
- This approach ensures smooth collaboration and maintains a clean history of project progress.

---

## 2. Data Structures

All application data persists in the browser's **localStorage** for Phase 1. The key entities are:

### `User` (models/user.ts)
- Represents an individual user and their roles in the system. 
```
export class User {
    id: number;
    username: string;
    password: string;
    email: string;
    roles: Role[];         // 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN'
    groups: string[];      // List of group names the user belongs to
}
```

### `Group` (models/groups.ts)
- Represents a group which can contain channels and users.
```
export class Group {
  name: string;
  createdBy: string;        // Username of the creator
  admins: string[];         // Usernames of group admins
  members: string[];        // Usernames of group members
  channels: string[];       // List of channels within the group
  interested: string[];     // Users interested to join the group
  bannedUsers: { [channel: string]: string[]}    // Channel specific ban
}
```
### `Channel` (models/channel.ts)
- Represents a communication channel within a group.
```
export class Channel {
    name: string;
    groupName: string;        // Name of the parent group
    members: string[];        // Users in the channel
    bannedUsers: string[];    // Users banned from the channel
}
```
Relationships:
- A user can belong to multiple groups.
- A group can contain multiple channels.
- Roles (USER, GROUP_ADMIN, SUPER_ADMIN) determine what actions a user can perform within groups and channels
---

### 3. REST API
- Phase 1 uses localStorage instead of a backend API. The following is the planned RESTful API structure for Phase 2:

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

- In Phase 2, angular will communicate with these endpoints using HttpClient service.
---

### 4. Angular Architecture

Components
- Register (/register): Handles user registration.
- Login (/login): Handles user login.
- Dashboard (/dashboard): Displays user information and navigation based on role.
- Groups (/groups): Manages display, creation, joining, leaving and deleting groups.
- Channels (/channels): Lists, creates, joins, leaves and deletes channels.
- Admins (/admins): Allow `SUPER_ADMIN` users to manage user roles.

Services
- AuthService: Manages login/logout, authetication state, and role checks.
- GroupService: CRUD (Create, Read, Update, Delete) operations for groups, stored in localStorage.
- ChannelService: CRUD operations for channels, stored in localStorage.

Models
- Define the data entities (User, Group and Channel) for consistent use across components and services.

Routes
- Maps URLs to components
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
- Default route opens the login page.

Component-Service Interaction
- Login/Register: `AuthService` updates current user and persists it in localStorage.
- Groups/Channels: Components call GroupService and ChannelService to manipulate localStorage, update the lists and UI reactively.
- Role-based UI: Components display actions conditionally based on roles using AuthService.




