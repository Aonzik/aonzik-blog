import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 文章集合。
 * 文件放 src/content/posts/*.md，文件名即 URL：/posts/<文件名>/
 * 注意：`z` 从 astro:content 导入已在 Astro 7 弃用（Astro 8 移除），这里用 astro/zod。
 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** 发布日期（frontmatter 可写 2026-10-24 或 2026-10-24 20:00） */
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** 分类：卡片右上角 .card-cat 与侧栏分类计数用 */
    category: z.string().default('随笔'),
    tags: z.array(z.string()).default([]),
    /** 封面图（放 public/ 或 src/assets/，缺省时显示 .card-cover-placeholder） */
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    /** 是否上首页精选位（横向大卡） */
    featured: z.boolean().default(false),
    /** 草稿：build 时不产出页面 */
    draft: z.boolean().default(false),
    /** 显式覆盖阅读时长（分钟） */
    readingTime: z.number().int().positive().optional(),
    /** 文章头右侧装饰位想放的角色名（纯元数据，供美术参考） */
    decorNote: z.string().optional(),
  }),
});

export const collections = { posts };