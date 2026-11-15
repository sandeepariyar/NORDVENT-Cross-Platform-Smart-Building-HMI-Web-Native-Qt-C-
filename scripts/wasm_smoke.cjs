// CI browser test: only the real Qt 6 WebAssembly application can pass.
const { chromium } = require('playwright-core');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1180, height: 860 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('requestfailed', req => errors.push('request: '+req.url()+': '+req.failure()?.errorText));
  try {
    const response = await page.goto('http://127.0.0.1:8765/native/', {waitUntil:'domcontentloaded'});
    if (!response || !response.ok()) throw new Error('native demo HTTP failed');
    await page.waitForFunction(() => window.__nordventStatus === 'ready', null, {timeout:120000});
    await page.waitForTimeout(2500);
    const canvas = page.locator('#qtScreen canvas').first();
    await canvas.waitFor({state:'visible', timeout:20000});
    const rect = await canvas.boundingBox();
    if (!rect || rect.width < 200 || rect.height < 100) throw new Error('Qt canvas not sized correctly: '+JSON.stringify(rect));
    const before = await page.screenshot({path:'wasm-smoke.png', animations:'disabled'});
    // Click actual QML header's Night button (x around 329, y around 23).
    const screen = await page.locator('#qtScreen').boundingBox();
    await page.mouse.click(screen.x + screen.width * (329/800), screen.y + screen.height * (23/480));
    await page.waitForTimeout(600);
    if (await page.evaluate(() => window.__nordventStatus) !== 'ready') throw new Error('Qt exited after a UI interaction');
    if (errors.some(msg => /QQml|qml:.*error|Unable to load|ReferenceError|TypeError|wasm.*abort|uncaught|NORDVENT_WASM/i.test(msg)))
      throw new Error('Qt/QML runtime error: '+errors.join('\n'));
    fs.writeFileSync('wasm-smoke.log', `Status ready; canvas ${rect.width}x${rect.height}; clicked native Night scene.\n${errors.join('\n')}`);
    console.log('NORDVENT Qt WASM smoke: PASS — native QML canvas launched and accepted a click.');
  } finally {
    await browser.close();
  }
})().catch(error => {fs.writeFileSync('wasm-smoke.log', String(error.stack||error));console.error(error);process.exit(1);});
