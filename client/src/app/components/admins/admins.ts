import { Component } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { User, Role } from "../../models/user"
import { AuthService } from "../../services/auth-service"

@Component({
  selector: "app-admins",
  imports: [FormsModule, CommonModule],
  templateUrl: "./admins.html",
  styleUrls: ["./admins.css"],
})
export class Admins {
  users: User[] = []
  selectedRole: "all" | Role = "all"
  selectedUsers: Set<string> = new Set()
  selectAll = false

  constructor(
    private auth: AuthService,
  ) {
    this.loadUsers()
  }

  loadUsers() {
    console.log("[v0] Admins: Loading users from API...")
    this.auth.getUsers().subscribe({
      next: (users) => {
        console.log("[v0] Admins: Received users from API:", users)
        console.log("[v0] Admins: Number of users:", users.length)
        console.log(
          "[v0] Admins: User usernames:",
          users.map((u) => u.username),
        )
        this.users = users
      },
      error: (err) => {
        console.error("[v0] Admins: Error loading users:", err)
      },
    })
  }

  get filteredUsers(): User[] {
    if (this.selectedRole === "all") {
      return this.users
    }
    return this.users.filter((u) => u.roles.includes(this.selectedRole as Role))
  }

  get selectedCount(): number {
    return this.selectedUsers.size
  }

  get superAdminCount(): number {
    return this.users.filter((u) => u.roles.includes("SUPER_ADMIN")).length
  }

  get groupAdminCount(): number {
    return this.users.filter((u) => u.roles.includes("GROUP_ADMIN")).length
  }

  get userCount(): number {
    return this.users.filter((u) => u.roles.includes("USER")).length
  }

  toggleUserSelection(username: string) {
    if (this.selectedUsers.has(username)) {
      this.selectedUsers.delete(username)
    } else {
      this.selectedUsers.add(username)
    }
    this.updateSelectAllState()
  }

  isUserSelected(username: string): boolean {
    return this.selectedUsers.has(username)
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.filteredUsers.forEach((u) => {
        if (u.username !== "super") {
          this.selectedUsers.add(u.username)
        }
      })
    } else {
      this.selectedUsers.clear()
    }
  }

  updateSelectAllState() {
    const selectableUsers = this.filteredUsers.filter((u) => u.username !== "super")
    this.selectAll = selectableUsers.length > 0 && selectableUsers.every((u) => this.selectedUsers.has(u.username))
  }

  setRoleFilter(role: "all" | Role) {
    this.selectedRole = role
    this.selectedUsers.clear()
    this.selectAll = false
  }

  batchPromoteToGroupAdmin() {
    if (this.selectedUsers.size === 0) return

    this.users.forEach((u) => {
      if (this.selectedUsers.has(u.username) && !u.roles.includes("GROUP_ADMIN")) {
        u.roles.push("GROUP_ADMIN")
      }
    })

    this.saveUsers()
    this.selectedUsers.clear()
    this.selectAll = false
  }

  batchPromoteToSuperAdmin() {
    if (this.selectedUsers.size === 0) return

    this.users.forEach((u) => {
      if (this.selectedUsers.has(u.username) && !u.roles.includes("SUPER_ADMIN")) {
        u.roles.push("SUPER_ADMIN")
      }
    })

    this.saveUsers()
    this.selectedUsers.clear()
    this.selectAll = false
  }

  batchDeleteUsers() {
    if (this.selectedUsers.size === 0) return

    if (confirm(`Are you sure you want to delete ${this.selectedUsers.size} user(s)?`)) {
      this.users = this.users.filter((u) => !this.selectedUsers.has(u.username))
      this.saveUsers()
      this.selectedUsers.clear()
      this.selectAll = false
    }
  }

  canPromoteGroup(u: User) {
    return this.auth.hasRole("SUPER_ADMIN") && !u.roles.includes("GROUP_ADMIN")
  }

  canPromoteSuper(u: User) {
    return this.auth.hasRole("SUPER_ADMIN") && !u.roles.includes("SUPER_ADMIN")
  }

  canRemove(u: User) {
    return this.auth.hasRole("SUPER_ADMIN") && u.username !== "super"
  }

  removeUser(u: User) {
    this.auth.deleteUser(u.username).subscribe({
      next: () => {
        this.loadUsers()
      },
      error: (err) => {
        console.error("Error deleting user:", err)
      },
    })
  }

  saveUsers() {
    // For batch operations, we need to update each user individually
    const updatePromises = this.users.map((user) => this.auth.updateUser(user.username, user).toPromise())

    Promise.all(updatePromises)
      .then(() => {
        this.loadUsers()
      })
      .catch((err) => {
        console.error("Error saving users:", err)
      })
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case "SUPER_ADMIN":
        return "badge-super"
      case "GROUP_ADMIN":
        return "badge-group"
      case "USER":
        return "badge-user"
      default:
        return "badge-default"
    }
  }
}
