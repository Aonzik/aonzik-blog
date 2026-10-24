/**
 * 二次元装饰「预留位」注册表。
 *
 * 这里只描述「空位」：叫什么、在哪儿、预期多大、准备放什么。
 * 位子由 <Decor slot="…" /> 渲染（见 src/components/Decor.astro），
 * 位置与开关逻辑在 src/styles/decorations.css。
 *
 * 新增一个装饰位时：先在 decorSlots 里登记，再在 decorations.css 第 5 节写位置，
 * 最后在对应组件的 DOM 里放 <Decor slot="…" />。三步即可，互不耦合。
 */

/** 装饰层的三种状态：开 / 关 / 调试（画虚线框看空位） */
export type DecorMode = 'on' | 'off' | 'debug';

/** localStorage key，与 src/scripts/main.ts、BaseLayout 的内联脚本共用 */
export const DECOR_STORAGE_KEY = 'aonzik-decor';

export const DECOR_MODES: DecorMode[] = ['on', 'off', 'debug'];

/** 装饰开关按钮上依次显示的文字（title / aria-label） */
export const DECOR_MODE_LABEL: Record<DecorMode, string> = {
  on: '装饰：显示中（点击切换为关闭）',
  off: '装饰：已关闭（点击切换为调试模式）',
  debug: '装饰：调试模式（点击切换为显示）',
};

export type DecorSlotKind =
  | 'ambient' // 页面四角、两侧留白这类环境装饰
  | 'mascot' // 吉祥物 / 角色立绘
  | 'sticker' // 贴纸、角标
  | 'ornament' // 纹样、分隔、花边
  | 'ui'; // 跟随交互的装饰（光标伙伴、气泡）

export interface DecorSlotDef {
  /** DOM 上的标识：data-decor-slot */
  slot: string;
  /** 一句话说明这个位子的用途 */
  role: string;
  /** 出现在哪个页面/组件的哪个位置 */
  where: string;
  /** 建议尺寸（宽 × 高），同时也是调试框的实际尺寸 */
  size: string;
  kind: DecorSlotKind;
  /** 给将来画图的人的建议：放什么、注意什么 */
  hint: string;
}

export const decorSlots: DecorSlotDef[] = [
  // ── 环境装饰：只在 ≥1280px 的留白里出现，不压正文 ──
  {
    slot: 'page-corner-tl',
    role: '页面左上角环境装饰',
    where: 'BaseLayout · .site-shell 左上（sticky 导航下方）',
    size: '6rem × 6rem',
    kind: 'ambient',
    hint: '适合一笔云纹或屋檐。建议只用墨色 12% 透明度，别抢标题。',
  },
  {
    slot: 'page-corner-tr',
    role: '页面右上角环境装饰',
    where: 'BaseLayout · .site-shell 右上',
    size: '6rem × 6rem',
    kind: 'ambient',
    hint: '与左上角对称；可以放一只探头的小角色，透明度压到 0.5 以下。',
  },
  {
    slot: 'page-corner-bl',
    role: '页面左下角环境装饰',
    where: 'BaseLayout · .site-shell 左下',
    size: '6rem × 6rem',
    kind: 'ambient',
    hint: '适合落叶 / 花瓣这类飘散元素。',
  },
  {
    slot: 'page-corner-br',
    role: '页面右下角环境装饰',
    where: 'BaseLayout · .site-shell 右下',
    size: '6rem × 6rem',
    kind: 'ambient',
    hint: '注意与固定层（返回顶部、光标伙伴）错开，放在它们上方更安全。',
  },
  {
    slot: 'page-rail-left',
    role: '左侧竖长条装饰位',
    where: 'BaseLayout · 容器外侧左边（≥1400px）',
    size: '6rem × 20rem',
    kind: 'ambient',
    hint: '半身立绘位。竖构图，底部对齐基线，透明度建议 ≤0.35。',
  },
  {
    slot: 'page-rail-right',
    role: '右侧竖长条装饰位',
    where: 'BaseLayout · 容器外侧右边（≥1400px）',
    size: '6rem × 20rem',
    kind: 'ambient',
    hint: '与左侧呼应；可放角色背影或书签带。',
  },

  // ── 导航栏 ──
  {
    slot: 'nav-brand-mascot',
    role: '品牌名旁的小吉祥物',
    where: 'SiteNav · .nav-brand 右侧',
    size: '1.25rem × 1.25rem',
    kind: 'mascot',
    hint: '极小的头身比角色（Q 版头像）。线条要能在 60px 高的导航里看清。',
  },
  {
    slot: 'nav-actions-tail',
    role: '导航右侧按钮组尾部的挂件',
    where: 'SiteNav · .nav-actions 之后',
    size: '1.75rem × 1.75rem',
    kind: 'sticker',
    hint: '可放「新文提醒」角标或季节限定小挂件。',
  },
  {
    slot: 'nav-drawer-foot',
    role: '移动端抽屉底部装饰',
    where: 'SiteNav · .nav-drawer 底部居中（≤768px）',
    size: '6rem × 6rem',
    kind: 'mascot',
    hint: '抽屉打开时的收尾角色，横向居中，底部留 32px。',
  },

  // ── 首页 Hero ──
  {
    slot: 'hero-sprite',
    role: '首页主视觉立绘',
    where: 'index · .hero-inner 右侧（≥1280px，利用容器 1180 − 文案 740 的留白）',
    size: '20rem × 26rem',
    kind: 'mascot',
    hint: '全站最大的装饰位。全身/半身立绘，脚底贴住 hero 基线；避免用高饱和色，朱砂只做点缀。',
  },
  {
    slot: 'hero-badge',
    role: 'hero 标签旁的小徽章',
    where: 'index · .hero-tag 右侧',
    size: '3rem × 3rem',
    kind: 'sticker',
    hint: '圆形徽章 / 小图标，与药丸形 .hero-tag 同高附近，别超过 3rem。',
  },
  {
    slot: 'hero-title-corner',
    role: '大标题右下角的手绘感补笔',
    where: 'index · .hero-head 右下',
    size: '3rem × 3rem',
    kind: 'ornament',
    hint: '和 .hero-title em 的朱砂下划线风格统一：一笔手绘线、印章或星点。',
  },
  {
    slot: 'hero-cta-tail',
    role: '按钮组右侧的小角色',
    where: 'index · .hero-cta 右侧（≥1080px）',
    size: '6rem × 6rem',
    kind: 'mascot',
    hint: '像在推按钮的小角色，可做 hover 微动。',
  },
  {
    slot: 'hero-ground',
    role: 'Hero 底部地面装饰带',
    where: 'index · .hero 底部通栏',
    size: '整宽 × 3rem',
    kind: 'ornament',
    hint: '草线 / 影线 / 花丛剪影。用 100% 宽、3rem 高的横向素材，底部对齐。',
  },

  // ── 章节 ──
  {
    slot: 'section-ornament',
    role: '章节标题行纹样',
    where: 'SectionHead · 1px 分隔线左下方（全站通用）',
    size: '6rem × 1.75rem',
    kind: 'ornament',
    hint: '横向小纹样，与 .section-head 的 2px 朱砂短线同一视觉重量。',
  },
  {
    slot: 'content-divider',
    role: '章节之间的分隔纹样',
    where: '各页面 section 之间（720px 居中）',
    size: '100%（≤720px）× 3rem',
    kind: 'ornament',
    hint: '中央对称的细纹样，两侧可渐隐。它是流式占位：关掉装饰时高度归零。',
  },

  // ── 卡片 ──
  {
    slot: 'card-corner',
    role: '卡片右上角贴纸',
    where: 'PostCard · .card 右上角（网格卡与精选卡通用）',
    size: '1.75rem × 1.75rem',
    kind: 'sticker',
    hint: '角标 / 分类小徽章。别盖住 .card-cover 的边框。',
  },
  {
    slot: 'card-cover-sticker',
    role: '封面右下角贴纸',
    where: 'PostCard · .card-cover 左下角',
    size: '6rem × 6rem',
    kind: 'mascot',
    hint: '从封面边缘探出的角色。封面本身是 16/9，贴纸别超过高度的 60%。',
  },

  // ── 文章页 ──
  {
    slot: 'post-body-figure',
    role: '正文右侧立绘',
    where: 'posts/[...id] · .prose 右侧空档（≥1280px）',
    size: '10rem × 12rem',
    kind: 'mascot',
    hint: '顶部与 .prose 第一段对齐；右边只剩约 176px，宽度别超过 10rem。',
  },
  {
    slot: 'post-cover-sticker',
    role: '文章封面角落装饰',
    where: 'posts/[...slug] · .post-cover 右下',
    size: '6rem × 6rem',
    kind: 'sticker',
    hint: '封面是 21/9 通栏，角落元素要小而稳。',
  },
  {
    slot: 'toc-mascot',
    role: '目录下方挂件',
    where: 'posts/[...id] · 右侧 .toc 下方（≥1280px）',
    size: '6rem × 6rem',
    kind: 'mascot',
    hint: '吸底目录的尾巴，可做「翻页」姿势。',
  },

  // ── 关于页 ──
  {
    slot: 'profile-avatar-frame',
    role: '名片头像外框装饰',
    where: 'about · .profile-avatar 上方',
    size: '6rem × 1.75rem',
    kind: 'ornament',
    hint: '头像上方的横幅 / 挂旗 / 花环，与 7rem 圆形头像同宽居中。',
  },
  {
    slot: 'about-hero-figure',
    role: '关于页简介右侧插图',
    where: 'about · .about-body 右侧空档（≥1280px）',
    size: '10rem × 12rem',
    kind: 'mascot',
    hint: '正文 58ch 之外只剩约 190px，尺寸别超；顶部与 .about-body 顶部对齐。',
  },
  {
    slot: 'skill-tip',
    role: '技能条末端小图标',
    where: 'about · .skill-track 右端（≥1080px）',
    size: '1.25rem × 1.25rem',
    kind: 'sticker',
    hint: '与 4px 高的细条同高，做成小圆点或星星即可，不要超过 1.25rem。',
  },

  // ── 页脚 ──
  {
    slot: 'footer-mascot',
    role: '页脚角色',
    where: 'SiteFooter · 右下角（≥768px）',
    size: '10rem × 10rem',
    kind: 'mascot',
    hint: '坐着的角色，底部贴住页脚地面带。',
  },
  {
    slot: 'footer-ground',
    role: '页脚地面带',
    where: 'SiteFooter · 底部通栏',
    size: '整宽 × 1.75rem',
    kind: 'ornament',
    hint: '横向地面剪影，和 hero-ground 用同一套笔触。',
  },

  // ── 交互层 ──
  {
    slot: 'back-to-top-mascot',
    role: '返回顶部按钮上的角色',
    where: 'BackToTop · 按钮左上角',
    size: '3rem × 3rem',
    kind: 'ui',
    hint: '小角色拽着按钮往上飞，须与 2.5rem 的按钮圆角/描边风格一致。',
  },
  {
    slot: 'cursor-companion',
    role: '跟随光标的伙伴',
    where: 'BaseLayout · 固定层右下（≥768px）',
    size: '10rem × 10rem',
    kind: 'ui',
    hint: '用 fixed 定位，脚本可直接驱动 transform / 帧动画；默认 opacity ≤0.9。',
  },
  {
    slot: 'bubble-corner',
    role: '右下角说话气泡',
    where: 'BaseLayout · 固定层右下（伙伴上方）',
    size: '13rem × 6rem',
    kind: 'ui',
    hint: '气泡轮廓 + 一条尾巴朝向伙伴；文字可用 .mono 小字。',
  },
];

/** 按 slot 名查定义，/decor 页面与调试提示会用到 */
export const decorSlotMap = new Map(decorSlots.map((s) => [s.slot, s]));

export function getDecorSlot(slot: string): DecorSlotDef | undefined {
  return decorSlotMap.get(slot);
}