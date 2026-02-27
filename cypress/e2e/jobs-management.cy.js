/// <reference types="cypress" />

/**
 * Tests E2E — Gestion des Offres d'emploi
 * Couverture : affichage, création, modification, suppression
 */

describe("Gestion des Offres d'emploi", () => {
  const PAGE_URL = "/recruiter/jobs"; // ✅ Corrigé: recruiter au lieu de admin

  // ================= MOCK DATA =================
  // ✅ Corrigé: noms de champs correspondant à page.jsx
  const mockJobs = [
    {
      _id: "job1",
      id: "job1",
      titre: "Développeur Frontend",
      description: "Développement d'interfaces React et Next.js",
      technologies: ["React", "Next.js", "TypeScript"],
      dateCloture: "2026-06-30",
      createdAt: "2024-01-15T10:00:00.000Z",
    },
    {
      _id: "job2",
      id: "job2",
      titre: "Développeur Backend",
      description: "Développement d'APIs Node.js",
      technologies: ["Node.js", "Express", "MongoDB"],
      dateCloture: "2026-07-15",
      createdAt: "2024-02-20T14:30:00.000Z",
    },
    {
      _id: "job3",
      id: "job3",
      titre: "DevOps Engineer",
      description: "Gestion infrastructure cloud",
      technologies: ["Docker", "Kubernetes", "AWS"],
      dateCloture: "2026-08-01",
      createdAt: "2024-03-10T09:15:00.000Z",
    },
  ];

  const mockUsers = [
    { _id: "user1", email: "user1@test.com", nom: "Test", prenom: "User" },
  ];

  const newJob = {
    titre: "Data Scientist",
    description: "Analyse de données et machine learning",
    technologies: "Python, TensorFlow, SQL",
    dateCloture: "2026-09-30",
  };

  const updatedJob = {
    titre: "Développeur Frontend Senior",
  };

  // ================= HOOK =================
  beforeEach(() => {
    cy.loginadmin();

    // Mock GET jobs
    cy.intercept("GET", "/api/jobs*", {
      statusCode: 200,
      body: mockJobs,
    }).as("getJobs");

    // Mock GET users (pour le modal)
    cy.intercept("GET", "/api/users*", {
      statusCode: 200,
      body: mockUsers,
    }).as("getUsers");

    // Mock POST job
    cy.intercept("POST", "/api/jobs*", {
      statusCode: 201,
      body: { message: "Offre créée avec succès", job: { _id: "newjob", ...newJob } },
    }).as("createJob");

    // Mock PUT/PATCH job
    cy.intercept("PUT", "/api/jobs/*", {
      statusCode: 200,
      body: { message: "Offre modifiée avec succès" },
    }).as("updateJob");

    cy.intercept("PATCH", "/api/jobs/*", {
      statusCode: 200,
      body: { message: "Offre modifiée avec succès" },
    }).as("updateJobPatch");

    // Mock DELETE job
    cy.intercept("DELETE", "/api/jobs/*", {
      statusCode: 200,
      body: { message: "Offre supprimée" },
    }).as("deleteJob");

    cy.visit(PAGE_URL);
    cy.wait("@getJobs");
  });

  // ================= AFFICHAGE =================
  describe("Affichage", () => {
    it("devrait afficher le titre de la page", () => {
      cy.contains("Offres d'emploi").should("be.visible");
    });

    it("devrait afficher toutes les offres", () => {
      mockJobs.forEach((job) => {
        cy.contains(job.titre).should("be.visible");
      });
    });

    it("devrait afficher le bouton Nouvelle offre", () => {
      cy.contains("Nouvelle offre").should("be.visible");
    });

    it("devrait afficher les cartes d'offres", () => {
      cy.get("h3").should("have.length.at.least", 1);
    });

    it("devrait afficher les technologies", () => {
      mockJobs[0].technologies.forEach((tech) => {
        cy.contains(tech).should("exist");
      });
    });

    it("devrait afficher les dates", () => {
      cy.contains("Créée").should("exist");
      cy.contains("Clôture").should("exist");
    });
  });

  // ================= CRÉATION =================
  describe("Création", () => {
    it("devrait ouvrir le modal de création", () => {
      cy.contains("Nouvelle offre").click();
      
      // Vérifier que le modal s'ouvre
      cy.contains("Ajouter une offre").should("be.visible");
      cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]').should("be.visible");
    });

    it("devrait créer une nouvelle offre avec succès", () => {
      cy.contains("Nouvelle offre").click();

      // Attendre le modal
      cy.contains("Ajouter une offre").should("be.visible");

      // Remplir le formulaire avec les bons placeholders
      cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]').type(newJob.titre);
      cy.get('textarea[placeholder*="Décrivez la mission"]').type(newJob.description);
      cy.get('input[placeholder="React, Node.js, Tailwind"]').type(newJob.technologies);
      cy.get('input[type="date"]').type(newJob.dateCloture);
      
      // Soumettre
      cy.contains("button", "Enregistrer").click();

      cy.wait("@createJob");
    });

    it("devrait fermer le modal avec Annuler", () => {
      cy.contains("Nouvelle offre").click();
      
      cy.contains("Ajouter une offre").should("be.visible");
      
      cy.contains("button", "Annuler").click();
      
      // Le modal doit se fermer
      cy.contains("Ajouter une offre").should("not.exist");
    });
  });

  // ================= MODIFICATION =================
  describe("Modification", () => {
    it("devrait ouvrir le modal de modification", () => {
      // Trouver le premier bouton contenant l'icône Edit2 dans la section actions
      // Les boutons sont dans une div flex à la fin de chaque carte
      cy.get(".rounded-2xl").first().within(() => {
        // Le premier bouton dans la zone d'actions (après le divider)
        cy.get("button").first().click();
      });
      
      // Attendre que le modal s'ouvre
      cy.contains("Modifier l'offre").should("be.visible");
    });

    it("devrait modifier une offre existante", () => {
      cy.get(".rounded-2xl").first().within(() => {
        cy.get("button").first().click();
      });

      // Attendre le modal
      cy.contains("Modifier l'offre").should("be.visible");

      // Modifier le titre
      cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]')
        .clear()
        .type(updatedJob.titre);

      cy.contains("button", "Enregistrer").click();

      cy.wait("@updateJob");
    });
  });

  // ================= SUPPRESSION =================
  describe("Suppression", () => {
    it("devrait ouvrir le modal de confirmation", () => {
      cy.get(".rounded-2xl").first().within(() => {
        // Le deuxième bouton est celui de suppression
        cy.get("button").eq(1).click();
      });

      cy.contains("Supprimer l'offre").should("be.visible");
    });

    it("devrait supprimer une offre avec succès", () => {
      cy.get(".rounded-2xl").first().within(() => {
        cy.get("button").eq(1).click();
      });

      cy.contains("Supprimer l'offre").should("be.visible");

      // Utiliser data-cy="confirm-delete"
      cy.get('[data-cy="confirm-delete"]').click();

      cy.wait("@deleteJob");

      cy.contains("Supprimer l'offre").should("not.exist");
    });

    it("devrait annuler la suppression", () => {
      cy.get(".rounded-2xl").first().within(() => {
        cy.get("button").eq(1).click();
      });

      cy.contains("Supprimer l'offre").should("be.visible");

      cy.contains("button", "Annuler").click();

      cy.contains("Supprimer l'offre").should("not.exist");
    });
  });

  // ================= PAGINATION =================
  describe("Pagination", () => {
    it("devrait afficher la pagination", () => {
      cy.contains("Total:").should("be.visible");
      cy.contains("Page").should("be.visible");
    });
  });

  // ================= LIRE LA SUITE =================
  describe("Lire la suite", () => {
    it("devrait afficher/masquer la description complète", () => {
      cy.get("body").then(($body) => {
        if ($body.find("button:contains('Lire la suite')").length > 0) {
          cy.contains("Lire la suite").first().click();
          cy.contains("Réduire").should("be.visible");
        }
      });
    });
  });

  // ================= RESPONSIVE =================
  describe("Responsive", () => {
    it("devrait s'afficher correctement sur mobile", () => {
      cy.viewport(375, 667);
      cy.contains("Offres d'emploi").should("be.visible");
    });

    it("devrait s'afficher correctement sur desktop", () => {
      cy.viewport(1280, 720);
      cy.contains("Offres d'emploi").should("be.visible");
    });
  });

  // ================= DARK MODE =================
  describe("Dark Mode", () => {
    it("devrait supporter le dark mode", () => {
      cy.document().then((doc) => {
        doc.documentElement.classList.add("dark");
      });
      cy.contains("Offres d'emploi").should("be.visible");
    });
  });
});