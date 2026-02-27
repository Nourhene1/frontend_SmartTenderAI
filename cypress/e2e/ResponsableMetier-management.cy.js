/// <reference types="cypress" />

/**
 * Tests E2E — Gestion des Responsables Métier
 * Couverture : affichage, recherche, ajout, édition, suppression
 */

describe("Gestion des Responsables Métier", () => {
  const PAGE_URL = "/recruiter/ResponsableMetier";

  // ================= MOCK DATA =================
  const mockRoles = [
    { id: "1", _id: "1", name: "ADMIN" },
    { id: "2", _id: "2", name: "HR_MANAGER" },
    { id: "3", _id: "3", name: "DEVELOPER" },
  ];

  const mockUsers = [
    {
      _id: "user1",
      id: "user1",
      prenom: "Ahmed",
      nom: "Ben Ali",
      email: "ahmed.benali@test.com",
      role: "ADMIN",
      createdAt: "2024-01-15T10:00:00.000Z",
    },
    {
      _id: "user2",
      id: "user2",
      prenom: "Sami",
      nom: "Trabelsi",
      email: "sami.trabelsi@test.com",
      role: "HR_MANAGER",
      createdAt: "2024-02-20T14:30:00.000Z",
    },
    {
      _id: "user3",
      id: "user3",
      prenom: "Leila",
      nom: "Mansouri",
      email: "leila.mansouri@test.com",
      role: "DEVELOPER",
      createdAt: "2024-03-10T09:15:00.000Z",
    },
  ];

  const newUser = {
    prenom: "Nour",
    nom: "Hamdi",
    email: "nour.hamdi@test.com",
    password: "Password123!",
    role: "DEVELOPER",
  };

  const updatedUser = {
    prenom: "Ahmed Updated",
    nom: "Ben Ali Updated",
    email: "ahmed.updated@test.com",
  };

  // ================= HOOK =================
  beforeEach(() => {
    cy.loginadmin();

    // Mock GET roles
    cy.intercept("GET", "/api/roles*", {
      statusCode: 200,
      body: mockRoles,
    }).as("getRoles");

    // Mock GET users
    cy.intercept("GET", "/api/users*", {
      statusCode: 200,
      body: mockUsers,
    }).as("getUsers");

    // Mock POST user (register)
    cy.intercept("POST", "/api/users/register", {
      statusCode: 201,
      body: { message: "Responsable métier créé avec succès" },
    }).as("createUser");

    // Mock PATCH user
    cy.intercept("PATCH", "/api/users/*", {
      statusCode: 200,
      body: { message: "Responsable métier modifié avec succès" },
    }).as("updateUser");

    // Mock DELETE user
    cy.intercept("DELETE", "/api/users/*", {
      statusCode: 200,
      body: { message: "Responsable métier supprimé" },
    }).as("deleteUser");

    cy.visit(PAGE_URL);
    cy.wait("@getUsers");
  });

  // ================= AFFICHAGE =================
  it("devrait afficher le titre de la page", () => {
    cy.contains("Liste des responsables métier").should("be.visible");
  });

  it("devrait afficher tous les responsables métier", () => {
    cy.viewport(1280, 720);
    mockUsers.forEach((u) => {
      cy.contains(u.email).should("be.visible");
    });
  });

  it("devrait afficher le champ de recherche", () => {
    cy.get('input[placeholder="Rechercher (email, rôle)…"]').should("be.visible");
  });

  it("devrait afficher le bouton Ajouter un responsable", () => {
    cy.contains("+ Ajouter un responsable").should("be.visible");
  });

  it("devrait afficher les colonnes du tableau (desktop)", () => {
    cy.viewport(1280, 720);
    cy.contains("Prénom").should("be.visible");
    cy.contains("Nom").should("be.visible");
    cy.contains("Email").should("be.visible");
    cy.contains("Rôle").should("be.visible");
    cy.contains("Date").should("be.visible");
    cy.contains("Actions").should("be.visible");
  });

  // ================= RECHERCHE =================
  it("devrait filtrer les responsables métier par email", () => {
    cy.viewport(1280, 720);
    cy.get('input[placeholder="Rechercher (email, rôle)…"]').type("ahmed");
    cy.contains("ahmed.benali@test.com").should("be.visible");
    cy.contains("sami.trabelsi@test.com").should("not.exist");
  });

  it("devrait filtrer les responsables métier par rôle", () => {
    cy.viewport(1280, 720);
    cy.get('input[placeholder="Rechercher (email, rôle)…"]').type("DEVELOPER");
    cy.contains("leila.mansouri@test.com").should("be.visible");
    cy.contains("ahmed.benali@test.com").should("not.exist");
  });

  it("devrait filtrer les responsables métier par nom", () => {
    cy.viewport(1280, 720);
    cy.get('input[placeholder="Rechercher (email, rôle)…"]').type("Trabelsi");
    cy.contains("sami.trabelsi@test.com").should("be.visible");
    cy.contains("ahmed.benali@test.com").should("not.exist");
  });

  // ================= AJOUT =================
  it("devrait ouvrir le modal d'ajout", () => {
    cy.viewport(1280, 720);
    cy.contains("+ Ajouter un responsable").click();
    cy.contains("Ajouter un responsable métier").should("be.visible");
    cy.get('input[placeholder="Ex : Ahmed"]').should("be.visible");
  });

  it("devrait ajouter un responsable métier avec succès", () => {
    cy.viewport(1280, 720);
    cy.contains("+ Ajouter un responsable").click();

    // Remplir le formulaire
    cy.get('input[placeholder="Ex : Ahmed"]').type(newUser.prenom);
    cy.get('input[placeholder="Ex : Ben Ali"]').type(newUser.nom);
    cy.get('input[placeholder="exemple@entreprise.com"]').type(newUser.email);
    cy.get('input[placeholder="••••••••"]').type(newUser.password);
    cy.get("select").select(newUser.role);

    // Soumettre
    cy.contains("button", "Enregistrer").click();

    // Vérifier la requête
    cy.wait("@createUser").its("request.body").should((body) => {
      expect(body.prenom).to.eq(newUser.prenom);
      expect(body.nom).to.eq(newUser.nom);
      expect(body.email).to.eq(newUser.email);
      expect(body.role).to.eq(newUser.role);
    });

    // Vérifier que le modal se ferme
    cy.get('input[placeholder="Ex : Ahmed"]').should("not.exist");
  });

  it("devrait fermer le modal avec le bouton Annuler", () => {
    cy.viewport(1280, 720);
    cy.contains("+ Ajouter un responsable").click();
    cy.contains("button", "Annuler").click();
    cy.get('input[placeholder="Ex : Ahmed"]').should("not.exist");
  });

  it("devrait fermer le modal en cliquant sur l'overlay", () => {
    cy.viewport(1280, 720);
    cy.contains("+ Ajouter un responsable").click();
    cy.get(".bg-black\\/50").click({ force: true });
    cy.get('input[placeholder="Ex : Ahmed"]').should("not.exist");
  });

  // ================= ÉDITION =================
  it("devrait ouvrir le modal d'édition avec les données pré-remplies", () => {
    cy.viewport(1280, 720);
    
    // Cliquer sur le bouton éditer du premier utilisateur
    cy.contains("tr", "ahmed.benali@test.com")
      .find("button")
      .first()
      .click();

    // Vérifier que le modal s'ouvre avec le bon titre
    cy.contains("Modifier un responsable métier").should("be.visible");

    // Vérifier les valeurs pré-remplies
    cy.get('input[placeholder="Ex : Ahmed"]').should("have.value", "Ahmed");
    cy.get('input[placeholder="Ex : Ben Ali"]').should("have.value", "Ben Ali");
    cy.get('input[placeholder="exemple@entreprise.com"]').should(
      "have.value",
      "ahmed.benali@test.com"
    );
  });

  it("devrait modifier un responsable métier avec succès", () => {
    cy.viewport(1280, 720);

    // Ouvrir le modal d'édition
    cy.contains("tr", "ahmed.benali@test.com")
      .find("button")
      .first()
      .click();

    // Modifier les champs
    cy.get('input[placeholder="Ex : Ahmed"]').clear().type(updatedUser.prenom);
    cy.get('input[placeholder="Ex : Ben Ali"]').clear().type(updatedUser.nom);

    // Soumettre
    cy.contains("button", "Enregistrer").click();

    // Vérifier la requête
    cy.wait("@updateUser");

    // Vérifier que le modal se ferme
    cy.contains("Modifier un responsable métier").should("not.exist");
  });

  // ================= SUPPRESSION =================
  it("devrait ouvrir le modal de confirmation de suppression", () => {
    cy.viewport(1280, 720);

    // Cliquer sur le bouton supprimer
    cy.contains("tr", "sami.trabelsi@test.com")
      .find("button")
      .last()
      .click();

    // Vérifier le modal de confirmation
    cy.contains("Supprimer le responsable métier").should("be.visible");
    cy.contains("Cette action est irréversible").should("be.visible");
    cy.contains("sami.trabelsi@test.com").should("be.visible");
  });

  it("devrait supprimer un responsable métier avec succès", () => {
    cy.viewport(1280, 720);

    // Ouvrir le modal de suppression
    cy.contains("tr", "sami.trabelsi@test.com")
      .find("button")
      .last()
      .click();

    // Confirmer la suppression
    cy.get("button.bg-red-500").contains("Supprimer").click();

    // Vérifier la requête
    cy.wait("@deleteUser");

    // Vérifier que le modal se ferme
    cy.contains("Supprimer le responsable métier").should("not.exist");
  });

  it("devrait annuler la suppression", () => {
    cy.viewport(1280, 720);

    // Ouvrir le modal de suppression
    cy.contains("tr", "sami.trabelsi@test.com")
      .find("button")
      .last()
      .click();

    // Annuler
    cy.contains("button", "Annuler").click();

    // Vérifier que le modal se ferme
    cy.contains("Supprimer le responsable métier").should("not.exist");
  });

  // ================= RESPONSIVE =================
  it("devrait afficher les cartes sur mobile", () => {
    cy.viewport(375, 667);

    // Les cartes mobiles doivent être visibles
    cy.get(".lg\\:hidden").should("be.visible");
    mockUsers.forEach((u) => {
      cy.get(".lg\\:hidden").contains(u.email).should("be.visible");
    });
  });

  it("devrait pouvoir éditer depuis la vue mobile", () => {
    cy.viewport(375, 667);

    // Trouver la carte mobile et cliquer sur éditer
    cy.get(".lg\\:hidden")
      .contains(mockUsers[0].email)
      .parents(".rounded-3xl")
      .find("button")
      .first()
      .click();

    // Vérifier que le modal s'ouvre
    cy.contains("Modifier un responsable métier").should("be.visible");
  });

  it("devrait pouvoir supprimer depuis la vue mobile", () => {
    cy.viewport(375, 667);

    // Trouver la carte mobile et cliquer sur supprimer
    cy.get(".lg\\:hidden")
      .contains(mockUsers[0].email)
      .parents(".rounded-3xl")
      .find("button")
      .last()
      .click();

    // Vérifier que le modal s'ouvre
    cy.contains("Supprimer le responsable métier").should("be.visible");
  });

  // ================= PAGINATION =================
  it("devrait afficher la pagination", () => {
    cy.viewport(1280, 720);
    cy.contains("Total :").should("be.visible");
  });

  // ================= VALIDATION FORMULAIRE =================
  it("devrait exiger les champs obligatoires", () => {
    cy.viewport(1280, 720);
    cy.contains("+ Ajouter un responsable").click();

    // Essayer de soumettre sans remplir
    cy.contains("button", "Enregistrer").click();

    // Le formulaire ne doit pas se fermer (validation HTML5)
    cy.get('input[placeholder="Ex : Ahmed"]').should("be.visible");
  });

  // ================= RÔLES =================
  it("devrait charger et afficher les rôles dans le select", () => {
    cy.viewport(1280, 720);
    cy.contains("+ Ajouter un responsable").click();

    // Vérifier que les rôles sont chargés
    cy.get("select").should("be.visible");
    mockRoles.forEach((r) => {
      cy.get("select").should("contain", r.name);
    });
  });
});