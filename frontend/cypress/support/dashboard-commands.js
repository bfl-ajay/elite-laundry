// Custom Cypress commands for Employee Dashboard Enhancement testing

// Command to login as different user types
Cypress.Commands.add('loginAs', (userType = 'employee') => {
  const users = {
    employee: { username: 'testemployee', password: 'Test123' },
    admin: { username: 'testadmin', password: 'Test123' },
    superadmin: { username: 'testsuperadmin', password: 'Test123' }
  };

  const user = users[userType];
  
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(user.username);
  cy.get('[data-testid="password-input"]').type(user.password);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for dashboard to load
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
});

// Command to wait for dashboard to fully load
Cypress.Commands.add('waitForDashboard', () => {
  cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
  cy.get('[data-testid="search-bar"]').should('be.visible');
  cy.get('[data-testid="order-table"]').should('be.visible');
  
  // Wait for any loading states to complete
  cy.get('[data-testid="loading-skeleton"]').should('not.exist');
  cy.get('[data-testid="search-loading"]').should('not.exist');
});

// Command to select a metric badge filter
Cypress.Commands.add('selectFilter', (filterType) => {
  const filterMap = {
    'all': '[data-testid="total-badge"]',
    'pending': '[data-testid="pending-badge"]',
    'completed': '[data-testid="completed-badge"]',
    'paid': '[data-testid="paid-badge"]',
    'unpaid-completed': '[data-testid="unpaid-completed-badge"]'
  };

  cy.get(filterMap[filterType]).click();
  
  // Wait for filter to apply
  cy.get(filterMap[filterType]).should('have.class', 'ring-2');
});

// Command to search for orders
Cypress.Commands.add('searchOrders', (searchTerm) => {
  cy.get('input[placeholder*="Search by customer name"]').clear().type(searchTerm);
  
  // Wait for debounced search
  cy.wait(500);
  
  // Verify search indicator appears
  cy.contains(`Search: "${searchTerm}"`).should('be.visible');
});

// Command to clear search
Cypress.Commands.add('clearSearch', () => {
  cy.get('[data-testid="clear-search"]').click();
  cy.get('input[placeholder*="Search by customer name"]').should('have.value', '');
});

// Command to verify order table contains specific data
Cypress.Commands.add('verifyOrderTable', (expectedData) => {
  if (expectedData.status) {
    cy.get('[data-testid="order-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('[data-testid="order-status"]').should('contain', expectedData.status);
    });
  }
  
  if (expectedData.customerName) {
    cy.get('[data-testid="order-table"] tbody tr').should('contain', expectedData.customerName);
  }
  
  if (expectedData.minRows) {
    cy.get('[data-testid="order-table"] tbody tr').should('have.length.at.least', expectedData.minRows);
  }
  
  if (expectedData.maxRows) {
    cy.get('[data-testid="order-table"] tbody tr').should('have.length.at.most', expectedData.maxRows);
  }
});

// Command to verify metric badge values
Cypress.Commands.add('verifyMetrics', (expectedMetrics) => {
  if (expectedMetrics.total !== undefined) {
    cy.get('[data-testid="total-badge"]').find('[data-testid="metric-count"]')
      .should('contain', expectedMetrics.total);
  }
  
  if (expectedMetrics.pending !== undefined) {
    cy.get('[data-testid="pending-badge"]').find('[data-testid="metric-count"]')
      .should('contain', expectedMetrics.pending);
  }
  
  if (expectedMetrics.completed !== undefined) {
    cy.get('[data-testid="completed-badge"]').find('[data-testid="metric-count"]')
      .should('contain', expectedMetrics.completed);
  }
  
  if (expectedMetrics.paid !== undefined) {
    cy.get('[data-testid="paid-badge"]').find('[data-testid="metric-count"]')
      .should('contain', expectedMetrics.paid);
  }
  
  if (expectedMetrics.unpaidCompleted !== undefined) {
    cy.get('[data-testid="unpaid-completed-badge"]').find('[data-testid="metric-count"]')
      .should('contain', expectedMetrics.unpaidCompleted);
  }
});

// Command to test accessibility
Cypress.Commands.add('checkAccessibility', () => {
  // Check for proper heading structure
  cy.get('h1').should('exist');
  cy.get('h3').should('exist');
  
  // Check for ARIA labels on interactive elements
  cy.get('[data-testid="total-badge"]').should('have.attr', 'aria-label');
  cy.get('[data-testid="pending-badge"]').should('have.attr', 'aria-pressed');
  cy.get('input[placeholder*="Search"]').should('have.attr', 'aria-label');
  cy.get('[data-testid="order-table"]').should('have.attr', 'aria-label');
  
  // Check keyboard navigation
  cy.get('body').tab();
  cy.focused().should('be.visible');
});

// Command to simulate API errors
Cypress.Commands.add('simulateApiError', (endpoint, statusCode = 500) => {
  cy.intercept('GET', endpoint, { statusCode }).as('apiError');
});

// Command to simulate slow API responses
Cypress.Commands.add('simulateSlowApi', (endpoint, delay = 2000) => {
  cy.intercept('GET', endpoint, (req) => {
    req.reply((res) => {
      res.delay(delay);
      res.send({ fixture: 'orders.json' });
    });
  }).as('slowApi');
});

// Command to test responsive design
Cypress.Commands.add('testResponsive', (viewports = ['iphone-x', 'ipad-2', 'macbook-15']) => {
  viewports.forEach(viewport => {
    cy.viewport(viewport);
    cy.waitForDashboard();
    
    // Verify main components are still visible
    cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
    cy.get('[data-testid="search-bar"]').should('be.visible');
    cy.get('[data-testid="order-table"]').should('be.visible');
    
    // Test basic functionality
    cy.selectFilter('completed');
    cy.searchOrders('John');
    cy.clearSearch();
  });
});

// Command to measure performance
Cypress.Commands.add('measureLoadTime', (maxLoadTime = 3000) => {
  const startTime = Date.now();
  
  cy.waitForDashboard().then(() => {
    const loadTime = Date.now() - startTime;
    expect(loadTime).to.be.lessThan(maxLoadTime);
    cy.log(`Dashboard loaded in ${loadTime}ms`);
  });
});

// Command to test keyboard navigation flow
Cypress.Commands.add('testKeyboardNavigation', () => {
  // Start from body and tab through interactive elements
  cy.get('body').tab();
  cy.focused().should('have.attr', 'data-testid', 'total-badge');
  
  cy.focused().tab();
  cy.focused().should('have.attr', 'data-testid', 'pending-badge');
  
  cy.focused().tab();
  cy.focused().should('have.attr', 'data-testid', 'completed-badge');
  
  cy.focused().tab();
  cy.focused().should('have.attr', 'data-testid', 'paid-badge');
  
  cy.focused().tab();
  cy.focused().should('have.attr', 'data-testid', 'unpaid-completed-badge');
  
  // Continue to search input
  cy.focused().tab();
  cy.focused().should('have.attr', 'placeholder').and('include', 'Search');
  
  // Test Enter key on focused elements
  cy.get('[data-testid="pending-badge"]').focus().type('{enter}');
  cy.get('[data-testid="pending-badge"]').should('have.class', 'ring-2');
});

// Command to verify loading states
Cypress.Commands.add('verifyLoadingStates', () => {
  // Should show loading initially
  cy.get('[data-testid="loading-skeleton"]').should('be.visible');
  
  // Loading should disappear
  cy.get('[data-testid="loading-skeleton"]').should('not.exist');
  
  // Test loading on filter change
  cy.selectFilter('completed');
  cy.get('[data-testid="loading-skeleton"]').should('be.visible');
  cy.get('[data-testid="loading-skeleton"]').should('not.exist');
});

// Command to test error recovery
Cypress.Commands.add('testErrorRecovery', () => {
  // Simulate API error
  cy.simulateApiError('/api/orders/metrics');
  cy.visit('/dashboard');
  cy.wait('@apiError');
  
  // Should show error message
  cy.contains('Error loading metrics').should('be.visible');
  cy.get('[data-testid="retry-button"]').should('be.visible');
  
  // Mock successful retry
  cy.intercept('GET', '/api/orders/metrics', { fixture: 'metrics.json' }).as('metricsSuccess');
  cy.get('[data-testid="retry-button"]').click();
  cy.wait('@metricsSuccess');
  
  // Should show data
  cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
});