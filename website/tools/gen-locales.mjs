#!/usr/bin/env node
/**
 * Generate the per-language static pages from the single source.
 *
 * Source of truth: ../index.html — both its markup and its inline i18n dictionary
 * (`EN` = English fallback, `OV` = per-language overrides). No translation is
 * duplicated here: every string a locale page shows comes from that dictionary, and
 * any key a language does not override falls back to English exactly like the live
 * page's client-side language switcher does.
 *
 * Usage:  node tools/gen-locales.mjs
 * Output: ../<slug>/index.html for zh, ja, ko, es, fr
 *
 * Why separate URLs: this is a static GitHub Pages site with no server-side
 * rendering and a client-side language switcher, so a crawler that does not execute
 * JavaScript only ever saw English. Each language now has its own URL, its own
 * lang/title/description, hreflang alternates and prerendered content.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'index.html');
const BASE = 'https://deepseekcode.github.io/deepseekwork/';

/** locale -> { dir, lang, ogLocale } */
const LOCALES = [
  { locale: 'zh-CN', dir: 'zh', lang: 'zh-CN', ogLocale: 'zh_CN' },
  { locale: 'ja', dir: 'ja', lang: 'ja', ogLocale: 'ja_JP' },
  { locale: 'ko', dir: 'ko', lang: 'ko', ogLocale: 'ko_KR' },
  { locale: 'es', dir: 'es', lang: 'es', ogLocale: 'es_ES' },
  { locale: 'fr', dir: 'fr', lang: 'fr', ogLocale: 'fr_FR' },
];

const escHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (v) => escHtml(v).replace(/"/g, '&quot;');

/** Replace `from` with `to` (literal), asserting exactly one occurrence. */
function rep(html, from, to, label) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error('anchor ×' + n + (label ? ' [' + label + ']' : '') + ': ' + JSON.stringify(String(from).slice(0, 80)));
  return html.replace(from, () => to);
}

/** Extract the object literal that follows `needle`, by brace matching. */
function extractObject(src, needle) {
  const at = src.indexOf(needle);
  if (at < 0) throw new Error('not found: ' + needle);
  const open = src.indexOf('{', at);
  let depth = 0, i = open, inStr = null, escape = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(open, i);
}

/** Index just past the matching `</tag>` for the element whose `<tag` starts at `from`. */
function endOfElement(html, from, tag) {
  const open = new RegExp('<' + tag + '\\b', 'gi');
  const close = new RegExp('</' + tag + '\\s*>', 'gi');
  let depth = 0, i = from;
  while (i < html.length) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) throw new Error('unbalanced <' + tag + '>');
    if (o && o.index < c.index) { depth++; i = o.index + o[0].length; continue; }
    depth--;
    if (depth === 0) return c.index + c[0].length;
    i = c.index + c[0].length;
  }
  throw new Error('unbalanced <' + tag + '>');
}

/** Read the inner content of the one element carrying `marker`. */
function innerOf(html, marker) {
  const at = html.indexOf(marker);
  if (at < 0) throw new Error('marker not found: ' + marker);
  if (html.indexOf(marker, at + 1) >= 0) throw new Error('marker not unique: ' + marker);
  const start = html.lastIndexOf('<', at);
  const tag = /^<([a-z0-9]+)/i.exec(html.slice(start, at))[1];
  const bodyStart = html.indexOf('>', at) + 1;
  const elementEnd = endOfElement(html, start, tag);
  return html.slice(bodyStart, elementEnd - ('</' + tag + '>').length);
}

/** Replace the inner content of the one element carrying `marker`. */
function setInner(html, marker, inner) {
  const at = html.indexOf(marker);
  if (at < 0) throw new Error('marker not found: ' + marker);
  if (html.indexOf(marker, at + 1) >= 0) throw new Error('marker not unique: ' + marker);
  const start = html.lastIndexOf('<', at);
  const tag = /^<([a-z0-9]+)/i.exec(html.slice(start, at))[1];
  const bodyStart = html.indexOf('>', at) + 1;
  const elementEnd = endOfElement(html, start, tag);
  const closeStart = elementEnd - ('</' + tag + '>').length;
  return html.slice(0, bodyStart) + inner + html.slice(closeStart);
}

const GRIDS = {
  workflowGrid: (T) =>
    T('steps').map((x) => '<article class="step"><div class="num">' + x[0] + '</div><h3>' + escHtml(x[1]) + '</h3><p>' + escHtml(x[2]) + '</p></article>').join(''),
  capGrid: (T) =>
    T('caps').map((x) => '<article class="card"><div class="icon">' + x[0] + '</div><h3>' + escHtml(x[1]) + '</h3><p>' + escHtml(x[2]) + '</p><div class="tags">' + x[3].map((y) => '<span class="tag">' + escHtml(y) + '</span>').join('') + '</div></article>').join(''),
  ecoGrid: (T) => {
    const row = (x) => '<div class="eco-row"><div class="symbol">' + x[0] + '</div><div><strong>' + escHtml(x[1]) + '</strong><span>' + escHtml(x[2]) + '</span></div></div>';
    return (
      '<article class="eco"><h3>' + escHtml(T('ecoTitle')) + '</h3><p>' + escHtml(T('ecoDesc')) + '</p>' + T('eco').slice(0, 2).map(row).join('') + '</article>' +
      '<article class="eco"><h3>Context + extensibility</h3><p>Compose capabilities so the agent grows with your project.</p>' + T('eco').slice(2).map(row).join('') + '</article>'
    );
  },
  faqList: (T) => T('faq').map((x) => '<details><summary>' + escHtml(x[0]) + '</summary><p>' + escHtml(x[1]) + '</p></details>').join(''),
};

function main() {
  const source = fs.readFileSync(SRC, 'utf8');
  const EN = eval('(' + extractObject(source, 'const EN=') + ')');
  const OV = eval('(' + extractObject(source, 'const OV=') + ')');

  for (const { locale, dir, lang, ogLocale } of LOCALES) {
    const overrides = OV[locale];
    if (!overrides) throw new Error('no dictionary for ' + locale);
    const T = (key) => (overrides[key] !== undefined ? overrides[key] : EN[key]);
    const S = (key) => (typeof T(key) === 'string' ? T(key) : EN[key]);

    let html = source;
    let slots = 0;

    // 1. every static text slot
    html = html.replace(/<([a-z0-9]+)([^>]*?)\sdata-t="([^"]+)"([^>]*?)>([\s\S]*?)<\/\1>/gi, (m, tag, pre, key, post) => {
      if (key === 'privateNotice') return m; // hidden container, deliberately empty
      const value = T(key);
      if (typeof value !== 'string') return m;
      slots++;
      return '<' + tag + pre + ' data-t="' + key + '"' + post + '>' + escHtml(value) + '</' + tag + '>';
    });

    // 2. the prerendered content grids
    for (const [id, build] of Object.entries(GRIDS)) {
      const marker = 'id="' + id + '"';
      const expected = build(T);
      html = setInner(html, marker, expected);
      if (innerOf(html, marker) !== expected) throw new Error('grid not applied: ' + id);
    }

    // 3. image alt text
    let alts = 0;
    html = html.replace(/alt="[^"]*"(\s+data-a="([^"]+)")/g, (m, tail, key) => { alts++; return 'alt="' + escAttr(T(key)) + '"' + tail; });
    if (alts === 0) throw new Error('no alt rewritten for ' + locale);
    for (const m of html.matchAll(/alt="([^"]*)"\s+data-a="([^"]+)"/g)) {
      if (m[1] !== escAttr(T(m[2]))) throw new Error('alt mismatch for ' + m[2] + ' in ' + locale);
    }

    // 4. head: language, titles, descriptions, canonicals
    const head = [
      ['<html lang="en">', '<html lang="' + lang + '">'],
      ['<title id="title">DeepSeekCode — AI coding workspace</title>', '<title id="title">' + escHtml(S('metaTitle')) + '</title>'],
      ['<meta id="desc" name="description" content="' + EN.desc + '">', '<meta id="desc" name="description" content="' + escAttr(S('desc')) + '">'],
      ['<meta name="twitter:title" content="' + EN.metaTitle + '">', '<meta name="twitter:title" content="' + escAttr(S('metaTitle')) + '">'],
      ['<meta name="twitter:description" content="' + EN.desc + '">', '<meta name="twitter:description" content="' + escAttr(S('desc')) + '">'],
      ['<meta property="og:title" content="' + EN.metaTitle + '">', '<meta property="og:title" content="' + escAttr(S('metaTitle')) + '">'],
      ['<meta property="og:description" content="' + EN.desc + '">', '<meta property="og:description" content="' + escAttr(S('desc')) + '">'],
      ['<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="' + ogLocale + '">'],
      ['<meta property="og:url" content="' + BASE + '">', '<meta property="og:url" content="' + BASE + dir + '/">'],
      ['<link rel="canonical" href="' + BASE + '">', '<link rel="canonical" href="' + BASE + dir + '/">'],
    ];
    for (const [from, to] of head) html = rep(html, from, to, 'head');

    // 5. structured data: same entity, this page's language
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (blocks.length !== 2) throw new Error('expected 2 JSON-LD blocks, got ' + blocks.length);
    for (const block of blocks) {
      const obj = JSON.parse(block[1]);
      obj.description = S('desc');
      // only claim the locale when the FAQ content itself is localized
      obj.inLanguage = obj['@type'] === 'FAQPage' ? (Array.isArray(overrides.faq) ? locale : 'en') : locale;
      const next = '<script type="application/ld+json">' + JSON.stringify(obj, null, 2).split('\n').join('\r\n') + '</script>';
      html = rep(html, block[0], next, 'json-ld ' + obj['@type']);
    }

    // 6. a language URL must win over browser-language sniffing
    const fnAt = html.indexOf('function initialLanguage()');
    if (fnAt < 0) throw new Error('initialLanguage() not found');
    let depth = 0, j = html.indexOf('{', fnAt), str = null, escape = false;
    for (; j < html.length; j++) {
      const c = html[j];
      if (str) { if (escape) { escape = false; continue; } if (c === '\\') { escape = true; continue; } if (c === str) str = null; continue; }
      if (c === "'" || c === '"' || c === '`') { str = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { j++; break; } }
    }
    html = html.slice(0, fnAt) +
      "function initialLanguage(){const saved=localStorage.getItem('deepseekcode-lang');if(saved&&LANGS.includes(saved))return saved;return'" + locale + "'}" +
      html.slice(j);

    // 7. this page lives one directory down: rebase the relative asset references
    const beforeAssets = html;
    html = html.replace(/(?<!deepseekwork\/)assets\/screenshots\//g, '../assets/screenshots/');
    if (html === beforeAssets) throw new Error('no asset references rewritten for ' + locale);
    if (/"assets\//.test(html)) throw new Error('unrewritten relative asset path in ' + locale);

    const outDir = path.join(ROOT, dir);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log('wrote ' + dir + '/index.html  lang=' + lang + '  slots=' + slots + '  bytes=' + Buffer.byteLength(html, 'utf8') + '  title=' + JSON.stringify(S('metaTitle')));
  }
}

main();
