/// <reference types="cypress" />

describe("Mes candidatures – utilisateur", () => {
  const PAGE_URL = "/ResponsableMetier/candidatures";

  const mockUser = {
    _id: "u1",
    role: "RESPONSABLE_RH",
    email: "user@test.tn",
  };

  const mockCandidatures = [
    {
      _id: "c1",
      jobTitle: "Responsable IT",
      extracted: {
        personal_info: {
          nom: "Ali Ben Salah",
          email: "ali@test.tn",
          telephone: "22123456",
        },
      },
    },
  ];

  beforeEach(() => {
    // ✅ Intercepter LA VRAIE requête backend
    cy.intercept(
      "GET",
      "**/candidatures/my",
      {
        statusCode: 200,
        body: mockCandidatures,
      }
    ).as("getMyCandidatures");

    // ✅ Simuler utilisateur connecté AVANT React
    cy.visit(PAGE_URL, {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-jwt-token");
        win.localStorage.setItem("user", JSON.stringify(mockUser));
      },
    });

    // ✅ Attendre la requête réelle
    cy.wait("@getMyCandidatures");
  });

  it("devrait afficher le titre de la page", () => {
    cy.contains("Mes candidatures").should("be.visible");
  });

  it("devrait afficher le rôle de l'utilisateur", () => {
    cy.contains("Rôle: RESPONSABLE_RH").should("be.visible");
  });

  it("devrait afficher la liste des candidatures", () => {
    cy.contains("Ali Ben Salah").should("be.visible");
    cy.contains("Responsable IT").should("be.visible");
    cy.contains("ali@test.tn").should("be.visible");
    cy.contains("22123456").should("be.visible");
  });
});
