import { describe, beforeEach, it } from "mocha"

describe("Chat Functionality", () => {
  beforeEach(() => {
    cy.login("super", "123")
    cy.visit("/channels")
  })

  it("should display available channels", () => {
    cy.get('[data-testid="channel-list"]').should("be.visible")
    cy.get('[data-testid="channel-item"]').should("have.length.greaterThan", 0)
  })

  it("should join a channel and send message", () => {
    cy.get('[data-testid="channel-item"]').first().click()
    cy.url().should("include", "/chat")

    cy.get('textarea[name="message"]').type("Test message from E2E")
    cy.get('button[type="submit"]').click()

    cy.contains("Test message from E2E").should("be.visible")
  })

  it("should upload image in chat", () => {
    cy.get('[data-testid="channel-item"]').first().click()

    cy.get('input[type="file"]').selectFile("cypress/fixtures/test-image.jpg", { force: true })
    cy.get('[data-testid="chat-image"]', { timeout: 10000 }).should("be.visible")
  })

  it("should start video call", () => {
    cy.get('[data-testid="channel-item"]').first().click()

    cy.get('[data-testid="video-call-button"]').click()
    cy.window().its("open").should("be.called")
  })
})
