/**
 * 从原始 HTML 里抽出所有 <svg> 片段并按内容去重，供 Astro 组件逐字复用。
 * 产物：.handoff/svgs.txt —— 每条含出现次数、出现页、紧邻的 class 提示与完整 svg 源码。
 * 运行：node scripts/extract-svgs.mjs（需在仓库根目录执行，依赖根目录下的原始 HTML）
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = ['index.html', 'blog.html', 'post.html', 'about.html'];

/** @type {Map<string, {svg: string, where: Set<string>, near: string, count: number}>} */
const found = new Map();

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const re = /<svg\b[^>]*>[\s\S]*?<\/svg>/g;
  let m;
  while ((m = re.exec(html))) {
    const svg = m[0].replace(/\s+/g, ' ').replace(/> </g, '><').trim();
    // 取 svg 之前最近的 class="..." 作为上下文提示
    const before = html.slice(Math.max(0, m.index - 220), m.index);
    const cls = [...before.matchAll(/class="([^"]*)"/g)].pop()?.[1] ?? '';
    const key = svg;
    const entry = found.get(key) ?? { svg, where: new Set(), near: cls, count: 0 };
    entry.where.add(page);
    entry.count += 1;
    if (!entry.near) entry.near = cls;
    found.set(key, entry);
  }
}

const lines = [];
lines.push(`共 ${found.size} 种不重复的 svg 片段`);
for (const [i, entry] of [...found.values()].entries()) {
  lines.push('');
  lines.push(`### svg-${String(i + 1).padStart(2, '0')}  ×${entry.count}  pages=${[...entry.where].join(',')}  near-class="${entry.near}"`);
  lines.push(entry.svg);
}
const out = path.join(root, '.handoff', 'svgs.txt');
fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
console.log(`unique svgs: ${found.size} -> .handoff/svgs.txt (${fs.statSync(out).size} bytes)`);