/**
 * 把原始 HTML 里页面局部的 <style> 块原样抽出，写成独立 CSS 文件。
 * 原因：原站在 blog/post/about 各写了页内 <style>，重建时必须逐字保留这些规则
 * （其中包含 .blog-layout/.post-row/.article-wrap/.about-grid 等页面专属布局）。
 * 产物：src/styles/page-<name>.css，由对应的 .astro 页面 import（保持原站层叠顺序：
 * tokens → base → components → responsive → 页面局部样式）。
 * 运行：node scripts/extract-page-styles.mjs（需在仓库根目录执行，依赖根目录下的原始 HTML）
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = [
  ['blog', 'blog.html'],
  ['post', 'post.html'],
  ['about', 'about.html'],
];

fs.mkdirSync(path.join(root, 'src', 'styles'), { recursive: true });

for (const [name, file] of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const m = html.match(/<style>([\s\S]*?)<\/style>/i);
  if (!m) {
    console.log(`${file}: no <style> block`);
    continue;
  }
  let css = m[1];
  // 去掉行尾空白，统一以换行结尾；其余内容一字不改
  css = css
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n*$/, '\n');
  const out = path.join(root, 'src', 'styles', `page-${name}.css`);
  const header = `/* 原站 ${file} 页内 <style> 的逐字副本（仅修复首尾空白），由 src/pages/${name === 'blog' ? 'blog/[...page].astro' : name === 'post' ? 'posts/[...id].astro' : 'about.astro'} import。\n   原站的层叠顺序为 tokens → base → components → responsive → 本文件，因此本文件必须在全局之后加载。 */\n`;
  fs.writeFileSync(out, header + css, 'utf8');
  console.log(`${file}: ${css.split('\n').length} lines -> src/styles/page-${name}.css`);
}