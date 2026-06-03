
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    console.log(msg.type().toUpperCase() + ': ' + msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  try {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'F:/cx/debug_screenshot.png', fullPage: true });
    console.log('ERRORS:', JSON.stringify(errors));
  } catch(e) {
    console.log('PAGE ERROR:', e.message);
  }
  await browser.close();
})();
