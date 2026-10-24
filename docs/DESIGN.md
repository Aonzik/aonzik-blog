# Aonzik Blog — 美术设计交接文档

> 本文档面向后续接手的 agent。读完它，你应该能在不查看现有 CSS 的情况下，
> 复现整套视觉，或新增符合既有审美的页面与组件。
> 所有数值以 [styles/tokens.css](../styles/tokens.css) 为唯一真相源；本文与之保持一致。
>
> 说明：本文描述的数值与结构来自根目录的**原始手写版**（`index.html` / `blog.html` / `post.html` /
> `about.html` + `styles/` + `scripts/main.js`），那是这套美术的原始真相源。Astro 重建把这些文件
> 逐字搬到了 `src/styles/` 与 `src/scripts/` 下，数值一字未改；两边不一致时以本文 + 原始版为准。
> Astro 侧的工程结构见 `.handoff/astro-architecture.md`。

---

## 1. 设计概念：纸、墨、朱砂

整套视觉建立在一个意象上：**一张铺在桌上的纸，用墨写字，用朱砂点睛。**

这个意象决定了三件事：

| 意象 | 角色 | 落地为 |
|------|------|--------|
| 纸 | 底色、承载面 | `--paper` 系列三个明度 |
| 墨 | 正文、文字 | `--ink` 系列三个明度 |
| 朱砂 | 强调、点睛 | `--accent` + `--accent-soft` |

由此推导出的几条不可违背的原则：

1. **只有朱砂一种强调色。** 不引入第二个彩色。状态色（成功/警告/危险）若将来需要，也应从朱砂的色相族里派生，而不是另起一色。这是「一个 accent」的克制。
2. **底色不是纯白。** 纸是暖白 `#f6f2ea`，浮起的卡片更亮一点 `#fffdf8`，压下去的引用块更暗一点 `#ece6da`。三者明度差很小，靠「浮起 / 压下」而非强对比分层。
3. **正文不是纯黑。** 墨是 `#17130e`，带一点暖棕。纯黑配暖白会显得脏。
4. **阴影是暖调墨色，不是纯黑。** 用 `rgba(30, 22, 12, …)`，让阴影像纸上的投影而非屏幕的发光。
5. **圆角克制。** 只有两个值：`3px`（按钮、标签、输入框）和 `999px`（药丸形标签）。卡片、图片、代码块一律直角。这是「纸」的隐喻——纸不圆。

---

## 2. 色板（完整可复现值）

### 2.1 亮色（默认）

```css
--paper:        #f6f2ea;   /* 页面底色 */
--paper-raised: #fffdf8;   /* 卡片、浮层 */
--paper-sunken: #ece6da;   /* 引用块、代码块底、头像底 */
--ink:          #17130e;   /* 正文 */
--ink-soft:     #423a31;   /* 次级文字：摘要、侧栏链接 */
--ink-faint:    #837a6c;   /* 注释：日期、版权、小节标题 */
--rule:         rgba(23, 19, 14, 0.13);   /* 分隔线 */
--rule-strong:  rgba(23, 19, 14, 0.28);   /* 强分隔线、按钮描边 */
--accent:       #a8442a;   /* 朱砂：链接、强调、logo 底 */
--accent-soft:  rgba(168, 68, 42, 0.10);  /* 朱砂浅底：hover、active tag */
```

明度阶梯：`faint` → `soft` → `ink` 是三档灰，间距大致均匀。`rule` / `rule-strong` 是墨色的低透明度版本，这样无论换什么底色，分隔线都自然融入。

### 2.2 暗色（`[data-theme="dark"]`）

暗色不是反色，是另调的一套「墨底」配色：

```css
--paper:        #12100d;   /* 底色，带暖调而非中性灰 */
--paper-raised: #1a1713;   /* 卡片浮起 */
--paper-sunken: #211d18;   /* 压下 */
--ink:          #ece5d8;   /* 正文：暖白 */
--ink-soft:     #bdb4a5;
--ink-faint:    #8a8172;
--rule:         rgba(236, 229, 216, 0.14);
--rule-strong:  rgba(236, 229, 216, 0.30);
--accent:       #dd7a53;   /* 朱砂提亮、降饱和，在暗底才不刺眼 */
--accent-soft:  rgba(221, 122, 83, 0.14);
```

暗色配色的关键判断：朱砂从 `#a8442a` 改成 `#dd7a53`——**提亮、降饱和**。同一个朱砂直接放暗底会显得脏且过曝，这是暗色 accent 的通用规律。

阴影在暗色下换成纯黑 `rgba(0,0,0,…)`，因为暖墨色阴影在深底上看不见。

### 2.3 对比度

正文 `ink` on `paper`：亮色约 14:1，暗色约 13:1，远超 WCAG AAA。
`ink-faint`（`#837a6c`）on `paper`：约 4.6:1，刚好过 AA 正文线，只用于小字注释，不用于正文。
朱砂 `#a8442a` on 纸色：约 5.4:1，过 AA，用于强调文字和链接。
**不靠颜色单独传达状态**——active 链接同时用颜色 + 浅底；tag hover 同时变色 + 加底。

---

## 3. 字体系统

三套字族，各司其职：

```css
--font-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC",
             "SimSun", "Iowan Old Style", Georgia, serif;
--font-sans:  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
             "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
             system-ui, sans-serif;
--font-mono:  "JetBrains Mono", "SF Mono", ui-monospace,
             "Cascadia Code", Menlo, Consolas, monospace;
```

分工约定（**新增组件必须遵守**）：

| 用途 | 字族 | 出现位置 |
|------|------|----------|
| 大标题 H1/H2、文章标题、作者名、项目名 | serif | Hero、文章头、卡片大标题、关于页引语 |
| 正文、按钮、导航、UI 文字 | sans | 段落、meta、标签、按钮 |
| 日期、阅读时长、分页数字、代码 | mono | `card-date`、`post-date`、分页器、代码块 |

衬线只用在「要被读、而非被点」的地方；sans 用在「要被点」的 UI 上。这个区分让页面有文学的呼吸感，又不失工具的利落。

字体加载见各 HTML `<head>`，Google Fonts 一条链接拉三个字族：`Noto Serif SC` (400,600) + `Inter` (400,450,500,600) + `JetBrains Mono` (400,500)。

### 字号阶梯

等比阶梯，比例约 1.25，共 9 档：

| token | rem | px(基准16) | 用途 |
|-------|-----|-----------|------|
| `--fs-xs` | 0.75 | 12 | 日期、tag、小节标题、版权 |
| `--fs-sm` | 0.875 | 14 | 摘要、次级文字、按钮 |
| `--fs-base` | 1.0625 | 17 | 正文 |
| `--fs-md` | 1.25 | 20 | 三级标题、卡片标题 |
| `--fs-lg` | 1.5625 | 25 | 二级标题（暗色降级用） |
| `--fs-xl` | 1.9375 | 31 | 二级标题 |
| `--fs-2xl` | 2.5 | 40 | — |
| `--fs-3xl` | 3.25 | 52 | — |
| `--fs-4xl` | 4.25 | 68 | Hero 最大标题 |

**实际使用时大标题几乎不用 token，而是 `clamp()` 流体缩放**，保证从手机到桌面平滑过渡。例：

```css
.hero-title { font-size: clamp(2.8rem, 7vw, 5.5rem); }
.post-title { font-size: clamp(2rem, 5vw, 3.4rem); }
```

约定：**任何超过 `--fs-xl` 的标题都用 `clamp()`，不直接引用 token**。这是为了让大字号在窄屏不溢出。

行高：正文 1.75–1.85（中文需要更松），标题 1.1–1.22（紧凑）。标题用 `text-wrap: balance`，段落用 `text-wrap: pretty`。

---

## 4. 间距系统

8px 基准，10 档：

```
sp-1  0.25rem  (4px)   细微：tag 内边距、图标与文字间隙
sp-2  0.5rem   (8px)   小：列表项间、按钮内边距微调
sp-3  0.75rem  (12px)  导航链接内边距
sp-4  1rem     (16px)  基准：卡片内边距、段落间距单位
sp-5  1.5rem   (24px)  卡片正文内边距、网格 gap
sp-6  2rem     (32px)  = gutter，章节内分组
sp-7  3rem     (48px)  章节标题下方
sp-8  4rem     (64px)  小章节 padding
sp-9  6rem     (96px)  标准章节 padding
sp-10 8rem    (128px)  Hero padding
```

用法约定：

- **章节纵向 padding** 用 `--sp-9`（标准）或 `--sp-8`（紧凑，加 `section--tight`）。
- **卡片网格 gap** 用 `--sp-5`。
- **容器横向 gutter** 用 `--gutter`（2rem，大屏 3rem，移动端 1.25rem）。
- **不在 token 之外的间距值**。要 20px 就用 `sp-4 + sp-2`，不要写 `1.25rem`。

---

## 5. 布局

```
容器宽度：
  --container: 1180px        主容器（首页卡片网格、页脚）
  --container-narrow: 720px   正文容器（文章 prose）
  --gutter: 2rem             容器两侧内边距
```

**正文（`.prose`）最宽 720px**——这是中文长文阅读的舒适宽度，约 38–40 字/行。
**卡片网格**：桌面 3 列、平板 2 列、手机 1 列，gap 24px。
**文章列表页**用 1fr + 280px 的双栏，900px 以下隐藏侧栏。

---

## 6. 组件设计要点

### 6.1 导航栏 `.site-nav`
- sticky 顶部，高 60px。
- 滚动超过 8px 后加 `.is-scrolled`：出现底边线 + 毛玻璃 + 阴影。背景从纯纸色变 88% 不透明纸色 + 14px 模糊。
- logo：32×32 朱砂方块 + 内嵌白色「A」字形 SVG。**logo 描边色用 `--paper-raised` 而非 `#fff`**，保证暗色模式下描边是暖白而非纯白。
- 移动端隐藏链接，显示汉堡按钮（三条线，展开时变 X）。

### 6.2 卡片 `.card`
- `paper-raised` 底 + `rule` 边框 + 直角。
- hover：边框加深、阴影加深、上浮 3px、封面图 `scale(1.04)`、标题变朱砂、右下角「阅读全文 →」从左淡入。
- 精选卡 `.card-featured` 横向：左 42% 封面，右正文；移动端回纵向。
- 封面占位：无图时用 `card-cover-placeholder`，居中一个 14% 透明度的 SVG 图标，不喧宾夺主。

### 6.3 按钮 `.btn`
两型：
- `.btn-primary`：朱砂底白字，带朱砂色辉光阴影。hover 加深 15% 黑。
- `.btn-ghost`：透明底 + `rule-strong` 描边 + `ink-soft` 字。hover 加朱砂浅底、描边变朱砂、字变墨。
- active 下沉 1px（`translateY(1px)`），提供按压反馈。

### 6.4 正文排版 `.prose`
这是全站最讲究的一块，**新增文章页必须复用**：

- 720px 限宽，行高 1.85。
- `> * + *` 选所有相邻兄弟，段间距 1.4em。避免首段也有上边距。
- 二级标题带**上方分隔线**（`border-top` + `padding-top: 1.8em`），作为大段落分界。
- 行内链接：朱砂色，hover 时下划线从透明变实色。
- 引用块：左 3px 朱砂边 + `paper-sunken` 底 + 斜体。
- 代码块：暗底 + 等宽，行内 code 用浅底加边框、朱砂字。
- 表格：表头全大写 + 字距加宽，数字用 `tabular-nums`。

### 6.5 时间轴 `.timeline`（关于页）
关键是对齐：竖线 1px，圆点 9px + 2px 边框 = 13px 总宽。
用 `--tl-gutter`（= `--sp-7`）和 `--tl-line-left`（= gutter − 12px）推导，
圆点 `left` = `line-left − gutter − 6px`，让圆点中心精确压在竖线上。
**改 gutter 时两个变量同步即可，不要手算像素。**

### 6.6 技能条 `.skill-bar`
进入视口时从 0 填到 `data-pct`，1.2s 缓出。JS 在 [main.js](../scripts/main.js) 里用 IntersectionObserver 触发。

---

## 7. 动效约定

```css
--ease:      cubic-bezier(0.22, 0.61, 0.36, 1);  /* 标准 */
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);       /* 进入动画 */
--dur:       260ms;                               /* 大多数交互 */
```

规则：

- **交互反馈（hover/active/focus）**：260ms，`--ease`。
- **滚动进入动画**：700ms，`--ease-out`，错开延迟 60ms × index（封顶 360ms）。
- **只动 `transform` 和 `opacity`**，不动 `layout` 属性（width/height/padding）。
- 阅读进度条例外，用 120ms linear（进度需要即时）。
- 全站遵 `prefers-reduced-motion`：动画时长压到 0.01ms，进入动画直接显示。

---

## 8. 暗色模式实现

- 触发：`<html data-theme="dark">`。
- 切换按钮 `.btn-theme`：亮色显示太阳图标，暗色显示月亮图标（CSS 控制 display）。
- 持久化：`localStorage["aonzik-theme"]`。
- 首次加载优先级：localStorage > `prefers-color-scheme` > 默认亮色。
- **整站只有一个 accent 变量**，暗色模式只是覆盖同一批变量，组件代码零改动。

---

## 9. 响应式断点

断点分两个位置：[responsive.css](../styles/responsive.css) 是**全局**断点；各页面 `<head>` 里的 `<style>` 是**局部**断点（只影响本页布局）。

### 全局（responsive.css）

| 断点 | 类型 | 作用 |
|------|------|------|
| `min-width: 1440px` | 大屏 | `--gutter` 从 2rem → 3rem |
| `max-width: 1024px` | 平板 | 卡片网格 3列→2列；页脚 4列→2列 |
| `max-width: 768px` | 移动端 | 单列网格；隐藏导航链接/显示汉堡；字号降级 |
| `max-width: 380px` | 超小屏 | Hero 字号、品牌名再收紧 |
| `print` | 打印 | 隐藏导航/页脚/浮层 |

### 局部（页面 `<style>`）

| 文件 | 断点 | 作用 |
|------|------|------|
| blog.html | `max-width: 900px` | 双栏转单栏，侧栏隐藏 |
| post.html | `max-width: 1080px` | 文章+目录双栏转单栏，侧栏隐藏 |
| post.html | `max-width: 640px` | 上下篇导航双栏转单栏 |
| about.html | `max-width: 900px` | 简介+名片双栏转单栏 |
| about.html | `max-width: 860px` | 经历+技能双栏转单栏 |
| about.html | `max-width: 700px` | 项目网格双栏转单栏 |

**约定**：`responsive.css` 只放影响多个页面的全局规则；只影响某一页面的布局规则放在该页面的 `<style>` 里，不要污染全局文件。

移动端的几个关键调整（不是简单缩放）：
- 导航链接转汉堡抽屉（`display:none` + `display:flex`，无 JS 依赖，纯 CSS 切换）。
- Hero 字号 `clamp(2.8rem, 7vw, 5.5rem)` 在移动端自然压缩，不需要额外覆盖。
- 精选卡 `.card-featured` 回纵向（`flex-direction: column`）。
- 作者卡居中纵排（`flex-direction: column; align-items: center`）。
- 正文 `--fs-base` 从 17px（1.0625rem）降到 16px（1rem）。

---

## 10. 文件结构

```
aonzik-blog/
├── index.html          首页：Hero + 精选 + 最新 + 标签云
├── blog.html           列表：筛选 + 行列表 + 分页 + 侧栏
├── post.html           详情：进度条 + 目录 + 正文 + 作者卡 + 上下篇
├── about.html          关于：简介 + 名片 + 时间轴 + 技能 + 项目
├── styles/
│   ├── tokens.css      ★ 唯一真相源：所有变量
│   ├── base.css        重置 + 排版基准 + 工具类
│   ├── components.css   所有组件样式（1255 行）
│   └── responsive.css  断点调整
└── scripts/
    └── main.js         主题/导航/动画/进度/目录/技能/搜索（167 行）
```

**样式加载顺序固定**：tokens → base → components → responsive。
页面局部样式用 `<style>` 写在对应 HTML 的 `<head>` 里（如 blog.html 的列表布局），不进公共 CSS。

---

## 11. 给后续 agent 的操作指南

### 新增一个页面
1. 复制 `about.html` 作模板（它结构最完整）。
2. 改 `<title>`、`<meta description>`、导航 `is-active`、抽屉 `id`。
3. 主体用 `.container` / `.section` 包裹，内部组件复用既有 class。
4. **不要新建 CSS 文件**，页面局部样式写 `<style>`，通用样式加到 `components.css`。
5. 引入顺序保持：tokens → base → components → responsive → `<style>`。

### 新增一个组件
1. 先在 `tokens.css` 确认有没有现成的间距/字号/颜色可用。**不写魔法数字**。
2. 组件样式加到 `components.css`，按 6.x 的分节注释组织。
3. 用到的颜色一律 `var(--…)`，不写十六进制。
4. 交互态（hover/active/focus-visible/disabled）全都要写。
5. 触摸目标：`.btn` 用 padding 撑高，实测约 38–42px；图标按钮（`.btn-theme`、`.btn-menu`）固定 `2.25rem`（36px），低于 WCAG 44px 建议——若将来加触摸设备优化，把这两个改到 `2.75rem` 即可，其余不变。返回顶部按钮已达 `2.5rem`（40px）。

### 改主题色
只改 `tokens.css` 里的 `--accent` 和 `--accent-soft`（亮色 + 暗色两组）。
其余组件全部引用变量，会自动跟进。**这是 token 系统的核心价值，不要绕过它。**

### 补真实内容
占位文字都带「占位」字样，全局搜索可定位。替换时只动 HTML 文本节点，
不动 class、不动 CSS。封面图替换 `card-cover-placeholder` 为 `<img>` 即可。

---

## 12. 已知待办（内容层，非美术）

- 全部文案为占位（index 9 处、blog 16 处、post 8 处、about 22 处）。
- 封面、头像、项目缩略图均为 SVG 占位图形，无真实图片。
- 搜索、分页、分类筛选为纯前端占位交互，无后端逻辑。
- RSS、邮件、社交链接为 `#` 占位。

美术模板本身已完成且自洽，后续只需在既有结构里填充内容。
