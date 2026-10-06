import { expect, test } from "@playwright/test";

test("docs open on the installation guide", async ({ page }) => {
  await page.goto("/docs");
  await expect(page).toHaveURL(/\/docs\/installation$/);
  await expect(page.getByRole("heading", { level: 1, name: "Installation" })).toBeVisible();
});

test("installation guide shows the theme tokens and CLI command", async ({ page }) => {
  await page.goto("/docs/installation");
  await expect(page.getByText("--primary-foreground:").first()).toBeAttached();
  await expect(page.getByText("npx @modus-ui/cli add blur-text magnet").first()).toBeAttached();
  await expect(page.locator("#add-components")).toBeAttached();
});
