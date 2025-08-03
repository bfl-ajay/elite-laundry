describe('Employee Dashboard Enhancement', () => {
  beforeEach(() => {
    // Login as employee user
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testemployee');
    cy.get('[data-testid="password-input"]').type('Test123');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for dashboard to load
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
  });

  describe('Dashboard Layout and Components', () => {
    it('displays all main dashboard components', () => {
      // Check welcome message
      cy.contains('Welcome back, testemployee!').should('be.visible');
      
      // Check metric badges
      cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
      cy.contains('Total Orders').should('be.visible');
      cy.contains('Pending').should('be.visible');
      cy.contains('Completed').should('be.visible');
      cy.contains('Paid').should('be.visible');
      cy.contains('Unpaid Completed').should('be.visible');
      
      // Check search bar
      cy.get('[data-testid="search-bar"]').should('be.visible');
      cy.get('input[placeholder*="Search by customer name"]').should('be.visible');
      
      // Check order table
      cy.get('[data-testid="order-table"]').should('be.visible');
      cy.contains('Order #').should('be.visible');
      cy.contains('Customer').should('be.visible');
      cy.contains('Date').should('be.visible');
      cy.contains('Status').should('be.visible');
      cy.contains('Amount').should('be.visible');
      
      // Check quick actions
      cy.contains('Quick Actions').should('be.visible');
      cy.contains('New Order').should('be.visible');
      cy.contains('Mark Complete').should('be.visible');
      cy.contains('Payment').should('be.visible');
      cy.contains('Reports').should('be.visible');
    });

    it('shows pending orders by default', () => {
      // Check that pending badge is active
      cy.get('[data-testid="pending-badge"]').should('have.class', 'ring-2');
      
      // Check status indicator
      cy.contains('Showing: Pending Orders').should('be.visible');
      
      // Verify table shows only pending orders
      cy.get('[data-testid="order-table"] tbody tr').each(($row) => {
        cy.wrap($row).find('[data-testid="order-status"]').should('contain', 'Pending');
      });
    });
  });

  describe('Metric Badge Filtering', () => {
    it('filters orders when clicking different metric badges', () => {
      // Click Total Orders badge
      cy.get('[data-testid="total-badge"]').click();
      cy.contains('Showing: All Orders').should('be.visible');
      cy.get('[data-testid="total-badge"]').should('have.class', 'ring-2');
      
      // Click Completed badge
      cy.get('[data-testid="completed-badge"]').click();
      cy.contains('Showing: Completed Orders').should('be.visible');
      cy.get('[data-testid="completed-badge"]').should('have.class', 'ring-2');
      
      // Verify table shows only completed orders
      cy.get('[data-testid="order-table"] tbody tr').each(($row) => {
        cy.wrap($row).find('[data-testid="order-status"]').should('contain', 'Completed');
      });
      
      // Click Paid badge
      cy.get('[data-testid="paid-badge"]').click();
      cy.contains('Showing: Paid Orders').should('be.visible');
      cy.get('[data-testid="paid-badge"]').should('have.class', 'ring-2');
      
      // Click Unpaid Completed badge
      cy.get('[data-testid="unpaid-completed-badge"]').click();
      cy.contains('Showing: Unpaid Completed Orders').should('be.visible');
      cy.get('[data-testid="unpaid-completed-badge"]').should('have.class', 'ring-2');
    });

    it('updates metric counts when data changes', () => {
      // Get initial pending count
      cy.get('[data-testid="pending-badge"]').find('[data-testid="metric-count"]').then(($count) => {
        const initialCount = parseInt($count.text());
        
        // Create a new pending order (assuming this functionality exists)
        cy.get('[data-testid="new-order-button"]').click();
        // ... order creation steps would go here
        
        // Verify count increased
        cy.get('[data-testid="pending-badge"]').find('[data-testid="metric-count"]')
          .should('contain', initialCount + 1);
      });
    });

    it('shows loading state when switching filters', () => {
      // Click a different badge
      cy.get('[data-testid="completed-badge"]').click();
      
      // Should show loading indicators briefly
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      cy.get('[data-testid="search-loading"]').should('be.visible');
      
      // Loading should disappear
      cy.get('[data-testid="loading-skeleton"]').should('not.exist');
      cy.get('[data-testid="search-loading"]').should('not.exist');
    });
  });

  describe('Search Functionality', () => {
    it('searches orders by customer name', () => {
      // Type in search box
      cy.get('input[placeholder*="Search by customer name"]').type('John Doe');
      
      // Should show search indicator
      cy.contains('Search: "John Doe"').should('be.visible');
      
      // Should show clear search button
      cy.get('[data-testid="clear-search"]').should('be.visible');
      
      // Wait for debounced search
      cy.wait(500);
      
      // Verify filtered results
      cy.get('[data-testid="order-table"] tbody tr').each(($row) => {
        cy.wrap($row).find('[data-testid="customer-name"]').should('contain', 'John Doe');
      });
    });

    it('searches orders by contact number', () => {
      cy.get('input[placeholder*="Search by customer name"]').type('1234567890');
      
      cy.contains('Search: "1234567890"').should('be.visible');
      cy.wait(500);
      
      // Verify results contain the contact number
      cy.get('[data-testid="order-table"] tbody tr').should('have.length.at.least', 1);
    });

    it('shows no results message for invalid search', () => {
      cy.get('input[placeholder*="Search by customer name"]').type('NonexistentCustomer');
      cy.wait(500);
      
      cy.contains('No orders found').should('be.visible');
      cy.contains('Try adjusting your search or filter criteria').should('be.visible');
    });

    it('clears search when clear button is clicked', () => {
      // Enter search term
      cy.get('input[placeholder*="Search by customer name"]').type('John Doe');
      cy.contains('Search: "John Doe"').should('be.visible');
      
      // Click clear button
      cy.get('[data-testid="clear-search"]').click();
      
      // Search should be cleared
      cy.get('input[placeholder*="Search by customer name"]').should('have.value', '');
      cy.contains('Search: "John Doe"').should('not.exist');
    });

    it('maintains search when switching filters', () => {
      // Enter search term
      cy.get('input[placeholder*="Search by customer name"]').type('Jane Smith');
      cy.wait(500);
      
      // Switch filter
      cy.get('[data-testid="completed-badge"]').click();
      
      // Search should be maintained
      cy.get('input[placeholder*="Search by customer name"]').should('have.value', 'Jane Smith');
      cy.contains('Search: "Jane Smith"').should('be.visible');
    });

    it('supports keyboard shortcuts', () => {
      // Test forward slash shortcut to focus search
      cy.get('body').type('/');
      cy.get('input[placeholder*="Search by customer name"]').should('be.focused');
      
      // Test escape to clear search
      cy.get('input[placeholder*="Search by customer name"]').type('test search');
      cy.get('input[placeholder*="Search by customer name"]').type('{esc}');
      cy.get('input[placeholder*="Search by customer name"]').should('have.value', '');
    });

    it('debounces search input correctly', () => {
      // Type rapidly
      cy.get('input[placeholder*="Search by customer name"]').type('J');
      cy.get('input[placeholder*="Search by customer name"]').type('o');
      cy.get('input[placeholder*="Search by customer name"]').type('h');
      cy.get('input[placeholder*="Search by customer name"]').type('n');
      
      // Should not search immediately
      cy.get('[data-testid="search-loading"]').should('not.exist');
      
      // Wait for debounce
      cy.wait(400);
      
      // Should search now
      cy.contains('Search: "John"').should('be.visible');
    });
  });

  describe('Order Table Interactions', () => {
    it('displays order details when row is clicked', () => {
      // Click on first order row
      cy.get('[data-testid="order-table"] tbody tr').first().click();
      
      // Should open order details modal or navigate to details page
      cy.get('[data-testid="order-details"]').should('be.visible');
      // Or check for navigation: cy.url().should('include', '/orders/');
    });

    it('shows proper order status styling', () => {
      // Check pending orders have yellow styling
      cy.get('[data-testid="order-status"]').contains('Pending')
        .should('have.class', 'bg-yellow-100')
        .should('have.class', 'text-yellow-800');
      
      // Switch to completed orders
      cy.get('[data-testid="completed-badge"]').click();
      cy.wait(500);
      
      // Check completed orders have green styling
      cy.get('[data-testid="order-status"]').contains('Completed')
        .should('have.class', 'bg-green-100')
        .should('have.class', 'text-green-800');
    });

    it('formats currency amounts correctly', () => {
      cy.get('[data-testid="order-amount"]').each(($amount) => {
        // Should start with $ and have 2 decimal places
        cy.wrap($amount).should('match', /^\$\d+\.\d{2}$/);
      });
    });

    it('displays service information', () => {
      cy.get('[data-testid="order-services"]').should('be.visible');
      cy.get('[data-testid="order-services"]').should('contain.text', 'washing');
    });

    it('supports keyboard navigation', () => {
      // Focus first row
      cy.get('[data-testid="order-table"] tbody tr').first().focus();
      
      // Press Enter
      cy.get('[data-testid="order-table"] tbody tr').first().type('{enter}');
      
      // Should select order
      cy.get('[data-testid="order-details"]').should('be.visible');
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes data when refresh button is clicked', () => {
      // Get initial order count
      cy.get('[data-testid="order-table"] tbody tr').its('length').then((initialCount) => {
        // Click refresh button
        cy.get('[data-testid="refresh-button"]').click();
        
        // Should show loading briefly
        cy.get('[data-testid="loading-skeleton"]').should('be.visible');
        cy.get('[data-testid="loading-skeleton"]').should('not.exist');
        
        // Data should be refreshed (count might be same or different)
        cy.get('[data-testid="order-table"] tbody tr').should('have.length.at.least', 0);
      });
    });

    it('refresh button has proper styling and icon', () => {
      cy.get('[data-testid="refresh-button"]')
        .should('have.class', 'bg-blue-600')
        .should('contain', 'Refresh')
        .find('svg')
        .should('exist');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', () => {
      // Simulate API failure (this would require mocking or server manipulation)
      cy.intercept('GET', '/api/orders/metrics', { statusCode: 500 }).as('metricsError');
      
      // Refresh to trigger API call
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@metricsError');
      
      // Should show error message
      cy.contains('Error loading metrics').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('retries API call when retry button is clicked', () => {
      // Simulate initial failure then success
      cy.intercept('GET', '/api/orders/metrics', { statusCode: 500 }).as('metricsError');
      cy.intercept('GET', '/api/orders', { statusCode: 500 }).as('ordersError');
      
      cy.visit('/dashboard');
      cy.wait('@metricsError');
      cy.wait('@ordersError');
      
      // Should show error and retry button
      cy.contains('Error loading').should('be.visible');
      
      // Mock successful retry
      cy.intercept('GET', '/api/orders/metrics', { fixture: 'metrics.json' }).as('metricsSuccess');
      cy.intercept('GET', '/api/orders', { fixture: 'orders.json' }).as('ordersSuccess');
      
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@metricsSuccess');
      cy.wait('@ordersSuccess');
      
      // Should show data
      cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
      cy.get('[data-testid="order-table"]').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts layout for mobile screens', () => {
      cy.viewport('iphone-x');
      
      // Check that components stack vertically
      cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
      cy.get('[data-testid="search-bar"]').should('be.visible');
      cy.get('[data-testid="order-table"]').should('be.visible');
      
      // Check responsive grid classes
      cy.get('[data-testid="metrics-grid"]').should('have.class', 'grid-cols-1');
      cy.get('[data-testid="quick-actions-grid"]').should('have.class', 'grid-cols-2');
    });

    it('maintains functionality on touch devices', () => {
      cy.viewport('ipad-2');
      
      // Test touch interactions
      cy.get('[data-testid="pending-badge"]').click();
      cy.contains('Showing: Pending Orders').should('be.visible');
      
      // Test search on mobile
      cy.get('input[placeholder*="Search by customer name"]').type('John');
      cy.wait(500);
      cy.contains('Search: "John"').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation throughout dashboard', () => {
      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'total-badge');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'pending-badge');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'completed-badge');
      
      // Continue tabbing to search input
      cy.focused().tab().tab().tab();
      cy.focused().should('have.attr', 'placeholder').and('include', 'Search');
    });

    it('has proper ARIA labels and roles', () => {
      // Check metric badges have proper labels
      cy.get('[data-testid="total-badge"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="pending-badge"]').should('have.attr', 'aria-pressed');
      
      // Check search input has proper label
      cy.get('input[placeholder*="Search"]').should('have.attr', 'aria-label', 'Search orders');
      
      // Check table has proper accessibility
      cy.get('[data-testid="order-table"]').should('have.attr', 'aria-label', 'Orders table');
    });

    it('announces filter changes to screen readers', () => {
      // Click different filter
      cy.get('[data-testid="completed-badge"]').click();
      
      // Check for screen reader announcements (this would require axe-core or similar)
      cy.get('[data-testid="completed-badge"]').should('have.attr', 'aria-pressed', 'true');
      cy.get('[data-testid="pending-badge"]').should('have.attr', 'aria-pressed', 'false');
    });

    it('maintains focus management', () => {
      // Focus search input
      cy.get('input[placeholder*="Search"]').focus();
      
      // Clear search with button
      cy.get('input[placeholder*="Search"]').type('test');
      cy.get('[data-testid="clear-search"]').click();
      
      // Focus should return to search input
      cy.focused().should('have.attr', 'placeholder').and('include', 'Search');
    });
  });

  describe('Performance', () => {
    it('loads dashboard components within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/dashboard');
      cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
      cy.get('[data-testid="order-table"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
    });

    it('handles large datasets efficiently', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/orders', { fixture: 'large-orders-dataset.json' }).as('largeDataset');
      
      cy.visit('/dashboard');
      cy.wait('@largeDataset');
      
      // Should still be responsive
      cy.get('[data-testid="order-table"]').should('be.visible');
      cy.get('input[placeholder*="Search"]').type('test');
      
      // Search should still be responsive
      cy.wait(500);
      cy.contains('Search: "test"').should('be.visible');
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('works correctly in different browsers', () => {
      // This test would be run across different browsers in CI
      cy.get('[data-testid="order-metrics-badges"]').should('be.visible');
      cy.get('[data-testid="search-bar"]').should('be.visible');
      cy.get('[data-testid="order-table"]').should('be.visible');
      
      // Test core functionality
      cy.get('[data-testid="pending-badge"]').click();
      cy.contains('Showing: Pending Orders').should('be.visible');
      
      cy.get('input[placeholder*="Search"]').type('John');
      cy.wait(500);
      cy.contains('Search: "John"').should('be.visible');
    });
  });
});