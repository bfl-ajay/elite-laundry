describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth data
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Login Page', () => {
    it('should display login form', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      cy.contains('Laundry Management').should('be.visible');
      cy.contains('Please sign in to access your dashboard').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      
      cy.get('button[type="submit"]').click();
      
      cy.contains('Username is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('input[name="username"]').type('invalid');
      cy.get('input[name="password"]').type('invalid');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid username or password').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.visit('/login');
      
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Business Dashboard').should('be.visible');
    });

    it('should toggle password visibility', () => {
      cy.visit('/login');
      
      const passwordInput = cy.get('input[name="password"]');
      const toggleButton = cy.get('[data-testid="password-toggle"]');
      
      // Initially password should be hidden
      passwordInput.should('have.attr', 'type', 'password');
      
      // Click toggle to show password
      toggleButton.click();
      passwordInput.should('have.attr', 'type', 'text');
      
      // Click toggle to hide password
      toggleButton.click();
      passwordInput.should('have.attr', 'type', 'password');
    });

    it('should show demo credentials hint', () => {
      cy.visit('/login');
      
      cy.contains('Demo:').should('be.visible');
      cy.contains('admin').should('be.visible');
      cy.contains('admin123').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard');
      
      cy.url().should('include', '/login');
      cy.contains('Please sign in to access your dashboard').should('be.visible');
    });

    it('should allow access to protected routes when authenticated', () => {
      // Login first
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      // Should be able to access dashboard
      cy.url().should('include', '/dashboard');
      
      // Should be able to access orders page
      cy.visit('/orders');
      cy.url().should('include', '/orders');
      cy.contains('Order Management').should('be.visible');
      
      // Should be able to access expenses page
      cy.visit('/expenses');
      cy.url().should('include', '/expenses');
      cy.contains('Expense Management').should('be.visible');
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login before each test
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should logout successfully', () => {
      // Click logout button
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
      cy.contains('Please sign in to access your dashboard').should('be.visible');
    });

    it('should clear authentication state after logout', () => {
      // Logout
      cy.get('[data-testid="logout-button"]').click();
      
      // Try to access protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      // Login
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      // Refresh page
      cy.reload();
      
      // Should still be authenticated
      cy.url().should('include', '/dashboard');
      cy.contains('Business Dashboard').should('be.visible');
    });

    it('should handle session expiration', () => {
      // Login
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      // Simulate session expiration by clearing storage
      cy.clearLocalStorage();
      cy.clearCookies();
      
      // Try to access protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Login before each test
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
    });

    it('should navigate between pages using navigation menu', () => {
      // Should start on dashboard
      cy.url().should('include', '/dashboard');
      
      // Navigate to orders
      cy.get('[data-testid="nav-orders"]').click();
      cy.url().should('include', '/orders');
      cy.contains('Order Management').should('be.visible');
      
      // Navigate to expenses
      cy.get('[data-testid="nav-expenses"]').click();
      cy.url().should('include', '/expenses');
      cy.contains('Expense Management').should('be.visible');
      
      // Navigate back to dashboard
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/dashboard');
      cy.contains('Business Dashboard').should('be.visible');
    });

    it('should highlight active navigation item', () => {
      // Dashboard should be active
      cy.get('[data-testid="nav-dashboard"]').should('have.class', 'active');
      
      // Navigate to orders
      cy.get('[data-testid="nav-orders"]').click();
      cy.get('[data-testid="nav-orders"]').should('have.class', 'active');
      cy.get('[data-testid="nav-dashboard"]').should('not.have.class', 'active');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept login request and force network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('loginError');
      
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // Should show network error message
      cy.contains('Network error').should('be.visible');
    });

    it('should handle server errors', () => {
      // Intercept login request and return server error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { error: { message: 'Internal server error' } }
      }).as('serverError');
      
      cy.visit('/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@serverError');
      
      // Should show server error message
      cy.contains('Internal server error').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'username');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'password');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/login');
      
      cy.get('input[name="username"]').should('have.attr', 'aria-label');
      cy.get('input[name="password"]').should('have.attr', 'aria-label');
      cy.get('button[type="submit"]').should('have.attr', 'aria-label');
    });

    it('should announce errors to screen readers', () => {
      cy.visit('/login');
      
      cy.get('button[type="submit"]').click();
      
      // Error messages should have proper ARIA attributes
      cy.get('[role="alert"]').should('exist');
      cy.get('[aria-live="polite"]').should('exist');
    });
  });
});