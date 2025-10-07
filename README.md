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

- Development continues the main branch with incremental, meaningful commits. Each commit represents feature additions, bug fixes, or architectural improvements. Phase 2 commits focus on backend integration, real-time features, and video calling implementation.
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

#### Authentication API

Method | Route | Parameters | Return Values | Purpose
----- | ----- | ----- | ----- | ----- |
POST | /api/auth/login | {username, password}	|{success, user?, message?}	|Authenticate user
GET	| /api/auth/users | - | User[]	|Fetch all users
POST | /api/auth/users|	Partial<User>	|{success, user?, message?}	|Create new user
PUT	| /api/auth/users/:username|	Partial<User>|	{success, user?, message?}|	Update user
DELETE | /api/auth/users/:username|	-|	{success, message?}|	Delete user

#### Groups API

Method | Route | Parameters | Return Values | Purpose
----- | ----- | ----- | ----- | ----- |
GET	|/api/groups	|-	|Group[]	|Fetch all groups
POST	|/api/groups	|Group	|{success, group?, message?} |Create new group
POST	|/api/groups/:group/join	|{username}	|{success, message?}	|Request to join group
POST	|/api/groups/:group/approve	|{username}	|{success, message?}	|Approve join request
POST	|/api/groups/:group/reject	|{username}	|{success, message?}	|Reject join request
POST	|/api/groups/:group/leave|	{username}	|{success, message?}|	Leave group
DELETE	|/api/groups/:group|	-	|{success, message?}	|Delete group
DELETE	|/api/groups/:group/members/:username|	-|	{success, message?}	|Remove member

#### Channels API

Method | Route | Parameters | Return Values | Purpose
----- | ----- | ----- | ----- | ----- |
GET	|/api/channels	|-	|Channel[]|	Fetch all channels
POST	|/api/channels	|Channel	|{success, channel?, message?}	|Create channel
POST	|/api/channels/:ch/join	|{groupName, username}	|{success, message?}	|Join channel
POST	|/api/channels/:ch/leave|	{groupName, username}|	{success, message?}	|Leave channel
POST	|/api/channels/:ch/ban|	{groupName, username}	|{success, message?}	|Ban user from channel
POST	|/api/channels/:ch/report	|{groupName, username, reason, reportedBy}|	{success, message?}	Report user
DELETE	|/api/channels/:ch	|?groupName=...	|{success, message?}	|Delete channel
DELETE	|/api/channels/:ch/members/:username	|?groupName=...	|{success, message?}|	Remove member
GET	|/api/channels/group/:group|-	|Channel[]	|Get group channels
GET	|/api/channels/reports|	-|	any[]	|Get user reports

#### Upload API

Method | Route | Parameters | Return Values | Purpose
----- | ----- | ----- | ----- | ----- |
POST	|/api/upload/profile-image|	FormData(image, username)	|UploadResponse	|Upload profile image
POST	|/api/upload/chat-image|	FormData(image, channelName?, caption?)|	UploadResponse|	Upload chat image
DELETE	|/api/upload/image	|{imageUrl}	|{result, message}	|Delete image

#### Socket.IO Events
##### Chat Events:
- Client emits: join-channel, leave-channel, send-message
- Server emits: new-message, user-joined, user-left, message-error
##### Video Presence Events:
- Client emits: register-peer, unregister-peer
- Server emits: peer-list, new-peer, peer-left
---

### 4. Angular Architecture

Components
- Login (/login): Enhanced with error handling and redirect functionality.
- Register (/register): User registration with validation and role assignment.
- Dashboard (/dashboard): Role-based navigation and user information display.
- Groups (/groups): Complete group management with join requests, approval workflow, and admin controls.
- Channels (/channels): Real-time chat interface with image sharing, user moderation, and channel management.
- Admins (/admins): Super admin interface for user management and role promotion.
- Video (/video): WebRTC video calling with screen sharing, multiple participants, and peer presence management.

Services
- AuthService: JWT-based authentication, user management, and role-based authorization with localStorage session persistence.
- GroupService: Full CRUD operations for groups with join request workflow and member management via REST API.
- ChannelService: Channel management, moderation features (ban/report/remove), and integration with backend APIs.
- Sockets: Real-time chat communication using Socket.IO with message broadcasting and user presence tracking.
- VideoService: WebRTC peer presence management and signaling for video calls.
- PeerService: PeerJS integration for direct peer-to-peer video communication with media stream handling.
- UploadService: File upload handling for profile images and chat attachments with multipart form data.

Models
- Enhanced data entities (User, Group, Channel, Message) with comprehensive type definitions for frontend-backend consistency.

Guards
- authGuard: Route protection ensuring authenticated access with redirect functionality and return URL preservation.

Routes
- Expanded routing with authentication protection:
```
export const routes: Routes = [
    { path: '', component: Login },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'groups', component: Groups, canActivate: [authGuard] },
    { path: 'channels', component: Channels, canActivate: [authGuard] },
    { path: 'admins', component: Admins, canActivate: [authGuard] },
    { path: 'video', component: Video, canActivate: [authGuard] }
];
```
---

### 5. Component-Service Interaction
#### Authentication and Users
[1] Login (Login component)
-	Client request: 
•	POST /api/auth/login with { username, password }
-	Server changes: 
•	No file write expected; server verifies credentials against Users store (e.g., DB users collection). No global vars changed except session/JWT issuance.
-	Client update: 
•	AuthService.setCurrentUser stores user in localStorage.currentUser and signals _user/_loggedIn.
•	Login component navigates to /dashboard. Any components bound to isLoggedIn/currentUser recompute via signals and update their templates.
[2] Users CRUD (Admins component)
-	Client requests: 
•	GET /api/auth/users → to list users.
•	POST /api/auth/users with Partial<User> → create.
•	PUT /api/auth/users/:username with Partial<User> → update.
•	DELETE /api/auth/users/:username → delete.
-	Server changes: 
•	Users collection updated accordingly: insert/update/remove document (or rows). If using filesystem JSON, write updated JSON file; if DB, persist to table/collection.
-	Client update: 
•	Admins component calls AuthService methods; responses drive UI tables. On success, component refreshes the list via GET or updates in-memory array to reflect changes.


- Default route opens the login page.

Component-Service Interaction
- Login/Register: `AuthService` updates current user and persists it in localStorage.
- Groups/Channels: Components call GroupService and ChannelService to manipulate localStorage, update the lists and UI reactively.
- Role-based UI: Components display actions conditionally based on roles using AuthService.




