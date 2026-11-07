/**
 * render-math-in-html —— 把一段 HTML 字符串里的 `$…$` / `$$…$$` 就地编译成 KaTeX。
 *
 * 为什么需要它：
 * 本站正文的数学是靠 remark-math + rehype-katex 处理的，但那条管线只看 **markdown** 节点。
 * `src/assets/charts/*.html` 里的图表片段是在 remark 阶段被当作**原始 HTML 字符串**塞进
 * mdast 的（见 remark-chart-embed.mjs），KaTeX 根本看不到里面的 `$…$`，于是片段里的公式
 * 会原样显示成 `$\Delta P / P \approx - \text{Duration} \times \Delta y$`。
 *
 * 这里在注入之前先自己走一遍 KaTeX，把公式编译成 `<span class="katex">…`，
 * 与正文公式用的是同一套 KaTeX 输出和同一份 katex.min.css，观感完全一致。
 *
 * 实现要点：
 * - 按标签切分，只在**文本节点**上替换；`<style>` / `<script>` / `<code>` / `<pre>`
 *   内部整段跳过（CSS 里可能有 `$`，代码示例里的 `$` 也不该被当成公式）。
 * - 行内公式加了两条保险：`$` 后面不能紧跟空白或 `$`，`$` 前面不能是空白。
 *   这样 "价格 $10 到 $20" 这类金额不会被误当成公式。
 * - 编译失败（比如真的不是公式）就保留原文，构建不因此中断。
 */
import katex from 'katex';

/** 与 astro.config.mjs 里 rehype-katex 的宏保持一致。 */
const MACROS = { '\\exist': '\\exists' };

/** 这些标签内部不做公式替换。 */
const RAW_TAGS = new Set(['style', 'script', 'code', 'pre']);

const TAG = /<[^<>]*>/;
const TAG_NAME = /^<\s*(\/?)\s*([a-zA-Z][-\w]*)/;

function renderTeX(tex, displayMode) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
      macros: MACROS,
    });
  } catch {
    return null;
  }
}

function replaceMath(text) {
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (whole, tex) => renderTeX(tex, true) ?? whole)
    .replace(/\$(?![\s$])((?:\\[\s\S]|[^$\\])+?)(?<!\s)\$/g, (whole, tex) => renderTeX(tex, false) ?? whole);
}

export function renderMathInHtml(html) {
  if (!html.includes('$')) return html;

  let depth = 0;
  return html
    .split(new RegExp(`(${TAG.source})`, 'g'))
    .map((part) => {
      if (!part) return part;

      if (part.startsWith('<')) {
        const name = TAG_NAME.exec(part);
        if (name) {
          const tag = name[2].toLowerCase();
          if (RAW_TAGS.has(tag)) depth = Math.max(0, depth + (name[1] ? -1 : 1));
        }
        return part;
      }

      return depth > 0 ? part : replaceMath(part);
    })
    .join('');
}
