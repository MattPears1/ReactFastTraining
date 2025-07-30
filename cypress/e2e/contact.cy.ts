describe('Contact Page', () => {
  beforeEach(() => {
    cy.visit('/contact')
    cy.waitForPageLoad()
  })

  it('displays contact information', () => {
    cy.contains('Get in Touch').should('be.visible')
    cy.contains('123 Business Ave').should('be.visible')
    cy.contains('+1 (234) 567-890').should('be.visible')
    cy.contains('info@lexbusiness.com').should('be.visible')
  })

  it('validates contact form', () => {
    // Try to submit empty form
    cy.get('button[type="submit"]').click()
    
    // Check for validation errors
    cy.contains('First name must be at least 2 characters').should('be.visible')
    cy.contains('Last name must be at least 2 characters').should('be.visible')
    cy.contains('Please enter a valid email address').should('be.visible')
    cy.contains('Subject must be at least 5 characters').should('be.visible')
    cy.contains('Message must be at least 20 characters').should('be.visible')
  })

  it('submits contact form successfully', () => {
    // Fill in the form
    cy.get('input[name="firstName"]').type('John')
    cy.get('input[name="lastName"]').type('Doe')
    cy.get('input[name="email"]').type('john.doe@example.com')
    cy.get('input[name="phone"]').type('+1234567890')
    cy.get('input[name="company"]').type('Acme Inc')
    cy.get('input[name="subject"]').type('Test Subject')
    cy.get('textarea[name="message"]').type('This is a test message that is long enough to pass validation')
    cy.get('input[type="checkbox"]').check()
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Check for loading state
    cy.contains('Sending...').should('be.visible')
    
    // Check for success message
    cy.contains('Message sent successfully', { timeout: 5000 }).should('be.visible')
  })

  it('displays map placeholder', () => {
    cy.get('[class*="rounded-xl"]').within(() => {
      cy.contains('Lex Business Headquarters').should('be.visible')
    })
  })

  it('shows additional contact options', () => {
    cy.contains('Live Chat').should('be.visible')
    cy.contains('Schedule a Call').should('be.visible')
    cy.contains('Support Ticket').should('be.visible')
  })
})