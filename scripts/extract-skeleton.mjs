/**
 * 从原始 HTML 页面提取「DOM 骨架」：标签名 + class/id + 关键属性，丢掉全部文本。
 * 用途：用 Astro 重建时逐字复刻原有 DOM 嵌套顺序，保证美术不变。
 * 运行：node scripts/extract-skeleton.mjs（需在仓库根目录执行，依赖根目录下的原始 HTML）
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = ['index.html', 'blog.html', 'post.html', 'about.html'];

/** 只保留这些属性（其余属性对美术复刻无意义） */
const KEEP_ATTRS = new Set([
  'class',
  'id',
  'href',
  'src',
  'alt',
  'type',
  'role',
  'aria-label',
  'aria-current',
  'aria-expanded',
  'aria-controls',
  'aria-hidden',
  'data-reveal',
  'data-pct',
  'data-search-open',
  'data-theme',
  'datetime',
  'placeholder',
  'rel',
  'name',
  'width',
  'height',
  'viewBox',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'd',
  'title',
  'lang',
  'charset',
  'content',
  'property',
  'target',
  'disabled',
  'hidden',
]);

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop',
]);

/** 解析一个开始标签的属性串 */
function parseAttrs(raw) {
  const out = [];
  const re = /([:\w-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw))) {
    const name = m[1];
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    if (!KEEP_ATTRS.has(name)) continue;
    if (name === 'class') {
      out.push({ name, value });
      continue;
    }
    if (name === 'd') continue; // 路径数据太长，单独标注是否有 d
    out.push({ name, value });
  }
  return out;
}

function skeletonOf(html) {
  const lines = [];
  const stack = [];
  const tokenRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
  let m;
  while ((m = tokenRe.exec(html))) {
    const whole = m[0];
    if (whole.startsWith('<!--')) continue;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const rawAttrs = m[3] ?? '';
    const selfClosed = m[4] === '/' || VOID.has(tag);

    if (closing) {
      if (stack.length > 0) stack.pop();
      continue;
    }

    const attrs = parseAttrs(rawAttrs);
    const depth = stack.length;
    const parts = [];
    const cls = attrs.find((a) => a.name === 'class');
    const id = attrs.find((a) => a.name === 'id');
    parts.push(`<${tag}>`);
    if (cls) parts.push(`.${cls.value.trim().split(/\s+/).join('.')}`);
    if (id) parts.push(`#${id.value}`);
    const rest = attrs
      .filter((a) => a.name !== 'class' && a.name !== 'id')
      .map((a) => (a.value === '' ? a.name : `${a.name}="${a.value}"`));
    const suffix = rest.length > 0 ? ` ${rest.join(' ')}` : '';
    lines.push(`${'  '.repeat(depth)}${parts.join('')}${suffix}`);
    const hasText = '';
    void hasText;

    if (!selfClosed) stack.push(tag);
  }
  return lines;
}

for (const page of pages) {
  const file = path.join(root, page);
  const html = fs.readFileSync(file, 'utf8');
  // 去掉 <style>/<script> 的内容，避免噪声
  const cleaned = html
    .replace(/<style[\s\S]*?<\/style>/gi, '<style></style>')
    .replace(/<script[\s\S]*?<\/script>/gi, '<script></script>');
  const lines = skeletonOf(cleaned);
  const out = path.join(root, '.handoff', `skeleton-${page.replace('.html', '')}.txt`);
  fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
  console.log(`${page}: ${lines.length} nodes -> ${path.relative(root, out)}`);
}