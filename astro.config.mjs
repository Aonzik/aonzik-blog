// @ts-check
import { defineConfig } from 'astro/config';

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
  },

  build: {
    format: 'directory',
  },
});