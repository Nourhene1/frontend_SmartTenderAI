describe("Candidature - Step 1 Upload + Step 2 Vérification", () => {
  const jobId = "69612594fa71bdcfbe479de5";

  beforeEach(() => {
    cy.visit(`http://localhost:3000/jobs/${jobId}/apply`);
  });

  it("Flow complet : Upload -> Step2 -> toutes les sections -> Envoyer", () => {
    // ===== MOCK UPLOAD CV =====
    cy.intercept("POST", `**/api/applications/${jobId}/cv`, {
      statusCode: 200,
      body: {
        candidatureId: "fake_candidature_id_123",
        cvFileUrl: "/uploads/cvs/test.pdf",
        extracted: {
          nom: "Test User",
          email: "test.user@gmail.com",
          telephone: "+216 99 999 999",
          adresse: "Sfax",
          titre_poste: "Développeur",
          profil: "Profil test",

          competences: { all: ["React", "Node.js"] },

          formation: [
            {
              diplome: "Licence Informatique",
              etablissement: "ISET Sfax",
              periode: "2021 - 2024",
            },
          ],

          experience_professionnelle: [],
          projets: [],
          certifications: [],
          langues: [],
          activites: ["Sport"],

          reseaux_sociaux: {
            linkedin: "linkedin.com/in/test",
            github: "github.com/test",
          },

          personal_info: {
            date_naissance: "01/01/2000",
            lieu_naissance: "Tunis",
            numero_cin: "12345678",
            cin_delivree_le: "01/01/2018",
            cin_delivree_a: "Sfax",
            code_postal: "3000",
            permis_conduire: "Non",
            date_obtention_permis: "",
            situation_familiale: "Célibataire",
            nombre_enfants: "",
          },
        },
      },
    }).as("uploadCV");

    // ===== STEP 1: Upload CV =====
    cy.get('[data-cy="cv-input"]').selectFile("cypress/fixtures/test.pdf", {
      force: true,
    });

    cy.get('[data-cy="submit-cv-btn"]').click();
    cy.wait("@uploadCV");

    // Vérifier passage à l'étape 2
    cy.contains("Vérification").should("exist");

    // ===== MOCK CONFIRM CANDIDATURE =====
    cy.intercept(
      "POST",
      "**/api/applications/fake_candidature_id_123/confirm",
      {
        statusCode: 200,
        body: { message: "OK" },
      }
    ).as("submitCandidature");

    // ===== HELPERS =====
    const clickNext = () => {
      cy.contains("button", /Continuer|Suivant|→/).click({ force: true });
      cy.wait(500);
    };

    // ===== 1) INFORMATIONS PERSONNELLES =====
    cy.contains("Informations personnelles").should("exist");
    clickNext();

    // ===== 2) PROFIL =====
    cy.contains("Profil").should("exist");
    cy.get('textarea').first().clear().type("Je suis un profil modifié par Cypress.");
    clickNext();

    // ===== 3) COMPÉTENCES =====
    cy.contains("Compétences").should("exist");

    // Ajouter une compétence - utiliser le placeholder ou le texte du bouton
  cy.get('[data-cy="new-skill"]')
  .should('be.visible')
  .type('MongoDB');

cy.get('[data-cy="add-skill-btn"]').click();

    
    // Cliquer sur le bouton Ajouter (chercher par texte)
    cy.contains("button", /^Ajouter$/).click();
    cy.contains("MongoDB").should("exist");

    clickNext();

    // ===== 4) FORMATION =====
    cy.contains("Formation").should("exist");

    // Cliquer sur + Ajouter
    cy.contains("button", /Ajouter|\+/).first().click();

    cy.get('input[placeholder*="diplome"], input[placeholder*="Licence"], input[placeholder*="Diplôme"]')
      .last()
      .type("Master GL");
    cy.get('input[placeholder*="établissement"], input[placeholder*="ISET"], input[placeholder*="Établissement"]')
      .last()
      .type("ISET Sfax");
    cy.get('input[placeholder*="période"], input[placeholder*="2022"], input[placeholder*="Période"]')
      .last()
      .type("2024 - 2026");

    clickNext();

    // ===== 5) EXPÉRIENCE PROFESSIONNELLE =====
    cy.contains(/Expérience/i).should("exist");

    cy.contains("button", /Ajouter|\+/).first().click();

    cy.get('input[placeholder*="poste"], input[placeholder*="Fullstack"], input[placeholder*="Poste"]')
      .last()
      .type("Développeuse Fullstack");
    cy.get('input[placeholder*="entreprise"], input[placeholder*="MTR"], input[placeholder*="Entreprise"]')
      .last()
      .type("Optylab");

    clickNext();

    // ===== 6) PROJETS =====
    cy.contains("Projets").should("exist");

    cy.contains("button", /Ajouter|\+/).first().click();

    cy.get('input[placeholder*="projet"], input[placeholder*="YnityLearn"], input[placeholder*="Nom"]')
      .last()
      .type("Projet Cypress");

    clickNext();

    // ===== 7) CERTIFICATIONS =====
    cy.contains("Certifications").should("exist");

    cy.contains("button", /Ajouter|\+/).first().click();

    cy.get('input[placeholder*="certification"], input[placeholder*="ISTQB"], input[placeholder*="Nom"]')
      .last()
      .type("ISTQB Foundation");

    clickNext();

    // ===== 8) LANGUES =====
    cy.contains("Langues").should("exist");

    cy.contains("button", /Ajouter|\+/).first().click();

    cy.get('input[placeholder*="langue"], input[placeholder*="Français"]')
      .last()
      .type("Français");

    clickNext();

    // ===== 9) CENTRES D'INTÉRÊT =====
    cy.contains(/intérêt/i).should("exist");

    cy.get('textarea, input[type="text"]')
      .last()
      .clear()
      .type("Sport, Lecture, Musique");

    // ===== SOUMETTRE LA CANDIDATURE =====
    cy.contains("button", /Envoyer|Soumettre|candidature/i).click();

    // Vérifier la requête
    cy.wait("@submitCandidature");

    // Vérifier le message de succès
    cy.contains(/succès|envoyée/i).should("exist");
  });
});