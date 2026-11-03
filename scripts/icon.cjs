const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  await p.goto('file://' + process.cwd() + '/scripts/icon.html'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'assets/logo.png', omitBackground: true });
  await b.close();
})();
