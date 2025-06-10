
describe('RichTextEditor Markdown Shortcuts', () => {
  beforeEach(() => {
    // Visit the page with a text block where we can test the editor
    cy.visit('/');
    cy.wait(1000); // Wait for page to load
    
    // Login if needed (assuming we have auth)
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-form"]').length > 0) {
        cy.get('[data-testid="email-input"]').type('test@example.com');
        cy.get('[data-testid="password-input"]').type('password123');
        cy.get('[data-testid="login-button"]').click();
        cy.wait(2000);
      }
    });
    
    // Navigate to a page or create one where we can test the editor
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="add-block-button"]').length > 0) {
        cy.get('[data-cy="add-block-button"]').click();
        cy.get('[data-cy="text-block-option"]').click();
      }
    });
  });

  describe('Heading Shortcuts', () => {
    it('should convert "# " to heading 1', () => {
      // Find a contentEditable element (RichTextEditor)
      cy.get('[contenteditable="true"]').first().as('editor');
      
      // Type the heading markdown
      cy.get('@editor').click().type('# This is a heading 1');
      
      // Trigger the markdown conversion by typing a space or triggering input event
      cy.get('@editor').trigger('input');
      
      // Check that it was converted to an h1 element
      cy.get('@editor').should('contain.html', '<h1>');
      cy.get('@editor').find('h1').should('contain.text', 'This is a heading 1');
    });

    it('should convert "## " to heading 2', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('## This is a heading 2');
      cy.get('@editor').trigger('input');
      
      cy.get('@editor').should('contain.html', '<h2>');
      cy.get('@editor').find('h2').should('contain.text', 'This is a heading 2');
    });

    it('should convert "### " to heading 3', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('### This is a heading 3');
      cy.get('@editor').trigger('input');
      
      cy.get('@editor').should('contain.html', '<h3>');
      cy.get('@editor').find('h3').should('contain.text', 'This is a heading 3');
    });

    it('should not convert headings in the middle of text', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('Some text # not a heading');
      cy.get('@editor').trigger('input');
      
      // Should remain as regular text, not converted to heading
      cy.get('@editor').should('not.contain.html', '<h1>');
      cy.get('@editor').should('contain.text', 'Some text # not a heading');
    });
  });

  describe('Bold Shortcuts', () => {
    it('should convert **text** to bold', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('This is **bold text** in a sentence');
      cy.get('@editor').trigger('input');
      
      // Check that the text was converted to bold
      cy.get('@editor').should('contain.html', '<strong>');
      cy.get('@editor').find('strong').should('contain.text', 'bold text');
      
      // Check that the surrounding text is still there
      cy.get('@editor').should('contain.text', 'This is');
      cy.get('@editor').should('contain.text', 'in a sentence');
    });

    it('should handle multiple bold sections', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('**First bold** and **second bold** text');
      cy.get('@editor').trigger('input');
      
      // Should have two strong elements
      cy.get('@editor').find('strong').should('have.length', 2);
      cy.get('@editor').find('strong').first().should('contain.text', 'First bold');
      cy.get('@editor').find('strong').last().should('contain.text', 'second bold');
    });

    it('should not convert incomplete bold syntax', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('This is **incomplete bold text');
      cy.get('@editor').trigger('input');
      
      // Should not convert to bold since it's incomplete
      cy.get('@editor').should('not.contain.html', '<strong>');
      cy.get('@editor').should('contain.text', 'This is **incomplete bold text');
    });
  });

  describe('Italic Shortcuts', () => {
    it('should convert *text* to italic', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('This is *italic text* in a sentence');
      cy.get('@editor').trigger('input');
      
      // Check that the text was converted to italic
      cy.get('@editor').should('contain.html', '<em>');
      cy.get('@editor').find('em').should('contain.text', 'italic text');
      
      // Check that the surrounding text is still there
      cy.get('@editor').should('contain.text', 'This is');
      cy.get('@editor').should('contain.text', 'in a sentence');
    });

    it('should not convert *text* that is part of **bold** syntax', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('This is **bold text** not italic');
      cy.get('@editor').trigger('input');
      
      // Should only have bold, not italic
      cy.get('@editor').should('contain.html', '<strong>');
      cy.get('@editor').should('not.contain.html', '<em>');
      cy.get('@editor').find('strong').should('contain.text', 'bold text');
    });
  });

  describe('Mixed Formatting', () => {
    it('should handle heading with bold text', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('# Heading with **bold** text');
      cy.get('@editor').trigger('input');
      
      // Should have both heading and bold formatting
      cy.get('@editor').should('contain.html', '<h1>');
      cy.get('@editor').should('contain.html', '<strong>');
      cy.get('@editor').find('h1').should('exist');
      cy.get('@editor').find('strong').should('contain.text', 'bold');
    });

    it('should handle bold and italic together', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('**Bold** and *italic* text together');
      cy.get('@editor').trigger('input');
      
      // Should have both bold and italic
      cy.get('@editor').should('contain.html', '<strong>');
      cy.get('@editor').should('contain.html', '<em>');
      cy.get('@editor').find('strong').should('contain.text', 'Bold');
      cy.get('@editor').find('em').should('contain.text', 'italic');
    });
  });

  describe('Toolbar Integration', () => {
    it('should show toolbar when editor is focused', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click();
      
      // Toolbar should be visible
      cy.get('[data-testid="editor-toolbar"]').should('be.visible');
      
      // Toolbar should have formatting buttons
      cy.get('[data-testid="bold-button"]').should('be.visible');
      cy.get('[data-testid="italic-button"]').should('be.visible');
    });

    it('should hide toolbar when editor loses focus', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click();
      cy.get('[data-testid="editor-toolbar"]').should('be.visible');
      
      // Click outside the editor
      cy.get('body').click(0, 0);
      
      // Toolbar should be hidden
      cy.get('[data-testid="editor-toolbar"]').should('not.exist');
    });

    it('should apply bold formatting when toolbar button is clicked', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('Select this text');
      
      // Select all text
      cy.get('@editor').selectText();
      
      // Click bold button
      cy.get('[data-testid="bold-button"]').click();
      
      // Text should be bold
      cy.get('@editor').should('contain.html', '<strong>');
      cy.get('@editor').find('strong').should('contain.text', 'Select this text');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should apply bold with Ctrl+B', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('Text to bold');
      
      // Select all text and apply bold with keyboard shortcut
      cy.get('@editor').selectText().type('{ctrl+b}');
      
      // Text should be bold
      cy.get('@editor').should('contain.html', '<strong>');
    });

    it('should apply italic with Ctrl+I', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('Text to italicize');
      
      // Select all text and apply italic with keyboard shortcut
      cy.get('@editor').selectText().type('{ctrl+i}');
      
      // Text should be italic
      cy.get('@editor').should('contain.html', '<em>');
    });

    it('should apply underline with Ctrl+U', () => {
      cy.get('[contenteditable="true"]').first().as('editor');
      
      cy.get('@editor').click().type('Text to underline');
      
      // Select all text and apply underline with keyboard shortcut
      cy.get('@editor').selectText().type('{ctrl+u}');
      
      // Text should be underlined
      cy.get('@editor').should('contain.html', '<u>');
    });
  });
});
