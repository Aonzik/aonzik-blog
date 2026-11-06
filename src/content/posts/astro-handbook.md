---
title: Astro 学习手册
description: 版本基线为：2026 年 10 月，Astro 7.x（Rust 编译器 + Sätteri Markdown + Vite 8/Rolldown）。适用读者：会 HTML/CSS/JS，刚学完 TypeScript 与 Node 基础，没写过前端框架的学员。阅读前提：知道 `npm` 怎么用、什么是 ESM、什么是组件化。
date: 2026-11-01
category: 技术
tags:
  - AIGC
  - 技术
  - 笔记
---

## 目录

- [0. Astro 是什么](#0-astro-是什么)
- [1. 创建第一个项目](#1-创建第一个项目)
- [2. `.astro` 组件语法](#2-astro-组件语法)
- [3. 页面与布局](#3-页面与布局)
- [4. 路由](#4-路由)
- [5. 数据获取](#5-数据获取)
- [6. 内容集合（Content Collections）](#6-内容集合content-collections)
- [7. Markdown 与 MDX](#7-markdown-与-mdx)
- [标题](#标题)
- [8. 样式](#8-样式)
- [9. 图片与静态资源](#9-图片与静态资源)
- [10. 岛屿：在 Astro 里用 React / Vue / Svelte](#10-岛屿在-astro-里用-react-vue-svelte)
- [11. 动态渲染（SSR）与服务端能力](#11-动态渲染ssr与服务端能力)
- [12. 环境变量与配置](#12-环境变量与配置)
- [13. SEO、RSS、站点地图与可访问性](#13-seorss站点地图与可访问性)
- [14. 国际化（i18n）](#14-国际化i18n)
- [15. 构建与部署](#15-构建与部署)
- [16. 调试与常见错误](#16-调试与常见错误)
- [17. 实战：一个可部署的博客](#17-实战一个可部署的博客)
- [18. 从 HTML 迁移 / 与其他框架对比](#18-从-html-迁移-与其他框架对比)
- [19. 练习](#19-练习)
- [20. 速查表](#20-速查表)
- [21. 学习路径与资源](#21-学习路径与资源)

---

## 0. Astro 是什么

### 0.1 一句话定义

**Astro 是一个"以内容为中心"的网站框架：默认输出纯 HTML，只有在需要交互的地方才加载 JavaScript。**

它同时支持：

- **静态站点生成（SSG）**：构建时生成 HTML，可部署到任何 CDN。
- **服务端渲染（SSR）**：请求时生成 HTML，可做登录、个性化。
- **混合模式**：大部分页面预渲染，个别路由按需渲染。

### 0.2 核心概念：岛屿架构（Islands Architecture）

传统 SPA（React/Vue 单页应用）的做法是：整个页面由 JS 渲染，浏览器下载一大包 JS 再"画"出来。

Astro 的做法是：

```
┌──────────────────────────────────────────┐
│  静态 HTML（构建时生成，直接可见）          │
│   ┌──────────┐        ┌──────────┐        │
│   │ 岛屿 A   │        │ 岛屿 B   │        │
│   │ 交互组件 │        │ 交互组件 │        │
│   └──────────┘        └──────────┘        │
└──────────────────────────────────────────┘
```

- 页面骨架是服务端渲染好的 HTML，首屏快、SEO 好。
- 只有标记了 `client:*` 指令的组件才会被"激活"（hydrate），并且**各自独立加载**。
- 一个页面 90% 是静态内容，10% 是交互，就只付 10% 的 JS 成本。

### 0.3 与其他方案对比

| | Astro | Next.js | 纯 HTML + 手写 JS | Vite + React SPA |
| --- | --- | --- | --- | --- |
| 默认产物 | 静态 HTML | React 页面 + RSC | HTML | JS 渲染的 SPA |
| 首屏 JS | 极少 | 中等 | 0（或按需） | 大 |
| 内容型站点 | ★★★★★ | ★★★ | ★★ | ★★ |
| 强交互应用 | ★★★ | ★★★★★ | ★ | ★★★★★ |
| 学习曲线 | 低（会 HTML 就能上手） | 中高 | 最低 | 中 |
| 适合博客/文档/官网 | 非常适合 | 可以 | 可以但难维护 | 过度工程 |

**判断标准**：如果页面主要是"展示内容 + 少量交互"（博客、文档、电商落地页、公司官网），Astro 是当前最省心的选择。如果是复杂后台系统（大量状态、表格、实时协作），用 React/Vue 的 SPA 更合适。

Astro 也可以和 React/Vue/Svelte/Solid/Preact 共存：把已有组件直接当岛屿用。所以它不是"二选一"，而是"以内容为主、局部上框架"。

### 0.4 需要先掌握什么

1. **HTML 语义化标签**：`<header>`、`<nav>`、`<main>`、`<article>`、`<footer>`。
2. **CSS 基础**：选择器、盒模型、flex/grid、响应式。
3. **ESM**：`import` / `export`。
4. **TypeScript 基础**：类型注解、接口（本手册的组件都用 TS）。
5. **Node 基础**：`npm install`、`npm run`、`package.json`。

---

## 1. 创建第一个项目

### 1.1 脚手架

```bash
npm create astro@latest my-site
cd my-site
npm install
npm run dev
```

交互式提问会问：

- 模板：选 **Minimal**（先理解结构）或 **Blog**（看完整例子）。
- 是否使用 TypeScript：**Yes, strict**。
- 是否安装依赖：Yes。
- 是否初始化 git：按需。

### 1.2 目录结构

```
my-site/
├── astro.config.mjs        # 框架配置
├── package.json
├── tsconfig.json
├── public/                 # 原样拷贝的静态资源（favicon、robots.txt、图片）
└── src/
    ├── pages/              # 文件路由：每个文件 = 一个页面
    │   └── index.astro     # → /
    ├── layouts/            # 布局组件（可选，惯例）
    ├── components/         # 组件（可选，惯例）
    ├── content/            # Markdown/MDX 内容（配合内容集合）
    ├── content.config.ts   # 内容集合定义（Astro 5+）
    └── styles/             # 全局样式
```

关键规则：

- **`src/pages/` 下的文件结构就是 URL 结构**。`src/pages/about.astro` → `/about`。
- `public/` 里的文件按原路径访问：`public/logo.png` → `/logo.png`，**不经过构建处理**（不会压缩、不会加 hash）。
- `src/` 里的资源才会被构建系统处理（导入、优化、加 hash）。

### 1.3 脚本命令

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "astro": "astro"
  }
}
```

- `astro dev`：开发服务器，默认 <http://localhost:4321>，支持 HMR。
- `astro build`：构建到 `dist/`。
- `astro preview`：本地预览构建产物（不是开发服务器）。
- `astro check`：类型检查 `.astro` 文件（需要 `@astrojs/check` + `typescript`）。

> 在 AI 代理或 CI 环境里，Astro 7 支持后台模式：`astro dev --background`，配套 `astro dev status|logs|stop`。

### 1.4 配置文件

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",   // 影响 sitemap、RSS、canonical URL
  output: "static",              // "static"（默认）| "server"
  trailingSlash: "ignore",       // "always" | "never" | "ignore"
  prefetch: true,
});
```

`site` 不是必填，但**只要用到 sitemap、RSS、绝对 URL、OG 标签，就必须填**，否则生成的链接是相对的或直接报错。

---

## 2. `.astro` 组件语法

这是 Astro 唯一需要新学的东西，但它非常小。

### 2.1 结构

```astro
---
// ① 前置脚本（frontmatter）：只在服务端/构建时运行
import { getCollection } from "astro:content";

interface Props {
  title: string;
}

const { title } = Astro.props;
const posts = await getCollection("blog");     // 支持顶层 await
---

<!-- ② 模板：看起来就是 HTML -->
<h1>{title}</h1>

<ul>
  {posts.map((post) => (
    <li><a href={`/blog/${post.id}/`}>{post.data.title}</a></li>
  ))}
</ul>

<!-- ③ 样式：默认只作用于本组件 -->
<style>
  h1 { color: teal; }
</style>
```

三段的分工：

| 段 | 运行位置 | 能写什么 |
| --- | --- | --- |
| 前置脚本 `---` | 服务端 / 构建时（Node） | JS/TS 全部能力：`fs`、数据库、`fetch`、`import` |
| 模板 | 服务端渲染成 HTML | HTML + 表达式 `{}` + 组件 |
| `<style>` | 构建时作用域化 | CSS |

**前置脚本不会发到浏览器。** 这是 Astro 和 React 最大的差别：你可以在这里直接查数据库、读文件、用密钥，而不会泄露。

### 2.2 表达式

```astro
---
const name = "世界";
const items = ["a", "b"];
const show = true;
---

<p>你好，{name}！</p>
<p>{1 + 2}</p>
<p>{items.length} 项</p>
<p>{items.join(", ")}</p>
<p class={show ? "on" : "off"}>条件类名</p>
<input disabled={false} />
<div data-id={42}></div>
```

- `{}` 里只能写**表达式**，不能写语句（`if`、`for` 用下面的语法）。
- 属性值不加引号时，`{}` 里是 JS 表达式。
- 布尔属性：`checked={false}` 会直接不输出该属性。

### 2.3 条件与循环

```astro
{show && <p>显示</p>}

{show ? <p>是</p> : <p>否</p>}

<ul>
  {items.map((item) => <li>{item}</li>)}
</ul>

{/* 这是注释（构建时被移除） */}
```

**没有 `v-if` / `ngIf`**，就是 JS 的 `&&` 和三元表达式。

### 2.4 组件与 Props

```astro
---
// components/Card.astro
interface Props {
  title: string;
  description?: string;
  tags?: string[];
}

const { title, description = "暂无描述", tags = [] } = Astro.props;
---

<article class="card">
  <h2>{title}</h2>
  <p>{description}</p>
  {tags.length > 0 && (
    <ul>{tags.map((t) => <li>{t}</li>)}</ul>
  )}
</article>

<style>
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
</style>
```

使用：

```astro
---
import Card from "../components/Card.astro";
---

<Card title="你好" description="第一个组件" tags={["astro", "ts"]} />
```

要点：

- 组件名**必须大写开头**，否则会被当作原生 HTML 标签。
- `Astro.props` 有 `interface Props` 时自动获得类型检查。
- 没有 `children` 专用 prop，内容通过 `<slot />` 传递（见 §4）。

### 2.5 `<slot />`：内容投影

```astro
<!-- components/Panel.astro -->
<div class="panel">
  <slot />                    <!-- 默认插槽 -->
</div>
```

```astro
<Panel>
  <p>这段内容会出现在 slot 的位置</p>
</Panel>
```

### 2.6 具名插槽

```astro
<!-- components/Layout.astro -->
<header><slot name="header" /></header>
<main><slot /></main>
<footer><slot name="footer">默认页脚</slot></footer>
```

```astro
<Layout>
  <h1 slot="header">标题</h1>
  <p>正文</p>
  <p slot="footer">自定义页脚</p>
</Layout>
```

插槽可以带**回退内容**（slot 内部的 HTML），当没有传入时显示。

### 2.7 模板里的"片段"与 Fragment

```astro
<>
  <li>a</li>
  <li>b</li>
</>
```

`<>...</>` 是 Fragment，不产生额外 DOM 节点。常用于 `map` 返回多个元素时。

### 2.8 HTML 严格性（Astro 7 的变化，重要）

Astro 7 的编译器换成了 Rust 实现，行为更像 JSX：

1. **不再自动修正 HTML**：未闭合的 `<div>` 会**直接报错**，而不是被悄悄补全。
2. **属性必须闭合引号**：`<div class="x>` 报错。
3. **元素之间的空白按 JSX 规则折叠**：

```astro
<!-- 渲染为 "HelloWorld"（不再有空格） -->
<span>Hello</span>
<span>World</span>

<!-- 需要空格就显式写 -->
<span>Hello</span>{' '}<span>World</span>
```

这三点会让"从 HTML 复制粘贴"的代码报错，是正常的，按提示补齐即可。

### 2.9 全局对象 `Astro`

组件里可以直接用 `Astro`：

| 属性 | 说明 |
| --- | --- |
| `Astro.props` | 传入的属性 |
| `Astro.params` | 动态路由参数 |
| `Astro.url` | 当前 `URL` 对象 |
| `Astro.request` | `Request` 对象（SSR 时有用） |
| `Astro.redirect(path, status)` | 返回重定向响应 |
| `Astro.locals` | 中间件写入的请求级数据 |
| `Astro.cookies` | 读写 Cookie（SSR） |
| `Astro.session` | 会话（需配置驱动，SSR） |
| `Astro.cache` | 路由缓存控制（Astro 7，SSR） |
| `Astro.self` | 组件自身（递归渲染用） |

---

## 3. 页面与布局

### 3.1 页面就是组件

`src/pages/index.astro` 渲染 `/`。页面和组件的写法完全一样，区别只是"在 `pages/` 下"。

### 3.2 布局（Layout）

布局本质是"带 `<slot />` 的组件"。几乎所有项目都需要一个 `BaseLayout.astro`：

```astro
---
// src/layouts/BaseLayout.astro
import "../styles/global.css";

interface Props {
  title: string;
  description?: string;
}

const { title, description = "我的 Astro 站点" } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <header>
      <nav>
        <a href="/">首页</a>
        <a href="/blog/">博客</a>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>© {new Date().getFullYear()} 我的站点</p>
    </footer>
  </body>
</html>
```

使用：

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="关于" description="关于本页">
  <h1>关于</h1>
  <p>内容……</p>
</BaseLayout>
```

**注意**：布局是"包住"页面的，所以 `<html>`、`<head>`、`<body>` 只应该出现在布局里。页面里不要再写一遍。

### 3.3 布局嵌套

```
BaseLayout（html/head/body）
  └── BlogLayout（文章页特有的头图、目录、上一篇/下一篇）
        └── 文章页面
```

嵌套时内层布局用 `<slot />` 接收页面内容，外层布局接收内层布局。这是组合，不是继承。

### 3.4 全局样式的位置

在布局的前置脚本里 `import "../styles/global.css"`。Astro 会把它打进所有使用该布局的页面。

---

## 4. 路由

### 4.1 文件即路由

```
src/pages/index.astro          → /
src/pages/about.astro          → /about
src/pages/blog/index.astro     → /blog
src/pages/blog/first-post.md   → /blog/first-post
src/pages/[slug].astro         → /:slug（动态）
src/pages/docs/[...path].astro → /docs/a/b/c（通配）
src/pages/404.astro            → 404 页面
```

支持的页面文件类型：`.astro`、`.md`、`.mdx`、`.html`，以及 `.ts`/`.js`（API 端点）。

### 4.2 动态路由

```astro
---
// src/pages/blog/[slug].astro
export function getStaticPaths() {
  return [
    { params: { slug: "hello" } },
    { params: { slug: "world" } },
  ];
}

const { slug } = Astro.params;
---

<h1>文章：{slug}</h1>
```

- `getStaticPaths()` **只在静态构建时调用**，必须返回数组。
- `params` 的键必须和文件名里的 `[xxx]` 对应。
- `props` 可以把数据直接传给页面，避免重复查询：

```astro
---
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
---
```

### 4.3 通配路由

```astro
---
// src/pages/docs/[...path].astro
export function getStaticPaths() {
  return [
    { params: { path: undefined } },        // /docs
    { params: { path: "a" } },              // /docs/a
    { params: { path: "a/b/c" } },          // /docs/a/b/c
  ];
}
const { path } = Astro.params;
---
```

`[...path]` 也能匹配"没有段"的情况（传 `undefined`）。

### 4.4 路由优先级

静态段优先于动态段：

```
/blog/about.astro       → /blog/about   ✅ 优先
/blog/[slug].astro      → /blog/xxx
```

`404.astro` 用于未匹配的路径（静态构建时由托管平台返回）。

### 4.5 重定向

```js
// astro.config.mjs
export default defineConfig({
  redirects: {
    "/old": "/new",
    "/legacy": { status: 301, destination: "/blog" },
  },
});
```

页面里也可以：`return Astro.redirect("/login")`（SSR 或端点中）。

### 4.6 端点（API 路由）

`src/pages/api/hello.ts`：

```ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const name = url.searchParams.get("name") ?? "world";
  return new Response(JSON.stringify({ hello: name }), {
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({ received: body }), { status: 201 });
};
```

- 导出的名字就是 HTTP 方法：`GET`、`POST`、`PUT`、`PATCH`、`DELETE`、`ALL`。
- 静态构建时会预渲染成静态文件；`export const prerender = false` 可以强制按需执行（需 SSR）。

---

## 5. 数据获取

### 5.1 前置脚本里直接 `await`

```astro
---
const res = await fetch("https://api.example.com/posts");
const posts = await res.json();
---
```

这是 Astro 最爽的地方之一：数据在构建时（或请求时）就取好了，模板里直接渲染，浏览器不用发请求。

### 5.2 错误处理

构建时请求失败会让**整个构建失败**（这是好事，早发现）。要容错就自己包：

```astro
---
let posts: Post[] = [];
try {
  const res = await fetch(url);
  if (res.ok) posts = await res.json();
} catch (e) {
  console.error("fetch failed", e);
}
---
```

### 5.3 缓存与去重

同一个构建里对同一 URL 多次 `fetch`，Astro 不保证去重。需要的话自己缓存：

```ts
let cache: Promise<Post[]> | undefined;
export function getPosts() {
  return (cache ??= fetch(url).then((r) => r.json()));
}
```

### 5.4 `import.meta.glob`：批量导入本地文件

```astro
---
const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/*.{png,jpg}");
---
```

返回 `{ 路径: () => Promise<模块> }`，需要时再 `await`。适合"读取目录下所有资源"。

### 5.5 静态构建 vs 请求时获取

| 场景 | 时机 | 代价 |
| --- | --- | --- |
| 博客文章、产品列表 | 构建时 | 内容更新要重新构建 |
| 用户信息、购物车 | 请求时（SSR） | 每次请求都要算 |
| 高频变化的公共数据 | 构建时 + 定时重建 / 路由缓存 | 需要 CDN 失效策略 |

Astro 7 的**路由缓存**（§11.9）可以在 SSR 下把响应缓存起来，兼顾两者。

---


## 6. 内容集合（Content Collections）

当内容从"几个页面"变成"几十上百篇 Markdown"，手写 `import.meta.glob` 就会失控。内容集合解决三件事：

1. **统一的目录与加载方式**（本地文件、远程 CMS、数据库都行）。
2. **类型安全的 frontmatter**：字段类型、必填、默认值。
3. **内置的查询与渲染 API**。

### 6.1 定义集合

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

export const collections = { blog };
```

对应文件：

```
src/content/blog/
├── hello-world.md
└── 2026/
    └── astro-notes.md
```

`id` 就是相对于 `base` 的路径（去掉扩展名），例如 `2026/astro-notes`。

> Astro 5 起配置文件名是 `src/content.config.ts`（不再是 `src/content/config.ts`），并且必须使用 loader（`glob` / `file` / 自定义 loader）。旧的 "文件夹即集合" 隐式方式已移除。

### 6.2 frontmatter

```md
---
title: 我的第一篇文章
pubDate: 2026-10-01
tags: [astro, tutorial]
draft: false
---

正文从这里开始。
```

`schema` 校验失败会让**构建失败**，并指出是哪个文件的哪个字段。这是内容集合最大的价值：不会上线一篇缺标题的文章。

### 6.3 查询

```ts
import { getCollection, getEntry } from "astro:content";

// 全部（过滤草稿 + 按日期倒序）
const posts = (await getCollection("blog", ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

// 单篇
const post = await getEntry("blog", "hello-world");

// 引用关系（schema 里用 reference()）
const author = await getEntry(post.data.author);
```

### 6.4 渲染

```astro
---
import { getCollection, render } from "astro:content";

const posts = await getCollection("blog");
const { Content, headings } = await render(posts[0]);
---

<article>
  <Content />
</article>

<nav>
  {headings.map((h) => <a href={`#${h.slug}`}>{h.text}</a>)}
</nav>
```

- `render(entry)` 返回 `{ Content, headings, remarkPluginFrontmatter }`。
- `<Content />` 是编译后的 Markdown 组件。
- `headings` 是标题树（`depth`、`slug`、`text`），做目录非常方便。

### 6.5 列表页与分页

```astro
---
// src/pages/blog/index.astro
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

const posts = (await getCollection("blog", ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---

<BaseLayout title="博客">
  <h1>博客</h1>
  <ul>
    {posts.map((p) => (
      <li>
        <a href={`/blog/${p.id}/`}>{p.data.title}</a>
        <time datetime={p.data.pubDate.toISOString()}>
          {p.data.pubDate.toLocaleDateString("zh-CN")}
        </time>
      </li>
    ))}
  </ul>
</BaseLayout>
```

大量文章时按页拆分：

```astro
---
// src/pages/blog/[...page].astro
import { getCollection } from "astro:content";
import type { GetStaticPaths, Page } from "astro";

export const getStaticPaths = (async ({ paginate }) => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return paginate(posts, { pageSize: 10 });
}) satisfies GetStaticPaths;

const { page } = Astro.props as { page: Page };
---

<ul>{page.data.map((p) => <li>{p.data.title}</li>)}</ul>

{page.url.prev && <a href={page.url.prev}>上一页</a>}
<span>{page.currentPage} / {page.lastPage}</span>
{page.url.next && <a href={page.url.next}>下一页</a>}
```

`paginate(data, { pageSize })` 自动生成 `/blog/`、`/blog/2/`、`/blog/3/`……，并从 `Astro.props.page` 读取当前页数据。

### 6.6 详情页

```astro
---
// src/pages/blog/[id].astro  （注意：id 里可能有斜杠，静态构建没问题）
import { getCollection, render } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <h1>{post.data.title}</h1>
    <time>{post.data.pubDate.toLocaleDateString("zh-CN")}</time>
    <Content />
  </article>
</BaseLayout>
```

如果 `id` 里带 `/`，参数名用 `[...id]`（通配）才能匹配多段路径。

### 6.7 自定义 loader（接 CMS / API）

```ts
import { defineCollection } from "astro:content";

const posts = defineCollection({
  loader: async () => {
    const res = await fetch("https://cms.example.com/posts");
    const rows = await res.json();
    return rows.map((r: any) => ({
      id: String(r.id),
      title: r.title,          // 顶层字段会进入 entry.data? 
      ...r,
    }));
  },
  schema: /* ... */,
});
```

自定义 loader 的返回值需要符合 `{ id, ...data }` 的形状（具体以官方 loader API 为准）。Astro 7 还支持 **live collections**：数据在请求时获取并可带缓存提示，配合 `Astro.cache` 使用。

---

## 7. Markdown 与 MDX

### 7.1 Markdown

`src/pages/about.md` 直接就是一个页面，支持 frontmatter 和布局：

```md
---
layout: ../layouts/BaseLayout.astro
title: 关于
---

## 标题

正文。
```

或者放在内容集合里，由页面统一渲染（推荐，更可控）。

### 7.2 语法高亮

Astro 默认用 Shiki 做构建时高亮，无需客户端 JS：

````md
```ts title="app.ts"
const x: number = 1;
```
````

主题在 `astro.config.mjs` 配置：

```js
export default defineConfig({
  markdown: {
    shikiConfig: { theme: "github-dark", wrap: true },
  },
});
```

### 7.3 Astro 7 的 Markdown 管线

Astro 7 默认使用 **Sätteri**（Rust 实现）：

- GFM（表格、删除线、任务列表、脚注）**默认开启**，不再需要 `remark-gfm`。
- 智能标点、标题 id、容器指令、数学公式、上下标等都可以通过 `features` 打开。
- 如果你依赖 remark/rehype 插件，仍可切回 unified 管线：

```js
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";

export default defineConfig({
  markdown: { processor: unified({ remarkPlugins: [remarkToc] }) },
});
```

新手建议：**先用默认管线**。需要插件时再切换，别一上来就配一堆。

### 7.4 MDX

MDX = Markdown + JSX，可以在正文里用组件：

```bash
npx astro add mdx
```

```mdx
---
title: 用 MDX 写文章
---

import Counter from "../../components/Counter.jsx";

正文里可以直接嵌入组件：

<Counter client:visible />
```

MDX 适合"文档里要嵌交互示例"的场景。纯内容站点用 Markdown 就够，MDX 会增加构建复杂度和安全面（可以执行表达式）。

---

## 8. 样式

### 8.1 默认：组件作用域

```astro
<style>
  h1 { color: red; }
</style>
```

Astro 会给元素加 `data-astro-cid-xxx` 属性，选择器自动限定到本组件。**不会影响其他组件**，也不需要 BEM 之类的命名约定。

### 8.2 全局样式

```astro
<style is:global>
  body { margin: 0; font-family: system-ui; }
</style>
```

或者在布局里 `import "../styles/global.css"`（推荐，全局样式集中管理）。

### 8.3 局部突破作用域

```astro
<style>
  .prose :global(a) { color: teal; }   /* 只对 .prose 内的 a 生效，且不限作用域 */
</style>
```

渲染 Markdown 内容时，`<Content />` 内部的元素不在你的组件作用域里，必须用 `:global()` 才能命中。

### 8.4 CSS 变量与主题

```astro
<style>
  :root {
    --color-bg: #fff;
    --color-fg: #111;
  }
  :root[data-theme="dark"] {
    --color-bg: #111;
    --color-fg: #eee;
  }
  body { background: var(--color-bg); color: var(--color-fg); }
</style>
```

切换主题就是改 `document.documentElement.dataset.theme`（一行 JS，不需要框架）。

### 8.5 Tailwind CSS

```bash
npx astro add tailwind
```

Astro 5+ 使用 Tailwind 4 的 Vite 插件。它会创建 `src/styles/global.css`：

```css
@import "tailwindcss";
```

然后在布局里引入该 CSS 即可。Tailwind 与 Astro 的 scoped style 可以共存：工具类写模板，复杂样式写 `<style>`。

### 8.6 其他选择

- **CSS Modules**：`import styles from "./x.module.css"`，适合需要显式类名映射的场景。
- **Sass/Less**：`npm i -D sass` 后直接用 `<style lang="scss">`。
- **CSS 框架**：UnoCSS、Panda CSS 等通过 Vite 插件接入。

新手建议：**先用原生 CSS + CSS 变量**，把布局和响应式写熟，再上 Tailwind。不要同时学三套样式方案。

---

## 9. 图片与静态资源

### 9.1 三种图片位置

| 位置 | 访问方式 | 是否优化 |
| --- | --- | --- |
| `public/` | `/logo.png` | 否（原样拷贝） |
| `src/assets/` + `import` | 组件 `src={img}` | 是（压缩、转格式、按尺寸生成） |
| 远程 URL | `src="https://..."` | 需显式给尺寸 |

### 9.2 `astro:assets`

```astro
---
import { Image, Picture, getImage } from "astro:assets";
import hero from "../assets/hero.jpg";
---

<!-- 自动生成 width/height，防止布局抖动；自动转 WebP/AVIF -->
<Image src={hero} alt="封面" width={800} />

<!-- 多格式 + 多尺寸 -->
<Picture
  src={hero}
  formats={["avif", "webp"]}
  alt="封面"
  widths={[400, 800, 1200]}
  sizes="(max-width: 600px) 100vw, 800px"
/>

<!-- 远程图片必须给尺寸 -->
<Image src="https://example.com/a.jpg" alt="远程" width={600} height={400} />
```

`getImage()` 在需要自己拼 `srcset` 时使用。

### 9.3 注意

- **`alt` 必填**（可访问性）。装饰性图片写 `alt=""`。
- 导入的图片是 `ImageMetadata` 对象，不是字符串路径。
- `public/` 里的图片拿不到优化，但适合 `favicon.ico`、OG 图、`robots.txt` 这类需要固定路径的文件。
- 图片优化默认用 sharp，构建会变慢，但换来更小的传输体积。大图很多的站点要关注构建时间。

---

## 10. 岛屿：在 Astro 里用 React / Vue / Svelte

### 10.1 加一个框架

```bash
npx astro add react
```

它会安装 `@astrojs/react`、`react`、`react-dom`，并自动改 `astro.config.mjs`。

### 10.2 写一个交互组件

```tsx
// src/components/Counter.tsx
import { useState } from "react";

export default function Counter({ start = 0 }: { start?: number }) {
  const [n, setN] = useState(start);
  return (
    <div>
      <button onClick={() => setN(n - 1)}>-</button>
      <span>{n}</span>
      <button onClick={() => setN(n + 1)}>+</button>
    </div>
  );
}
```

### 10.3 在页面里使用（关键：指令）

```astro
---
import Counter from "../components/Counter.tsx";
---

<!-- 不写指令：只渲染 HTML，不加载 JS，按钮点了没反应 -->
<Counter start={5} />

<!-- 立即加载并激活 -->
<Counter start={5} client:load />

<!-- 浏览器空闲时激活 -->
<Counter start={5} client:idle />

<!-- 滚动到可见时激活 -->
<Counter start={5} client:visible />

<!-- 匹配媒体查询时激活（如只在桌面端） -->
<Counter start={5} client:media="(min-width: 768px)" />

<!-- 只在客户端渲染，跳过 SSR（需要框架名） -->
<Counter start={5} client:only="react" />
```

**这是 Astro 最核心的心智模型**：组件默认是"服务端渲染的 HTML 模板"，加了 `client:*` 才变成"活的组件"。

### 10.4 选择哪个指令

| 指令 | 加载时机 | 适用 |
| --- | --- | --- |
| `client:load` | 页面加载立即 | 首屏必须可交互（搜索框、购物车） |
| `client:idle` | 主线程空闲 | 次要交互（评论区、分享按钮） |
| `client:visible` | 进入视口 | 页面下方的组件、长列表 |
| `client:media` | 媒体查询匹配 | 移动端菜单 |
| `client:only` | 仅客户端 | 依赖 `window`、无法 SSR 的库 |

不确定就用 `client:visible`，它对首屏性能最友好。

### 10.5 岛屿的四个限制（新手必读）

1. **props 必须可序列化**：不能传函数、类实例、`Date` 也建议转字符串。因为要跨"服务端 → 浏览器"边界。
2. **岛屿之间不共享状态**：两个 React 岛屿是两个独立的 React 树。要共享状态用：
   - 把状态提升到同一个岛屿里；
   - 用 `nanostores`（Astro 官方推荐的跨框架状态库）；
   - 用 URL / localStorage / 服务端 session。
3. **每个岛屿单独打包**：同一个组件在页面上出现两次、都加了 `client:load`，会被打包成一份共享 chunk，但仍是两个独立实例。
4. **SSR 与浏览器环境不同**：组件在构建时也会执行一次，不能直接访问 `window`。需要判断 `typeof window !== "undefined"`，或用 `client:only`。

### 10.6 混合框架

同一个页面可以同时用 React 和 Vue 组件（各自安装集成）。但**不要为了"试试"混用**，维护成本会翻倍。选一个主框架，其余用原生 Astro 组件。

### 10.7 什么时候不该用岛屿

- 纯展示（文本、图片、静态列表）→ 用 `.astro` 组件，0 JS。
- 简单交互（展开/折叠、主题切换、复制按钮）→ 用 `<script>` 写几行原生 JS，比引入框架更轻。
- 表单提交 → 用 HTML 表单 + 端点/Actions，不需要框架。

```astro
<button id="toggle">切换主题</button>

<script>
  document.getElementById("toggle")?.addEventListener("click", () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  });
</script>
```

`<script>` 默认会被打包、去重、只在需要时加载（同一段脚本在页面出现多次也只执行一次）。

---

## 11. 动态渲染（SSR）与服务端能力

### 11.1 什么时候需要 SSR

- 登录后的个性化页面（"我的订单"）
- 需要读 Cookie / 请求头才能决定内容
- 内容更新频繁、不想每次重建
- 需要写数据库（表单提交、评论）

### 11.2 开启方式

```bash
npx astro add node        # 或 netlify / vercel / cloudflare
```

```js
// astro.config.mjs
import node from "@astrojs/node";
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
});
```

- `output: "server"`：所有页面默认按需渲染。
- `output: "static"`（默认）：所有页面预渲染；某个页面写 `export const prerender = false` 就变成按需渲染（需要 adapter）。

### 11.3 API 端点读写请求

```ts
// src/pages/api/comment.ts
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const body = await request.json();
  if (!body?.content) {
    return new Response(JSON.stringify({ error: "content required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  await db.insert(body.content);
  return new Response(null, { status: 204 });
};
```

### 11.4 中间件

```ts
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get("token")?.value;
  context.locals.user = token ? await verify(token) : undefined;

  // 保护 /admin
  if (context.url.pathname.startsWith("/admin") && !context.locals.user) {
    return context.redirect("/login");
  }

  const res = await next();
  res.headers.set("x-frame-options", "DENY");
  return res;
});
```

给 `locals` 加类型：

```ts
// src/env.d.ts
declare namespace App {
  interface Locals {
    user?: { id: string; name: string };
  }
}
```

中间件适合：鉴权、日志、安全头、A/B 分流、国际化。**不要在里面做重活**（每次请求都会执行）。

### 11.5 Cookie

```ts
context.cookies.set("token", jwt, {
  httpOnly: true,      // JS 读不到，防 XSS 窃取
  secure: true,        // 仅 HTTPS
  sameSite: "lax",     // 防 CSRF
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
});
context.cookies.delete("token", { path: "/" });
```

### 11.6 Session

Astro 5.7+ 提供请求级会话（`Astro.session`），需要 adapter 提供驱动（Node 的文件、Netlify 的 Blob、Cloudflare 的 KV 等）。用法：

```ts
const cart = (await Astro.session?.get("cart")) ?? [];
cart.push(item);
await Astro.session?.set("cart", cart);
```

- 驱动在 `astro.config.mjs` 的 `session` 配置里指定（具体驱动名看所用 adapter 文档）。
- Astro 7.2 起可以用 `session: false` 彻底关掉会话运行时，减小打包体积。
- 会话适合"购物车、草稿、多步表单"；长期身份仍用 Cookie + 数据库。

### 11.7 Actions（类型安全的表单/接口）

```ts
// src/actions/index.ts
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  subscribe: defineAction({
    input: z.object({ email: z.string().email() }),
    handler: async ({ email }) => {
      if (await exists(email)) {
        throw new ActionError({ code: "CONFLICT", message: "已订阅" });
      }
      await save(email);
      return { ok: true };
    },
  }),
};
```

客户端（React/Vue/原生 JS 都行）：

```ts
import { actions } from "astro:actions";

const { data, error } = await actions.subscribe({ email: "a@b.com" });
if (error) console.error(error.message);
```

表单零 JS 提交：

```astro
---
import { actions } from "astro:actions";
---
<form method="POST" action={actions.subscribe}>
  <input name="email" type="email" required />
  <button>订阅</button>
</form>
```

Actions 的价值：**输入校验、错误结构、CSRF 防护、类型推断**由框架统一处理，不用自己写一套 API 客户端。

### 11.8 Server Islands

```astro
---
import Avatar from "../components/Avatar.astro";
---

<Avatar user={Astro.locals.user?.id} server:defer>
  <div slot="fallback">加载中…</div>
</Avatar>
```

页面主体静态缓存，只有这个组件在请求时单独渲染并替换进来。适合"个性化但非首屏关键"的片段（头像、推荐位、库存）。需要 SSR。

### 11.9 路由缓存（Astro 7）

```js
// astro.config.mjs
import { defineConfig, memoryCache } from "astro/config";

export default defineConfig({
  cache: { provider: memoryCache() },
  routeRules: {
    "/blog/[...path]": { maxAge: 300, swr: 60 },
  },
});
```

```astro
---
Astro.cache.set({ maxAge: 120, swr: 60, tags: ["products"] });
---
```

失效：

```ts
await cache.invalidate({ tags: ["products"] });
await cache.invalidate({ path: "/products/42" });
```

`maxAge` 是新鲜期，`swr` 是"过期后仍可先返回旧内容、后台再验证"的窗口。配合 CMS webhook 做定点失效，可以做到"内容更新不用重建整站"。

### 11.10 高级路由（Astro 7）

需要完全掌控请求管线时，加 `src/fetch.ts`：

```ts
import { astro, FetchState } from "astro/fetch";

export default {
  fetch(request: Request) {
    const state = new FetchState(request);
    if (state.url.pathname.startsWith("/api")) {
      return fetch(new Request(new URL(state.url.pathname, "https://backend.example.com"), request));
    }
    return astro(state);
  },
};
```

这适合"Astro 只负责页面，API 转发给别的服务"或"要在 Astro 之前插入鉴权"的场景。**普通项目不需要**。

### 11.11 视图过渡与预取

```astro
---
import { ClientRouter } from "astro:transitions";
---
<head>
  <ClientRouter />
</head>
```

- 页面间跳转不再整页刷新，而是原地替换内容。
- 用 `transition:name` 让同一元素在页面间平滑移动：

```astro
<img src={post.data.cover} transition:name="hero" />
```

预取：

```js
export default defineConfig({
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
});
```

鼠标悬停/进入视口时预取目标页，跳转几乎瞬时。注意：预取会增加流量，别对需要鉴权的路径开。

---


## 12. 环境变量与配置

### 12.1 `import.meta.env`

```bash
# .env
PUBLIC_API_URL=https://api.example.com
SECRET_TOKEN=abc123
```

```ts
import.meta.env.PUBLIC_API_URL;   // 可以，会打进客户端
import.meta.env.SECRET_TOKEN;     // 服务端可以，客户端是 undefined
import.meta.env.MODE;             // "development" | "production"
import.meta.env.DEV;              // boolean
import.meta.env.PROD;             // boolean
```

三条铁律：

1. **只有 `PUBLIC_` 前缀的变量会进入客户端**。这不是可选的安全措施，是硬性机制。
2. 任何写进模板/客户端脚本的值，**用户都能看到**。密钥永远只在服务端用。
3. `.env` 进 `.gitignore`，同时提交 `.env.example`。

### 12.2 类型化环境变量（`astro:env`）

```js
// astro.config.mjs
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      PUBLIC_API_URL: envField.string({ context: "client", access: "public" }),
      DATABASE_URL: envField.string({ context: "server", access: "secret" }),
      PORT: envField.number({ context: "server", access: "public", default: 4321 }),
    },
  },
});
```

```ts
import { PUBLIC_API_URL, DATABASE_URL } from "astro:env/server";
```

好处：**启动时校验**（缺变量直接报错）、类型安全、明确区分客户端/服务端。中大型项目建议用。

### 12.3 配置优先级

```
命令行 --port 等参数
  > 环境变量
    > .env 文件
      > astro.config.mjs 里的默认值
```

---

## 13. SEO、RSS、站点地图与可访问性

### 13.1 每个页面都该有的

```astro
<head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />

  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={new URL("/og.png", Astro.site)} />
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

- `canonical` 防止重复内容被搜索引擎分散权重。
- OG 图建议 1200×630，且必须是**绝对 URL**。
- 一个页面只有一个 `<h1>`，标题层级不要跳级（`h2` → `h4` 是错的）。

### 13.2 站点地图

```bash
npx astro add sitemap
```

```js
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://example.com",
  integrations: [sitemap()],
});
```

构建后生成 `sitemap-index.xml`。必须配置 `site`。

### 13.3 RSS

```bash
npm i @astrojs/rss
```

```ts
// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return rss({
    title: "我的博客",
    description: "记录学习",
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.pubDate,
      description: p.data.description ?? "",
      link: `/blog/${p.id}/`,
    })),
    customData: "<language>zh-cn</language>",
  });
};
```

### 13.4 结构化数据（JSON-LD）

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.data.title,
  datePublished: post.data.pubDate.toISOString(),
})} />
```

`set:html` 用于插入原始 HTML/JSON 字符串（**不要**把用户输入直接塞进去，会 XSS）。

### 13.5 可访问性清单

- 图片 `alt`；装饰图 `alt=""`。
- 表单 `<label for>` 与输入框关联。
- 交互只用 `<div>` 时补 `role`、`tabindex`、键盘事件——**能不用 div 就不用**。
- 颜色对比度 ≥ 4.5:1（正文）。
- 焦点样式不要 `outline: none` 了事。
- 尊重 `prefers-reduced-motion`。
- 语义化：`<nav>`、`<main>`、`<article>`、`<button>`。

---

## 14. 国际化（i18n）

```js
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: { prefixDefaultLocale: false },  // /about 而不是 /zh/about
  },
});
```

```
src/pages/
├── index.astro          → /（中文）
├── about.astro          → /about
└── en/
    ├── index.astro      → /en
    └── about.astro      → /en/about
```

内容集合里可以用目录区分语言，或在 schema 里加 `lang` 字段。URL 工具：

```ts
import { getRelativeLocaleUrl } from "astro:i18n";
getRelativeLocaleUrl("en", "/about");   // /en/about
```

**翻译文案不要散落在模板里**：抽到 `src/i18n/zh.ts`、`src/i18n/en.ts`，用一个 `t(key)` 函数取。

---

## 15. 构建与部署

### 15.1 构建产物

```bash
npm run build
```

```
dist/
├── index.html
├── blog/
│   └── hello/index.html
├── _astro/            # 带 hash 的 JS/CSS/图片
└── sitemap-index.xml
```

静态产物就是一堆文件，扔到任何静态托管都能跑。

### 15.2 部署选项

| 平台 | 命令 | 备注 |
| --- | --- | --- |
| Netlify | `npx astro add netlify` | 自动配置 adapter |
| Vercel | 直接导入仓库 | 静态零配置；SSR 加 `@astrojs/vercel` |
| Cloudflare Pages | `npx astro add cloudflare` | 边缘运行时，注意 Node API 兼容性 |
| GitHub Pages | 需设 `site` + `base` | 纯静态 |
| 自己的服务器 | `node ./dist/server/entry.mjs` | Node adapter standalone 模式 |
| Docker | 多阶段构建 | 见下 |

GitHub Pages 的 `base`：

```js
export default defineConfig({
  site: "https://user.github.io",
  base: "/repo-name",
});
```

### 15.3 Docker（Node adapter standalone）

```dockerfile
FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26-alpine
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
USER node
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

### 15.4 部署前检查清单

- [ ] `npm run build` 本地通过
- [ ] `npm run preview` 抽查关键页面
- [ ] `site` 配置正确（影响 canonical/sitemap/RSS）
- [ ] `.env` 没进仓库，生产环境变量已在平台上配置
- [ ] 没有把密钥写进 `PUBLIC_` 变量
- [ ] 404 页面存在且样式正常
- [ ] 图片都有 `alt`，页面有 `title` 和 `description`
- [ ] 移动端宽度下没有横向滚动
- [ ]  Lighthouse 跑一遍（性能 / 可访问性 / SEO）

---

## 16. 调试与常见错误

### 16.1 常用命令

```bash
npx astro check          # 类型检查（.astro + TS）
npx astro build --verbose
npx astro dev --verbose
```

VS Code 装 **Astro** 官方扩展，才有 `.astro` 的语法高亮、跳转、类型提示。

### 16.2 高频报错

| 报错 | 原因 | 处理 |
| --- | --- | --- |
| `Expected ">" but found ...`（Astro 7） | 标签未闭合/属性未闭合 | 补齐；Astro 7 不再自动修正 HTML |
| `Cannot find module 'astro:content'` | 没配 `content.config.ts` 或用错导入 | 确认配置文件存在且集合已导出 |
| `getStaticPaths` 返回值缺少 `params` | 动态路由必须给参数 | 检查返回结构 |
| `Unable to render Content` | 用了 `entry.render()`（旧 API） | 改成 `render(entry)` |
| `Hydration failed` / 组件不响应 | 忘了 `client:*` 指令 | 加上合适的指令 |
| `window is not defined` | 组件在构建时访问了浏览器 API | 判断环境，或 `client:only` |
| `Cannot use import statement outside a module` | 脚本里用了 ESM 但没 `type="module"` | 加 `type="module"` |
| 样式不生效 | 作用域问题 / 选择器没命中 Markdown 内容 | 用 `:global()`，检查 DOM |
| 图片 404 | 从 `public/` 用 `import` 导入 | `public/` 的图用绝对路径字符串 |
| 构建 OOM | 大项目/大图 | 调 `NODE_OPTIONS=--max-old-space-size`，优化图片 |

### 16.3 调试技巧

1. **前置脚本里 `console.log` 看的是构建/服务端输出**，不是浏览器控制台。
2. **模板里临时输出**：`<pre>{JSON.stringify(data, null, 2)}</pre>`。
3. **看生成的 HTML**：`npm run build` 后打开 `dist/**.html`，能确认 SSR 结果。
4. **HMR 不生效**：重启 dev server；检查是否在 `public/` 里改了文件（不会触发 HMR）。
5. **样式冲突**：DevTools 里看 `data-astro-cid-*` 属性，确认选择器是否被作用域改写。

---

## 17. 实战：一个可部署的博客

目标：文章列表 + 详情 + 标签页 + RSS + 404 + 部署，全程用内容集合。

### 17.1 初始化

```bash
npm create astro@latest my-blog -- --template minimal --typescript strict
cd my-blog
npx astro add sitemap
npm i @astrojs/rss
```

### 17.2 内容与 schema

`src/content.config.ts`（用 §6.1 的配置），然后在 `src/content/blog/` 放三篇 Markdown。

### 17.3 工具函数

```ts
// src/lib/posts.ts
import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export function allTags(posts: Post[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}
```

### 17.4 布局

`src/layouts/BaseLayout.astro`（用 §3.2 的版本），加上 `<ClientRouter />` 做页面过渡。

### 17.5 首页

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getPublishedPosts, formatDate } from "../lib/posts";

const posts = await getPublishedPosts();
const recent = posts.slice(0, 5);
---

<BaseLayout title="首页">
  <h1>最近文章</h1>
  <ul>
    {recent.map((p) => (
      <li>
        <a href={`/blog/${p.id}/`}>{p.data.title}</a>
        <time datetime={p.data.pubDate.toISOString()}>{formatDate(p.data.pubDate)}</time>
      </li>
    ))}
  </ul>
  <p><a href="/blog/">全部文章 →</a></p>
</BaseLayout>
```

### 17.6 列表页

用 §6.5 的 `paginate` 版本。

### 17.7 详情页

用 §6.6，并补上：

```astro
<BaseLayout title={post.data.title} description={post.data.description}>
  <article class="prose">
    <h1>{post.data.title}</h1>
    <p>
      <time datetime={post.data.pubDate.toISOString()}>{formatDate(post.data.pubDate)}</time>
      {post.data.tags.map((t) => <a href={`/tags/${t}/`}>#{t}</a>)}
    </p>
    <Content />
  </article>
</BaseLayout>

<style>
  .prose { max-width: 68ch; margin-inline: auto; line-height: 1.8; }
  .prose :global(h2) { margin-top: 2.5rem; }
  .prose :global(pre) { overflow-x: auto; padding: 1rem; border-radius: 8px; }
  .prose :global(img) { max-width: 100%; height: auto; }
</style>
```

### 17.8 标签页

```astro
---
// src/pages/tags/[tag].astro
import { getPublishedPosts } from "../../lib/posts";

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({
    params: { tag },
    props: { posts: posts.filter((p) => p.data.tags.includes(tag)) },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---
<h1>#{tag}</h1>
<ul>{posts.map((p) => <li><a href={`/blog/${p.id}/`}>{p.data.title}</a></li>)}</ul>
```

### 17.9 404 与 RSS

```astro
---
// src/pages/404.astro
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="404">
  <h1>页面不存在</h1>
  <p><a href="/">回到首页</a></p>
</BaseLayout>
```

RSS 用 §13.3 的 `rss.xml.ts`。

### 17.10 构建与部署

```bash
npm run build
npm run preview
```

推到 GitHub，接 Netlify/Vercel 自动部署。每次 push 自动重建（因为内容是构建时读取的）。

### 17.11 这个项目覆盖了哪些知识点

| 知识点 | 位置 |
| --- | --- |
| 文件路由 | `pages/` 结构 |
| 布局与插槽 | `BaseLayout.astro` |
| 内容集合 + schema | `content.config.ts` |
| 查询与排序 | `lib/posts.ts` |
| 动态路由 + `getStaticPaths` | `[id].astro`、`[tag].astro` |
| 分页 | `[...page].astro` |
| Markdown 渲染 | `<Content />` |
| 作用域样式与 `:global` | 详情页 `<style>` |
| RSS / sitemap / SEO | `rss.xml.ts`、`BaseLayout` |
| 构建与部署 | `npm run build` |

---

## 18. 从 HTML 迁移 / 与其他框架对比

### 18.1 把一个静态 HTML 站点搬进 Astro

1. `public/` 放不需要处理的资源（favicon、PDF、`robots.txt`）。
2. 把公共的 `<head>`、导航、页脚抽成 `BaseLayout.astro`。
3. 每个 HTML 文件改成一个页面：去掉 `<html>/<head>/<body>`，只保留内容，外面包 `<BaseLayout>`。
4. 重复的板块抽成组件（卡片、按钮、文章摘要）。
5. 把内联 `<style>` 移到组件 `<style>` 或全局 CSS。
6. 加 `site`、sitemap、404、OG 标签。

### 18.2 与 Next.js 的差异

| | Astro | Next.js |
| --- | --- | --- |
| 默认模型 | 静态 HTML + 岛屿 | React 全栈（App Router + RSC） |
| 组件 | `.astro`（类 HTML） | React JSX |
| 数据获取 | 前置脚本直接 `await` | Server Components / `fetch` |
| 客户端 JS | 仅岛屿 | 默认更多 |
| 生态 | 内容型强 | 应用型强 |
| 学习成本 | 低 | 中高 |

**如果团队已经重度使用 React 且页面交互复杂，Next 更顺；如果站点以内容为主，Astro 的产物更小、心智更简单。**

---

## 19. 练习

### 练习 1：把 About 页做成布局

新建 `BaseLayout`，包含 `<head>`、导航、页脚；让首页和 About 都用它。

### 练习 2：动态标签页

用 `getStaticPaths` 生成 `/tags/[tag]`，只显示该标签下的文章，并按日期倒序。

### 练习 3：给文章加"阅读时长"

在详情页计算 `post.body` 的词数，按 200 词/分钟估算：

<details><summary>提示</summary>

`post.body` 是原始 Markdown 字符串；`Math.ceil(words / 200)`。
</details>

### 练习 4：一个不引入框架的交互

做一个"复制代码"按钮或"深浅色切换"，只用 `<script>`，不安装 React。

### 练习 5：接入一个岛屿

安装 React，写一个搜索框组件：输入时过滤当前页的文章标题（数据通过 props 传入），用 `client:idle` 加载。

<details><summary>提示</summary>

props 传 `titles: string[]`（可序列化），组件内部用 `useState` 过滤。
</details>

### 练习 6：RSS + sitemap + 404

补齐三件套，`npm run build` 后检查 `dist/` 里生成的 `rss.xml`、`sitemap-index.xml`、`404.html`。

### 练习 7：SSR 页面

用 Node adapter 把站点切到 `output: "server"`，加一个 `/api/time` 端点返回当前时间，并写一个页面在服务端渲染它。

---

## 20. 速查表

```astro
---
// 前置脚本：服务端运行
import Card from "../components/Card.astro";
import { getCollection } from "astro:content";

interface Props { title: string }
const { title } = Astro.props;
const posts = await getCollection("blog");
---

<h1>{title}</h1>
{posts.map((p) => <Card title={p.data.title} />)}
<slot />

<style>
  h1 { color: teal; }
  .prose :global(a) { color: blue; }
</style>

<script>
  // 浏览器端，自动打包
</script>
```

```astro
<!-- 岛屿 -->
<Counter client:load />
<Counter client:idle />
<Counter client:visible />
<Counter client:only="react" />
```

```ts
// 动态路由
export async function getStaticPaths() {
  return [{ params: { id: "a" }, props: { data } }];
}

// 端点
export const GET: APIRoute = ({ url }) => new Response("ok");
export const prerender = false;
```

### 20.1 常用 API 速查

| API | 用途 |
| --- | --- |
| `Astro.props` / `Astro.params` / `Astro.url` | 组件数据 |
| `Astro.redirect()` / `Astro.cookies` | 跳转 / Cookie |
| `getCollection()` / `getEntry()` / `render()` | 内容集合 |
| `import.meta.env` / `astro:env/server` | 环境变量 |
| `Image` / `Picture` / `getImage` | 图片优化 |
| `defineMiddleware()` | 中间件 |
| `defineAction()` | 类型安全接口 |
| `paginate()` | 分页 |
| `ClientRouter` | 视图过渡 |
| `Astro.cache.set()` | 路由缓存 |

### 20.2 配置速查

```js
export default defineConfig({
  site: "https://example.com",
  output: "static",              // 或 "server"
  adapter: node({ mode: "standalone" }),
  integrations: [react(), sitemap(), mdx()],
  prefetch: true,
  markdown: { shikiConfig: { theme: "github-dark" } },
  i18n: { defaultLocale: "zh", locales: ["zh", "en"] },
  redirects: { "/old": "/new" },
  cache: { provider: memoryCache() },
});
```

---

## 21. 学习路径与资源

### 21.1 建议的 4 周计划

| 周 | 目标 | 产出 |
| --- | --- | --- |
| 1 | 页面、组件、布局、样式 | 一个 3 页的静态站点 |
| 2 | 内容集合 + 动态路由 + 分页 | 一个能写 Markdown 的博客 |
| 3 | 岛屿 + 一个框架组件 | 搜索框 / 评论框 / 主题切换 |
| 4 | SSR、Actions、部署 | 带表单提交的线上站点 |

### 21.2 资源

- 官方文档（最好的教程）：<https://docs.astro.build>
- 官方教程（边做边学）：<https://docs.astro.build/en/tutorial/0-introduction/>
- 主题与集成：<https://astro.build/themes/>、<https://astro.build/integrations/>
- 在线试玩：<https://play.astro.build>
- Astro 7 发布说明：<https://astro.build/blog/astro-7/>

### 21.3 常见的学习误区

1. **一上来就装 React/Vue**：先用纯 `.astro` 把站点搭起来，再考虑岛屿。
2. **把 Astro 当 Next 用**：所有页面都 `client:load`，等于放弃了 Astro 的优势。
3. **忽略 `site` 配置**：sitemap、canonical、OG 全都会出问题。
4. **在 `public/` 里放要优化的图片**：拿不到压缩和格式转换。
5. **组件里直接访问 `window`**：构建时会失败。
6. **不用 `astro check`**：`.astro` 文件里的类型错误不会被 `tsc` 发现。