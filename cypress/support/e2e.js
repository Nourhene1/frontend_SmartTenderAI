// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import "cypress-file-upload";
// cypress/support/e2e.js

Cypress.on("uncaught:exception", (err) => {
  // ✅ Ignorer seulement l'erreur Next.js Hydration mismatch
  if (
    err.message?.includes("Hydration failed") ||
    err.message?.includes("did not match") ||
    err.message?.includes("hydration-mismatch")
  ) {
    return false; // empêche Cypress de fail
  }

  // sinon, laisser Cypress échouer normalement
  return true;
});
