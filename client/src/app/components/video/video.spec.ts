import { type ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"
import { Video } from "./video"

describe("Video", () => {
  let component: Video
  let fixture: ComponentFixture<Video>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Video],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents()

    fixture = TestBed.createComponent(Video)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
