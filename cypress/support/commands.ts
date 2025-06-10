
// Custom Cypress commands for testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select text in a contentEditable element
       */
      selectText(): Chainable<Element>;
      
      /**
       * Custom command to clear a contentEditable element
       */
      clearContentEditable(): Chainable<Element>;
      
      /**
       * Custom command to wait for the RichTextEditor to be ready
       */
      waitForEditor(): Chainable<Element>;
    }
  }
}

// Command to select all text in a contentEditable element
Cypress.Commands.add('selectText', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).then(($el) => {
    const el = $el[0];
    if (el) {
      // Focus the element first
      el.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });
  
  return cy.wrap(subject);
});

// Command to clear contentEditable elements
Cypress.Commands.add('clearContentEditable', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).then(($el) => {
    const el = $el[0];
    if (el) {
      el.innerHTML = '';
      el.focus();
    }
  });
  
  return cy.wrap(subject);
});

// Command to wait for the editor to be ready
Cypress.Commands.add('waitForEditor', () => {
  cy.get('[contenteditable="true"]').should('be.visible');
  cy.wait(500); // Small wait for editor initialization
});

export {};
