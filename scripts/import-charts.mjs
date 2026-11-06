#!/usr/bin/env node
/**
 * 把 docs/assets 里的 6 张「深色仪表盘」图表 HTML 导入为本站的图表片段。
 *
 * 只说做法，不说愿景：
 *   - 只取 <body> 内容，丢掉原图的 <style>（那套 1200px 深色皮肤已被
 *     src/styles/charts.css 的纸墨朱砂版本取代）；
 *   - 标题 <h1> 降级为 <p class="ch-title">，避免污染文章目录（.prose 无 h1 样式，
 *     且 h2 自带 border-top + padding-top）；
 *   - 类名统一加 ch- 前缀，避免与站点 .card / .tag / .badge 撞车；
 *   - 内联 style 里的颜色 → 语义类（ch-em / ch-good / ch-hl / ch-badge-* …），
 *     因为 DESIGN.md 只允许一个强调色，颜色不能散落在标记里；
 *   - 内联 SVG 的 fill/stroke 十六进制 → kfA/kfI/kfS/kfF/kfP 与 ksA/ksI/ksS/ksF/ksR，
 *     由 charts.css 映射到 tokens，暗色模式自动跟随；
 *   - 表格包一层 .ch-scroll，窄屏内部横向滚动而不是撑破正文栏。
 *
 * 用法：node scripts/import-charts.mjs [--src <docs/assets 目录>]
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const srcArg = process.argv.indexOf('--src');
const SRC =
  srcArg > -1
    ? process.argv[srcArg + 1]
    : 'C:/Users/川崎敬/Documents/deepseek-harness/default-workspace/docs/assets';
const OUT = join(root, 'src/assets/charts');

/** 每张图的内联样式 → 语义类。按整串匹配，命中即抛错，宁可失配也不静默放过。 */
const INLINE = {
  'chart1-asset-spectrum': [
    [/style="font-size: 11px; background: rgba\(0,0,0,0\.3\); padding: 2px 6px; border-radius: 4px;"/g, 'class="ch-pill"'],
    [
      /style="margin-top: 14px; font-size: 12px; color: #94a3b8; line-height: 1\.55;"/g,
      'class="ch-note"',
    ],
    [/style="color:#f87171; font-weight:600;"/g, 'class="ch-em"'],
  ],
  'chart2-company-to-stock': [],
  'chart3-kline-anatomy': [
    [/style="font-size: 11\.5px; color: #94a3b8; line-height: 1\.45;"/g, 'class="ch-micro"'],
    [
      /style="font-size: 11\.5px; color: #94a3b8; margin-top: 10px; line-height: 1\.4;"/g,
      'class="ch-micro ch-micro--sep"',
    ],
    // 五档形态：border-left-color + 名字颜色一起折成明度阶梯
    [/class="pattern-item" style="border-left-color: #ef4444;"/g, 'class="ch-pattern-item ch-pattern-up"'],
    [/class="pattern-item" style="border-left-color: #22c55e;"/g, 'class="ch-pattern-item ch-pattern-down"'],
    [/class="pattern-item" style="border-left-color: #f59e0b;"/g, 'class="ch-pattern-item ch-pattern-lv3"'],
    [/class="pattern-item" style="border-left-color: #a855f7;"/g, 'class="ch-pattern-item ch-pattern-lv4"'],
    [/class="pattern-item" style="border-left-color: #38bdf8;"/g, 'class="ch-pattern-item ch-pattern-lv5"'],
    [/class="pattern-name" style="color: #ef4444;"/g, 'class="ch-pattern-name"'],
    [/class="pattern-name" style="color: #22c55e;"/g, 'class="ch-pattern-name"'],
    [/class="pattern-name" style="color: #f59e0b;"/g, 'class="ch-pattern-name"'],
    [/class="pattern-name" style="color: #a855f7;"/g, 'class="ch-pattern-name"'],
    [/class="pattern-name" style="color: #38bdf8;"/g, 'class="ch-pattern-name"'],
    [/style="color: #ef4444;"/g, 'class="ch-em"'],
    [/style="color: #22c55e;"/g, 'class="ch-good"'],
    [/style="color: #f59e0b;"/g, 'class="ch-hl"'],
    [/style="color: #94a3b8;"/g, 'class="ch-micro"'],
  ],
  'chart4-financials-valuation': [
    [
      /class="stmt-badge" style="background: #1e3a8a; color: #93c5fd;"/g,
      'class="ch-stmt-badge ch-stmt-badge-a"',
    ],
    [
      /class="stmt-badge" style="background: #065f46; color: #6ee7b7;"/g,
      'class="ch-stmt-badge ch-stmt-badge-b"',
    ],
    [
      /class="stmt-badge" style="background: #78350f; color: #fde68a;"/g,
      'class="ch-stmt-badge ch-stmt-badge-c"',
    ],
  ],
  'chart5-trading-execution-costs': [
    [
      /style="font-size: 12\.5px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;"/g,
      'class="ch-subtitle"',
    ],
    [/style="font-size: 10px; color:#64748b;"/g, 'class="ch-micro"'],
    [/class="rule-pct" style="color: #38bdf8;"/g, 'class="ch-rule-pct"'],
    [
      /class="compare-side" style="border-right: 1px solid #334155; padding-right: 8px;"/g,
      'class="ch-compare-side ch-split"',
    ],
    [/<strong style="color: #ef4444;">/g, '<strong class="ch-em">'],
    [/<strong style="color: #22c55e;">/g, '<strong class="ch-good">'],
    [/<span style="color: #f87171; font-weight:700;">/g, '<span class="ch-em">'],
    [/<span style="color: #34d399; font-weight:700;">/g, '<span class="ch-good">'],
  ],
  'chart6-strategy-psychology': [
    [/class="rule-card" style="border-left-color: #ef4444; margin-bottom: 0;"/g, 'class="ch-rule-card"'],
    [/class="rule-title" style="color: #ef4444;"/g, 'class="ch-rule-title ch-em"'],
  ],
};

/** SVG 画笔：5 个色系 → 墨色阶梯。fill 与 stroke 分开，避免盖掉 fill="none"。 */
const FILL = {
  '#ef4444': 'kfA', // 涨 / 危险曲线
  '#22c55e': 'kfI', // 跌
  '#cbd5e1': 'kfS', // 次级数值
  '#94a3b8': 'kfF', // 轴标签
  '#34d399': 'kfI', // 正面结论
  '#f59e0b': 'kfF', // 参考线标签
  '#38bdf8': 'kfS', // 信息标记
  '#ffffff': 'kfP', // 实心柱上的白字
};

const STROKE = {
  '#ef4444': 'ksA',
  '#22c55e': 'ksI',
  '#38bdf8': 'ksS',
  '#f59e0b': 'ksF',
  '#334155': 'ksR',
};

const FILES = Object.keys(INLINE);

/**
 * chart3 的两张 K 线示意图需要手工重排。
 *
 * 原图把价格标签和蜡烛矩形挤在 140×230 的 viewBox 里：标签右端点 x=135、
 * 矩形右边缘 x=98，两者重叠 26px，而 <text> 在 <rect> 之前绘制（SVG 没有
 * z-index，文档顺序即层级）→ 标签被实心矩形盖掉一截。深色原图里被盖的是
 * 深灰字压深红块，看不清也就算了；换成纸色之后就成了硬伤。
 *
 * 这里改成「标签在侧、蜡烛居中」的版式，字号从 10px 提到 12px（原先在
 * 144px 宽里显示，等价于 6 号字），并把 viewBox 放宽到 260×240。
 */
const KLINE_BOX = `<div class="ch-kline-box">
<svg width="260" height="240" viewBox="0 0 260 240" role="img" aria-label="阳线结构示意：最高价、收盘价、开盘价、最低价与实体">
<text x="130" y="20" class="kfUp" font-size="14" font-weight="700" text-anchor="middle">阳线（上涨）</text>
<text x="252" y="46" class="kfF" font-size="12" text-anchor="end">最高价 12.80</text>
<line x1="96" y1="36" x2="96" y2="80" class="ksUp" stroke-width="2"/>
<text x="252" y="88" class="kfUp" font-size="12" text-anchor="end">收盘价 12.30</text>
<rect x="66" y="80" width="60" height="95" class="kfUp" rx="1"/>
<text x="96" y="133" class="kfP" font-size="12" font-weight="700" text-anchor="middle">实体阳柱</text>
<text x="252" y="183" class="kfS" font-size="12" text-anchor="end">开盘价 11.20</text>
<line x1="96" y1="175" x2="96" y2="219" class="ksUp" stroke-width="2"/>
<text x="252" y="226" class="kfF" font-size="12" text-anchor="end">最低价 10.90</text>
</svg>
<svg width="260" height="240" viewBox="0 0 260 240" role="img" aria-label="阴线结构示意：最高价、开盘价、收盘价、最低价与实体">
<text x="130" y="20" class="kfDown" font-size="14" font-weight="700" text-anchor="middle">阴线（下跌）</text>
<text x="8" y="46" class="kfF" font-size="12" text-anchor="start">最高价 12.50</text>
<line x1="164" y1="36" x2="164" y2="80" class="ksDown" stroke-width="2"/>
<text x="8" y="88" class="kfS" font-size="12" text-anchor="start">开盘价 12.00</text>
<rect x="134" y="80" width="60" height="95" class="kfDown" rx="1"/>
<text x="164" y="133" class="kfP" font-size="12" font-weight="700" text-anchor="middle">实体阴柱</text>
<text x="8" y="183" class="kfDown" font-size="12" text-anchor="start">收盘价 10.80</text>
<line x1="164" y1="175" x2="164" y2="219" class="ksDown" stroke-width="2"/>
<text x="8" y="226" class="kfF" font-size="12" text-anchor="start">最低价 10.50</text>
</svg>
</div>`;

function bodyOf(html) {
  const m = /<body[^>]*>([\s\S]*?)<\/body>/.exec(html);
  if (!m) throw new Error('找不到 <body>');
  return m[1];
}

function transform(name, body) {
  let out = body;

  // 1. 注释（原图里有「Left: …」这类分区注释，对读者无意义）
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // 2. 抬头：h1 + p → ch-title + ch-lede
  out = out.replace(
    /<div class="header">\s*<h1>([\s\S]*?)<\/h1>\s*<p>([\s\S]*?)<\/p>/,
    (_m, title, lede) =>
      `<div class="ch-header">\n    <p class="ch-title">${title.trim()}</p>\n    <p class="ch-lede">${lede.trim()}</p>`
  );

  // 3. 装饰性 emoji：本站的装饰语汇是朱砂细线 + serif，不是表情符。
  //    注意只删出现在句首/标题前的标记符，正文里的 ↑ 之类数据箭头保留。
  out = out.replace(/[\u{1F4A1}\u{1F4C8}\u{26A0}\u{1F6A8}\u{274C}\u2705]\uFE0F?\s*/gu, '');

  // 3. 内联样式 → 语义类
  for (const [re, rep] of INLINE[name] ?? []) out = out.replace(re, rep);

  // 3.5 chart3 的 K 线示意整块换成重排版式（原因见 KLINE_BOX 注释）
  if (name === 'chart3-kline-anatomy') {
    const before = out;
    out = out.replace(/<div class="kline-box">[\s\S]*?<\/div>/, () => KLINE_BOX);
    if (out === before) throw new Error('chart3: 没找到 kline-box 容器，版式重排失效');
  }

  // 4. SVG 画笔
  out = out.replace(/\bfill="(#[0-9a-fA-F]{6})"/g, (m, hex) => {
    const cls = FILL[hex.toLowerCase()];
    return cls ? `class="${cls}"` : m;
  });
  out = out.replace(/\bstroke="(#[0-9a-fA-F]{6})"/g, (m, hex) => {
    const cls = STROKE[hex.toLowerCase()];
    return cls ? `class="${cls}"` : m;
  });

  // 5. 表格包滚动层
  out = out.replace(/<table\b/g, '<div class="ch-scroll"><table');
  out = out.replace(/<\/table>/g, '</table></div>');

  // 6. 类名加 ch- 前缀（此时表格外层 .ch-scroll 已被加过，跳过它自己）
  out = out.replace(/class="([^"]*)"/g, (_m, cls) => {
    const list = cls
      .trim()
      .split(/\s+/)
      .map((c) => (c.startsWith('ch-') || /^k[fs][A-Z][A-Za-z]*$/.test(c) ? c : `ch-${c}`));
    return `class="${list.join(' ')}"`;
  });

  // 7. 压掉空行。
  //    CommonMark 里 HTML 块遇空行即终止；空行后若跟着 ≥4 空格缩进的行，
  //    整段会变成缩进代码块（图表里到处都是 4/6/8 空格缩进）。所以片段里
  //    不留空行，一次性避免这个坑。
  out = out
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '')
    .join('\n');

  // 收尾：去掉首尾空行
  return out.replace(/^\s*\n/, '').trim() + '\n';
}

mkdirSync(OUT, { recursive: true });

for (const name of FILES) {
  const raw = readFileSync(join(SRC, `${name}.html`), 'utf8');
  const out = transform(name, bodyOf(raw));

  // 硬校验：不许漏网的内联样式、不许残留未加前缀的类名
  const leftoverStyle = out.match(/style="[^"]*"/);
  if (leftoverStyle) throw new Error(`${name}: 漏掉内联样式 ${leftoverStyle[0]}`);
  const badClass = out.match(/class="([^"]*)"/g).find((c) =>
    c
      .slice(7, -1)
      .split(/\s+/)
      .some((x) => !x.startsWith('ch-') && !/^k[fs][A-Z][A-Za-z]*$/.test(x))
  );
  if (badClass) throw new Error(`${name}: 类名未加前缀 ${badClass}`);

  // 结束标签配对自检，防止转换把结构切断
  for (const tag of ['div', 'table', 'svg', 'span', 'p']) {
    const open = (out.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (out.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) throw new Error(`${name}: <${tag}> 数量不配对 ${open}/${close}`);
  }

  writeFileSync(join(OUT, `${name}.html`), out, 'utf8');
  console.log(`${name}.html  ${Buffer.byteLength(out)} B`);
}

/*
 * 图表片段是在「构建期」被 src/lib/remark-chart-embed.mjs 内联进文章的，而 Astro 的
 * content layer 会把每篇 md 的渲染结果缓存进 node_modules/.astro/data-store.json，
 * 键是 md 自身的内容摘要。只改片段、不改 md 时摘要不变 ⇒ 构建直接复用旧渲染结果，
 * 看着像「改了没生效」（实测踩过一次）。这里顺手清掉缓存，让下一次构建读到新片段。
 */
const DATA_STORE = join(root, 'node_modules/.astro/data-store.json');
if (existsSync(DATA_STORE)) {
  rmSync(DATA_STORE);
  console.log('已清除 node_modules/.astro/data-store.json（文章渲染缓存）');
}
