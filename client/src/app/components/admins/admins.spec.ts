import { ComponentFixture, TestBed } from "@angular/core/testing"
import { of, throwError } from "rxjs"
import { Admins } from "./admins"
import { AuthService } from "../../services/auth-service"
import { GroupService } from "../../services/group-service"
import { User } from "../../models/user"

describe("Admins", () => {
  let component: Admins
  let fixture: ComponentFixture<Admins>
  let authService: jasmine.SpyObj<AuthService>
  let groupService: jasmine.SpyObj<GroupService>

  const mockUsers: User[] = [
    {
      username: "super",
      email: "super@test.com",
      roles: ["SUPER_ADMIN"],
      groups: [],
      profileImage: "",
      id: 1, // Fixed to number type
      password: "password",
    },
    {
      username: "admin1",
      email: "admin1@test.com",
      roles: ["GROUP_ADMIN"],
      groups: [],
      profileImage: "",
      id: 2, // Fixed to number type
      password: "password",
    },
    {
      username: "user1",
      email: "user1@test.com",
      roles: ["USER"],
      groups: [],
      profileImage: "",
      id: 3, // Fixed to number type
      password: "password",
    },
  ]

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj("AuthService", ["getUsers", "deleteUser", "updateUser", "hasRole"])
    const groupSpy = jasmine.createSpyObj("GroupService", ["getGroups"])

    authSpy.getUsers.and.returnValue(of(mockUsers))
    authSpy.hasRole.and.returnValue(true)
    authSpy.deleteUser.and.returnValue(of({}))
    authSpy.updateUser.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [Admins],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: GroupService, useValue: groupSpy },
      ],
    }).compileComponents()

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    groupService = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>

    fixture = TestBed.createComponent(Admins)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should load users on initialization", () => {
    expect(authService.getUsers).toHaveBeenCalled()
    expect(component.users.length).toBe(3)
  })

  it("should handle error when loading users fails", () => {
    authService.getUsers.and.returnValue(throwError(() => new Error("Network error")))
    spyOn(console, "error")

    component.loadUsers()

    expect(console.error).toHaveBeenCalled()
  })

  it("should filter users by role", () => {
    component.setRoleFilter("SUPER_ADMIN")
    expect(component.filteredUsers.length).toBe(1)
    expect(component.filteredUsers[0].username).toBe("super")
  })

  it('should show all users when filter is "all"', () => {
    component.setRoleFilter("all")
    expect(component.filteredUsers.length).toBe(3)
  })

  it("should filter GROUP_ADMIN users correctly", () => {
    component.setRoleFilter("GROUP_ADMIN")
    expect(component.filteredUsers.length).toBe(1)
    expect(component.filteredUsers[0].username).toBe("admin1")
  })

  it("should toggle user selection", () => {
    component.toggleUserSelection("user1")
    expect(component.isUserSelected("user1")).toBe(true)

    component.toggleUserSelection("user1")
    expect(component.isUserSelected("user1")).toBe(false)
  })

  it("should select all users except super", () => {
    component.selectAll = true
    component.toggleSelectAll()

    expect(component.selectedUsers.has("admin1")).toBe(true)
    expect(component.selectedUsers.has("user1")).toBe(true)
    expect(component.selectedUsers.has("super")).toBe(false)
  })

  it("should clear all selections when toggling select all off", () => {
    component.selectedUsers.add("user1")
    component.selectAll = false
    component.toggleSelectAll()

    expect(component.selectedUsers.size).toBe(0)
  })

  it("should count super admins correctly", () => {
    expect(component.superAdminCount).toBe(1)
  })

  it("should count group admins correctly", () => {
    expect(component.groupAdminCount).toBe(1)
  })

  it("should count regular users correctly", () => {
    expect(component.userCount).toBe(1)
  })

  it("should promote users to group admin in batch", () => {
    component.selectedUsers.add("user1")
    component.batchPromoteToGroupAdmin()

    expect(authService.updateUser).toHaveBeenCalled()
  })

  it("should promote users to super admin in batch", () => {
    component.selectedUsers.add("user1")
    component.batchPromoteToSuperAdmin()

    expect(authService.updateUser).toHaveBeenCalled()
  })

  it("should delete users in batch after confirmation", () => {
    spyOn(window, "confirm").and.returnValue(true)
    component.selectedUsers.add("user1")

    component.batchDeleteUsers()

    expect(component.users.length).toBe(2)
  })

  it("should not delete users if confirmation is cancelled", () => {
    spyOn(window, "confirm").and.returnValue(false)
    component.selectedUsers.add("user1")

    component.batchDeleteUsers()

    expect(component.users.length).toBe(3)
  })

  it("should allow super admin to promote to group admin", () => {
    const user = mockUsers[2]
    expect(component.canPromoteGroup(user)).toBe(true)
  })

  it("should not allow promoting user who is already group admin", () => {
    const user = mockUsers[1]
    expect(component.canPromoteGroup(user)).toBe(false)
  })

  it("should allow removing users except super", () => {
    expect(component.canRemove(mockUsers[1])).toBe(true)
    expect(component.canRemove(mockUsers[0])).toBe(false)
  })

  it("should remove individual user", () => {
    component.removeUser(mockUsers[2])

    expect(authService.deleteUser).toHaveBeenCalledWith("user1")
  })

  it("should return correct badge class for roles", () => {
    expect(component.getRoleBadgeClass("SUPER_ADMIN")).toBe("badge-super")
    expect(component.getRoleBadgeClass("GROUP_ADMIN")).toBe("badge-group")
    expect(component.getRoleBadgeClass("USER")).toBe("badge-user")
  })
})
