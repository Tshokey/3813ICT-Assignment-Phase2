// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
// import './commands';
// Cypress E2E support file
// Custom commands and global configuration

declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

// ✅ No need to import { cy } from 'cypress'

// Custom command for login
Cypress.Commands.add("login", (username: string, password: string) => {
  cy.visit("/login");
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/dashboard");
});

// Custom command for logout
Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should("include", "/login");
});