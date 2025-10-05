import { Component, inject } from "@angular/core"
import { RouterModule, Router, RouterLink } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { AuthService } from "../../services/auth-service"
import { UploadService } from "../../services/upload-service"
import { firstValueFrom } from "rxjs"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-register",
  imports: [RouterModule, FormsModule, RouterLink, CommonModule],
  templateUrl: "./register.html",
  styleUrls: ["./register.css"],
})
export class Register {
  username = ""
  email = ""
  password = ""
  errormsg = ""
  selectedFile: File | null = null
  uploadMessage = ""

  private router = inject(Router)
  private authService = inject(AuthService)
  private uploadService = inject(UploadService)

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const file = input.files[0]

      if (!file.type.startsWith("image/")) {
        this.uploadMessage = "Please select an image file"
        this.selectedFile = null
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        this.uploadMessage = "Image size must be less than 5MB"
        this.selectedFile = null
        return
      }

      this.selectedFile = file
      this.uploadMessage = ""
    }
  }

  async register() {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.errormsg = "All fields are required"
      return
    }

    try {
      const response = await firstValueFrom(
        this.authService.createUser({
          username: this.username.trim(),
          email: this.email.trim(),
          password: this.password.trim(),
          roles: ["USER"],
          groups: [],
        }),
      )

      if (response.success) {
        if (this.selectedFile) {
          try {
            const uploadResponse = await firstValueFrom(
              this.uploadService.uploadProfileImage(this.selectedFile, this.username.trim()),
            )
            if (uploadResponse.result !== "OK") {
              console.warn("Profile image upload failed, but registration succeeded")
            }
          } catch (uploadError) {
            console.error("Profile image upload error:", uploadError)
          }
        }

        this.router.navigate(["/login"])
      } else {
        this.errormsg = response.message || "Registration failed"
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      this.errormsg = error.error?.message || "Registration failed. Please try again."
    }
  }
}
