describe("Test Logout Recruteur", () => {
    it("Déconnexion réussie et redirection vers login", () => {
      // 1️⃣ Aller sur la page login
      cy.visit("http://localhost:3000/login");
  
      // 2️⃣ Se connecter
      cy.get('input[type="email"]').type("admin@optylab.tn");
      cy.get('input[type="password"]').type("Admin@123456");
      cy.contains("Se connecter").click();
  
      // 3️⃣ Vérifier qu’on est bien sur le dashboard
      cy.url().should("include", "/recruiter/dashboard");
  
      // 4️⃣ Cliquer sur Déconnexion
      cy.contains("Déconnexion").click();
  
      // 5️⃣ Vérifier la redirection vers login
      cy.url().should("include", "/login");
  
      // 6️⃣ Vérifier que le dashboard n’est plus accessible
      cy.visit("http://localhost:3000/recruiter/dashboard");
      cy.url().should("include", "/login");
    });
  });
  