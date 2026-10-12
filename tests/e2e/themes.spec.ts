import { expect, test, type Page } from "@playwright/test";

const background = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

test("palette and dark mode restyle the site, persist, including previews", async ({ page }) => {
  await page.goto("/components/blur-text");
  const stage = '[role="tabpanel"]';
  const siteBefore = await background(page, "body");
  const stageBefore = await background(page, stage);

  await page.getByRole("button", { name: "Change site theme" }).first().click();
  await page.getByRole("radio", { name: "Ocean" }).click();
  await page.getByRole("radio", { name: "Dark" }).first().click();

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-palette", "ocean");
  await expect(html).toHaveClass(/\bdark\b/);
  expect(await background(page, "body")).not.toBe(siteBefore);
  expect(await background(page, stage)).not.toBe(stageBefore);

  await page.reload();
  await expect(html).toHaveAttribute("data-palette", "ocean");
  await expect(html).toHaveClass(/\bdark\b/);
});

test("first visit follows the system colour scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/components");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
});
