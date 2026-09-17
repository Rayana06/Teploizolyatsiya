const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs');

const OUT = path.resolve(__dirname, '..', '..', 'lab2-screenshots');
const APP = 'http://127.0.0.1:3000/insulation-materials';
const ADMINER = 'http://127.0.0.1:8080/';
fs.mkdirSync(OUT, { recursive: true });

async function loginAdminer(page) {
  await page.goto(ADMINER, { waitUntil: 'domcontentloaded' });
  if (await page.locator('input[name="auth[username]"]').count()) {
    await page.locator('select[name="auth[driver]"]').selectOption('pgsql');
    await page.locator('input[name="auth[server]"]').fill('insulation-postgres');
    await page.locator('input[name="auth[username]"]').fill('teploshchit');
    await page.locator('input[name="auth[password]"]').fill('teploshchit');
    await page.locator('input[name="auth[db]"]').fill('teploshchit');
    await page.locator('input[type="submit"]:visible').first().click();
    await page.waitForLoadState('domcontentloaded');
  }
}

async function runSql(page, sql, output) {
  const sqlLink = page.locator('a[href*="&sql="]').first();
  await sqlLink.click();
  await page.waitForLoadState('domcontentloaded');
  await page.locator('textarea').evaluate((element, value) => {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, sql);
  await page.locator('input[type="submit"]:visible').first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: path.join(OUT, output), fullPage: false });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
  });
  const admin = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
  await loginAdminer(admin);

  await runSql(admin,
    "UPDATE insulation_materials SET status = 'deleted' WHERE insulation_material_id = 2;",
    '01-adminer-logical-delete.png');
  await runSql(admin,
    'SELECT insulation_material_id, name, status FROM insulation_materials ORDER BY insulation_material_id;',
    '02-adminer-status-select.png');

  const app = await browser.newPage({ viewport: { width: 820, height: 950 }, deviceScaleFactor: 1 });
  await app.goto(`${APP}/feed/1`, { waitUntil: 'networkidle' });
  await app.screenshot({ path: path.join(OUT, '03-app-feed.png'), fullPage: false });

  await app.goto(`${APP}/catalog?insulationMaxPrice=500`, { waitUntil: 'networkidle' });
  await app.screenshot({ path: path.join(OUT, '04-app-search.png'), fullPage: false });

  await app.request.post(`${APP}/3/delete`);
  await app.goto(`${APP}/catalog`, { waitUntil: 'networkidle' });
  await app.screenshot({ path: path.join(OUT, '05-app-after-delete.png'), fullPage: false });

  await app.goto(`${APP}/feed/3`, { waitUntil: 'domcontentloaded' });
  await app.screenshot({ path: path.join(OUT, '06-app-deleted-url.png'), fullPage: false });

  await app.goto(`${APP}/draft`, { waitUntil: 'networkidle' });
  if (!(await app.locator('body').innerText()).includes('Добавление материала')) {
    throw new Error('Ожидалась страница добавления без существующего черновика');
  }
  await app.screenshot({ path: path.join(OUT, '07-app-add-page.png'), fullPage: false });

  await app.request.post(`${APP}/draft`, { form: { insulationName: 'ЭКОВЕР ЛАЙТ 80' } });
  await runSql(admin,
    "SELECT insulation_material_id, name, status, image_url, video_url, created_at FROM insulation_materials WHERE status = 'draft' ORDER BY insulation_material_id DESC LIMIT 1;",
    '08-adminer-created-draft.png');

  const publication = await app.request.post(`${APP}/publish`, { form: {
    insulationDescription: 'Каменная вата для теплоизоляции стен и перекрытий.',
    insulationType: 'Минвата',
    insulationThicknessMm: '80',
    insulationManufacturer: 'ЭКОВЕР',
    insulationPriceRubM2: '490',
    insulationApplication: 'Стены и перекрытия',
    insulationSku: 'ECO-L80',
  }});
  await app.goto(publication.url(), { waitUntil: 'networkidle' });
  await app.screenshot({ path: path.join(OUT, '09-app-published-card.png'), fullPage: false });

  await runSql(admin,
    "SELECT insulation_material_id, name, status, insulation_type, thickness_mm, price_rub_m2, created_at, published_at FROM insulation_materials ORDER BY insulation_material_id DESC LIMIT 1;",
    '10-adminer-published-card.png');

  await browser.close();
  console.log(OUT);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
