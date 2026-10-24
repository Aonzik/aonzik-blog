# Aonzik Blog

个人博客，用 [Astro](https://astro.build/) 重建。美术设计沿用原先的手写 HTML 版本
（纸 / 墨 / 朱砂），**样式文件逐字保留、未做改动**；在此之上新增了一套「二次元装饰预留位」子系统。

## 命令

```bash
npm install          # 安装依赖
npm run dev          # 本地开发（http://localhost:4321）
npm run build        # 构建到 dist/
npm run preview      # 预览构建产物
npm run check        # astro check（.astro / .ts 类型检查）
```

站点地址通过环境变量传入（默认 `https://aonzik.example.com`）：

```bash
SITE_URL=https://your-domain.com npm run build
```

## 目录结构

```
src/
├─ content.config.ts      # 内容集合定义（posts，glob loader + zod schema）
├─ content/posts/*.md     # 文章（12 篇，目前都是占位内容）
├─ layouts/BaseLayout.astro   # 唯一的布局：head、导入样式、装饰固定层、导航、页脚、搜索、全局脚本
├─ components/
│  ├─ SiteNav / SiteFooter / BackToTop / SearchOverlay   # 全站公共块
│  ├─ PostCard / PostRow / BlogList / BlogSidebar        # 列表相关
│  ├─ Toc.astro                                          # 文章目录（正文内 + 侧栏共用一个组件）
│  └─ Decor.astro                                        # 装饰槽位（见下）
├─ lib/
│  ├─ site.ts             # 站点信息、导航、页脚、分类顺序、话题词
│  ├─ posts.ts            # 文章排序/筛选/日期/阅读时长/分页/话题等纯函数
│  └─ decorations.ts      # 装饰位注册表（29 个槽位）
├─ pages/
│  ├─ index.astro         # 首页
│  ├─ blog/[...page].astro# 文章列表（分页，每页 6 篇）
│  ├─ posts/[...id].astro # 文章页
│  ├─ tags/index.astro    # 话题总览
│  ├─ tags/[tag].astro    # 单个话题（分类名或标签名）
│  ├─ about.astro         # 关于
│  ├─ decor.astro         # 装饰位总览（规格表）
│  ├─ 404.astro
│  └─ rss.xml.ts          # RSS 2.0
├─ scripts/main.ts        # 前端交互：主题、装饰开关、滚动显现、目录高亮、进度条、技能条、搜索浮层
└─ styles/
   ├─ tokens.css base.css components.css responsive.css  # 原稿样式，逐字保留
   ├─ page-blog.css page-post.css page-about.css         # 原站页内 <style> 的逐字副本
   └─ decorations.css                                    # 新增：装饰层（唯一的新样式文件）
```

## 路由

| 路径 | 说明 |
| --- | --- |
| `/` | 首页（hero、精选、最新、话题标签云） |
| `/blog/`、`/blog/2/` | 文章列表（每页 6 篇，分页由数据驱动） |
| `/posts/<slug>/` | 文章页 |
| `/tags/` | 话题总览（分类 + 标签，带计数） |
| `/tags/<话题>/` | 单个话题页（分类名与标签名共用一套路由） |
| `/about/` | 关于 |
| `/decor/` | 装饰位总览 |
| `/rss.xml` | RSS 订阅 |

## 写文章

在 `src/content/posts/` 新建 `.md`，frontmatter 字段（`src/content.config.ts`）：

```yaml
---
title: 文章标题
description: 列表与卡片上的摘要（不写则截取正文）
date: 2025-10-01          # 必填，YYYY-MM-DD
updated: 2025-10-05       # 可选
category: 技术             # 默认「随笔」
tags: [技术, 工具]         # 可选
cover: /images/x.png      # 可选
coverAlt: 封面说明         # 可选
featured: false           # true 会成为首页精选（只取第一篇）
draft: false              # true 不参与构建输出
readingTime: 8            # 可选，单位分钟；不写则按字数估算（中文 350 字/分）
---
```

正文用 Markdown，样式由 `.prose` 负责（标题、引用、列表、表格、代码块）。
代码块不做语法高亮：全站只有一个强调色，染色块会破坏「纸墨」观感
（想开启就把 `astro.config.mjs` 里的 `markdown.syntaxHighlight: false` 删掉并配置 `shikiConfig`）。
文章内标题会生成锚点，目录（正文内与右侧粘性侧栏）由 `render()` 返回的 `headings` 自动生成。

## 二次元装饰预留位

整站为此预留了 **29 个空位**，位置、尺寸、画图建议都登记在 `src/lib/decorations.ts`，
视觉与开关在 `src/styles/decorations.css`，总览在 `/decor/`。

三种模式：

| 模式 | 行为 |
| --- | --- |
| 显示（`on`，默认） | 空位不占任何空间；一旦槽位里放了插画，占位自动生效 |
| 关闭（`off`） | 所有装饰槽位 `display:none` |
| 调试（`debug`） | 每个空位画虚线框 + 槽位名，用来检查版面留白 |

切换方式：导航栏上的装饰开关按钮（三态循环）、`/decor/` 页上的「显示 / 关闭 / 调试」按钮、
或链接参数 `?decor=debug`。状态存在 `localStorage["aonzik-decor"]`，主题同理
（`localStorage["aonzik-theme"]`），首屏由 `BaseLayout` 里的内联脚本处理，避免闪白。

放一张插画只需往槽位里塞内容（槽位内的 `img / svg / picture / canvas` 会自动铺满）：

```astro
---
import Decor from '../components/Decor.astro';
---
<div class="decor-slot" data-decor-slot="hero-sprite">
  <img src="/decor/hero.png" alt="" />
</div>

<!-- 或者用组件（会校验槽位名，写错直接报错） -->
<Decor slot="hero-sprite">
  <img src="/decor/hero.png" alt="" />
</Decor>
```

新增一个槽位的三步：`src/lib/decorations.ts` 登记 → `src/styles/decorations.css` 第 5 节写位置
→ 在宿主元素里放 `<Decor slot="…" />`（需要定位上下文的宿主加 `decor-host` 类）。

## 与原稿的关系

* `tokens.css` / `base.css` / `components.css` / `responsive.css` 与原稿**逐字节相同**，
  重建时用哈希校验过；`page-blog.css` / `page-post.css` / `page-about.css` 是原站页内 `<style>` 的逐字副本。
* 页面级样式放在 `src/styles/page-*.css`，由页面在 `import BaseLayout` **之后**导入，
  以复现原站「全局样式 → 页内 `<style>`」的层叠顺序。组件里不使用 Astro 的 scoped `<style>`，
  因为 scoped 属性会让跨组件、跨 markdown 渲染的 DOM 命不中样式。
* 有意做的少量改动：标签 / 分类统一成 `/tags/<话题>/` 路由（原稿是筛选按钮与标签云都指向 blog.html）；
  分页由数据驱动；筛选按钮从 `<button>` 改为 `<a>`（视觉不变）；新增 `/tags/`、`/decor/`、`/rss.xml`、`/404`。
* 美术约束见 `docs/DESIGN.md`（只有一个强调色、底色非纯白、正文非纯黑、阴影用暖墨色、纸不圆等）。

## 已知待办

* 文案、封面、头像、项目缩略图仍是占位内容，需要逐个替换。
* 搜索浮层是纯占位（没有索引），要真检索可接 Pagefind 之类的静态索引。
* 页脚里的 GitHub / Twitter 等外链仍是 `#`。
* `src/content.config.ts` 里的 `decorNote` 字段暂时没有页面使用。