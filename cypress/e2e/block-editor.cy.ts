
describe('Block Editor', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/'); 
    cy.get('[data-cy="new-page-button"]').click();
    cy.url().should('include', '/page/');
    cy.waitForEditor();
  });

  it('should add and edit a text block', () => {
    const text = 'This is a new text block.';
    cy.get('[contenteditable="true"]').first().focus().clear().type(text);
    cy.get('[contenteditable="true"]').first().should('have.text', text);
    
    cy.reload();
    cy.waitForEditor();
    cy.get('[contenteditable="true"]').first().should('have.text', text);
  });

  it('should convert a text block to a heading using markdown', () => {
    cy.get('[contenteditable="true"]').first().focus().clear().type('# Hello World ');
    cy.get('h1').should('contain', 'Hello World');
  });

  it('should add a new block using the slash command menu', () => {
    cy.get('[contenteditable="true"]').first().focus().clear().type('/h1');
    cy.get('[cmdk-item]').contains('Heading 1').click();
    cy.get('h1[contenteditable="true"]').should('be.visible').and('be.focused');
    cy.get('h1[contenteditable="true"]').type('This is a heading');
    cy.get('h1').should('have.text', 'This is a heading');
  });

  it('should add a bullet list', () => {
    cy.get('[contenteditable="true"]').first().focus().clear().type('/bullet');
    cy.get('[cmdk-item]').contains('Bullet List').click();
    cy.get('ul > li [contenteditable="true"]').should('exist').type('First item');
    cy.get('ul > li').should('have.length', 1);
    cy.get('ul > li').first().should('contain', 'First item');
  });
});
