// Image viewer (js/lightbox.js) in a real browser against the dev server:
//
//   node --test test/browser/        # SITE_URL defaults to http://localhost:8086
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch } from './cdp.mjs';

const SITE = process.env.SITE_URL ?? 'http://localhost:8086';
let browser, page;

before(async () => {
  browser = await launch();
  page = await browser.newPage();
});
after(async () => {
  page?.close();
  await browser?.close();
});

async function open(path) {
  await page.goto(SITE + path);
  await page.waitFor(`!document.body.classList.contains('loading') &&
    [...document.images].every((i) => i.complete)`, 15000);
}

const zoomables = () => page.eval(`[...document.querySelectorAll('.is-zoomable')].map((i) => i.getAttribute('src'))`);
const viewer = () => page.eval(`(() => {
  const d = document.querySelector('dialog.lightbox');
  if (!d) return null;
  return {
    open: d.open,
    src: d.querySelector('.lightbox__image').getAttribute('src'),
    caption: d.querySelector('.lightbox__caption').textContent.trim(),
    count: d.querySelector('.lightbox__count').textContent.trim(),
    navHidden: d.querySelector('.lightbox__next').hidden && d.querySelector('.lightbox__prev').hidden,
  };
})()`);
const click = (i) => page.eval(`document.querySelectorAll('.is-zoomable')[${i}].click()`);

test('images linked to a larger copy open that copy, and step between each other', async () => {
  await open('/blog/seti-searching-habitable-zone-kois');
  const imgs = await zoomables();
  assert.equal(imgs.length, 2, `zoomable: ${imgs}`);
  assert.ok(imgs.every((s) => /cass/i.test(s)), 'the chart linking to a PDF stays a plain link');

  await click(0);
  let v = await viewer();
  assert.equal(v.open, true);
  assert.match(v.src, /CassA_RGB2002_med\.jpg$/);
  assert.equal(v.count, '1 / 2');

  await page.key('ArrowRight');
  v = await viewer();
  assert.match(v.src, /cassA_ata350_simulation_med\.png$/);
  assert.equal(v.count, '2 / 2');

  await page.key('ArrowLeft');
  assert.match((await viewer()).src, /CassA_RGB2002_med\.jpg$/);

  await page.key('Escape');
  assert.equal((await viewer()).open, false);
});

test('gallery photos step with wrap-around, show captions, and replace Fluidbox', async () => {
  await open('/horology/seiko-5/');
  assert.equal((await zoomables()).length, 4);

  await click(2);
  let v = await viewer();
  assert.equal(v.count, '3 / 4');
  assert.equal(v.caption, 'back cover');

  await page.eval(`document.querySelector('.lightbox__next').click()`);
  assert.equal((await viewer()).count, '4 / 4');
  await page.eval(`document.querySelector('.lightbox__next').click()`);
  v = await viewer();
  assert.equal(v.count, '1 / 4');
  assert.equal(v.caption, 'face, and back cover');

  assert.equal(await page.eval(`document.querySelectorAll('.fluidbox--opened').length`), 0);
  await page.eval(`document.querySelector('.lightbox__close').click()`);
  assert.equal((await viewer()).open, false);
});

test('a lone image opens without prev/next', async () => {
  await open('/blog/bima-shutdown');
  assert.equal((await zoomables()).length, 1);
  await click(0);
  const v = await viewer();
  assert.equal(v.open, true);
  assert.equal(v.count, '1 / 1');
  assert.equal(v.navHidden, true);
  await page.key('Escape');
});
