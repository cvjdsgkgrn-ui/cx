
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('JS ERROR: ' + msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR: ' + err.message));
  try {
    await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('PAGE LOADED');
  } catch(e) {
    console.log('GOTO ERROR: ' + e.message);
  }
  await browser.close();
})();
