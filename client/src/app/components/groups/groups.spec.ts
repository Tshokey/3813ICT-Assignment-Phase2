import { ComponentFixture, TestBed } from "@angular/core/testing"
import { Groups } from "./groups"
import { GroupService } from "../../services/group-service"
import { AuthService } from "../../services/auth-service"

describe("Groups", () => {
  let component: Groups
  let fixture: ComponentFixture<Groups>
  let groupService: jasmine.SpyObj<GroupService>
  let authService: jasmine.SpyObj<AuthService>

  const mockGroups = [
    {
      name: "Test Group 1",
      createdBy: "user1",
      admins: ["user1"],
      members: ["user1", "user2"],
      channels: [],
      interested: [],
      bannedUsers: {}, // Object, not array
    },
    {
      name: "Test Group 2",
      createdBy: "user2",
      admins: ["user2"],
      members: ["user2"],
      channels: [],
      interested: [],
      bannedUsers: {},
    },
  ]

  beforeEach(async () => {
    const groupSpy = jasmine.createSpyObj("GroupService", [
      "createGroup",
      "deleteGroup",
      "sendJoinRequest",
      "leaveGroup",
      "groups",
    ])
    const authSpy = jasmine.createSpyObj("AuthService", ["getCurrentUser", "hasRole"])

    groupSpy.createGroup.and.returnValue(Promise.resolve(true))
    groupSpy.deleteGroup.and.returnValue(Promise.resolve(true))
    groupSpy.sendJoinRequest.and.returnValue(Promise.resolve(true))
    groupSpy.leaveGroup.and.returnValue(Promise.resolve(true))
    groupSpy.groups.and.returnValue(mockGroups)

    authSpy.getCurrentUser.and.returnValue({
      username: "user1",
      email: "user1@test.com",
      roles: ["USER"],
      groups: ["group1"],
      profileImage: "",
      id: 1,
      password: "password",
    })
    authSpy.hasRole.and.returnValue(false)

    await TestBed.configureTestingModule({
      imports: [Groups],
      providers: [
        { provide: GroupService, useValue: groupSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents()

    groupService = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>

    fixture = TestBed.createComponent(Groups)
    component = fixture.componentInstance
    component.groups = mockGroups
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should create new group", () => {
    authService.hasRole.and.returnValue(true) // User has GROUP_ADMIN role
    component.newGroupName = "New Group"
    component.createGroup()

    expect(groupService.createGroup).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: "New Group",
        createdBy: "user1",
      }),
    )
    expect(component.newGroupName).toBe("")
  })

  it("should not create group with empty name", () => {
    authService.hasRole.and.returnValue(true)
    component.newGroupName = "   "
    component.createGroup()

    expect(groupService.createGroup).not.toHaveBeenCalled()
  })

  it("should delete group", async () => {
    authService.hasRole.and.returnValue(true) // User has permission

    await component.deleteGroup(mockGroups[0])

    expect(groupService.deleteGroup).toHaveBeenCalledWith("Test Group 1")
  })

  it("should not delete group without permission", async () => {
    authService.hasRole.and.returnValue(false)

    await component.deleteGroup(mockGroups[0])

    expect(component.errormsg).toBe("You cannot delete this group")
  })

  it("should join available group", () => {
    component.joinGroup(mockGroups[1])

    expect(groupService.sendJoinRequest).toHaveBeenCalledWith("Test Group 2", "user1")
  })

  it("should leave group", async () => {
    await component.leaveGroup(mockGroups[0])

    expect(groupService.leaveGroup).toHaveBeenCalledWith("Test Group 1", "user1")
  })
})
