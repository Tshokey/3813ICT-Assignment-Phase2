import { TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"
import { GroupService } from "./group-service"

describe("GroupService", () => {
  let service: GroupService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(GroupService)
  })

  it("should be created", () => {
    expect(service).toBeTruthy()
  })
})
