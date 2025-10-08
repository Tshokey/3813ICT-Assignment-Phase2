import { ComponentFixture, TestBed } from "@angular/core/testing"
import { Router } from "@angular/router"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"
import { Dashboard } from "./dashboard"
import { AuthService } from "../../services/auth-service"
import { UploadService } from "../../services/upload-service"
import { User } from "../../models/user"

describe("Dashboard", () => {
  let component: Dashboard
  let fixture: ComponentFixture<Dashboard>
  let authServiceSpy: jasmine.SpyObj<AuthService>
  let uploadServiceSpy: jasmine.SpyObj<UploadService>
  let routerSpy: jasmine.SpyObj<Router>

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj("AuthService", ["getCurrentUser", "setCurrentUser", "hasRole", "logout"])
    const uploadSpy = jasmine.createSpyObj("UploadService", ["uploadProfileImage", "getImageUrl"])
    const routerSpyObj = jasmine.createSpyObj("Router", ["navigate"])

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: UploadService, useValue: uploadSpy },
        { provide: Router, useValue: routerSpyObj },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(Dashboard)
    component = fixture.componentInstance
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    uploadServiceSpy = TestBed.inject(UploadService) as jasmine.SpyObj<UploadService>
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should get user from auth service", () => {
    const mockUser: User = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      password: "pass",
      roles: ["USER"],
      groups: [],
    }

    authServiceSpy.getCurrentUser.and.returnValue(mockUser)

    expect(component.user).toEqual(mockUser)
  })

  it("should check if user has super admin role", () => {
    authServiceSpy.hasRole.and.returnValue(true)

    expect(component.isSuperAdmin).toBe(true)
    expect(authServiceSpy.hasRole).toHaveBeenCalledWith("SUPER_ADMIN")
  })

  it("should check if user has group admin role", () => {
    authServiceSpy.hasRole.and.returnValue(true)

    expect(component.isGroupAdmin).toBe(true)
    expect(authServiceSpy.hasRole).toHaveBeenCalledWith("GROUP_ADMIN")
  })

  it("should handle image load event", () => {
    spyOn(console, "log")
    component.onImageLoad()
    expect(console.log).toHaveBeenCalled()
  })

  it("should handle image error event", () => {
    spyOn(console, "error")
    const mockEvent = new Event("error")
    component.onImageError(mockEvent)
    expect(console.error).toHaveBeenCalled()
    expect(component.imageLoadError).toBe(true)
  })

  it("should get profile image URL", () => {
    const mockUser: User = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      password: "pass",
      roles: ["USER"],
      groups: [],
      profileImage: "/images/profile.jpg",
    }

    authServiceSpy.getCurrentUser.and.returnValue(mockUser)
    uploadServiceSpy.getImageUrl.and.returnValue("https://localhost:3000/images/profile.jpg")

    const url = component.getProfileImageUrl()
    expect(url).toBe("https://localhost:3000/images/profile.jpg")
  })

  it("should return placeholder when no profile image", () => {
    const mockUser: User = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      password: "pass",
      roles: ["USER"],
      groups: [],
    }

    authServiceSpy.getCurrentUser.and.returnValue(mockUser)

    const url = component.getProfileImageUrl()
    expect(url).toBe("")
  })
})
