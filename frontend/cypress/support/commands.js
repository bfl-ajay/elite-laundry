// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Basic login command
Cypress.Commands.add('login', (username = 'testemployee', password = 'Test123') => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type(username);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Command to add test data
Cypress.Commands.add('seedTestData', () => {
  // This would typically make API calls to seed test data
  cy.log('Seeding test data');
});

// Command to clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically clean up any test data created during tests
  cy.log('Cleaning up test data');
});

// Command to wait for API calls to complete
Cypress.Commands.add('waitForApiCalls', () => {
  cy.wait('@getMetrics');
  cy.wait('@getOrders');
});

// Command to mock API responses
Cypress.Commands.add('mockApiResponses', (responses = {}) => {
  if (responses.metrics) {
    cy.intercept('GET', '/api/orders/metrics', responses.metrics).as('getMetrics');
  }
  if (responses.orders) {
    cy.intercept('GET', '/api/orders*', responses.orders).as('getOrders');
  }
});

// Command to take screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});