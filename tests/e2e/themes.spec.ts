import { expect, test, type Page } from "@playwright/test";

const background = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

test("palette and dark mode restyle the site, persist, and leave previews on Modus", async ({
  page,
}) => {
  await page.goto("/docs/blur-text");
  const stage = '[data-palette="modus"]:not(html)';
  const siteBefore = await background(page, "body");
  const stageBefore = await background(page, stage);

  await page.getByRole("button", { name: "Change site theme" }).first().click();
  await page.getByRole("radio", { name: "Ocean" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-palette", "ocean");
  await expect(html).toHaveClass(/\bdark\b/);
  expect(await background(page, "body")).not.toBe(siteBefore);
  expect(await background(page, stage)).toBe(stageBefore);

  await page.reload();
  await expect(html).toHaveAttribute("data-palette", "ocean");
  await expect(html).toHaveClass(/\bdark\b/);
});
