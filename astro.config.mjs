// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkChartEmbed from './src/lib/remark-chart-embed.mjs';
import remarkBoldFallback from './src/lib/remark-bold-fallback.mjs';
import rehypeTableScroll from './src/lib/rehype-table-scroll.mjs';

// 部署前把 site 改成正式域名（RSS / 站点地图 / 绝对链接会用到它）。
const SITE = process.env?.SITE_URL ?? 'https://aonzik.example.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',

  // Astro 7 默认 compressHTML: 'jsx'，会按 JSX 规则吃掉行内元素之间的空格。
  // 原站点大量依赖行内元素间的字面空格（如「阅读全文 →」「共 12 篇文章」），
  // 所以这里回到 HTML 感知的压缩方式，保证渲染结果与原美术稿一致。
  compressHTML: true,

  // 原设计是「纸 / 墨 / 朱砂」单强调色体系，代码块本身用 paper-sunken 墨底 + 等宽字，
  // 不引入第二套彩色。所以关掉 shiki 的 token 着色，交给 .prose pre 的样式。
  // 若将来想要语法高亮：删掉下面这行并配置 markdown.shikiConfig.themes。
  markdown: {
    syntaxHighlight: false,

    // 数学公式：remark-math 负责认出 $…$（行内）与 $$…$$（行间），
    // rehype-katex 在构建期就渲染成 KaTeX 的静态 HTML ——
    // 纯 CSS 排版，页面不加载任何 JS，也不依赖外网 CDN。
    // 注：Astro 7 默认处理器是 Sätteri，它自带 math 但只提供自家的 hast visitor API，
    // 不能直接跑 rehype-katex；这里显式声明 unified 处理器（@astrojs/markdown-remark），
    // 与 Sätteri 的默认特性（GFM / smartypants）保持一致。
    processor: unified({
      // 图表占位符 `<figure data-chart="…">` 在 remark-math 之前换成片段即可：
      // 图表里没有数学公式，两个插件互不干扰（见 src/lib/remark-chart-embed.mjs）。
      remarkPlugins: [
        remarkChartEmbed,
        // 中文里「**术语（英文）**」这种写法的闭合 ** 会因「前后都是标点/汉字」
        // 而不满足 CommonMark 的 right-flanking 条件，整段粗体渲染失败。
        // 这个插件只补残留的 `**…**`，不动任何已经解析成功的强调。
        remarkBoldFallback,
        remarkMath,
      ],
      rehypePlugins: [
        // 宽表格套滚动容器，避免手机上整页横向滚动（见 src/lib/rehype-table-scroll.mjs）。
        rehypeTableScroll,
        [
          rehypeKatex,
          {
            // 原稿里有非标准写法（\exist、数学模式里直接写中文、全角括号），
            // 这些不该让整篇构建失败：降级成朱砂色提示文字，其余公式照常渲染。
            throwOnError: false,
            strict: false,
            errorColor: '#a8442a',
            // 原稿通篇把 \exists 写成 \exist，这里统一补个别名，不用改正文。
            macros: { '\\exist': '\\exists' },
          },
        ],
      ],
    }),
  },

  build: {
    format: 'directory',
  },
});