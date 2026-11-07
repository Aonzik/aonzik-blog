/**
 * clear-content-cache —— 构建前清掉 Astro 的内容层缓存。
 *
 * 为什么必须有这一步：
 * Astro 的 content layer 会把每篇文章渲染好的 HTML 存进 `.astro/data-store.json`，
 * 缓存键是**文章 .md 的内容摘要**。图表片段（src/assets/charts/*.html）是在 remark
 * 阶段被塞进正文的，**不在缓存键里** —— 于是「只改片段、不改 md」时，构建会命中旧缓存，
 * 打出来的页面还是上一版的片段（典型症状：图里的 `$\rightarrow$` 原样显示、表格换不回新结构）。
 *
 * 用 `npm run build` 时这个脚本由 `prebuild` 自动触发，所以部署机（git pull 后自动构建）
 * 也不需要人工登录删文件。
 *
 * 只删缓存文件、不删整个目录，避免把 .astro 里的其他产物一起清掉；
 * 另外顺手清理 node_modules/.astro 下的同名缓存（不同 Astro 版本放的位置不一样）。
 */
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const targets = [join('.astro', 'data-store.json'), join('node_modules', '.astro', 'data-store.json')];

const removed = targets.filter((file) => {
  if (!existsSync(file)) return false;
  rmSync(file, { force: true });
  return true;
});

console.log(
  removed.length > 0
    ? `[clear-content-cache] 已删除 ${removed.join(', ')}`
    : '[clear-content-cache] 没有缓存需要清理'
);
