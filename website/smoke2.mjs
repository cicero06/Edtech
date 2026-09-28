import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const state1 = await page.evaluate(() => ({
  railVisible: getComputedStyle(document.querySelector(".route-rail")).display,
  dots: document.querySelectorAll(".route-dot").length,
  fillDash: document.querySelector(".route-fill")?.style.strokeDashoffset,
  marquee: !!document.querySelector(".marquee-track"),
  lina: !!document.querySelector(".route-lina"),
  heroLina: !!document.querySelector(".hero-lina"),
  sysNodes: document.querySelectorAll(".sys-node").length,
  words: document.querySelectorAll(".intro-inner h2 .w").length,
}));
await page.evaluate(() => window.scrollBy(0, 3000));
await page.waitForTimeout(1200);
const state2 = await page.evaluate(() => ({
  fillDashAfter: document.querySelector(".route-fill")?.style.strokeDashoffset,
  linaY: getComputedStyle(document.querySelector(".route-lina")).transform,
  dotsOn: document.querySelectorAll(".route-dot.on").length,
}));
console.log("STATE1:", JSON.stringify(state1));
console.log("STATE2:", JSON.stringify(state2));
console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
