import { test, expect } from "@playwright/test";
import { authenticateInBrowser, isAuthenticated } from "./utils/auth";

test.describe("User Authentication", () => {
  test("should authenticate using dev fields", async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL!;
    const testPassword = process.env.TEST_USER_PASSWORD!;

    console.log("🔄 Testing authentication with dev fields...");

    // Go to signin page
    await page.goto("/signin");
    await page.waitForLoadState("networkidle");

    // Verify dev fields are present
    const emailField = page.locator('input[placeholder="Email (Dev only)"]');
    const passwordField = page.locator(
      'input[placeholder="Password (Dev only)"]',
    );
    const devButton = page.locator('button:has-text("Sign In (Dev)")');

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(devButton).toBeVisible();

    // Fill in the dev fields
    await emailField.fill(testEmail);
    await passwordField.fill(testPassword);

    // Click the dev signin button and wait for navigation
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes("/signin"), {
        timeout: 5000,
      }),
      devButton.click(),
    ]);

    // Additional wait to ensure page is fully loaded
    await page.waitForLoadState("domcontentloaded");

    // Log current URL for debugging
    console.log("✓ After login, current URL:", page.url());

    // Verify authentication was successful
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBeTruthy();

    console.log("✓ Dev authentication successful");
    console.log("✓ Current URL:", page.url());
  });

  test("should access dashboard page successfully", async ({ page }) => {
    console.log("🔄 Testing dashboard access after authentication...");

    // Use the authenticateInBrowser function
    await authenticateInBrowser(page);

    // Try to navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify authentication was successful
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBeTruthy();

    console.log("✓ Dashboard access successful");
    console.log("✓ Current URL:", page.url());
  });
});
