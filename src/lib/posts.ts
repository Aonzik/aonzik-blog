/**
 * 文章相关的纯函数工具：排序、日期与阅读时长格式化、标签聚合、分页、上下篇。
 * 全部为纯函数，便于在页面与组件之间共享，也便于后续加测试。
 */
import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 每页文章数（12 篇 / 6 = 2 页） */
export const PAGE_SIZE = 6;

/** 按日期倒序（新 → 旧） */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 过滤草稿 */
export function published(posts: Post[]): Post[] {
  return posts.filter((post) => !post.data.draft);
}

/**
 * 卡片 / 列表里的日期：原稿形如 2025-10-01
 * 用 UTC 取值：frontmatter 里的 `2025-10-01` 会被解析成 UTC 零点，
 * 用本地 getter 会在 UTC-N 的构建机上整体差一天。
 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 文章头 meta 行：原稿形如 2025 年 10 月 1 日 */
export function formatDateCN(date: Date): string {
  return `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

/** <time datetime> 用的 ISO 日期 */
export function isoDate(date: Date): string {
  return formatDate(date);
}

/** 中文按 350 字/分钟、英文按 200 词/分钟估算 */
export function readingMinutes(post: Post): number {
  if (post.data.readingTime) return post.data.readingTime;
  const body = (post.body ?? '').replace(/```[\s\S]*?```/g, '');
  const cnChars = (body.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const enWords = (body.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cnChars / 350 + enWords / 200));
}

/** 卡片与文章头：原稿「约 8 分钟阅读」 */
export function readingLabel(post: Post): string {
  return `约 ${readingMinutes(post)} 分钟阅读`;
}

/** 首页「最新」卡片的 .card-read：原稿「约 5 分钟」（不带「阅读」二字） */
export function readingMid(post: Post): string {
  return `约 ${readingMinutes(post)} 分钟`;
}

/** 列表行：原稿「8 分钟」 */
export function readingShort(post: Post): string {
  return `${readingMinutes(post)} 分钟`;
}

/** 文章路径 */
export function postPath(post: Post): string {
  return `/posts/${post.id}/`;
}

/** 摘要：frontmatter description 优先 */
export function excerptOf(post: Post): string {
  return post.data.description;
}

/** 标签计数（按出现次数倒序，同频按名称排） */
export function tagCounts(posts: Post[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hans-CN'));
}

/** 分类计数（按原稿顺序：技术 / 随笔 / 阅读 / 设计 / 生活） */
export function categoryCounts(posts: Post[], order: string[] = []): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of posts) {
    map.set(post.data.category, (map.get(post.data.category) ?? 0) + 1);
  }
  const entries = [...map.entries()].map(([name, count]) => ({ name, count }));
  if (order.length === 0) return entries.sort((a, b) => b.count - a.count);
  return entries.sort((a, b) => {
    const ia = order.indexOf(a.name);
    const ib = order.indexOf(b.name);
    if (ia === -1 && ib === -1) return b.count - a.count;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** 某个标签下的文章（保持传入顺序） */
export function postsWithTag(posts: Post[], tag: string): Post[] {
  return posts.filter((post) => post.data.tags.includes(tag));
}

export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}/`;
}

/**
 * 一个「话题」下的文章：分类名或标签名任一命中即算。
 * 原稿的分类筛选按钮与页脚分类列都走这里，这样 12 个话题名（分类 5 + 独有标签 4）
 * 都能有真实可点的落地页，不必为分类另开一套路由。
 */
export function topicPosts(posts: Post[], name: string): Post[] {
  return posts.filter((post) => post.data.category === name || post.data.tags.includes(name));
}

/** 全部话题名（分类在前、独有标签在后，重复只算一次，顺序按文章新旧首次出现） */
export function topicNames(posts: Post[]): string[] {
  const names: string[] = [];
  for (const post of posts) {
    if (!names.includes(post.data.category)) names.push(post.data.category);
    for (const tag of post.data.tags) {
      if (!names.includes(tag)) names.push(tag);
    }
  }
  return names;
}

/** 上一篇 / 下一篇（按时间序列，prev 更早、next 更新） */
export function neighbours(posts: Post[], current: Post): { prev?: Post; next?: Post } {
  const index = posts.findIndex((post) => post.id === current.id);
  if (index === -1) return {};
  return { prev: posts[index + 1], next: posts[index - 1] };
}

/** 分页切片 */
export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): { items: T[]; total: number; lastPage: number } {
  const total = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), total);
  return { items: items.slice((current - 1) * size, current * size), total, lastPage: total };
}