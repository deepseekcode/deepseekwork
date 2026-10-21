// 宣传素材采集：本地 mock 模型 + 真实 server + Chromium 录屏/截图。
// 全程离线：不连任何模型厂商，不读用户真实配置（配置目录指向 .tools/promo-config）。
//
// 用法:
//   node scripts/promo/record.mjs            # 录屏 → docs/promo/media/raw-ui.webm
//   node scripts/promo/record.mjs --shots    # 只出静帧 → docs/promo/media/shots/*.png
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '../..');
const DEMO = join(ROOT, '.tools/promo-demo');
const CONFIG = join(ROOT, '.tools/promo-config');
const MEDIA = join(ROOT, 'docs/promo/media');
const SHOTS = join(MEDIA, 'shots');
const HTTP_PORT = 8190;
const WS_PORT = 8191;
const MOCK_PORT = 3199;
const SHOT_MODE = process.argv.includes('--shots');
const PROMPT = 'The retry wrapper in src/api.ts swallows 5xx errors and gives up immediately. Fix it and check every caller.';

mkdirSync(MEDIA, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const children = [];

function start(cmd, args, env = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, DEEPSEEKCODE_API_KEY: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(`  [${cmd === 'node' && args[0].includes('mock') ? 'mock' : 'srv'}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`  [err] ${d}`));
  children.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error(`timeout waiting for ${url}`);
}

function cleanup() {
  for (const child of children) {
    try { child.kill(); } catch { /* ignore */ }
  }
}

process.on('exit', cleanup);

async function main() {
  start('node', [join(ROOT, 'scripts/promo/mock-openai.mjs'), String(MOCK_PORT)]);
  start('node', [join(ROOT, 'packages/server/dist/index.js'),
    '--port', String(HTTP_PORT), '--ws-port', String(WS_PORT), '--workspace', DEMO,
  ], { DEEPSEEKCODE_CONFIG_DIR: CONFIG });

  await waitFor(`http://127.0.0.1:${HTTP_PORT}/`);
  console.log('[record] server up on', HTTP_PORT);

  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    recordVideo: SHOT_MODE ? undefined : { dir: join(MEDIA, '_raw'), size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text().slice(0, 200)); });

  await page.goto(`http://127.0.0.1:${HTTP_PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.chat-composer-card textarea', { timeout: 45000 });
  await sleep(2500);

  const timings = { startedAt: Date.now(), marks: [] };
  const mark = (name) => {
    timings.marks.push({ name, atMs: Date.now() - timings.startedAt });
    console.log(`[mark] ${name} @${Date.now() - timings.startedAt}ms`);
  };

  mark('ready');

  if (SHOT_MODE) {
    await page.screenshot({ path: join(SHOTS, '01-chat-dark.png') });
  }

  const composer = page.locator('.chat-composer-card textarea');
  await composer.click();
  await sleep(300);
  await composer.type(PROMPT, { delay: 28 });
  mark('typed');
  await sleep(600);
  await composer.press('Enter');
  mark('sent');

  // 等这一轮跑完：工具卡片 + 最终结论都到了，且不再有运行指示
  await page.waitForFunction(
    () => !!document.querySelector('.markdown-content') &&
          !document.querySelector('[data-running="true"], .shimmer, .is-running'),
    { timeout: 180000 },
  ).catch(() => console.log('[record] waited for completion timed out, continuing'));
  mark('completed');
  await sleep(2500);

  if (SHOT_MODE) {
    await page.screenshot({ path: join(SHOTS, '02-session-dark.png') });
    // 工具调用明细：展开步骤行 / 工具组
    for (const sel of ['[data-testid="turn-group-toggle"]', '[data-testid="step-row"]', '[data-testid="toolcall-group-toggle"]']) {
      const el = page.locator(sel).first();
      if (await el.count()) await el.click().catch(() => {});
      await sleep(400);
    }
    await page.screenshot({ path: join(SHOTS, '03-toolcall-expanded.png') });
    await page.goto(`http://127.0.0.1:${HTTP_PORT}/#models`, { waitUntil: 'domcontentloaded' });
    await sleep(4000);
    await page.screenshot({ path: join(SHOTS, '04-models.png') });
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(`http://127.0.0.1:${HTTP_PORT}/`, { waitUntil: 'domcontentloaded' });
    await sleep(3500);
    await page.screenshot({ path: join(SHOTS, '05-mobile.png') });
    console.log('[record] screenshots written to', SHOTS);
  }

  await context.close();
  await browser.close();

  if (!SHOT_MODE) {
    const raw = join(MEDIA, '_raw');
    const { readdirSync } = await import('node:fs');
    const files = readdirSync(raw).filter((f) => f.endsWith('.webm'));
    if (!files.length) throw new Error('no webm produced');
    writeFileSync(join(MEDIA, 'raw-ui.webm'), readFileSync(join(raw, files[0])));
    writeFileSync(join(MEDIA, 'timings.json'), JSON.stringify(timings, null, 2));
    rmSync(raw, { recursive: true, force: true });
    console.log('[record] video ->', join(MEDIA, 'raw-ui.webm'));
  }
}


main().then(() => {
  cleanup();
  process.exit(0);
}).catch((err) => {
  console.error('[record] FAILED:', err);
  cleanup();
  process.exit(1);
});
