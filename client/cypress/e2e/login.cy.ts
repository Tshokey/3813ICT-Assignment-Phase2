import { describe, beforeEach, it } from "mocha"

describe("Login Flow", () => {
  beforeEach(() => {
    cy.visit("/login")
  })

  it("should display login form", () => {
    cy.get('input[name="username"]').should("be.visible")
    cy.get('input[name="password"]').should("be.visible")
    cy.get('button[type="submit"]').should("be.visible")
  })

  it("should login with valid credentials", () => {
    cy.get('input[name="username"]').type("super")
    cy.get('input[name="password"]').type("123")
    cy.get('button[type="submit"]').click()

    cy.url().should("include", "/dashboard") 
    cy.contains("Welcome").should("be.visible")
  })

  it("should show error with invalid credentials", () => {
    cy.get('input[name="username"]').type("invalid")
    cy.get('input[name="password"]').type("wrong")
    cy.get('button[type="submit"]').click()

    cy.contains("Invalid").should("be.visible")
    cy.url().should("include", "/login")
  })

  it("should validate required fields", () => {
    cy.get('button[type="submit"]').click()
    cy.get('input[name="username"]:invalid').should("exist")
    cy.get('input[name="password"]:invalid').should("exist")
  })

  it("should navigate to register page", () => {
    cy.contains("Register").click()
    cy.url().should("include", "/register")
  })
})
