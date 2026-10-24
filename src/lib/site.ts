/**
 * 全站站点级配置：品牌、导航、页脚、作者信息。
 *
 * 文案来源：原站 index/blog/post/about 四个 HTML 中逐字提取（见 .handoff/content-extract.md），
 * 除「新增页面入口」（标签 / 装饰位）外不得改写任何一个字。
 */

export interface NavItem {
  key: 'home' | 'blog' | 'about';
  label: string;
  href: string;
}

/** 主导航：与原稿完全一致的 3 项（首页 / 文章 / 关于） */
export const nav: NavItem[] = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'blog', label: '文章', href: '/blog/' },
  { key: 'about', label: '关于', href: '/about/' },
];

/** 页脚「导航」栏：原稿 3 项 + 两个新增页面的入口（标签、装饰位） */
export const footerNav = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/blog/' },
  { label: '标签', href: '/tags/' },
  { label: '关于', href: '/about/' },
  { label: '装饰位', href: '/decor/' },
];

/** 页脚「分类」栏：原稿标签，链接由 blog.html 指向 /tags/<标签>/（行为增强，样式不变） */
export const footerCategories = ['技术', '随笔', '阅读', '设计'];

/** 分类的固定顺序：原稿筛选条与侧栏计数的顺序（技术 / 随笔 / 阅读 / 设计 / 生活） */
export const CATEGORY_ORDER = ['技术', '随笔', '阅读', '设计', '生活'];

/** 首页话题标签云（原稿 8 个标签） */
export const heroTags = [
  '技术',
  '随笔',
  '阅读笔记',
  '设计',
  '工具',
  '生活',
  '摄影',
  '观影',
];

export const site = {
  name: 'Aonzik',
  /** 品牌 mark 里的字母（导航与页脚 logo 同款描边字） */
  markLetter: 'A',
  lang: 'zh-CN',
  /** 首页 <title> / description：原稿文案 */
  title: 'Aonzik — 个人博客',
  description: '记录思考、技术与生活的个人博客。',
  author: {
    name: 'Aonzik',
    role: 'Developer / Writer',
    /** 文章页作者卡原文 */
    bio: '写代码，也写字。关注设计、技术与生活的交叉地带。 这个博客用来记录那些值得留下的想法。',
    email: 'hi@aonzik.com',
  },
  /** 页脚标语原文 */
  footerTagline: '记录思考、技术与生活，文字是留存时光的方式。',
  footerCopyTail: '内容遵循 CC BY 4.0 协议。',
  social: {
    github: '#',
    twitter: '#',
    rss: '/rss.xml',
  },
  links: {
    email: 'mailto:hi@aonzik.com',
    github: '#',
    twitter: '#',
    rss: '/rss.xml',
    feed: '/rss.xml',
  },
} as const;

/** 页脚版权行：年份取构建年份（原稿为 2025） */
export function copyrightYear(now = new Date()): number {
  return now.getFullYear();
}

export function copyrightLine(now = new Date()): string {
  return `© ${copyrightYear(now)} ${site.name}. ${site.footerCopyTail}`;
}