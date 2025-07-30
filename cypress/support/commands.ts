// Custom Cypress commands

// Authentication commands
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
    email,
    password,
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('authToken');
  window.localStorage.removeItem('user');
});

// Form filling commands
Cypress.Commands.add('fillContactForm', (data) => {
  const { name, email, message, phone, subject } = data;
  
  if (name) cy.get('[name="name"]').type(name);
  if (email) cy.get('[name="email"]').type(email);
  if (message) cy.get('[name="message"]').type(message);
  if (phone) cy.get('[name="phone"]').type(phone);
  if (subject) cy.get('[name="subject"]').type(subject);
});

// Navigation commands
Cypress.Commands.add('navigateToPage', (pageName: string) => {
  const routes: Record<string, string> = {
    home: '/',
    about: '/about',
    contact: '/contact',
    products: '/products',
    faq: '/faq',
    login: '/login',
    register: '/register',
  };
  
  cy.visit(routes[pageName.toLowerCase()] || '/');
});

// Accessibility testing
Cypress.Commands.add('checkA11y', (context?, options?) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// API mocking
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any) => {
  cy.intercept(method, url, response);
});

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-screen"]').should('not.exist');
  cy.get('body').should('not.have.class', 'loading');
});

// Theme testing
Cypress.Commands.add('toggleTheme', () => {
  cy.get('[data-testid="theme-toggle"]').click();
});

Cypress.Commands.add('checkTheme', (theme: 'light' | 'dark') => {
  cy.get('html').should('have.class', theme);
});

// Declare custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      fillContactForm(data: {
        name?: string;
        email?: string;
        message?: string;
        phone?: string;
        subject?: string;
      }): Chainable<void>;
      navigateToPage(pageName: string): Chainable<void>;
      checkA11y(context?: any, options?: any): Chainable<void>;
      mockApiResponse(method: string, url: string, response: any): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      toggleTheme(): Chainable<void>;
      checkTheme(theme: 'light' | 'dark'): Chainable<void>;
    }
  }
}

export {};