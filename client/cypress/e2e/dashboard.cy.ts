import { describe, beforeEach, it } from "mocha"

describe("Dashboard", () => {
  beforeEach(() => {
    cy.login("super", "123")
  })

  it("should display user profile information", () => {
    cy.get('[data-testid="user-profile"]').should("be.visible")
    cy.contains("super").should("be.visible")
  })

  it("should navigate to groups page", () => {
    cy.contains("Groups").click()
    cy.url().should("include", "/groups")
  })

  it("should navigate to channels page", () => {
    cy.contains("Channels").click()
    cy.url().should("include", "/channels")
  })

  it("should allow profile image upload", () => {
    cy.get('[data-testid="profile-upload"]').should("exist")
    cy.get('input[type="file"]').selectFile("cypress/fixtures/test-image.jpg", { force: true })
    cy.contains("Upload successful", { timeout: 10000 }).should("be.visible")
  })

  it("should logout successfully", () => {
    cy.logout()
  })
})
