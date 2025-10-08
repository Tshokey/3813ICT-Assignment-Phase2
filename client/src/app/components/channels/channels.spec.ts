import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"
import { Channels } from "./channels"

describe("Channels", () => {
  let component: Channels
  let fixture: ComponentFixture<Channels>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Channels],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents()

    fixture = TestBed.createComponent(Channels)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
