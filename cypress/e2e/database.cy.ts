
describe('Database View', () => {
  const databaseUrl = '/workspace/8ed232fe-343d-45d4-978c-9d755259d213/database/6b074868-6d11-47f2-979f-39b0c24e03cf';

  beforeEach(() => {
    cy.login();
    cy.visit(databaseUrl);
    cy.contains('Loading', { timeout: 20000 }).should('not.exist');
    cy.get('[role="grid"]').should('be.visible');
  });

  it('should display the database table with rows', () => {
    cy.get('[role="grid"]').find('[role="rowgroup"]').find('[role="row"]').its('length').should('be.gt', 0);
  });

  it('should open the properties management modal', () => {
    cy.get('button').contains('Properties').click();
    cy.get('[role="dialog"]').should('be.visible').and('contain', 'Manage properties');
    cy.get('[role="dialog"]').find('button[aria-label="Close dialog"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should open the filter modal', () => {
    cy.get('button').contains('Filter').click();
    cy.get('[role="dialog"]').should('be.visible').and('contain', 'Filter');
    cy.get('[role="dialog"]').find('button[aria-label="Close dialog"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });
});
