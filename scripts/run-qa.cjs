const { chromium } = require("playwright");
const vitalUrl = process.env.VITAL_URL || "http://127.0.0.1:5186/";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(vitalUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: "qa/dashboard.png", fullPage: true });
  await page.getByLabel("Theme").selectOption("midnight-icu");
  await page.waitForTimeout(250);
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: "qa/theme-midnight.png", fullPage: true });
  const persistedTheme = await page.locator(".app").getAttribute("data-theme");
  if (persistedTheme !== "midnight-icu") {
    throw new Error(`Theme persistence failed: ${persistedTheme}`);
  }
  await page.getByLabel("Theme").selectOption("clinical-aurora");

  await page.getByRole("button", { name: "Symptom Checker" }).click();
  await page.getByText("At-risk monitoring").click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "qa/triage-at-risk.png", fullPage: true });

  await page.getByText("Emergency trigger").click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: "qa/triage-emergency.png", fullPage: true });

  await page.getByRole("button", { name: "Medication Check" }).click();
  await page.getByRole("button", { name: "Tablet visible" }).click();
  await page.screenshot({ path: "qa/medication.png", fullPage: true });

  await page.getByRole("button", { name: "Voice Distress" }).click();
  await page.locator("textarea").fill("Help, I have chest pain and can't breathe clearly.");
  await page.getByRole("button", { name: "Analyze text" }).click();
  await page.screenshot({ path: "qa/voice-distress.png", fullPage: true });

  await page.getByRole("button", { name: "Emergency SOS" }).click();
  await page.getByRole("button", { name: "Trigger emergency" }).click();
  await page.waitForTimeout(11200);
  await page.screenshot({ path: "qa/emergency-incident.png", fullPage: true });

  await page.getByRole("button", { name: "Appointments" }).click();
  await page.getByRole("button", { name: "Book demo appointment" }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: "qa/appointments.png", fullPage: true });

  await page.getByRole("button", { name: "Health Analytics" }).click();
  await page.screenshot({ path: "qa/analytics.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 });
  const mobileErrors = [];
  mobile.on("console", (msg) => {
    if (msg.type() === "error") mobileErrors.push(msg.text());
  });
  await mobile.goto(vitalUrl, { waitUntil: "networkidle" });
  await mobile.evaluate(() => localStorage.clear());
  await mobile.reload({ waitUntil: "networkidle" });
  await mobile.screenshot({ path: "qa/mobile-dashboard.png", fullPage: true });

  const title = await page.title();
  await browser.close();
  const result = {
    title,
    consoleErrors,
    mobileErrors,
    screenshots: 10,
    persistedTheme
  };
  console.log(JSON.stringify(result, null, 2));
  if (consoleErrors.length || mobileErrors.length) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
