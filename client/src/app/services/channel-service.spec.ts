import { TestBed } from "@angular/core/testing"
import { HttpTestingController } from "@angular/common/http/testing"
import { ChannelService } from "./channel-service"
import { AuthService } from "./auth-service"
import { Channel } from "../models/channels"
import { User } from "../models/user"

describe("ChannelService", () => {
  let service: ChannelService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj("AuthService", ["getCurrentUser"])

    TestBed.configureTestingModule({
      imports: [],
      providers: [ChannelService, { provide: AuthService, useValue: authSpy }],
    })

    service = TestBed.inject(ChannelService)
    httpMock = TestBed.inject(HttpTestingController)
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>

    const req = httpMock.expectOne("https://localhost:3000/api/channels")
    req.flush([])
  })

  afterEach(() => {
    httpMock.verify()
  })

  it("should be created", () => {
    expect(service).toBeTruthy()
  })

  describe("loadChannels", () => {
    it("should load channels on initialization", () => {
      const mockChannels: Channel[] = [
        { name: "general", groupName: "Group1", members: [], bannedUsers: [] },
        { name: "random", groupName: "Group1", members: [], bannedUsers: [] },
      ]

      expect(service.allChannels()).toEqual([])
    })
  })

  describe("createChannel", () => {
    it("should create a new channel successfully", async () => {
      const newChannel: Channel = {
        name: "newchannel",
        groupName: "Group1",
        members: [],
        bannedUsers: [],
      }

      const createPromise = service.createChannel(newChannel)

      const req = httpMock.expectOne("https://localhost:3000/api/channels")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual(newChannel)

      req.flush({ success: true, channel: newChannel })

      const result = await createPromise
      expect(result).toBe(true)
    })

    it("should fail to create channel when server returns error", async () => {
      const newChannel: Channel = {
        name: "existing",
        groupName: "Group1",
        members: [],
        bannedUsers: [],
      }

      const createPromise = service.createChannel(newChannel)

      const req = httpMock.expectOne("https://localhost:3000/api/channels")
      req.flush({ success: false, message: "Channel already exists" })

      const result = await createPromise
      expect(result).toBe(false)
    })

    it("should handle network errors", async () => {
      const newChannel: Channel = {
        name: "test",
        groupName: "Group1",
        members: [],
        bannedUsers: [],
      }

      const createPromise = service.createChannel(newChannel)

      const req = httpMock.expectOne("https://localhost:3000/api/channels")
      req.error(new ProgressEvent("error"))

      const result = await createPromise
      expect(result).toBe(false)
    })
  })

  describe("JoinChannel", () => {
    it("should join a channel successfully", async () => {
      const joinPromise = service.JoinChannel("general", "Group1", "user1")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general/join")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual({ groupName: "Group1", username: "user1" })

      req.flush({ success: true, message: "Joined channel" })

      const reloadReq = httpMock.expectOne("https://localhost:3000/api/channels")
      reloadReq.flush([])

      const result = await joinPromise
      expect(result).toBe(true)
    })

    it("should fail to join channel", async () => {
      const joinPromise = service.JoinChannel("general", "Group1", "user1")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general/join")
      req.flush({ success: false, message: "Already member" })

      const result = await joinPromise
      expect(result).toBe(false)
    })
  })

  describe("leaveChannel", () => {
    it("should leave a channel successfully", async () => {
      const leavePromise = service.leaveChannel("general", "Group1", "user1")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general/leave")
      expect(req.request.method).toBe("POST")
      req.flush({ success: true, message: "Left channel" })

      const reloadReq = httpMock.expectOne("https://localhost:3000/api/channels")
      reloadReq.flush([])

      const result = await leavePromise
      expect(result).toBe(true)
    })
  })

  describe("deleteChannel", () => {
    it("should delete a channel successfully", async () => {
      const deletePromise = service.deleteChannel("general", "Group1")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general?groupName=Group1")
      expect(req.request.method).toBe("DELETE")
      req.flush({ success: true, message: "Channel deleted" })

      const result = await deletePromise
      expect(result).toBe(true)
    })
  })

  describe("banUser", () => {
    it("should ban a user from channel", async () => {
      const banPromise = service.banUser("general", "Group1", "baduser")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general/ban")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual({ groupName: "Group1", username: "baduser" })

      req.flush({ success: true, message: "User banned" })

      const reloadReq = httpMock.expectOne("https://localhost:3000/api/channels")
      reloadReq.flush([])

      const result = await banPromise
      expect(result).toBe(true)
    })
  })

  describe("reportUser", () => {
    it("should report a user successfully", async () => {
      const mockUser: User = {
        id: 1,
        username: "reporter",
        email: "reporter@example.com",
        password: "pass",
        roles: ["USER"],
        groups: [],
      }

      authServiceSpy.getCurrentUser.and.returnValue(mockUser)

      const reportPromise = service.reportUser("Group1", "general", "baduser", "Spam")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general/report")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual({
        groupName: "Group1",
        username: "baduser",
        reason: "Spam",
        reportedBy: "reporter",
      })

      req.flush({ success: true, message: "User reported" })

      const result = await reportPromise
      expect(result).toBe(true)
    })
  })

  describe("removeMember", () => {
    it("should remove a member from channel", async () => {
      const removePromise = service.removeMember("general", "Group1", "user1")

      const req = httpMock.expectOne("https://localhost:3000/api/channels/general/members/user1?groupName=Group1")
      expect(req.request.method).toBe("DELETE")
      req.flush({ success: true, message: "Member removed" })

      const reloadReq = httpMock.expectOne("https://localhost:3000/api/channels")
      reloadReq.flush([])

      const result = await removePromise
      expect(result).toBe(true)
    })
  })

  describe("getChannelsByGroup", () => {
    it("should get channels for a specific group", () => {
      const mockChannels: Channel[] = [{ name: "general", groupName: "Group1", members: [], bannedUsers: [] }]

      service.getChannelsByGroup("Group1").subscribe((channels) => {
        expect(channels).toEqual(mockChannels)
        expect(channels.length).toBe(1)
      })

      const req = httpMock.expectOne("https://localhost:3000/api/channels/group/Group1")
      expect(req.request.method).toBe("GET")
      req.flush(mockChannels)
    })
  })

  describe("getUserReports", () => {
    it("should get all user reports", () => {
      const mockReports = [{ groupName: "Group1", channelName: "general", reportedUser: "baduser", reason: "Spam" }]

      service.getUserReports().subscribe((reports) => {
        expect(reports).toEqual(mockReports)
        expect(reports.length).toBe(1)
      })

      const req = httpMock.expectOne("https://localhost:3000/api/channels/reports")
      expect(req.request.method).toBe("GET")
      req.flush(mockReports)
    })
  })
})
