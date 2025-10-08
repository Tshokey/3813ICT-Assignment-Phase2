import { ComponentFixture, TestBed } from "@angular/core/testing"
import { Router, ActivatedRoute } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { of } from "rxjs"
import { Login } from "./login"
import { AuthService } from "../../services/auth-service"

describe("Login", () => {
  let component: Login
  let fixture: ComponentFixture<Login>
  let authServiceSpy: jasmine.SpyObj<AuthService>
  let routerSpy: jasmine.SpyObj<Router>
  let activatedRouteSpy: any

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj("AuthService", ["login"])
    const routerSpyObj = jasmine.createSpyObj("Router", ["navigate"])
    const activatedRouteStub = {
      queryParams: of({ error: "" }),
    }

    await TestBed.configureTestingModule({
      imports: [Login, FormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(Login)
    component = fixture.componentInstance
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>
    activatedRouteSpy = TestBed.inject(ActivatedRoute)

    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should initialize with empty credentials", () => {
    expect(component.username).toBe("")
    expect(component.password).toBe("")
    expect(component.errormsg).toBe("")
  })

  it("should display error message from query params", () => {
    activatedRouteSpy.queryParams = of({ error: "Session expired" })
    component.ngOnInit()
    expect(component.errormsg).toBe("Session expired")
  })

  it("should login successfully with valid credentials", async () => {
    component.username = "testuser"
    component.password = "password123"
    authServiceSpy.login.and.returnValue(Promise.resolve(true))

    await component.login()

    expect(authServiceSpy.login).toHaveBeenCalledWith("testuser", "password123")
    expect(routerSpy.navigate).toHaveBeenCalledWith(["/dashboard"])
    expect(component.errormsg).toBe("")
  })

  it("should show error message on failed login", async () => {
    component.username = "testuser"
    component.password = "wrongpassword"
    authServiceSpy.login.and.returnValue(Promise.resolve(false))

    await component.login()

    expect(authServiceSpy.login).toHaveBeenCalledWith("testuser", "wrongpassword")
    expect(routerSpy.navigate).not.toHaveBeenCalled()
    expect(component.errormsg).toBe("Invalid username or password")
  })

  it("should trim whitespace from credentials", async () => {
    component.username = "  testuser  "
    component.password = "  password123  "
    authServiceSpy.login.and.returnValue(Promise.resolve(true))

    await component.login()

    expect(authServiceSpy.login).toHaveBeenCalledWith("testuser", "password123")
  })

  it("should handle empty credentials", async () => {
    component.username = ""
    component.password = ""
    authServiceSpy.login.and.returnValue(Promise.resolve(false))

    await component.login()

    expect(authServiceSpy.login).toHaveBeenCalledWith("", "")
    expect(component.errormsg).toBe("Invalid username or password")
  })
})
