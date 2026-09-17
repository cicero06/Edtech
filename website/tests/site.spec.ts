import { test, expect } from "@playwright/test";
for (const width of [375, 768, 1440])
  for (const route of ["/", "/denge-kasabasi"]) {
    test(`${route} ${width}px: içerik, görseller ve bağlantılar`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 960 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
        "href",
        `https://atlaslearningtech.com${route}`,
      );
      await expect(page.locator("meta[name=description]")).toHaveAttribute(
        "content",
        /.{40,}/,
      );
      for (const img of await page.locator("img").all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty("complete", true);
        expect(
          await img.evaluate((el: HTMLImageElement) => el.naturalWidth),
        ).toBeGreaterThan(0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const a of await page.locator('a[href^="/#"], a[href^="#"]').all()) {
        const href = await a.getAttribute("href");
        if (href?.startsWith("#"))
          expect(await page.locator(href).count()).toBe(1);
      }
      expect(errors).toEqual([]);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `test-results/${route === "/" ? "home" : "product"}-${width}.png`,
        fullPage: true,
      });
    });
  }
test("Mobil menü: klavye, Escape, ürün sayfasından bölüm bağlantısı", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/denge-kasabasi");
  const toggle = page.locator(".menu-toggle");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Ürünümüz" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Yaklaşımımız" })
    .click();
  await expect(page).toHaveURL(/\/#yaklasimimiz$/);
  await expect(page.locator("#yaklasimimiz")).toBeInViewport();
});
test("Demo, iletişim, yenileme ve gerçek 404", async ({ page, request }) => {
  await page.goto("/denge-kasabasi");
  await page.reload();
  await expect(page.locator("h1")).toContainText("Senin kararların");
  for (const a of await page.getByRole("link", { name: /Demoyu Oyna/ }).all()) {
    await expect(a).toHaveAttribute(
      "href",
      "https://edtech-edtech8.vercel.app/",
    );
    await expect(a).toHaveAttribute("target", "_blank");
    await expect(a).toHaveAccessibleName(/yeni sekmede/);
  }
  await expect(
    page.getByRole("link", { name: "İletişime geçin", exact: false }),
  ).toHaveAttribute("href", "mailto:huseyinn.dnz@gmail.com");
  expect((await page.goto("/bulunamayan-adres"))?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("Bu yol");
  for (const path of ["/robots.txt", "/sitemap.xml", "/favicon.svg"])
    expect((await request.get(path)).status()).toBe(200);
  const html = await (await request.get("/denge-kasabasi")).text();
  expect(html).toContain("Bir kasabanın geleceği.");
  expect(html).toContain("og:title");
});
test("Hareket azaltma ve JavaScript olmadan içerik", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.locator("h1")).toContainText("Oyunla keşfet");
  await page.goto("http://127.0.0.1:4173/denge-kasabasi");
  await expect(page.locator("h1")).toContainText("Senin kararların");
  await context.close();
});
