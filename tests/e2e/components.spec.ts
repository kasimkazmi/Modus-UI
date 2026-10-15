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
      // Backgrounds only count on leaves (e.g. decorative lines); a wrapper's
      // backdrop would otherwise mask content that never appeared.
      const style = getComputedStyle(el);
      const painted =
        (el.childElementCount === 0 &&
          (style.backgroundColor !== "rgba(0, 0, 0, 0)" || style.backgroundImage !== "none")) ||
        el instanceof HTMLCanvasElement ||
        el instanceof SVGElement ||
        el instanceof HTMLImageElement ||
        [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      return painted && box.width > 0 && box.height > 0 && opacity(el) > 0.5;
    });
  });
}

/**
 * Readable or clickable elements in the docs preview that the frame cuts off. Full-bleed
 * canvases and backgrounds are expected to fill (and clip at) the frame, so only text,
 * controls and images count, and content inside a deliberate scroller (overflow auto/scroll,
 * e.g. a marquee track) is skipped.
 */
async function clippedInPreview(page: Page): Promise<string[]> {
  return page.getByRole("tabpanel").evaluate((panel: HTMLElement) => {
    const frame = panel.getBoundingClientRect();
    // The outermost clipping box is the demo's frame. If a clipping container nested inside it
    // already cuts the element off (a marquee track, a zoom viewer, a scroller), that is by design.
    const scrolls = (el: Element) => {
      const clippers: Element[] = [];
      for (let n = el.parentElement; n && n !== panel; n = n.parentElement) {
        if (getComputedStyle(n).overflowX !== "visible") clippers.push(n);
      }
      const box = el.getBoundingClientRect();
      // Every clipper but the outermost, plus the outermost too when it is narrower than the
      // frame: that is the component's own window (a carousel viewport), not the frame.
      const own = clippers.filter(
        (c, i) => i < clippers.length - 1 || c.getBoundingClientRect().width < frame.width - 24,
      );
      return own.some((c) => {
        const { overflowX } = getComputedStyle(c);
        const r = c.getBoundingClientRect();
        return (
          overflowX === "auto" ||
          overflowX === "scroll" ||
          box.left < r.left - 2 ||
          box.right > r.right + 2
        );
      });
    };
    // Opacity multiplies up the tree, so a page parked at opacity 0 hides its contents too.
    const visible = (el: HTMLElement) => {
      if (getComputedStyle(el).visibility === "hidden") return false;
      let opacity = 1;
      for (let n: HTMLElement | null = el; n && n !== panel; n = n.parentElement) {
        const style = getComputedStyle(n);
        if (style.display === "none") return false;
        opacity *= Number(style.opacity || "1");
      }
      return opacity > 0.05;
    };
    const content = [
      ...panel.querySelectorAll<HTMLElement>("button, a, input, img, [role]"),
    ].concat(
      [...panel.querySelectorAll<HTMLElement>("*")].filter((el) =>
        [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()),
      ),
    );
    return content
      .filter((el) => {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || !visible(el) || scrolls(el)) return false;
        return box.left < frame.left - 2 || box.right > frame.right + 2;
      })
      .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`);
  });
}

// Demos whose content runs past the frame by design. Dome Gallery tiles the inside of a
// sphere, so tiles always extend beyond the viewport at any size.
const RUNS_PAST_FRAME = new Set<string>(["dome-gallery"]);

test.describe.configure({ mode: "parallel" });

for (const { name } of registry) {
  test.describe(name, () => {
    test("docs page renders without errors", async ({ page }) => {
      const errors = trackErrors(page);
      const response = await page.goto(`/components/${name}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("tab", { name: "preview" })).toBeVisible();
      await expect(page.getByText(`npx @modus-ui/cli add ${name}`).first()).toBeAttached();
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    });

    test("docs page fits a phone screen", async ({ page }) => {
      test.skip(test.info().project.name !== "mobile", "phone layout only");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/components/${name}`);
      await expect(page.getByRole("tabpanel")).toBeVisible();
      await page.waitForTimeout(800);
      const width = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      expect(width[0], "page scrolls sideways").toBeLessThanOrEqual(width[1]);
      if (!RUNS_PAST_FRAME.has(name)) expect(await clippedInPreview(page)).toEqual([]);
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
