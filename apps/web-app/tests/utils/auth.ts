import type { Page } from "@playwright/test";

/**
 * Validates that test credentials are available
 * @throws Error if credentials are missing
 */
function validateTestCredentials(): void {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      "Missing test user credentials. Ensure TEST_USER_EMAIL and TEST_USER_PASSWORD are set in your .env.local file.",
    );
  }
}

/**
 * Authenticates the test user by using the signin page.
 * This is the most reliable way as it uses the actual app's auth flow.
 *
 * @param page - The Playwright page object
 * @throws Error if authentication fails
 */
export async function authenticateInBrowser(page: Page): Promise<void> {
  validateTestCredentials();

  const testEmail = process.env.TEST_USER_EMAIL!;
  const testPassword = process.env.TEST_USER_PASSWORD!;

  try {
    // Go to signin page
    await page.goto("/signin");
    await page.waitForLoadState("networkidle");

    console.log("📍 On signin page:", page.url());

    // Verify dev fields are present before trying to use them
    await page.waitForSelector('input[placeholder="Email (Dev only)"]', {
      timeout: 10000,
    });
    await page.waitForSelector('input[placeholder="Password (Dev only)"]', {
      timeout: 5000,
    });
    await page.waitForSelector('button:has-text("Sign In (Dev)")', {
      timeout: 5000,
    });

    console.log("✓ Dev fields found");

    // Fill in the dev-specific fields
    await page.fill('input[placeholder="Email (Dev only)"]', testEmail);
    await page.fill('input[placeholder="Password (Dev only)"]', testPassword);

    console.log("✓ Credentials filled");

    // Click the dev signin button and wait for navigation
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes("/signin"), {
        timeout: 30000,
      }),
      page.click('button:has-text("Sign In (Dev)")'),
    ]);

    console.log("✓ Clicked and navigation started");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify we're no longer on signin page
    const currentUrl = page.url();
    if (currentUrl.includes("/signin")) {
      // Take a screenshot for debugging
      await page.screenshot({ path: "debug-signin-failed.png" });
      throw new Error("Authentication failed - still on signin page");
    }

    console.log(
      "✓ Browser authentication successful, redirected to:",
      currentUrl,
    );
  } catch (error) {
    console.error("Authentication failed:", error);
    // Take screenshot on error
    try {
      await page.screenshot({ path: "debug-auth-error.png" });
      console.log("💾 Screenshot saved to debug-auth-error.png");
    } catch (screenshotError) {
      console.error("Failed to take screenshot:", screenshotError);
    }
    throw new Error(`Browser authentication failed: ${error}`);
  }
}

/**
 * Saves the current browser session state to be reused in other tests.
 * Should be called after successful browser authentication.
 *
 * @param page - The Playwright page object
 */
export async function saveAuthState(page: Page): Promise<void> {
  try {
    // Save the authentication state (cookies, localStorage, etc.)
    await page.context().storageState({ path: "storageState.json" });
    console.log("✓ Authentication state saved to storageState.json");
  } catch (error) {
    console.error("Failed to save auth state:", error);
    throw error;
  }
}

/**
 * Checks if the user is currently authenticated by verifying the current page
 * @param page - The Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  console.log("Current URL for authentication check:", url);
  // If we're on signin page, definitely not authenticated
  if (url.includes("/signin")) {
    return false;
  }

  // If we're on protected pages, we're authenticated
  const protectedPaths = ["/dashboard", "/subscribe"];
  return protectedPaths.some((path) => url.includes(path));
}
