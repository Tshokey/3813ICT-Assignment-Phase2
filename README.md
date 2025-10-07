# ChatApp - Phase 2

## 1. Git Repository Organization
**Repository Structures:**

- The project structure has been expanded to support real-time communication, video calling, and comprehensive backend integration
- Root Directory: Contains project configurations, documentation, and build files.
- Components folder (src/app/components/) - Enhanced with video calling functionality and improved UI components. Each component remains standalone for independent development and testing.
- Models folder (src/app/models/) - Expanded to include Message model for chat functionality and UserActivity interface for real-time events.
- Services folder (src/app/services/) - Significantly expanded with real-time communication services, video calling, file uploads, and full backend integration replacing localStorage.
- Guards folder (src/app/guards/) - Contains route protection logic for authenticated access.

**Version Control**

Development continues the main branch with incremental, meaningful commits. Each commit represents feature additions, bug fixes, or architectural improvements. Phase 2 commits focus on backend integration, real-time features, and video calling implementation.
---

## 2. Data Structures

Application data now persists through backend APIs and real-time connections. Key entities have been enhanced:

### `User` (models/user.ts)
- Represents users with enhanced profile and role management capabilities.
```
export class User {
    id: number;
    username: string;
    password: string;
    email: string;
    roles: Role[];                    // 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN'
    groups: string[];             // List of group names the user belongs to
    profileImage?: string | null ;   // Profile image path
    toPromoteGroup?: boolean;         // Promotion flags for admin management
    toPromoteSuper?: boolean;
}

```

### `Group` (models/groups.ts)
- Enhanced with interest management and channel-specific moderation.
```
export class Group {
  name: string;
  createdBy: string;         // Username of the creator
  admins: string[];          //Usernames of group admins
  members: string[];		 // Usernames of group members
  channels: string[];		 // List of channels within the group
  interested: string[];  		 // Users interested to join the group
  bannedUsers: { [channel: string]: string[]}		// Channel specific ban
}

```
### `Channel` (models/channel.ts)
- Supports group-based organization and member management.
```
export class Channel {
    name: string;		
    groupName: string;		// Name of the parent group
    members: string[];		// Users in the channel
    bannedUsers: string[];	// Users banned from the channel
}

```
### `Message` (models/message.ts)
- Supports real-time chat with text and image messages.
```
export class Message {
  _id?: string
  channelName: string
  groupName: string
  username: string
  message: string
  messageType: "text" | "image"    // Support for different message types
  imageUrl?: string                // Optional image attachment
  timestamp: Date
  createdAt?: Date
}

```
### `UserActivity Interface`
- Tracks user join/leave events in real-time.
```
export interface UserActivity {
  username: string
  message: string
  timestamp: Date
}

```
---

### 3. REST API
-	Phase 2 implements a comprehensive RESTful API with real-time communication capabilities:

#### `Authentication API`

Method | Route | Parameters | Return Values | Purpose
----- | ----- | ----- | ----- | ----- |
POST | /api/auth/login | {username, password}	|{success, user?, message?}	|Authenticate user
GET	| /api/auth/users | - | User[]	|Fetch all users
POST | /api/auth/users|	Partial<User>	|{success, user?, message?}	|Create new user
PUT	| /api/auth/users/:username|	Partial<User>|	{success, user?, message?}|	Update user
DELETE | /api/auth/users/:username|	-|	{success, message?}|	Delete user


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




