
describe('Smoke Tests - Basic Functionality', () => {
  it('should load the application without errors', () => {
    cy.visit('/');
    cy.wait(2000);
    
    // Check that the page loads without critical errors
    cy.get('body').should('be.visible');
    
    // Check for any error messages in the UI
    cy.get('[data-testid="error-message"]').should('not.exist');
    
    // Verify basic UI elements are present
    cy.get('main, [role="main"], #root').should('be.visible');
  });

  it('should handle navigation without breaking', () => {
    cy.visit('/');
    cy.wait(2000);
    
    // Try navigating to workspace if available
    cy.get('body').then(($body) => {
      if ($body.find('[href*="/workspace"]').length > 0) {
        cy.get('[href*="/workspace"]').first().click();
        cy.wait(1000);
        cy.url().should('include', '/workspace');
      }
    });
  });

  it('should not have JavaScript errors in console', () => {
    // Set up console error tracking
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
    
    cy.visit('/');
    cy.wait(3000);
    
    // Check that no critical console errors occurred
    cy.get('@consoleError').should('not.have.been.called');
  });

  it('should render refactored components without errors', () => {
    cy.visit('/');
    cy.wait(2000);
    
    // Check that key refactored components render
    cy.get('body').within(() => {
      // Should not have React error boundaries triggered
      cy.contains('Something went wrong').should('not.exist');
      cy.contains('Error loading').should('not.exist');
    });
  });
});
