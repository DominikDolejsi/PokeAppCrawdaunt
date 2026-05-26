import { chromium } from "playwright";

export const setupBrowser = async (headless: boolean) => {
  const browser = await chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  const randWait = async () => {
    await page.waitForTimeout(400 + Math.random() * 800);
  };

  const close = async () => {
    await page.close();
    await browser.close();
  };

  return { page, wait: randWait, close };
};
