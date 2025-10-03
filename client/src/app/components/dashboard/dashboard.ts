import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user';
import { UploadService } from '../../services/upload-service';

@Component({
  selector: "app-dashboard",
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: "./dashboard.html",
  styleUrls: ["./dashboard.css"],
})
export class Dashboard {
  selectedFile: File | null = null
  uploadMessage = ""
  isUploading = false

  constructor(
    private auth: AuthService,
    private uploadService: UploadService,
  ) {}

  get user(): User | null {
    return this.auth.getCurrentuser()
  }

  get isLoggedIn(): boolean {
    return this.auth.isloggedIn()
  }

  logout() {
    this.auth.logout()
  }

  get isSuperAdmin() {
    return this.auth.hasRole("SUPER_ADMIN")
  }

  get isGroupAdmin() {
    return this.auth.hasRole("GROUP_ADMIN")
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const file = input.files[0]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        this.uploadMessage = "Please select an image file"
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadMessage = "Image size must be less than 5MB"
        return
      }

      this.selectedFile = file
      this.uploadMessage = ""
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile || !this.user) {
      return
    }

    this.isUploading = true
    this.uploadMessage = "Uploading..."

    this.uploadService.uploadProfileImage(this.selectedFile, this.user.username).subscribe({
      next: (response) => {
        if (response.result === "OK" && response.data.imageUrl) {
          // Update user object with new profile image
          if (this.user) {
            this.user.profileImage = response.data.imageUrl
            // Update in localStorage
            localStorage.setItem("currentUser", JSON.stringify(this.user))
          }
          this.uploadMessage = "Profile image updated successfully!"
          this.selectedFile = null
          // Reset file input
          const fileInput = document.getElementById("profileImageInput") as HTMLInputElement
          if (fileInput) {
            fileInput.value = ""
          }
        } else {
          this.uploadMessage = "Upload failed: " + response.message
        }
        this.isUploading = false
      },
      error: (error) => {
        console.error("Upload error:", error)
        this.uploadMessage = "Upload failed. Please try again."
        this.isUploading = false
      },
    })
  }

  getProfileImageUrl(): string {
    if (this.user?.profileImage) {
      return this.uploadService.getImageUrl(this.user.profileImage)
    }
    return ""
  }

  hasProfileImage(): boolean {
    return !!this.user?.profileImage
  }
}
