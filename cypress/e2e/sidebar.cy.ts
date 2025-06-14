
describe('Sidebar Navigation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/'); // Visit root and let login command handle redirect.
  });

  it('should display the workspace switcher', () => {
    cy.get('[data-cy="workspace-switcher"]').should('be.visible');
  });

  it('should allow creating a new page', () => {
    const newPageTitle = 'Untitled';
    cy.get('[data-cy="new-page-button"]').click();

    // Wait for navigation and new page to be created in sidebar
    cy.url().should('include', '/page/');
    cy.get('[aria-label*="pages"]', { timeout: 10000 }).contains(newPageTitle).should('be.visible');
    
    // Also check the editor area for the title
    cy.get('textarea[placeholder="Untitled Page"]').should('be.visible');
  });
  
  it('should allow searching for pages', () => {
    cy.get('[data-cy="search-trigger"]').click();
    cy.get('[role="dialog"]').contains('Search pages...').should('be.visible');
    cy.get('[cmdk-input]').type('My Test Page');
    // Further assertions would depend on seeded data.
    cy.get('body').type('{esc}'); // Close modal
    cy.get('[role="dialog"]').should('not.exist');
  });
});
