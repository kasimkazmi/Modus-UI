import { expect, test, type Page } from "@playwright/test";
import { registry } from "../../src/registry";

/**
 * Collects uncaught exceptions, console errors and failed same-origin requests.
 * Third-party failures (e.g. GitHub API rate limits) are network weather, not bugs,
 * so their responses and the matching "Failed to load resource" console lines are ignored.
 */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  const origin = new URL(test.info().project.use.baseURL!).origin;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === origin) {
      errors.push(`${r.status()} ${r.url()}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      errors.push(message.text());
    }
  });
  return errors;
}

/**
 * Whether anything in the preview is actually shown. Opacity is multiplied up
 * the tree, so content at opacity 1 inside a wrapper stuck at 0 counts as hidden:
 * an entrance animation that never settles passes `toBeVisible` but shows nothing.
 */
async function showsContent(page: Page): Promise<boolean> {
  return page.locator("[data-preview-stage]").evaluate((root: HTMLElement) => {
    const opacity = (node: HTMLElement) => {
      let value = 1;
      for (
        let el: HTMLElement | null = node;
        el && el !== root.parentElement;
        el = el.parentElement
      ) {
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") return 0;
        value *= Number(style.opacity || "1");
      }
      return value;
    };
    return [...root.querySelectorAll<HTMLElement>("*")].some((el) => {
      const box = el.getBoundingClientRect();
      const painted =
        el instanceof HTMLCanvasElement ||
        el instanceof SVGElement ||
        el instanceof HTMLImageElement ||
        [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      return painted && box.width > 0 && box.height > 0 && opacity(el) > 0.5;
    });
  });
}

test.describe.configure({ mode: "parallel" });

for (const { name } of registry) {
  test.describe(name, () => {
    test("docs page renders without errors", async ({ page }) => {
      const errors = trackErrors(page);
      const response = await page.goto(`/docs/${name}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("tab", { name: "preview" })).toBeVisible();
      await expect(page.getByText(`npx modus-ui add ${name}`).first()).toBeAttached();
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    });

    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      test(`preview settles visibly (motion: ${reducedMotion})`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        const errors = trackErrors(page);
        const response = await page.goto(`/preview/${name}`);
        expect(response?.status()).toBe(200);
        await expect.poll(() => showsContent(page), { timeout: 5_000 }).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}
