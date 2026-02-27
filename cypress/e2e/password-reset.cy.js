// cypress/e2e/password-reset.cy.js

describe("Password Reset Flow", () => {
    const testEmail = "test@optylab.tn";
    const nonExistentEmail = "nonexistent@optylab.tn";
    const newPassword = "NewPassword123";

    beforeEach(() => {
        cy.window().then((win) => {
            win.sessionStorage.clear();
        });
    });

    /* ========================================
       FORGOT PASSWORD PAGE TESTS
    ======================================== */
    describe("Forgot Password Page", () => {
        beforeEach(() => {
            cy.visit("/login");
            // ✅ D'abord cliquer sur le lien "Mot de passe oublié" dans le formulaire LOGIN
            cy.get('button').contains("Mot de passe oublié").click();
            // Attendre l'animation du slide
            cy.wait(1000);
        });

        it("should display forgot password form", () => {
            // ✅ Vérifier les éléments du formulaire forgot password (panneau de gauche)
            cy.contains("h2", "Mot de passe oublié").should("be.visible");
            cy.contains("Entrez votre email pour recevoir un code").should("be.visible");
            cy.contains("button", "Envoyer le code").should("be.visible");
        });

        it("should show error for non-existent email", () => {
            cy.intercept("POST", "**/password/forgot", {
                statusCode: 404,
                body: { message: "Aucun compte n'est associé à cet email" },
            }).as("forgotPassword");

            // ✅ Cibler l'input visible dans le formulaire forgot password
            cy.get('input[type="email"]:visible').clear().type(nonExistentEmail);
            cy.contains("button", "Envoyer le code").click();

            cy.wait("@forgotPassword");
            cy.contains("Aucun compte n'est associé à cet email").should("be.visible");
        });

        it("should send reset code for valid email", () => {
            cy.intercept("POST", "**/password/forgot", {
                statusCode: 200,
                body: {
                    message: "Un code de réinitialisation a été envoyé",
                    email: testEmail,
                    exists: true
                },
            }).as("forgotPassword");

            cy.get('input[type="email"]:visible').clear().type(testEmail);
            cy.contains("button", "Envoyer le code").click();

            cy.wait("@forgotPassword");
            cy.contains("Un code a été envoyé").should("be.visible");
            cy.url().should("include", "/verify-code");
        });

        it("should navigate back to login", () => {
            cy.contains("Retour à la connexion").click();
            cy.wait(1000);
            // Vérifier qu'on est revenu au formulaire login
            cy.contains("h2", "Connexion Recruteur").should("be.visible");
        });
    });

    /* ========================================
       VERIFY CODE PAGE TESTS
    ======================================== */
    describe("Verify Code Page", () => {
        beforeEach(() => {
            cy.visit("/verify-code", {
                onBeforeLoad(win) {
                    win.sessionStorage.setItem("resetEmail", testEmail);
                },
            });
        });

        it("should display verify code form", () => {
            cy.contains("Vérification du code").should("be.visible");
            cy.contains(testEmail).should("be.visible");
            cy.get('input[inputmode="numeric"]').should("have.length", 6);
        });

        it("should redirect to login if no email in session", () => {
            cy.window().then((win) => {
                win.sessionStorage.clear();
            });
            cy.visit("/verify-code");
            cy.url().should("include", "/login");
        });

        it("should show error for invalid code", () => {
            cy.intercept("POST", "**/password/verify-code", {
                statusCode: 400,
                body: { message: "Code invalide ou expiré" },
            }).as("verifyCode");

            cy.get('input[inputmode="numeric"]').each(($input, index) => {
                cy.wrap($input).type("0");
            });

            cy.wait("@verifyCode");
            cy.contains("Code invalide ou expiré").should("be.visible");
        });

        it("should redirect to reset password page on valid code", () => {
            cy.intercept("POST", "**/password/verify-code", {
                statusCode: 200,
                body: { verified: true, email: testEmail },
            }).as("verifyCode");

            const code = "123456";
            cy.get('input[inputmode="numeric"]').each(($input, index) => {
                cy.wrap($input).type(code[index]);
            });

            cy.wait("@verifyCode");
            cy.url().should("include", "/reset-password");
        });

        it("should resend code successfully", () => {
            cy.intercept("POST", "**/password/resend-code", {
                statusCode: 200,
                body: { message: "Un nouveau code a été envoyé" },
            }).as("resendCode");

            cy.contains("Renvoyer le code").click();
            cy.wait("@resendCode");
            cy.contains(/Renvoyer le code \(\d+s\)/).should("be.visible");
        });
    });

    /* ========================================
       RESET PASSWORD PAGE TESTS
    ======================================== */
    describe("Reset Password Page", () => {
        beforeEach(() => {
            cy.visit("/reset-password", {
                onBeforeLoad(win) {
                    win.sessionStorage.setItem("resetEmail", testEmail);
                    win.sessionStorage.setItem("resetCode", "123456");
                },
            });
        });

        it("should display reset password form", () => {
            cy.contains("Nouveau mot de passe").should("be.visible");
            cy.get('input[name="newPassword"]').should("be.visible");
            cy.get('input[name="confirmPassword"]').should("be.visible");
            cy.contains("button", "Réinitialiser le mot de passe").should("be.visible");
        });

        it("should redirect if no email/code in session", () => {
            cy.window().then((win) => {
                win.sessionStorage.clear();
            });
            cy.visit("/reset-password");
            // ✅ Utiliser une assertion simple ou une regex
            cy.url().should("match", /\/(forgot-password|login)/);
        });
        it("should show error for short password", () => {
            cy.get('input[name="newPassword"]').type("123");
            cy.get('input[name="confirmPassword"]').type("123");
            cy.contains("button", "Réinitialiser le mot de passe").click();

            cy.contains("Le mot de passe doit contenir au moins 6 caractères").should("be.visible");
        });

        it("should show error for non-matching passwords", () => {
            cy.get('input[name="newPassword"]').type("Password123");
            cy.get('input[name="confirmPassword"]').type("DifferentPassword");
            cy.contains("button", "Réinitialiser le mot de passe").click();

            cy.contains("Les mots de passe ne correspondent pas").should("be.visible");
        });

        it("should show password match indicator", () => {
            cy.get('input[name="newPassword"]').type("Password123");
            cy.get('input[name="confirmPassword"]').type("Password123");
            cy.contains("Les mots de passe correspondent").should("be.visible");
        });

        it("should toggle password visibility", () => {
            cy.get('input[name="newPassword"]').type("Password123");
            cy.get('input[name="newPassword"]').should("have.attr", "type", "password");

            // Cliquer sur le bouton toggle
            cy.get('input[name="newPassword"]').siblings("button").click();
            cy.get('input[name="newPassword"]').should("have.attr", "type", "text");
        });

        it("should reset password successfully", () => {
            cy.intercept("POST", "**/password/reset", {
                statusCode: 200,
                body: { success: true, message: "Mot de passe réinitialisé avec succès" },
            }).as("resetPassword");

            cy.get('input[name="newPassword"]').type(newPassword);
            cy.get('input[name="confirmPassword"]').type(newPassword);
            cy.contains("button", "Réinitialiser le mot de passe").click();

            cy.wait("@resetPassword");
            cy.contains("Mot de passe réinitialisé").should("be.visible");
            cy.url({ timeout: 5000 }).should("include", "/login");
        });

        it("should show error on reset failure", () => {
            cy.intercept("POST", "**/password/reset", {
                statusCode: 400,
                body: { message: "Code invalide ou expiré" },
            }).as("resetPassword");

            cy.get('input[name="newPassword"]').type(newPassword);
            cy.get('input[name="confirmPassword"]').type(newPassword);
            cy.contains("button", "Réinitialiser le mot de passe").click();

            cy.wait("@resetPassword");
            cy.contains("Code invalide ou expiré").should("be.visible");
        });
    });

    /* ========================================
       FULL E2E FLOW TEST
    ======================================== */
    describe("Complete Password Reset Flow", () => {
        it("should complete full password reset flow", () => {
            // Step 1: Go to login and click forgot password
            cy.visit("/login");
            cy.get('button').contains("Mot de passe oublié").click();
            cy.wait(1000);

            // Step 2: Enter email
            cy.intercept("POST", "**/password/forgot", {
                statusCode: 200,
                body: { message: "Code envoyé", email: testEmail, exists: true },
            }).as("forgotPassword");

            cy.get('input[type="email"]:visible').clear().type(testEmail);
            cy.contains("button", "Envoyer le code").click();
            cy.wait("@forgotPassword");

            // Step 3: Verify code
            cy.url().should("include", "/verify-code");

            cy.intercept("POST", "**/password/verify-code", {
                statusCode: 200,
                body: { verified: true, email: testEmail },
            }).as("verifyCode");

            const code = "123456";
            cy.get('input[inputmode="numeric"]').each(($input, index) => {
                cy.wrap($input).type(code[index]);
            });
            cy.wait("@verifyCode");

            // Step 4: Reset password
            cy.url().should("include", "/reset-password");

            cy.intercept("POST", "**/password/reset", {
                statusCode: 200,
                body: { success: true },
            }).as("resetPassword");

            cy.get('input[name="newPassword"]').type(newPassword);
            cy.get('input[name="confirmPassword"]').type(newPassword);
            cy.contains("button", "Réinitialiser le mot de passe").click();
            cy.wait("@resetPassword");

            // Step 5: Verify success and redirect
            cy.contains("Mot de passe réinitialisé").should("be.visible");
            cy.url({ timeout: 5000 }).should("include", "/login");
        });
    });
});