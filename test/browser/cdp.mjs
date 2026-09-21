// Minimal headless-Chromium driver over the DevTools protocol, using only
// Node built-ins (fetch, WebSocket). Enough to open a page and evaluate
// expressions in it; no test framework or browser package needed.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_CHROME = join(homedir(),
  'Library/Caches/ms-playwright/chromium-1161/chrome-mac/Chromium.app/Contents/MacOS/Chromium');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ chrome = process.env.CHROME ?? DEFAULT_CHROME } = {}) {
  const profile = await mkdtemp(join(tmpdir(), 'cgk-cdp-'));
  const proc = spawn(chrome, [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1280,900',
    'about:blank',
  ], { stdio: 'ignore' });

  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    port = await readFile(join(profile, 'DevToolsActivePort'), 'utf8')
      .then((s) => s.split('\n')[0]).catch(() => undefined);
  }
  if (!port) throw new Error(`Chromium did not start: ${chrome}`);

  return {
    async newPage() {
      const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
      return openPage(target.webSocketDebuggerUrl);
    },
    async close() {
      proc.kill();
      await sleep(200);
      await rm(profile, { recursive: true, force: true });
    },
  };
}

async function openPage(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      listeners.filter((l) => l.method === msg.method).forEach((l) => l.fn(msg.params));
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((fn) => listeners.push({ method, fn }));

  await send('Page.enable');
  await send('Runtime.enable');

  const page = {
    async goto(url) {
      const loaded = once('Page.loadEventFired');
      await send('Page.navigate', { url });
      await loaded;
    },
    // Evaluate an expression (may be async) in the page and return its value.
    async eval(expression) {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression, awaitPromise: true, returnByValue: true, userGesture: true,
      });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
      return result.value;
    },
    // Wait until an expression is truthy in the page.
    async waitFor(expression, timeout = 5000) {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        if (await page.eval(expression)) return;
        await sleep(50);
      }
      throw new Error(`Timed out waiting for: ${expression}`);
    },
    async key(key) {
      const code = { Escape: 'Escape', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight' }[key] ?? key;
      const vk = { Escape: 27, ArrowLeft: 37, ArrowRight: 39 }[key];
      for (const type of ['keyDown', 'keyUp']) {
        await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk });
      }
    },
    async screenshot() {
      const { data } = await send('Page.captureScreenshot');
      return Buffer.from(data, 'base64');
    },
    close: () => ws.close(),
  };
  return page;
}
