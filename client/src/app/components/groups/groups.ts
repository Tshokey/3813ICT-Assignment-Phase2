import { Component, effect } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { AuthService } from "../../services/auth-service"
import { GroupService } from "../../services/group-service"
import { User } from "../../models/user"
import { Group } from "../../models/group"

@Component({
  selector: "app-groups",
  imports: [FormsModule, CommonModule],
  templateUrl: "./groups.html",
  styleUrls: ["./groups.css"],
})
export class Groups {
  user: User | null = null
  newGroupName = ""
  errormsg = ""

  /** reactive groups array */
  groups: Group[] = []

  constructor(
    public auth: AuthService,
    private groupService: GroupService,
  ) {
    this.user = this.auth.getCurrentuser()

    // update local groups whenever the service signal changes
    effect(() => {
      this.groups = this.groupService.groups()
    })
  }

  createGroup(): void {
    if (!this.user) {
      this.errormsg = "You must be logged in to create a group"
      return
    }

    if (!this.auth.hasRole("GROUP_ADMIN") && !this.auth.hasRole("SUPER_ADMIN")) {
      this.errormsg = "Only admins can create groups"
      return
    }

    if (!this.newGroupName.trim()) {
      this.errormsg = "Group name cannot be empty"
      return
    }

    const exists = this.groups.some((g) => g.name.toLowerCase() === this.newGroupName.trim().toLowerCase())
    if (exists) {
      this.errormsg = "A group with this name already exists"
      return
    }

    const group = new Group(this.newGroupName.trim(), this.user.username, [this.user.username], [], [], [])

    this.groupService.createGroup(group)
    this.newGroupName = ""
    this.errormsg = ""
  }

  async registerInterest(group: Group) {
    if (this.user && !group.interested.includes(this.user.username) && !group.members.includes(this.user.username)) {
      const success = await this.groupService.sendJoinRequest(group.name, this.user.username)
      if (!success) {
        this.errormsg = "Failed to send join request"
      }
    }
  }

  async approveUser(group: Group, username: string) {
    const success = await this.groupService.approveUser(group.name, username)
    if (!success) {
      this.errormsg = "Failed to approve user"
    }
  }

  joinGroup(group: Group): void {
    if (this.user) {
      this.groupService.sendJoinRequest(group.name, this.user.username)
    }
  }

  async rejectUser(group: Group, username: string): Promise<void> {
    const success = await this.groupService.rejectUser(group.name, username)
    if (!success) {
      this.errormsg = "Failed to reject user"
    }
  }

  async deleteGroup(group: Group): Promise<void> {
    if (!this.user) return

    if (
      this.auth.hasRole("SUPER_ADMIN") ||
      (this.auth.hasRole("GROUP_ADMIN") && group.createdBy === this.user.username)
    ) {
      const success = await this.groupService.deleteGroup(group.name)
      if (!success) {
        this.errormsg = "Failed to delete group"
      }
    } else {
      this.errormsg = "You cannot delete this group"
    }
  }

  async leaveGroup(group: Group): Promise<void> {
    if (this.user) {
      const success = await this.groupService.leaveGroup(group.name, this.user.username)
      if (!success) {
        this.errormsg = "Failed to leave group"
      }
    }
  }

  async removeMember(group: Group, username: string): Promise<void> {
    if (!this.user) return

    if (
      this.auth.hasRole("SUPER_ADMIN") ||
      (this.auth.hasRole("GROUP_ADMIN") && group.createdBy === this.user.username)
    ) {
      const success = await this.groupService.removeMember(group.name, username)
      if (!success) {
        this.errormsg = "Failed to remove member"
      }
    } else {
      this.errormsg = "You don't have permission to remove members from this group."
    }
  }
}
