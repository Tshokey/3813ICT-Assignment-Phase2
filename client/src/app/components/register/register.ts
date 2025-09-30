import { Component, inject } from "@angular/core"
import { RouterModule, Router, RouterLink } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { AuthService } from "../../services/auth-service"
import { firstValueFrom } from "rxjs"

@Component({
  selector: "app-register",
  imports: [RouterModule, FormsModule, RouterLink],
  templateUrl: "./register.html",
  styleUrls: ["./register.css"],
})
export class Register {
  username = ""
  email = ""
  password = ""
  errormsg = ""

  private router = inject(Router)
  private authService = inject(AuthService)

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
