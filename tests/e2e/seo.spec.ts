import { expect, test } from "@playwright/test";

test("sitemap.xml and robots.txt are served", async ({ request }) => {
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect((await request.get("/robots.txt")).status()).toBe(200);
});

test("component docs have canonical and Open Graph metadata", async ({ page, request }) => {
  await page.goto("/docs/blur-text");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/docs\/blur-text$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);

  const image = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(image).toBeTruthy();
  // og:image is absolute on the production domain; fetch the same path from the server under test.
  const { pathname, search } = new URL(image!);
  const response = await request.get(pathname + search);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\//);
});

test("preview pages are not indexed", async ({ page }) => {
  await page.goto("/preview/blur-text");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
