import { expect, test } from "@playwright/test";

test("llms.txt indexes the components", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const body = await res.text();
  expect(body).toMatch(/^# Modus UI/);
  expect(body).toContain("/docs/blur-text.md");
});

test("llms-full.txt includes docs and source", async ({ request }) => {
  const res = await request.get("/llms-full.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const body = await res.text();
  expect(body).toContain("npx @modus-ui/cli add blur-text");
  expect(body).toContain("```tsx");
});

test("/docs/<name>.md serves one component as markdown", async ({ request }) => {
  const res = await request.get("/docs/blur-text.md");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/markdown");
  const body = await res.text();
  expect(body).toMatch(/^# Blur Text/);
  expect(body).toContain("npx @modus-ui/cli add blur-text");
  expect(body).not.toContain("<ComponentPreview");
  expect(body).toContain("export function BlurText");
});

test("unknown component markdown is a 404", async ({ request }) => {
  expect((await request.get("/docs/does-not-exist.md")).status()).toBe(404);
});
