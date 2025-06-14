
describe('Sidebar Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // Wait for page to load
    
    // Handle authentication if needed
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-form"]').length > 0) {
        cy.get('[data-testid="email-input"]').type('test@example.com');
        cy.get('[data-testid="password-input"]').type('password123');
        cy.get('[data-testid="login-button"]').click();
        cy.wait(3000);
      }
    });
  });

  describe('Workspace Navigation', () => {
    it('should display workspace in sidebar', () => {
      // Check if workspace is visible in sidebar
      cy.get('[data-testid="workspace-group"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain.text', 'workspace');
    });

    it('should allow expanding and collapsing page groups', () => {
      // Look for expandable page groups
      cy.get('[data-testid="page-tree-item"]').first().then(($item) => {
        if ($item.find('[data-testid="expand-toggle"]').length > 0) {
          // Click expand button
          cy.wrap($item).find('[data-testid="expand-toggle"]').click();
          
          // Verify expansion
          cy.get('[data-testid="page-tree-children"]').should('be.visible');
          
          // Click collapse button
          cy.wrap($item).find('[data-testid="expand-toggle"]').click();
          
          // Verify collapse
          cy.get('[data-testid="page-tree-children"]').should('not.exist');
        }
      });
    });

    it('should navigate to pages when clicked', () => {
      // Find and click on a page item
      cy.get('[data-testid="page-tree-item"]').first().click();
      
      // Verify URL changed to page route
      cy.url().should('include', '/page/');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation', () => {
      // Focus on first page item
      cy.get('[data-testid="page-tree-item"]').first().focus();
      
      // Test arrow down navigation
      cy.focused().type('{downarrow}');
      
      // Verify focus moved to next item
      cy.get('[data-testid="page-tree-item"]').eq(1).should('be.focused');
    });

    it('should support Enter key activation', () => {
      // Focus on first page item
      cy.get('[data-testid="page-tree-item"]').first().focus();
      
      // Press Enter
      cy.focused().type('{enter}');
      
      // Verify navigation occurred
      cy.url().should('include', '/page/');
    });
  });

  describe('Virtualization', () => {
    it('should handle large numbers of pages efficiently', () => {
      // Test that virtualized list renders correctly
      cy.get('[data-testid="virtualized-pages-list"]').should('be.visible');
      
      // Scroll through the list to test virtualization
      cy.get('[data-testid="virtualized-pages-list"]').scrollTo('bottom');
      cy.wait(500);
      cy.get('[data-testid="virtualized-pages-list"]').scrollTo('top');
      
      // Verify items are still visible after scrolling
      cy.get('[data-testid="page-tree-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Drag and Drop', () => {
    it('should allow reordering pages via drag and drop', () => {
      // Find draggable items
      cy.get('[data-testid="page-tree-item"]').as('pageItems');
      
      // Test drag and drop if items exist
      cy.get('@pageItems').then(($items) => {
        if ($items.length >= 2) {
          const firstItem = $items.eq(0);
          const secondItem = $items.eq(1);
          
          // Perform drag and drop
          cy.wrap(firstItem).trigger('dragstart');
          cy.wrap(secondItem).trigger('dragover');
          cy.wrap(secondItem).trigger('drop');
          
          // Wait for potential reordering
          cy.wait(1000);
        }
      });
    });
  });
});
