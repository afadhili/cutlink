import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";
import jsQR from "jsqr";
test("dashboard works on desktop and mobile with persistent themes", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A little less. A lot more." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Use light theme" }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: testInfo.outputPath("dashboard-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Text sharing", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A space for your words." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("shortens links, redirects, displays statistics and remembers history", async ({
  page,
  request,
}) => {
  await page.goto("/links");
  await page
    .getByLabel("Destination URL")
    .fill("https://example.com/a?source=cutlink");
  await page.getByLabel("Custom slug").fill(`browser-${crypto.randomUUID()}`);
  await page.getByRole("button", { name: "Shorten link", exact: true }).click();
  const url = page.locator(".result-url");
  await expect(url).toBeVisible();
  const redirect = await request.get((await url.getAttribute("href"))!, {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toBe(
    "https://example.com/a?source=cutlink",
  );
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.locator(".stats-box strong")).toHaveText("1");
  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page.locator(".history-list")).toContainText(
    "https://example.com/a?source=cutlink",
  );
});
test("QR PNG and SVG exports are valid and encode the supplied text", async ({
  page,
}) => {
  const value = "https://example.com/hello?qr=1";
  await page.goto("/qr");
  await page.getByLabel("Text or URL").fill(value);
  await expect(page.getByAltText("Generated QR code")).toBeVisible();
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  const png = PNG.sync.read(
    await readFile((await (await pngDownload).path())!),
  );
  expect(png.width).toBe(512);
  expect(
    jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data,
  ).toBe(value);
  const svgDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  const svg = await readFile((await (await svgDownload).path())!, "utf8");
  expect(svg).toContain("<svg");
  expect(svg).toContain('width="512"');
});
test("one-time text requires reveal, safely renders content and becomes unavailable", async ({
  page,
  request,
}) => {
  const content =
    '<img src=x onerror="window.hacked=true">\n<script>alert(1)</script>\nA useful note.';
  await page.goto("/share");
  await page.getByLabel("Title").fill("Browser share");
  await page.getByLabel("Your text").fill(content);
  await page.getByLabel("Burn after reading").check();
  await page.getByRole("button", { name: "Create text share" }).click();
  await expect(page.locator(".result-url")).toBeVisible();
  const shareUrl = (await page.locator(".result-url").getAttribute("href"))!;
  await page.goto(shareUrl);
  await expect(page.getByRole("button", { name: "Reveal text" })).toBeVisible();
  await page.getByRole("button", { name: "Reveal text" }).click();
  await expect(page.locator(".shared-text")).toHaveText(content);
  expect(
    await page.locator(".shared-text img, .shared-text script").count(),
  ).toBe(0);
  const slug = new URL(shareUrl).pathname.split("/").at(-1);
  expect(
    (
      await request.get(`http://localhost:3001/api/v1/snippets/${slug}`)
    ).status(),
  ).toBe(404);
  await page.reload();
  await page.getByRole("button", { name: "Reveal text" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "missing, expired, or has reached",
  );
});
test("API failures remain visible and never show a fabricated success", async ({
  page,
}) => {
  await page.route("**/api/v1/links", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "Test server failure." },
      }),
    }),
  );
  await page.goto("/links");
  await page.getByLabel("Destination URL").fill("https://example.com");
  await page.getByRole("button", { name: "Shorten link", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Test server failure.");
  await expect(page.locator(".result-url")).toHaveCount(0);
});
