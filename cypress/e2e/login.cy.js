describe("Test Login Recruteur", () => {
    it("Connexion réussie avec des identifiants valides", () => {
      cy.visit("http://localhost:3000/login");
  
      cy.get('input[type="email"]').type("admin@optylab.tn");
      cy.get('input[type="password"]').type("Admin@123456");
  
      cy.contains("Se connecter").click();
  
      cy.url().should("include", "/recruiter/dashboard");
    });
  });
  