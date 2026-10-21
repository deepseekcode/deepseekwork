// 宣传素材采集：本地 mock 模型 + 真实 server + Chrome CDP（Screencast 录帧 / 静帧截图）。
// 全程离线：不连任何模型厂商，不读用户真实配置（配置目录固定 .tools/promo-config）。
//
// 为什么不用 playwright：本机 playwright 的 bun 补丁把 chromium 的调试通道改成了端口模式，
// node 下启动时报 `ws connecting undefined`。仓库里的 ui-screenshot.mjs 已经证明纯 CDP
// 驱动是可靠的，这里沿用同一套做法，并用 Page.startScreencast 拿到带时间戳的帧序列。
//
// 用法:
//   node scripts/promo/record.mjs            # 录屏 → docs/promo/media/_frames/*.jpg + timings.json
//   node scripts/promo/record.mjs --shots    # 只出静帧 → docs/promo/media/shots/*.png
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const DEMO = join(ROOT, '.tools/promo-demo');
const CONFIG = join(ROOT, '.tools/promo-config');
const MEDIA = join(ROOT, 'docs/promo/media');
const SHOTS = join(MEDIA, 'shots');
const FRAMES = join(MEDIA, '_frames');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTTP_PORT = 8190;
const WS_PORT = 8191;
const MOCK_PORT = 3199;
const CDP_PORT = 19250;
const VIEW = { width: 1920, height: 1080 };
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
  child.stdout.on('data', (d) => process.stdout.write(`  [srv] ${d}`));
  child.stderr.on('data', (d) => {
    const text = String(d);
    if (!/WARNING: No --max-old-space-size/.test(text)) process.stderr.write(`  [err] ${text}`);
  });
  children.push(child);
  return child;
}

function cleanup() {
  for (const child of children) {
    try { child.kill(); } catch { /* ignore */ }
  }
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

/** 干净开局：清掉上一次录制留下的会话数据，但保留 config.yaml。 */
function resetSessions() {
  for (const dir of ['sessions', 'state', 'logs', 'last-session.json']) {
    const p = join(CONFIG, dir);
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
}

function cdpClient(ws) {
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: ok, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else ok(msg.result);
      return;
    }
    const handler = listeners.get(msg.method);
    if (handler) handler(msg.params);
  });
  return {
    send(method, params = {}) {
      return new Promise((ok, reject) => {
        const mid = ++id;
        pending.set(mid, { resolve: ok, reject });
        ws.send(JSON.stringify({ id: mid, method, params }));
        setTimeout(() => {
          if (pending.has(mid)) { pending.delete(mid); reject(new Error(`timeout: ${method}`)); }
        }, 60000);
      });
    },
    on(method, handler) { listeners.set(method, handler); },
    close() { ws.close(); },
  };
}

async function capture(cdp, path) {
  const res = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path, Buffer.from(res.data, 'base64'));
  console.log('[shot]', path);
}

async function main() {
  resetSessions();

  start('node', [join(ROOT, 'scripts/promo/mock-openai.mjs'), String(MOCK_PORT)]);
  start('node', [join(ROOT, 'packages/server/dist/index.js'),
    '--port', String(HTTP_PORT), '--ws-port', String(WS_PORT), '--workspace', DEMO,
  ], { DEEPSEEKCODE_CONFIG_DIR: CONFIG });
  await waitFor(`http://127.0.0.1:${HTTP_PORT}/`);
  console.log('[record] server up on', HTTP_PORT);

  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--window-size=${VIEW.width},${VIEW.height}`,
    '--hide-scrollbars',
    '--lang=en-US',
    '--force-color-profile=srgb',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    'about:blank',
  ], { stdio: 'ignore' });
  children.push(chrome);

  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
    } catch { /* retry */ }
  }
  if (!target) throw new Error('CDP target not reachable');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, no) => {
    ws.addEventListener('open', ok, { once: true });
    ws.addEventListener('error', no, { once: true });
  });
  const cdp = cdpClient(ws);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.width, height: VIEW.height, deviceScaleFactor: 1, mobile: false,
  });
  // 界面语言跟随 navigator.language；这只机器是 zh-CN，宣传片要英文界面。
  await cdp.send('Emulation.setLocaleOverride', { locale: 'en-US' }).catch(() => {});

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(String(res.exceptionDetails.exception?.description || 'eval error'));
    return res.result?.value;
  };

  const frames = [];
  cdp.on('Page.screencastFrame', async (params) => {
    frames.push({ t: params.metadata.timestamp, data: params.data });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId }); } catch { /* ignore */ }
  });

  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` });
  for (let i = 0; i < 120; i++) {
    await sleep(500);
    if (await evaluate(`!!document.querySelector('.chat-composer-card textarea')`)) break;
  }
  await sleep(3000);

  // 关掉挡镜头的三样东西：更新弹窗、auto-approve 横幅、输入框上方的提示条
  for (let i = 0; i < 3; i++) {
    const open = await evaluate(`(() => {
      const t = document.body.innerText || '';
      return t.includes('What\\'s New') || t.includes('更新内容');
    })()`);
    if (!open) break;
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      const btn = document.querySelector('[aria-label="Close"], [aria-label="关闭"], [class*="modal"] [class*="close"], [class*="Modal"] [class*="close"]');
      if (btn) btn.click();
      return true;
    })()`);
    await sleep(900);
  }
  await evaluate(`(() => {
    const pick = (re) => Array.from(document.querySelectorAll('button, a, span[role="button"]'))
      .find((el) => re.test((el.textContent || '').trim()));
    const hide = pick(/^Don't show again$/i);
    if (hide) hide.click();
    const dismiss = pick(/^Dismiss$/i);
    if (dismiss) dismiss.click();
    return true;
  })()`);
  await sleep(700);
  console.log('[record] UI ready');

  if (!SHOT_MODE) {
    await cdp.send('Page.startScreencast', {
      format: 'jpeg', quality: 90, maxWidth: VIEW.width, maxHeight: VIEW.height, everyNthFrame: 1,
    });
    console.log('[record] screencast started');
  }

  const timings = { startedAt: Date.now(), marks: [] };
  const mark = (name) => {
    timings.marks.push({ name, atMs: Date.now() - timings.startedAt });
    console.log(`[mark] ${name} @${Date.now() - timings.startedAt}ms`);
  };
  mark('ready');

  if (SHOT_MODE) {
    await sleep(1200);
    await capture(cdp, join(SHOTS, '01-chat-dark.png'));
  }

  await evaluate(`(() => { document.querySelector('.chat-composer-card textarea').focus(); return true; })()`);
  await sleep(300);
  for (const ch of PROMPT) {
    await evaluate(`(() => {
      const ta = document.querySelector('.chat-composer-card textarea');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, ta.value + ${JSON.stringify(ch)});
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(16 + Math.random() * 26);
  }
  mark('typed');
  await sleep(900);
  await evaluate(`(() => {
    const ta = document.querySelector('.chat-composer-card textarea');
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    return true;
  })()`);
  mark('sent');

  let done = false;
  for (let i = 0; i < 300; i++) {
    await sleep(400);
    // 权限审批弹窗：这是产品最该被看到的一幕，出现就点 Allow 并记录拍摄点
    const allowed = await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find((b) => /^\\s*(Allow|Approve|允许)\\s*$/i.test(b.textContent || ''));
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    if (allowed) {
      mark('approved');
      await sleep(1200);
      continue;
    }
    done = await evaluate(`(() => {
      const text = document.body.innerText || '';
      const finished = text.includes('backwards compatible');
      const busy = /正在生成|generating/i.test(text);
      return finished && !busy;
    })()`);
    if (done) break;
  }
  mark(done ? 'completed' : 'timeout');
  await sleep(2600);

  if (SHOT_MODE) {
    await capture(cdp, join(SHOTS, '02-session-dark.png'));
    for (const sel of ['[data-testid="turn-group-toggle"]', '[data-testid="step-row"]', '[data-testid="toolcall-group-toggle"]']) {
      await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el) { el.click(); return true; } return false; })()`);
      await sleep(500);
    }
    await capture(cdp, join(SHOTS, '03-toolcall-expanded.png'));

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#models` });
    await sleep(5000);
    await capture(cdp, join(SHOTS, '04-models.png'));

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` });
    await sleep(4500);
    await capture(cdp, join(SHOTS, '05-mobile.png'));
    console.log('[record] screenshots written to', SHOTS);
  } else {
    await cdp.send('Page.stopScreencast');
    mark('stop');
    console.log(`[record] collected ${frames.length} frames`);
    frames.forEach((frame, i) => {
      writeFileSync(join(FRAMES, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(frame.data, 'base64'));
    });
    writeFileSync(join(MEDIA, 'timings.json'), JSON.stringify({
      marks: timings.marks,
      frames: frames.map((f, i) => ({ i, t: Number(f.t) })),
    }, null, 2));
    console.log('[record] frames ->', FRAMES);
  }

  cdp.close();
  cleanup();
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('[record] FAILED:', err);
  cleanup();
  process.exit(1);
});
