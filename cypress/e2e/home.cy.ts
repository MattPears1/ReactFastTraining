describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForPageLoad()
  })

  it('displays the hero section', () => {
    cy.get('h1').should('contain', 'Transform Your Business')
    cy.contains('Get Started Free').should('be.visible')
    cy.contains('Watch Demo').should('be.visible')
  })

  it('navigates to contact page when CTA is clicked', () => {
    cy.contains('Get Started Free').click()
    cy.url().should('include', '/contact')
  })

  it('displays features section', () => {
    cy.contains('Everything You Need to Succeed').should('be.visible')
    cy.get('[class*="card"]').should('have.length.at.least', 6)
  })

  it('displays stats section', () => {
    cy.contains('10K+').should('be.visible')
    cy.contains('Happy Customers').should('be.visible')
  })

  it('has working navigation', () => {
    // Test navigation links
    cy.get('nav').contains('About').click()
    cy.url().should('include', '/about')
    
    cy.get('nav').contains('Contact').click()
    cy.url().should('include', '/contact')
    
    cy.get('nav').contains('FAQ').click()
    cy.url().should('include', '/faq')
  })

  it('toggles dark mode', () => {
    // Check initial state
    cy.get('html').should('not.have.class', 'dark')
    
    // Toggle dark mode
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('html').should('have.class', 'dark')
    
    // Toggle back to light mode
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('html').should('not.have.class', 'dark')
  })

  it('is responsive on mobile', () => {
    // Set mobile viewport
    cy.viewport('iphone-x')
    
    // Mobile menu should be hidden initially
    cy.get('nav').contains('About').should('not.be.visible')
    
    // Open mobile menu
    cy.get('button[aria-label="Toggle menu"]').click()
    
    // Mobile menu should be visible
    cy.get('nav').contains('About').should('be.visible')
  })
})