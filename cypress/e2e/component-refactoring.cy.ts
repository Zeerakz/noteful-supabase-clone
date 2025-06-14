
describe('Component Refactoring Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
    
    // Handle authentication
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-form"]').length > 0) {
        cy.get('[data-testid="email-input"]').type('test@example.com');
        cy.get('[data-testid="password-input"]').type('password123');
        cy.get('[data-testid="login-button"]').click();
        cy.wait(3000);
      }
    });
  });

  describe('PageTreeItem Component', () => {
    it('should render page tree items correctly', () => {
      cy.get('[data-testid="page-tree-item"]')
        .should('exist')
        .and('be.visible');
    });

    it('should display page actions on hover', () => {
      cy.get('[data-testid="page-tree-item"]').first().trigger('mouseover');
      
      // Check if actions become visible
      cy.get('[data-testid="page-actions"]').should('be.visible');
    });

    it('should handle page deletion correctly', () => {
      // Find page with actions
      cy.get('[data-testid="page-tree-item"]').first().as('pageItem');
      
      // Hover to reveal actions
      cy.get('@pageItem').trigger('mouseover');
      
      // Click more options if available
      cy.get('[data-testid="page-actions"]').within(() => {
        cy.get('[data-testid="more-options"]').click();
      });
      
      // Look for delete option
      cy.get('[data-testid="delete-option"]').should('be.visible');
    });
  });

  describe('VirtualizedPagesList Component', () => {
    it('should render virtualized list container', () => {
      cy.get('[data-testid="virtualized-pages-list"]')
        .should('exist')
        .and('be.visible');
    });

    it('should maintain scroll position during virtualization', () => {
      const container = cy.get('[data-testid="virtualized-pages-list"]');
      
      // Scroll to middle
      container.scrollTo(0, 200);
      cy.wait(500);
      
      // Verify scroll position is maintained
      container.then(($el) => {
        expect($el[0].scrollTop).to.be.greaterThan(100);
      });
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('should work across refactored components', () => {
      // Focus first item
      cy.get('[data-testid="page-tree-item"]').first().focus();
      
      // Navigate with keyboard
      cy.focused().type('{downarrow}');
      cy.focused().type('{downarrow}');
      cy.focused().type('{uparrow}');
      
      // Verify navigation still works
      cy.get('[data-testid="page-tree-item"]').eq(1).should('be.focused');
    });

    it('should handle expand/collapse with keyboard', () => {
      // Find item with children
      cy.get('[data-testid="page-tree-item"]').each(($item) => {
        if ($item.find('[data-testid="expand-toggle"]').length > 0) {
          cy.wrap($item).focus();
          cy.focused().type('{rightarrow}'); // Expand
          cy.wait(500);
          cy.focused().type('{leftarrow}'); // Collapse
          return false; // Break the loop
        }
      });
    });
  });

  describe('Performance Tests', () => {
    it('should render without significant performance issues', () => {
      const startTime = Date.now();
      
      // Navigate to workspace
      cy.visit('/workspace/8ed232fe-343d-45d4-978c-9d755259d213');
      
      // Wait for content to load
      cy.get('[data-testid="page-tree-item"]', { timeout: 10000 })
        .should('be.visible')
        .then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
        });
    });

    it('should handle rapid interactions without errors', () => {
      // Rapidly click different items
      cy.get('[data-testid="page-tree-item"]').each(($item, index) => {
        if (index < 5) { // Limit to first 5 items
          cy.wrap($item).click();
          cy.wait(100);
        }
      });
      
      // Verify no errors occurred
      cy.window().then((win) => {
        expect(win.console.error).to.not.have.been.called;
      });
    });
  });
});
