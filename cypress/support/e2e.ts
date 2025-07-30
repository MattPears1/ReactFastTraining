// Import Cypress commands
import './commands';
import 'cypress-axe';

// Preserve cookies between tests
Cypress.Cookies.defaults({
  preserve: ['authToken', 'sessionId'],
});

// Custom error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  // that are expected in the application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Add custom viewport commands
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport('iphone-x');
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport('ipad-2');
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1920, 1080);
});

// Declare custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
    }
  }
}