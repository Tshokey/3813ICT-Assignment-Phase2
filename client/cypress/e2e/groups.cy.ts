import { describe, beforeEach, it } from "mocha"

describe("Groups Management", () => {
  beforeEach(() => {
    cy.login("super", "123")
    cy.visit("/groups")
  })

  it("should display groups list", () => {
    cy.get('[data-testid="groups-container"]').should("be.visible")
  })

  it("should create new group", () => {
    cy.get('[data-testid="create-group-button"]').click()
    cy.get('input[name="groupName"]').type("Test Group E2E")
    cy.get('button[type="submit"]').click()

    cy.contains("Test Group E2E").should("be.visible")
  })

  it("should send join request to group", () => {
    cy.get('[data-testid="group-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="join-button"]').click()
      })

    cy.contains("Request sent").should("be.visible")
  })

  it("should delete group as admin", () => {
    cy.get('[data-testid="group-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="delete-group"]').click()
      })

    cy.get('[data-testid="confirm-delete"]').click()
    cy.contains("Group deleted").should("be.visible")
  })
}) 
