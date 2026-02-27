/// <reference types="cypress" />

/**
 * Tests E2E — Gestion des Rôles
 * Couverture : affichage, recherche, ajout, édition, suppression
 * ✅ CORRIGÉ - Compatible avec page.jsx
 */

describe("Gestion des Rôles", () => {
  const PAGE_URL = "/recruiter/roles";

  // ================= MOCK DATA =================
  const mockRoles = [
    { id: "1", _id: "1", name: "ADMIN" },
    { id: "2", _id: "2", name: "HR_MANAGER" },
    { id: "3", _id: "3", name: "DEVELOPER" },
    { id: "4", _id: "4", name: "GUEST" },
  ];

  const newRole = "IT_SUPPORT";
  const updatedRole = "SENIOR_DEVELOPER";

  // ================= HOOK =================
  beforeEach(() => {
    cy.loginadmin();

    cy.intercept("GET", "/api/roles*", {
      statusCode: 200,
      body: mockRoles,
    }).as("getRoles");

    cy.intercept("POST", "/api/roles*", {
      statusCode: 201,
      body: { message: "Rôle créé avec succès" },
    }).as("createRole");

    cy.intercept("PUT", "/api/roles/*", {
      statusCode: 200,
      body: { message: "Rôle modifié avec succès" },
    }).as("updateRole");

    cy.intercept("DELETE", "/api/roles/*", {
      statusCode: 200,
      body: { message: "Rôle supprimé" },
    }).as("deleteRole");

    cy.visit(PAGE_URL);
    cy.wait("@getRoles");
  });

  // ================= AFFICHAGE =================
  it("devrait afficher le titre de la page", () => {
    cy.contains("Liste des rôles").should("be.visible");
  });

  it("devrait afficher tous les rôles", () => {
    mockRoles.forEach((r) => {
      cy.contains(r.name).should("be.visible");
    });
  });

  it("devrait afficher le champ de recherche", () => {
    cy.get('input[placeholder="Rechercher un rôle…"]').should("be.visible");
  });

  it("devrait afficher le bouton Ajouter un rôle", () => {
    cy.contains("Ajouter un rôle").should("be.visible");
  });

  // ================= RECHERCHE =================
  it("devrait filtrer les rôles", () => {
    cy.get('input[placeholder="Rechercher un rôle…"]').type("ADMIN");
    cy.contains("ADMIN").should("be.visible");
    cy.contains("HR_MANAGER").should("not.exist");
  });

  // ================= AJOUT =================
  it("devrait ajouter un rôle avec succès", () => {
    cy.contains("Ajouter un rôle").click();

    cy.get('input[placeholder="ex : HR_MANAGER"]').type(newRole);
    cy.contains("button", "Enregistrer").click();

    cy.wait("@createRole")
      .its("request.body")
      .should("have.property", "name", newRole);

    // ✅ Vérifier le message de succès
    cy.contains("Rôle ajouté avec succès").should("be.visible");
  });

  it("devrait refuser un nom vide", () => {
    cy.contains("Ajouter un rôle").click();
    cy.contains("button", "Enregistrer").click();

    cy.contains("Veuillez saisir le nom du rôle.").should("be.visible");
  });

  // ================= ÉDITION =================
  it("devrait modifier un rôle", () => {
    cy.contains("ADMIN")
      .parents("tr")
      .find('[aria-label="Modifier"]')
      .click();

    cy.get('input[placeholder="ex : IT_MANAGER"]')
      .clear()
      .type(updatedRole);

    cy.contains("button", "Enregistrer").click();

    cy.wait("@updateRole");

    // ✅ Vérifier le message de succès
    cy.contains("Rôle modifié avec succès").should("be.visible");
  });

  // ================= SUPPRESSION =================
  it("devrait supprimer un rôle", () => {
    cy.contains("GUEST")
      .parents("tr")
      .find('[aria-label="Supprimer"]')
      .click();

    // ✅ Attendre que le modal de confirmation soit visible
    cy.contains("Voulez-vous vraiment supprimer").should("be.visible");

    // ✅ Cliquer sur le bouton rouge de confirmation
    cy.get("button.bg-red-500").click();

    // ✅ Vérifier que la requête DELETE a été envoyée
    cy.wait("@deleteRole");

    // ✅ Vérifier le message de succès
    cy.contains("Rôle supprimé").should("be.visible");
  });

  // ================= ACCESSIBILITÉ =================
  it("devrait avoir les aria-labels requis", () => {
    cy.get('[aria-label="Modifier"]').should("have.length", mockRoles.length);
    cy.get('[aria-label="Supprimer"]').should("have.length", mockRoles.length);
  });

  // ================= DARK MODE =================
  it("devrait supporter le dark mode", () => {
    cy.document().then((doc) => {
      doc.documentElement.classList.add("dark");
    });

    cy.get('input[placeholder="Rechercher un rôle…"]')
      .should("have.class", "dark:bg-gray-800");
  });
});