import { expect, test } from "@playwright/test";

const bodyBackground = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test("switching theme restyles the site, persists, and leaves previews on Modus", async ({
  page,
}) => {
  await page.goto("/docs/blur-text");
  const modusBackground = await bodyBackground(page);
  const stage = page.locator('[data-theme="modus"]').first();
  const stageBefore = await stage.evaluate((el) => getComputedStyle(el).fontFamily);

  await page.getByRole("button", { name: "Change site theme" }).first().click();
  await page.getByRole("radio", { name: /Midnight/ }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "midnight");
  expect(await bodyBackground(page)).not.toBe(modusBackground);
  expect(await stage.evaluate((el) => getComputedStyle(el).fontFamily)).toBe(stageBefore);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "midnight");
});
