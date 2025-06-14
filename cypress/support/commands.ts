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

      /**
       * Custom command to log in a user.
       * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.
       */
      login(): Chainable<void>;
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

Cypress.Commands.add('login', () => {
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in cypress.env.json or as environment variables.');
  }

  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').should('be.visible').type(email);
    cy.get('input[name="password"]').should('be.visible').type(password);
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to workspace and for the sidebar to be ready
    cy.url().should('include', '/workspace/');
    cy.get('[aria-label="Main navigation"]', { timeout: 15000 }).should('be.visible');
  }, {
    cacheAcrossSpecs: true,
  });
});

export {};
