describe('Order Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    
    // Navigate to orders page
    cy.visit('/orders');
  });

  describe('Order List', () => {
    it('should display orders table', () => {
      cy.contains('Order Management').should('be.visible');
      cy.get('[data-testid="orders-table"]').should('be.visible');
      
      // Check table headers
      cy.contains('Order #').should('be.visible');
      cy.contains('Customer').should('be.visible');
      cy.contains('Date').should('be.visible');
      cy.contains('Status').should('be.visible');
      cy.contains('Amount').should('be.visible');
      cy.contains('Actions').should('be.visible');
    });

    it('should filter orders by status', () => {
      // Click status filter
      cy.get('[data-testid="status-filter"]').select('Pending');
      
      // Should only show pending orders
      cy.get('[data-testid="order-row"]').each(($row) => {
        cy.wrap($row).should('contain', 'Pending');
      });
      
      // Change to completed filter
      cy.get('[data-testid="status-filter"]').select('Completed');
      
      // Should only show completed orders
      cy.get('[data-testid="order-row"]').each(($row) => {
        cy.wrap($row).should('contain', 'Completed');
      });
    });

    it('should search orders by customer name', () => {
      cy.get('[data-testid="search-input"]').type('John');
      
      // Should filter orders containing "John"
      cy.get('[data-testid="order-row"]').each(($row) => {
        cy.wrap($row).should('contain.text', 'John');
      });
    });

    it('should sort orders by date', () => {
      cy.get('[data-testid="date-sort"]').click();
      
      // Check if orders are sorted (newest first by default)
      cy.get('[data-testid="order-date"]').then(($dates) => {
        const dates = Array.from($dates).map(el => new Date(el.textContent));
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).to.deep.equal(sortedDates);
      });
    });
  });

  describe('Create Order', () => {
    it('should open create order form', () => {
      cy.get('[data-testid="create-order-btn"]').click();
      
      cy.get('[data-testid="order-form"]').should('be.visible');
      cy.contains('Create New Order').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="create-order-btn"]').click();
      cy.get('[data-testid="submit-order"]').click();
      
      cy.contains('Customer name is required').should('be.visible');
      cy.contains('Phone number is required').should('be.visible');
      cy.contains('At least one service is required').should('be.visible');
    });

    it('should create order successfully', () => {
      cy.get('[data-testid="create-order-btn"]').click();
      
      // Fill customer information
      cy.get('input[name="customerName"]').type('John Doe');
      cy.get('input[name="contactNumber"]').type('1234567890');
      
      // Add service
      cy.get('[data-testid="add-service-btn"]').click();
      cy.get('select[name="serviceType"]').select('washing');
      cy.get('select[name="clothType"]').select('normal');
      cy.get('input[name="quantity"]').type('5');
      cy.get('input[name="unitCost"]').type('10');
      
      // Submit form
      cy.get('[data-testid="submit-order"]').click();
      
      // Should show success message
      cy.contains('Order created successfully').should('be.visible');
      
      // Should close form and refresh table
      cy.get('[data-testid="order-form"]').should('not.exist');
      cy.contains('John Doe').should('be.visible');
    });

    it('should calculate total amount correctly', () => {
      cy.get('[data-testid="create-order-btn"]').click();
      
      // Fill customer information
      cy.get('input[name="customerName"]').type('Jane Smith');
      cy.get('input[name="contactNumber"]').type('0987654321');
      
      // Add first service
      cy.get('[data-testid="add-service-btn"]').click();
      cy.get('select[name="serviceType"]').first().select('washing');
      cy.get('select[name="clothType"]').first().select('normal');
      cy.get('input[name="quantity"]').first().type('3');
      cy.get('input[name="unitCost"]').first().type('15');
      
      // Add second service
      cy.get('[data-testid="add-service-btn"]').click();
      cy.get('select[name="serviceType"]').last().select('ironing');
      cy.get('select[name="clothType"]').last().select('saari');
      cy.get('input[name="quantity"]').last().type('2');
      cy.get('input[name="unitCost"]').last().type('25');
      
      // Check total calculation (3*15 + 2*25 = 95)
      cy.get('[data-testid="total-amount"]').should('contain', '$95.00');
    });

    it('should add and remove services', () => {
      cy.get('[data-testid="create-order-btn"]').click();
      
      // Add service
      cy.get('[data-testid="add-service-btn"]').click();
      cy.get('[data-testid="service-row"]').should('have.length', 1);
      
      // Add another service
      cy.get('[data-testid="add-service-btn"]').click();
      cy.get('[data-testid="service-row"]').should('have.length', 2);
      
      // Remove first service
      cy.get('[data-testid="remove-service-btn"]').first().click();
      cy.get('[data-testid="service-row"]').should('have.length', 1);
    });
  });

  describe('Order Details', () => {
    it('should show order details when clicking on order', () => {
      cy.get('[data-testid="order-row"]').first().click();
      
      cy.get('[data-testid="order-details"]').should('be.visible');
      cy.contains('Order Details').should('be.visible');
    });

    it('should display all order information', () => {
      cy.get('[data-testid="order-row"]').first().click();
      
      // Check order information sections
      cy.contains('Order Number').should('be.visible');
      cy.contains('Customer Information').should('be.visible');
      cy.contains('Services').should('be.visible');
      cy.contains('Total Amount').should('be.visible');
      cy.contains('Status').should('be.visible');
    });

    it('should close details modal', () => {
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="order-details"]').should('be.visible');
      
      cy.get('[data-testid="close-details"]').click();
      cy.get('[data-testid="order-details"]').should('not.exist');
    });
  });

  describe('Order Status Management', () => {
    it('should update order status to completed', () => {
      // Find a pending order
      cy.get('[data-testid="order-row"]').contains('Pending').parent().within(() => {
        cy.get('[data-testid="status-update-btn"]').click();
      });
      
      cy.get('[data-testid="status-select"]').select('Completed');
      cy.get('[data-testid="confirm-status-update"]').click();
      
      cy.contains('Order status updated successfully').should('be.visible');
    });

    it('should update payment status', () => {
      // Find a completed order
      cy.get('[data-testid="order-row"]').contains('Completed').parent().within(() => {
        cy.get('[data-testid="payment-update-btn"]').click();
      });
      
      cy.get('[data-testid="payment-select"]').select('Paid');
      cy.get('[data-testid="confirm-payment-update"]').click();
      
      cy.contains('Payment status updated successfully').should('be.visible');
    });
  });

  describe('Bill Generation', () => {
    it('should generate bill for completed order', () => {
      // Find a completed order
      cy.get('[data-testid="order-row"]').contains('Completed').parent().within(() => {
        cy.get('[data-testid="generate-bill-btn"]').click();
      });
      
      cy.get('[data-testid="bill-modal"]').should('be.visible');
      cy.contains('Invoice').should('be.visible');
      cy.contains('Bill Number').should('be.visible');
    });

    it('should display itemized bill', () => {
      // Generate bill for completed order
      cy.get('[data-testid="order-row"]').contains('Completed').parent().within(() => {
        cy.get('[data-testid="generate-bill-btn"]').click();
      });
      
      // Check bill details
      cy.get('[data-testid="bill-modal"]').within(() => {
        cy.contains('Services').should('be.visible');
        cy.contains('Quantity').should('be.visible');
        cy.contains('Unit Cost').should('be.visible');
        cy.contains('Total').should('be.visible');
        cy.contains('Grand Total').should('be.visible');
      });
    });

    it('should print bill', () => {
      // Generate bill
      cy.get('[data-testid="order-row"]').contains('Completed').parent().within(() => {
        cy.get('[data-testid="generate-bill-btn"]').click();
      });
      
      // Mock print function
      cy.window().then((win) => {
        cy.stub(win, 'print').as('print');
      });
      
      cy.get('[data-testid="print-bill-btn"]').click();
      cy.get('@print').should('have.been.called');
    });
  });

  describe('Order Deletion', () => {
    it('should delete order with confirmation', () => {
      const orderCount = cy.get('[data-testid="order-row"]').its('length');
      
      cy.get('[data-testid="order-row"]').first().within(() => {
        cy.get('[data-testid="delete-order-btn"]').click();
      });
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.contains('Order deleted successfully').should('be.visible');
      
      // Check order count decreased
      cy.get('[data-testid="order-row"]').should('have.length.lessThan', orderCount);
    });

    it('should cancel deletion', () => {
      const orderCount = cy.get('[data-testid="order-row"]').its('length');
      
      cy.get('[data-testid="order-row"]').first().within(() => {
        cy.get('[data-testid="delete-order-btn"]').click();
      });
      
      // Cancel deletion
      cy.get('[data-testid="cancel-delete"]').click();
      
      // Order count should remain same
      cy.get('[data-testid="order-row"]').should('have.length', orderCount);
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');
      
      cy.contains('Order Management').should('be.visible');
      cy.get('[data-testid="orders-table"]').should('be.visible');
      
      // Mobile-specific elements should be visible
      cy.get('[data-testid="mobile-menu-btn"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      
      cy.contains('Order Management').should('be.visible');
      cy.get('[data-testid="orders-table"]').should('be.visible');
      
      // Table should be properly formatted for tablet
      cy.get('[data-testid="order-row"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors when creating order', () => {
      // Intercept order creation and return error
      cy.intercept('POST', '/api/orders', {
        statusCode: 400,
        body: { error: { message: 'Invalid order data' } }
      }).as('createOrderError');
      
      cy.get('[data-testid="create-order-btn"]').click();
      
      // Fill form
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('input[name="contactNumber"]').type('1234567890');
      cy.get('[data-testid="add-service-btn"]').click();
      cy.get('select[name="serviceType"]').select('washing');
      cy.get('select[name="clothType"]').select('normal');
      cy.get('input[name="quantity"]').type('1');
      cy.get('input[name="unitCost"]').type('10');
      
      cy.get('[data-testid="submit-order"]').click();
      
      cy.wait('@createOrderError');
      cy.contains('Invalid order data').should('be.visible');
    });

    it('should handle network errors', () => {
      // Intercept orders fetch and force network error
      cy.intercept('GET', '/api/orders', { forceNetworkError: true }).as('networkError');
      
      cy.reload();
      
      cy.wait('@networkError');
      cy.contains('Network error').should('be.visible');
    });
  });
});