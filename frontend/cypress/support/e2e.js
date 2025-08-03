// ***********************************************************
// This example support/e2e.js is processed and
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

// Import commands.js using ES2015 syntax:
import './commands'
import './dashboard-commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that might occur in the application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Global before hook for all tests
beforeEach(() => {
  // Set up default intercepts for API calls
  cy.intercept('GET', '/api/orders/metrics', { fixture: 'metrics.json' }).as('getMetrics');
  cy.intercept('GET', '/api/orders*', { fixture: 'orders.json' }).as('getOrders');
  
  // Set viewport to desktop by default
  cy.viewport(1280, 720);
});

// Custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('haveLoadedWithin', function (time) {
    const startTime = this._obj;
    const loadTime = Date.now() - startTime;
    
    this.assert(
      loadTime <= time,
      `expected page to load within ${time}ms but took ${loadTime}ms`,
      `expected page to take longer than ${time}ms but loaded in ${loadTime}ms`,
      time,
      loadTime
    );
  });
});

// Add custom commands for accessibility testing
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('[role="button"]').should('be.visible');
  cy.get('[aria-label]').should('exist');
  cy.get('input[aria-label]').should('exist');
});

// Add command for testing color contrast
Cypress.Commands.add('checkColorContrast', () => {
  // This would integrate with axe-core or similar tool
  cy.log('Checking color contrast ratios');
});

// Performance monitoring
Cypress.Commands.add('startPerformanceMonitoring', () => {
  cy.window().then((win) => {
    win.performance.mark('test-start');
  });
});

Cypress.Commands.add('endPerformanceMonitoring', (testName) => {
  cy.window().then((win) => {
    win.performance.mark('test-end');
    win.performance.measure(testName, 'test-start', 'test-end');
    
    const measures = win.performance.getEntriesByType('measure');
    const testMeasure = measures.find(m => m.name === testName);
    
    if (testMeasure) {
      cy.log(`${testName} took ${testMeasure.duration.toFixed(2)}ms`);
    }
  });
});