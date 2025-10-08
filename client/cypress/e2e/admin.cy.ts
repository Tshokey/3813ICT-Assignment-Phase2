import { describe, beforeEach, it } from "mocha"

describe("Admin Panel", () => {
  beforeEach(() => {
    cy.login("super", "123")
    cy.visit("/admins")
  })

  it("should display all users", () => {
    cy.get('[data-testid="user-list"]').should("be.visible")
    cy.get('[data-testid="user-item"]').should("have.length.greaterThan", 0)
  })

  it("should filter users by role", () => {
    cy.get('[data-testid="role-filter-super"]').click()
    cy.get('[data-testid="user-item"]').each(($el) => {
      cy.wrap($el).should("contain", "Super Admin")
    })
  })

  it("should promote user to group admin", () => {
    cy.get('[data-testid="user-checkbox"]').first().check()
    cy.get('[data-testid="promote-group-admin"]').click()
    cy.contains("promoted", { timeout: 5000 }).should("be.visible")
  })

  it("should delete user", () => {
    const initialCount = Cypress.$('[data-testid="user-item"]').length

    cy.get('[data-testid="user-checkbox"]').eq(1).check()
    cy.get('[data-testid="delete-users"]').click()
    cy.get('[data-testid="confirm-delete"]').click()

    cy.get('[data-testid="user-item"]').should("have.length", initialCount - 1)
  })
})
