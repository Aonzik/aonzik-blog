/**
 * remark-chart-embed —— 把 `<figure data-chart="…">` 换成 src/assets/charts 里的图表片段。
 *
 * 为什么需要它：图表原本是 1200px 宽的独立 HTML（深色仪表盘），屏幕截图后才进的文章。
 * 方案 E 改成「构建期把同一份 HTML 内联进正文」，于是文章里只留一行占位符：
 *
 *   <figure data-chart="chart1-asset-spectrum" data-caption="图 1 · 资产光谱"></figure>
 *
 * 插件把占位符替换成：
 *
 *   <figure class="chart-embed">
 *     <div class="chart-embed__canvas">…图表片段…</div>
 *     <figcaption>图 1 · 资产光谱</figcaption>
 *   </figure>
 *
 * 这样做的好处（对照直接粘贴 HTML）：图表片段只有一份、可被 6 篇文章复用；
 * 正文源文件不会混进几百行标记；改样式只改 src/styles/charts.css。
 *
 * 关键取舍：
 * - 在 mdast 的 html 节点上做**字符串替换**，不做 hast 解析。图表片段本身就是
 *   一串 HTML，交给 Astro 自己的 rehype-raw 去解析，插件不承担解析职责。
 * - 找不到片段就 throw，让 `npm run build` 立刻失败 —— 宁可构建报错，
 *   也不要线上出现一片空白。
 * - 占位符必须独占一行（前后空行），否则会被当成行内 html 与正文粘连。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHART_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'charts');

/** 同一张图在一个站点里只用一次磁盘读取。 */
const cache = new Map();

function loadChart(id) {
  if (cache.has(id)) return cache.get(id);

  let html;
  try {
    html = readFileSync(join(CHART_DIR, `${id}.html`), 'utf8');
  } catch {
    throw new Error(
      `[remark-chart-embed] 找不到 src/assets/charts/${id}.html。` +
        '先运行 `node scripts/import-charts.mjs` 从 docs/assets 重新生成图表片段。'
    );
  }

  cache.set(id, html);
  return html;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const PLACEHOLDER = /<figure\s+data-chart="([\w-]+)"(?:\s+data-caption="([^"]*)")?\s*>\s*<\/figure>/;

function render(id, caption) {
  const body = loadChart(id);
  const figcaption = caption ? `\n<figcaption>${escapeAttr(caption)}</figcaption>` : '';

  return (
    '<figure class="chart-embed">' +
    '\n<div class="chart-embed__canvas">\n' +
    body +
    '</div>' +
    figcaption +
    '\n</figure>'
  );
}

export default function remarkChartEmbed() {
  return (tree) => {
    const visit = (parent) => {
      if (!Array.isArray(parent.children)) return;

      parent.children = parent.children.flatMap((node) => {
        if (node.type === 'html') {
          const match = PLACEHOLDER.exec(node.value);
          if (match) return [{ type: 'html', value: render(match[1], match[2]) }];
        }

        visit(node);
        return [node];
      });
    };

    visit(tree);
  };
}
