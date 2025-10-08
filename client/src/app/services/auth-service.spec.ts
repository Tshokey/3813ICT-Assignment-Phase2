import { TestBed } from "@angular/core/testing"
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { Router } from "@angular/router"
import { AuthService } from "./auth-service"
import type { User } from "../models/user"

describe("AuthService", () => {
  let service: AuthService
  let httpMock: HttpTestingController
  let routerSpy: jasmine.SpyObj<Router>

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj("Router", ["navigateByUrl"])

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpyObj }],
    })

    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>

    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  it("should be created", () => {
    expect(service).toBeTruthy()
  })

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser: User = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        roles: ["USER"],
        groups: [],
      }

      const loginPromise = service.login("testuser", "password123")

      const req = httpMock.expectOne("https://localhost:3000/api/auth/login")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual({ username: "testuser", password: "password123" })

      req.flush({ success: true, user: mockUser })

      const result = await loginPromise
      expect(result).toBe(true)
      expect(service.getCurrentUser()).toEqual(mockUser)
      expect(service.isLoggedIn()).toBe(true)
    })

    it("should fail login with invalid credentials", async () => {
      const loginPromise = service.login("testuser", "wrongpassword")

      const req = httpMock.expectOne("https://localhost:3000/api/auth/login")
      req.flush({ success: false, message: "Invalid credentials" })

      const result = await loginPromise
      expect(result).toBe(false)
      expect(service.getCurrentUser()).toBeNull()
    })

    it("should handle login errors", async () => {
      const loginPromise = service.login("testuser", "password123")

      const req = httpMock.expectOne("https://localhost:3000/api/auth/login")
      req.error(new ProgressEvent("error"))

      const result = await loginPromise
      expect(result).toBe(false)
    })
  })

  describe("setCurrentUser", () => {
    it("should set user and save to localStorage", () => {
      const mockUser: User = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        roles: ["USER"],
        groups: [],
      }

      service.setCurrentUser(mockUser)

      expect(service.getCurrentUser()).toEqual(mockUser)
      expect(service.isLoggedIn()).toBe(true)
      expect(localStorage.getItem("currentUser")).toBeTruthy()
    })

    it("should clear user and localStorage when set to null", () => {
      const mockUser: User = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        roles: ["USER"],
        groups: [],
      }

      service.setCurrentUser(mockUser)
      service.setCurrentUser(null)

      expect(service.getCurrentUser()).toBeNull()
      expect(service.isLoggedIn()).toBe(false)
      expect(localStorage.getItem("currentUser")).toBeNull()
    })
  })

  describe("hasRole", () => {
    it("should return true if user has the role", () => {
      const mockUser: User = {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        password: "password123",
        roles: ["USER", "SUPER_ADMIN"],
        groups: [],
      }

      service.setCurrentUser(mockUser)

      expect(service.hasRole("USER")).toBe(true)
      expect(service.hasRole("SUPER_ADMIN")).toBe(true)
      expect(service.hasRole("GROUP_ADMIN")).toBe(false)
    })

    it("should return false if no user is logged in", () => {
      expect(service.hasRole("USER")).toBe(false)
    })
  })

  describe("logout", () => {
    it("should clear user data and navigate to login", () => {
      const mockUser: User = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        roles: ["USER"],
        groups: [],
      }

      service.setCurrentUser(mockUser)
      service.logout()

      expect(service.getCurrentUser()).toBeNull()
      expect(service.isLoggedIn()).toBe(false)
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith("/login")
    })
  })

  describe("getUsers", () => {
    it("should fetch all users", () => {
      const mockUsers: User[] = [
        { id: 1, username: "user1", email: "user1@example.com", password: "pass", roles: ["USER"], groups: [] },
        { id: 2, username: "user2", email: "user2@example.com", password: "pass", roles: ["USER"], groups: [] },
      ]

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers)
        expect(users.length).toBe(2)
      })

      const req = httpMock.expectOne("https://localhost:3000/api/auth/users")
      expect(req.request.method).toBe("GET")
      req.flush(mockUsers)
    })
  })

  describe("createUser", () => {
    it("should create a new user", () => {
      const newUser: Partial<User> = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        roles: ["USER"],
      }

      service.createUser(newUser).subscribe((response) => {
        expect(response.success).toBe(true)
        expect(response.user?.username).toBe("newuser")
      })

      const req = httpMock.expectOne("https://localhost:3000/api/auth/users")
      expect(req.request.method).toBe("POST")
      req.flush({ success: true, user: newUser as User })
    })
  })

  describe("updateUser", () => {
    it("should update an existing user", () => {
      const updates: Partial<User> = {
        email: "updated@example.com",
      }

      service.updateUser("testuser", updates).subscribe((response) => {
        expect(response.success).toBe(true)
      })

      const req = httpMock.expectOne("https://localhost:3000/api/auth/users/testuser")
      expect(req.request.method).toBe("PUT")
      req.flush({ success: true, user: { username: "testuser", ...updates } })
    })
  })

  describe("deleteUser", () => {
    it("should delete a user", () => {
      service.deleteUser("testuser").subscribe((response) => {
        expect(response.success).toBe(true)
      })

      const req = httpMock.expectOne("https://localhost:3000/api/auth/users/testuser")
      expect(req.request.method).toBe("DELETE")
      req.flush({ success: true, message: "User deleted" })
    })
  })
})
