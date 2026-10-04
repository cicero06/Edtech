import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "@playwright/test";
import fs from "node:fs";

const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".json": "application/json",
};

// 1. Static Preview Server
const server = http.createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file = resolve(root, "." + path);
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403);
    return res.end();
  }
  let status = 200;
  try {
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    await stat(file);
  } catch {
    status = 404;
    file = resolve(root, "404.html");
  }
  try {
    const body = await readFile(file);
    res.writeHead(status, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end("Server Error");
  }
});

const PORT = 4176;
await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
console.log(`[TRAILER ENGINE] Server listening on http://127.0.0.1:${PORT}`);

const outputDir = resolve("videos");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const f of fs.readdirSync(outputDir)) {
  if (f.endsWith(".webm") || f.endsWith(".mp4")) {
    fs.unlinkSync(resolve(outputDir, f));
  }
}

console.log("[TRAILER ENGINE] Launching 1080p Chromium with 60fps recording...");
const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-web-security",
    "--autoplay-policy=no-user-gesture-required",
  ],
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: {
    dir: outputDir,
    size: { width: 1920, height: 1080 },
  },
});

const page = await context.newPage();
const BASE = `http://127.0.0.1:${PORT}/denge-kasabasi/ongosteri/`;
const KEY = "denge-kasabasi-session-v2";

const initialSession = {
  player: { name: "Atlas", avatar: "player" },
  quest: "investigate",
  completedCards: [],
  notebook: [],
  evidence: [],
  plan: null,
  announcedNpcIds: [],
  posterHung: true,
  implPhase: -1,
  stats: { environment: 50, economy: 50, society: 50, water: 50 },
  muted: false,
  savedAt: Date.now(),
};

await page.addInitScript(([k, s]) => {
  localStorage.setItem(k, JSON.stringify(s));
}, [KEY, initialSession]);

console.log("[TRAILER ENGINE] Navigating to Denge Kasabası...");
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(1000);

const resumeBtn = page.locator('button:has-text("Devam et —")');
if (await resumeBtn.isVisible()) {
  await resumeBtn.click();
}
await page.waitForTimeout(1800);

// Helper for UI overlays (cinematic title banners)
async function showCinematicTitle(title, subtitle, durationMs = 3200) {
  await page.evaluate(({ t, s, d }) => {
    let el = document.getElementById("trailer-overlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "trailer-overlay";
      el.style.position = "fixed";
      el.style.top = "50px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.zIndex = "999999";
      el.style.pointerEvents = "none";
      el.style.textAlign = "center";
      el.style.fontFamily = "sans-serif";
      el.style.transition = "all 0.4s ease";
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.90); backdrop-filter: blur(16px); border: 1.5px solid rgba(56, 189, 248, 0.4); padding: 12px 36px; border-radius: 999px; box-shadow: 0 20px 45px rgba(0,0,0,0.5);">
        <p style="margin: 0; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #38bdf8; font-weight: 800;">${s}</p>
        <h2 style="margin: 2px 0 0; font-size: 24px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">${t}</h2>
      </div>
    `;
    el.style.opacity = "1";
    setTimeout(() => {
      if (el) el.style.opacity = "0";
    }, d - 500);
  }, { t: title, s: subtitle, d: durationMs });
}

// =========================================================================
// SCENE 1 (0:00 - 0:04): Panoramic Town Establishing Shot
// =========================================================================
console.log("[SCENE 1] Panoramic Town Overview -> Descending to Central Park...");
await showCinematicTitle("DENGE KASABASI", "BİRLİKTE YAŞA, DENGEYİ BUL", 3500);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.setZoom(0.52);
  cam.centerOn(960, 720);
  cam.pan(960, 780, 3200, "Sine.easeInOut");
  cam.zoomTo(1.15, 3200, "Sine.easeInOut");
});
await page.waitForTimeout(3600);

// =========================================================================
// SCENE 2 (0:04 - 0:08): Residential District - Active Street Leak
// =========================================================================
console.log("[SCENE 2] Residential District -> Active Street Leak & Nuri Amca...");
await showCinematicTitle("BOŞA AKAN SU", "1. KRİZ · SOKAKTAKİ BORU PATLAK", 3200);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(1500, 810, 2000, "Cubic.easeInOut");
  cam.zoomTo(1.75, 2000, "Cubic.easeInOut");
});
await page.waitForTimeout(2200);

// Nuri Amca speaks
await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const nuri = scene.npcs.find((n) => n.definition.id === "nuri-amca");
  if (nuri) scene.openDialogue(nuri);
});
await page.waitForTimeout(2000);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// =========================================================================
// SCENE 3 (0:08 - 0:12): Reservoir Dam & Aylin's Data Chart
// =========================================================================
console.log("[SCENE 3] Reservoir Dam & Aylin's Data Chart...");
await showCinematicTitle("REZERVUAR VERİSİ", "2. KRİZ · SU SEVİYESİ %43'E DÜŞTÜ", 3200);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(560, 345, 2000, "Cubic.easeInOut");
  cam.zoomTo(1.4, 2000, "Cubic.easeInOut");
});
await page.waitForTimeout(2200);

// Open Baraj Card with Chart
await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const aylin = scene.npcs.find((n) => n.definition.id === "muhendis-aylin");
  if (aylin) scene.openDialogue(aylin);
});
await page.waitForTimeout(2500);

// Answer question if visible, then close card
const questionOption = page.locator(".question-option").last();
if (await questionOption.isVisible()) {
  await questionOption.click();
  await page.waitForTimeout(500);
}

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  scene.handleInvestigationCompleted("baraj");
});
await page.waitForTimeout(500);

// =========================================================================
// SCENE 4 (0:12 - 0:16): Farmland & Irrigation Dilemma
// =========================================================================
console.log("[SCENE 4] Farmland & Farmer Rıza's Drought Dilemma...");
await showCinematicTitle("TARIMSAL ÜRETİM", "3. KRİZ · VAHŞİ SULAMA VE KURAKLIK", 3000);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(380, 880, 2000, "Cubic.easeInOut");
  cam.zoomTo(1.35, 2000, "Cubic.easeInOut");
});
await page.waitForTimeout(2000);

// Rıza talks
await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const riza = scene.npcs.find((n) => n.definition.id === "ciftci-riza");
  if (riza) scene.openDialogue(riza);
});
await page.waitForTimeout(2000);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// =========================================================================
// SCENE 5 (0:16 - 0:21): Municipality Council - ₺1.000.000 Budget Decision
// =========================================================================
console.log("[SCENE 5] Town Hall - ₺1,000,000 Budget Meeting...");
await showCinematicTitle("BELEDİYE MECLİSİ", "KRİTİK KARAR · ₺1.000.000 BÜTÇE", 4000);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(960, 1320, 1600, "Sine.easeInOut");
  cam.zoomTo(1.1, 1600, "Sine.easeInOut");
});
await page.waitForTimeout(1800);

// Trigger Mayor meeting solution panel
await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  scene.quest = "meeting";
  const mayor = scene.npcs.find((n) => n.definition.id === "mayor");
  if (mayor) scene.openDialogue(mayor);
});
await page.waitForTimeout(1200);

// Click solutions
const dripCard = page.locator('button:has-text("Damla Sulama Desteği")');
const pipesCard = page.locator('button:has-text("Boru Kaçaklarını Onar")');

if (await dripCard.isVisible()) {
  console.log("Picking Damla Sulama Desteği (₺520.000)...");
  await dripCard.click();
  await page.waitForTimeout(800);
}

if (await pipesCard.isVisible()) {
  console.log("Picking Boru Kaçaklarını Onar (₺320.000)...");
  await pipesCard.click();
  await page.waitForTimeout(800);
}

const planReadyBtn = page.locator('button:has-text("PLANI HAZIRLADIM")');
if (await planReadyBtn.isVisible()) {
  await planReadyBtn.click();
  await page.waitForTimeout(600);
  const chip = page.locator("button.rationale-chip").first();
  if (await chip.isVisible()) await chip.click();
  await page.waitForTimeout(500);
  const submitCta = page.locator('button:has-text("PLANI BELEDİYEYE SUN")');
  if (await submitCta.isVisible()) await submitCta.click();
}
await page.waitForTimeout(1500);
await page.keyboard.press("Escape");
await page.waitForTimeout(500);

// =========================================================================
// SCENE 6 (0:21 - 0:24): TimeShift - 30 Days Later
// =========================================================================
console.log("[SCENE 6] 30 Days Later - Advancing to Day 30...");
await showCinematicTitle("30 GÜN SONRA", "ZAMAN İLERLİYOR · UYGULAMA TAMAMLANDI", 3200);

// Update session and world dressing to Day 30
await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  scene.worldPlanIds = ["drip-irrigation", "repair-pipes"];
  scene.implPhase = 2; // Day 30 settled
  scene.applyWorldDressing();
  // Golden hour sunset tint
  const dayStop = { label: "30. gün", date: "2 Mayıs", time: "17:40", tint: "rgba(255, 166, 77, 0.14)" };
  window.dispatchEvent(
    new CustomEvent("denge:day-changed", { detail: { ...dayStop, direction: "forward" } }),
  );
});
await page.waitForTimeout(2000);

// =========================================================================
// SCENE 7 (0:24 - 0:27): Before / After Visual Transformations!
// =========================================================================
console.log("[SCENE 7] Transformation: Repaired Street & Fresh Asphalt...");
await showCinematicTitle("DÖNÜŞÜM: ONARILAN SOKAK", "KAÇAK KAPANDI · YENİ ASFALT YAMASI", 2800);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(1500, 810, 1800, "Cubic.easeInOut");
  cam.zoomTo(2.0, 1800, "Cubic.easeInOut");
});
await page.waitForTimeout(2600);

console.log("[SCENE 7] Transformation: Drip Irrigation Hoses in Farmland...");
await showCinematicTitle("DÖNÜŞÜM: VERİMLİ TARIM", "DAMLA SULAMA HATTI DEVREDE", 2800);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(400, 1010, 1800, "Cubic.easeInOut");
  cam.zoomTo(1.65, 1800, "Cubic.easeInOut");
});
await page.waitForTimeout(2600);

// =========================================================================
// SCENE 8 (0:27 - 0:31): Finale / Outro Panorama & Logo
// =========================================================================
console.log("[SCENE 8] Finale / Outro Panorama & Logo...");
await showCinematicTitle("DENGE KASABASI", "atlaslearningtech.com · ŞİMDİ OYNA VE KEŞFET", 3500);

await page.evaluate(() => {
  const scene = window.__dengeGame.scene.scenes[0];
  const cam = scene.cameras.main;
  cam.pan(960, 740, 2000, "Sine.easeInOut");
  cam.zoomTo(0.52, 2000, "Sine.easeInOut");
});
await page.waitForTimeout(3500);

console.log("[TRAILER ENGINE] Recording complete! Closing browser...");
await page.close();
await context.close();
await browser.close();
server.close();

const recorded = fs.readdirSync(outputDir).filter((f) => f.endsWith(".webm"));
if (recorded.length > 0) {
  const finalPath = resolve(outputDir, "denge-kasabasi-trailer-1080p.webm");
  fs.renameSync(resolve(outputDir, recorded[0]), finalPath);
  const sizeMb = (fs.statSync(finalPath).size / (1024 * 1024)).toFixed(2);
  console.log(`[TRAILER ENGINE] SUCCESS! 30-Second 1080p Trailer exported to: ${finalPath} (${sizeMb} MB)`);
} else {
  console.error("[TRAILER ENGINE] No recording file found!");
}
