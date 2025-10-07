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
POST	|/api/channels/:ch/report	|{groupName, username, reason, reportedBy}|	{success, message?}	|Report user
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
    - POST /api/auth/login with { username, password }
-	Server changes: 
  - No file write expected; server verifies credentials against Users store (e.g., DB users collection). No global vars changed except session/JWT issuance.
-	Client update: 
  - AuthService.setCurrentUser stores user in localStorage.currentUser and signals _user/_loggedIn.
  - Login component navigates to /dashboard. Any components bound to isLoggedIn/currentUser recompute via signals and update their templates.
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

--
#### Groups
[1] List Groups (Groups component)
-	Client request: 
•	GET /api/groups
-	Server changes: 
•	None; reads Groups collection/file.
-	Client update: 
•	GroupService.loadGroups sets groups signal. Groups component reads groups() signal; Angular view updates automatically.
[2] Create Group (Groups component, admin)
-	Client request: 
•	POST /api/groups with Group
-	Server changes: 
•	Insert Group into Groups collection/file. Initialize: admins, members, channels, interested, bannedUsers.
-	Client update: 
•	GroupService.createGroup pushes returned group into groups signal, updating the table/cards in Groups UI.
[3] Join Request (Groups component, user)
-	Client request: 
•	POST /api/groups/:group/join with { username }
-	Server changes: 
•	Add username to group.interested[] in Groups collection/file. No global vars needed beyond persistent storage.
-	Client update: 
•	GroupService.loadGroups re-fetches groups; Groups component shows pending requests count/state. If UI separates “My status,” it shows “Requested.”
[4] Approve/Reject Join (Groups component, admin)
-	Client request: 
•	POST /api/groups/:group/approve with { username }
•	POST /api/groups/:group/reject with { username }
-	Server changes: 
•	Approve: move username from group.interested[] → group.members[] in storage.
•	Reject: remove username from group.interested[].
-	Client update: 
•	GroupService.loadGroups refreshes; the Groups UI updates members list and removes the username from pending. If the approved user is the current user, their local state (e.g., available channels) becomes visible after next fetch.
[5] Leave Group (Groups component, member)
-	Client request: 
•	POST /api/groups/:group/leave with { username }
-	Server changes: 
•	Remove username from group.members[].
-	Client update: 
•	GroupService.loadGroups refreshes; Groups page removes the group from user’s “My Groups” section.
[6] Remove Member / Delete Group (Groups component, admin)
-	Client requests: 
•	DELETE /api/groups/:group/members/:username
•	DELETE /api/groups/:group
-	Server changes: 
•	Remove member from group.members[] OR remove group document entirely.
•	If filesystem JSON, write updated file; if DB, delete document. Optionally cascade delete child channels if enforced server-side.
-	Client update: 
•	For remove member: loadGroups refreshes; UI updates memberships table.
•	For delete group: GroupService filters out group from groups; UI list updates immediately.

--
#### Channels
[1] List Channels (Channels component)
-	Client request: 
•	GET /api/channels or GET /api/channels/group/:group
-	Server changes: 
•	None; reads Channels collection/file.
-	Client update: 
•	ChannelService.loadChannels sets channels signal; Channels component updates list.
[2] Create Channel (Channels component, admin)
-	Client request: 
•	POST /api/channels with Channel
-	Server changes: 
•	Insert channel into Channels collection/file. Optionally, update the parent Group.channels[] for referential integrity.
-	Client update: 
•	ChannelService.createChannel pushes into channels signal; UI list updates.
[3] Join/Leave (Channels + Sockets)
-	Client REST requests: 
•	POST /api/channels/:ch/join with { groupName, username }
•	POST /api/channels/:ch/leave with { groupName, username }
-	Server changes: 
•	Update channel.members[] accordingly. Optionally sync to group-level membership constraints.
-	Client Socket actions: 
•	Sockets.joinChannel emits join-channel with { channelName, groupName, username }.
•	Sockets.leaveChannel emits leave-channel.
-	Server Socket changes: 
•	Server’s socket room membership updates (no file). Optionally update an in-memory presence map keyed by channelName and socketId/username.
-	Client UI updates: 
•	On REST success: ChannelService.loadChannels refreshes; Channels UI shows membership state.
•	Socket events: 
	user-joined/user-left update presence indicators.
	new-message updates message stream in real-time.
[4] Ban/Remove/Report (Channels component, admin/mod)
-	Client requests: 
•	POST /api/channels/:ch/ban with { groupName, username } → update channel.bannedUsers[]
•	DELETE /api/channels/:ch/members/:username?groupName=... → remove from members[]
•	POST /api/channels/:ch/report with { groupName, username, reason, reportedBy } → insert report record
-	Server changes: 
•	Channels collection: modify bannedUsers/members as appropriate.
•	Reports collection/file: append report entry.
-	Client update: 
•	After success, ChannelService.loadChannels refreshes, updating member lists and moderation UI controls.
[5] Delete Channel (Channels component, admin)
-	Client request: 
•	DELETE /api/channels/:ch?groupName=...
-	Server changes: 
•	Remove channel document/row; optionally update Group.channels[].
-	Client update: 
•	ChannelService removes from local channels signal; Channels list updates immediately.

--
#### Chat Messages and Presence (Sockets)
[1] Send Message (Channels component + Sockets)
-	Client action: 
•	Sockets.sendMessage emits send-message with { channelName, groupName, username, message, messageType, imageUrl? }.
-	Server changes: 
•	Persist message to Messages collection/file (append new record with timestamp). No global var required except an optional in-memory message cache.
-	Client update: 
•	Server emits new-message to room; Sockets service pushes to messageSubject.
•	Channels component subscribes to getMessages(); it appends to the chat view immediately.
•	user-joined/user-left events update presence indicators (e.g., online members list).
[2] Errors
-	Client listens to message-error; displays a toast/banner.
-	Server may send message-error for authorization issues (e.g., banned user, non-member).

--
#### Uploads (Profile and Chat Images)
[1] Profile Image Upload (Profile area in Dashboard/Admins)
-	Client request: 
•	POST /api/upload/profile-image with FormData(image, username)
-	Server changes: 
•	Writes file to disk or object storage; returns data.imageUrl. Optionally updates Users.profileImage in the Users collection/file.
-	Client update: 
•	UploadService returns UploadResponse. UI binds to new image URL. If server persists URL on user, a subsequent GET /users reflects it; components show updated avatar.
[2] Chat Image Upload (Channels component)
-	Client request: 
•	POST /api/upload/chat-image with FormData(image, channelName?, caption?)
-	Server changes: 
•	Writes file; returns imageUrl. Client then emits send-message with messageType = "image" and imageUrl to persist chat message.
-	Client update: 
•	On new-message event, Channels component displays image message inline.
[3] Delete Image
-	Client request: 
•	DELETE /api/upload/image with body { imageUrl }
-	Server changes: 
•	Removes file from storage; if referenced in a record (e.g., user profile), server should also clear or update that field.
-	Client update: 
•	Components relying on that image re-fetch user/channel state or update local state to remove/replace the image.

--
#### Video Calls (Video component, PeerJS + Socket.IO presence)
[1] Peer Registration and Presence
-	Client actions: 
•	PeerService.initPeer creates a PeerJS peer with id; VideoService.registerPeer emits register-peer with { peerId, username }.
-	Server changes: 
•	Maintains in-memory peer registry map: peerId → username. No persistent storage required; cleared when socket disconnects.
-	Client update: 
•	Server emits peer-list and new-peer/peer-left to VideoService; Video component subscribes and updates the participants list in real-time.
[2] Media Calls
-	Client actions: 
•	PeerService.call(peerId, stream) initiates WebRTC call.
•	Incoming calls answered with call.answer(myStream).
-	Server changes: 
•	None on filesystem/DB; signaling is peer-to-peer via PeerJS server (connection IDs). The PeerJS server may track active connections in memory only.
-	Client update: 
•	Video streams are rendered into the DOM. Toggling mic/cam or screen-share updates local MediaStream and either replaces tracks or re-calls peers; UI reflects state (icons, video tiles).
[3] Teardown
-	Client actions: 
•	VideoService.unregisterPeer and socket disconnect.
•	PeerService.destroy to tear down PeerJS.
-	Server changes: 
•	Removes peer from in-memory registry on unregister or disconnect.
-	Client update: 
•	Video component removes video tiles and updates presence list.
---

### 6. Global Variables and Server Files Overview
-	Users collection/file: 
•	Updated by Auth/users CRUD, profile image updates.
-	Groups collection/file: 
•	Updated by create/join/approve/reject/leave/remove/delete flows.
-	Channels collection/file: 
•	Updated by create/join/leave/ban/remove/delete flows.
-	Messages collection/file: 
•	Appended for each send-message event.
-	Reports collection/file: 
•	Appended for POST /api/channels/:ch/report.
-	Upload storage (filesystem or object storage): 
•	New files on profile/chat image uploads; deletions on DELETE /api/upload/image.
-	In-memory maps (global, non-persistent): 
•	Socket.IO channel room membership and presence.
•	Video presence registry: peerId → username for active clients.

Angular UI reacts via:
•	Signals (AuthService.currentUser, isLoggedIn; GroupService.groups; ChannelService.allChannels).
•	Observables (Sockets.getMessages/getUserJoined/getUserLeft/getConnectionStatus; VideoService peer streams).
•	Component templates bind to these sources for automatic, real-time updates.
---

### 7. Server-Side Tests (Mocha/Chai)
1.	Tooling
•	mocha, chai, supertest, nyc (coverage)
2.	Example Scripts (package.json)
•	Add these to your server package.json:
```
{
  "scripts": {
    "test": "mocha -r ts-node/register 'tests/**/*.spec.ts'",
    "test:watch": "mocha -r ts-node/register -w 'tests/**/*.spec.ts'",
    "coverage": "nyc --reporter=text-summary --reporter=html npm run test"
  }
}
```
4.	What To Test
•	Auth routes: login, users CRUD.
•	Groups routes: GET/POST /api/groups, join/approve/reject/leave/delete, remove member.
•	Channels routes: create/join/leave/ban/report/delete, list by group.
•	Upload routes: profile-image, chat-image, delete image (mock storage if needed).
•	Socket server: can be partially tested via integration tests or separated logic (e.g., message validation functions).

5.	Example Route Test (Supertest + Chai)
```
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app'; // your Express app

describe('Groups API', () => {
  it('GET /api/groups returns 200 and an array', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('POST /api/groups creates a group', async () => {
    const payload = { name: 'devs', createdBy: 'alice', admins: ['alice'], members: [], channels: [], interested: [], bannedUsers: {} };
    const res = await request(app).post('/api/groups').send(payload);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.group.name).to.equal('devs');
  });
});
```

Coverage 
•	Configure nyc (coverage) via .nycrc or package.json.
•	Aim to include controllers/services that back routes to pass >75% coverage for externally facing functions.
---

### 8. Angular Unit Tests 
1.	Tooling
•	Jasmine/Karma (default Angular)
•	Or Jest (optional) with ts-jest
2.	What To Test
•	Services: 
-	AuthService: login success/failure, user state signals.
-	GroupService: load/create/join/approve/etc. Use HttpTestingController to mock HTTP.
-	ChannelService: create/join/leave/ban/report/remove.
-	UploadService: POST form-data and delete behavior (mock HTTP).
-	Sockets/VideoService/PeerService: verify event registration and method calls (use spies/mocks; no real sockets).
•	Components: 
-	Login: form validation, submits, navigation on success.
-	Groups/Channels: renders lists from signals, reacts to mocked services, calls service methods on actions.
-	Video: creates PeerService connections (use spies), updates UI state on mocked events.
3.	Example Service Test (HttpTestingController)
```
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupService } from './group-service';

describe('GroupService', () => {
  let service: GroupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GroupService]
    });
    service = TestBed.inject(GroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load groups', (done) => {
    const mockGroups = [{ name: 'devs', createdBy: 'alice', admins: [], members: [], channels: [], interested: [], bannedUsers: {} }];
    const sub = service.groups.subscribe(gs => {
      if (gs.length) {
        expect(gs[0].name).toBe('devs');
        sub.unsubscribe();
        done();
      }
    });
    const req = httpMock.expectOne('https://localhost:3000/api/groups');
    req.flush(mockGroups);
  });

  afterEach(() => httpMock.verify());
});
```
---

### 9. Angular E2E Tests (Extensive)
1.	Tooling
•	Cypress (recommended) or Playwright.
•	Place tests under e2e/ and configure baseUrl to your dev server.
2.	E2E Flow Coverage
•	Login flow: wrong creds → error; correct creds → dashboard.
•	Groups: create group, join request, approve/reject, leave.
•	Channels: create channel, join, send/receive text and image message (upload mock if needed).
•	Upload: profile image upload and display.
•	Video: navigate to /video and verify presence list updates (smoke test; full WebRTC is difficult in CI—assert socket registration occurred).
3.	Example Cypress Scripts (package.json in Angular project)
```
{
  "scripts": {
    "e2e": "cypress run",
    "e2e:open": "cypress open"
  }
}
```
---

### 10. How To Run Tests
1.	Server Tests (Mocha/Chai)
•	Setup: 
-	cd server
-	npm install
•	Run unit/integration tests: 
-	npm test
•	Coverage: 
-	npm run coverage
•	Notes: 
-	Ensure test database or in-memory store is used.
-	If HTTPS is required, mock or disable TLS for tests.
2.	Angular Unit Tests
•	Setup: 
-	cd client
-	npm install
•	Run: 
-	npm run test
•	Coverage: 
-	npm run test -- --code-coverage
-	Coverage report in coverage/ directory.
3.	Angular E2E Tests
•	Ensure backend and frontend are running: 
-	Backend: npm start (server)
-	Frontend: ng serve (client)
•	Run Cypress: 
-	npm run e2e
•	Config: 
-	baseUrl set in cypress.config.ts to `http://localhost:4200`
-	Environment variables for API base if needed.



