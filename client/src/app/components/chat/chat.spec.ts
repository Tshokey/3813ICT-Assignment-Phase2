import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"
import { of } from "rxjs"
import { Chat } from "./chat"
import { AuthService } from "../../services/auth-service"
import { ChannelService } from "../../services/channel-service"
import { UploadService } from "../../services/upload-service"
import { ActivatedRoute } from "@angular/router"


describe("Chat", () => {
  let component: Chat
  let fixture: ComponentFixture<Chat>
  let authService: jasmine.SpyObj<AuthService>
  let channelService: jasmine.SpyObj<ChannelService>
  let uploadService: jasmine.SpyObj<UploadService>

  const mockChannel = {
    id: "channel1",
    name: "Test Channel",
    groupId: "group1",
    members: ["user1", "user2"],
    admins: ["user1"],
    bannedUsers: [],
  }

  const mockMessages = [
    {
      id: "1",
      channelId: "channel1",
      username: "user1",
      message: "Hello",
      timestamp: new Date(),
      profileImage: "",
    },
  ]

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj("AuthService", ["getCurrentUser", "getUsers"])
    const channelSpy = jasmine.createSpyObj("ChannelService", ["getChannel", "getChannelMembers"])
    const uploadSpy = jasmine.createSpyObj("UploadService", ["uploadChatImage", "getImageUrl"])

    authSpy.getCurrentUser.and.returnValue({
      username: "user1",
      email: "user1@test.com",
      roles: ["USER"],
      groups: [],
      profileImage: "",
      id: 1,
      password: "password",
    })
    authSpy.getUsers.and.returnValue(of([]))
    channelSpy.getChannel.and.returnValue(of(mockChannel))
    channelSpy.getChannelMembers.and.returnValue(of(["user1", "user2"]))
    uploadSpy.getImageUrl.and.returnValue("http://localhost:3000/image.jpg")

    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: ChannelService, useValue: channelSpy },
        { provide: UploadService, useValue: uploadSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ channelId: "channel1" }),
          },
        },
      ],
    }).compileComponents()

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    channelService = TestBed.inject(ChannelService) as jasmine.SpyObj<ChannelService>
    uploadService = TestBed.inject(UploadService) as jasmine.SpyObj<UploadService>

    fixture = TestBed.createComponent(Chat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should send text message", () => {
    component.newMessage = "Test message"
    component.isConnected = true
    component.sendMessage()

    expect(component.newMessage).toBe("")
  })

  it("should not send empty message", () => {
    component.newMessage = "   "
    const initialLength = component.messages.length
    component.sendMessage()

    expect(component.messages.length).toBe(initialLength)
  })

  it("should upload image when file is selected", () => {
    const mockFile = new File([""], "test.jpg", { type: "image/jpeg" })
    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as any

    uploadService.uploadChatImage.and.returnValue(of({ data: { imageUrl: "test.jpg" } }))

    component.onImageSelected(mockEvent)

    expect(component.selectedImage).toBe(mockFile)
  })

  it("should open video chat in popup window", () => {
    spyOn(window, "open")
    component.isConnected = true

    component.startVideoChat()

    expect(window.open).toHaveBeenCalled()
  })
})
