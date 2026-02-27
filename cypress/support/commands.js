// ✅ Votre commande existante - AMÉLIORÉE (login une seule fois)
Cypress.Commands.add("loginadmin", () => {
  cy.session("admin-session", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').should("be.visible").type("admin@optylab.tn");
    cy.get('input[type="password"]').type("Admin@123456");
    cy.contains("Se connecter").click();

    cy.url().should("include", "/recruiter/dashboard");
  });
});
