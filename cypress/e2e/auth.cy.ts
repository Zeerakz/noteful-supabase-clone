
describe('Authentication', () => {
  it('should redirect unauthenticated users to the login page from a protected route', () => {
    cy.visit('/workspace/some-id'); // A dummy protected route
    cy.url().should('include', '/login');
    cy.contains('Sign in to your account').should('be.visible');
  });

  it('should show an error for invalid login credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('invalid-user@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').contains('Sign In').click();
    cy.contains('Invalid login credentials').should('be.visible');
  });

  it('should allow a user to log in successfully', () => {
    cy.login();
    cy.url().should('include', '/workspace/');
    cy.get('[aria-label="Main navigation"]').should('be.visible');
  });

  it('should allow a new user to sign up', () => {
    const email = `test-user-${Date.now()}@example.com`;
    const password = 'password123';
    
    cy.visit('/register');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').contains('Sign Up').click();
    
    cy.contains('Check your email for the confirmation link').should('be.visible');
  });

  it('should prevent sign up with an existing email', () => {
    const email = Cypress.env('TEST_USER_EMAIL');

    cy.visit('/register');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('some-password');
    cy.get('button[type="submit"]').contains('Sign Up').click();

    cy.contains('User already registered').should('be.visible');
  });
});
