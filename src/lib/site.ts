/**
 * 全站站点级配置：品牌、导航、页脚、社交链接。
 *
 * 人物资料（名字来历、标签、研究线索、工具栈、兴趣）在 src/lib/profile.ts，
 * 内容唯一来源是 docs/bio.md。
 */

export interface NavItem {
  key: 'home' | 'blog' | 'about';
  label: string;
  href: string;
}

/** 主导航：首页 / 文章 / 关于 */
export const nav: NavItem[] = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'blog', label: '文章', href: '/blog/' },
  { key: 'about', label: '关于', href: '/about/' },
];

/** 页脚「导航」栏：主导航 + 标签、装饰位 */
export const footerNav = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/blog/' },
  { label: '标签', href: '/tags/' },
  { label: '关于', href: '/about/' },
  { label: '装饰位', href: '/decor/' },
];

/** 页脚「分类」栏：链接指向 /tags/<分类>/ */
export const footerCategories = ['技术', '随笔', '阅读', '设计'];

/** 分类的固定顺序（技术 / 随笔 / 阅读 / 设计 / 生活） */
export const CATEGORY_ORDER = ['技术', '随笔', '阅读', '设计', '生活'];

/** 首页话题标签云：内容里真实存在的 8 个标签 */
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
  /** 全名（版权行、og:site_name、RSS 用） */
  name: 'Aonzik Kawasaki',
  /** 导航栏 / 页脚 logo 旁的短名 */
  brand: 'Aonzik',
  /** 中文名 */
  zhName: '川崎·杭汐',
  /** 品牌 mark 里的字母（导航与页脚 logo 同款描边字） */
  markLetter: 'A',
  lang: 'zh-CN',
  /** 首页 <title> / description */
  title: 'Aonzik Kawasaki — 川崎·杭汐的个人博客',
  description:
    '川崎·杭汐（Aonzik Kawasaki）：计算机人工智能专业本科在读，做基于大语言模型的聊天机器人，折腾个人服务器与私有云，也写二次元文化与江浙吴越的方言。',
  author: {
    name: 'Aonzik Kawasaki',
    zhName: '川崎·杭汐',
    role: 'AI Student / Developer',
    /** 文章页作者卡 */
    bio: '计算机人工智能专业本科在读。做基于大语言模型的聊天机器人，也在补全栈、折腾个人服务器与私有云；闲下来时在方言、二次元与城市里乱走。',
    email: 'aonzik_koo@foxmail.com',
  },
  /** 页脚标语 */
  footerTagline: '在代码与方言之间，留一点记录。',
  footerCopyTail: '内容遵循 CC BY 4.0 协议。',
  links: {
    email: 'mailto:aonzik_koo@foxmail.com',
    /** 邮件正文里只拼出 aonzik_koo 这一半，@foxmail.com 由 CSS 补上，见 components.css */
    emailUser: 'aonzik_koo',
    github: 'https://github.com/Aonzik',
    bilibili: 'https://space.bilibili.com/349364610',
    rss: '/rss.xml',
    feed: '/rss.xml',
  },
} as const;

/** 内页标题：`标签 — Aonzik Kawasaki` */
export function titled(label: string): string {
  return `${label} — ${site.name}`;
}

/** 页脚版权行：年份取构建年份 */
export function copyrightYear(now = new Date()): number {
  return now.getFullYear();
}

export function copyrightLine(now = new Date()): string {
  return `© ${copyrightYear(now)} ${site.name}. ${site.footerCopyTail}`;
}
