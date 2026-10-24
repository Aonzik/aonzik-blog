/**
 * RSS 2.0 订阅源 —— /rss.xml
 * 只输出正式文章（已滤草稿），倒序排列。
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { excerptOf, published, sortPosts, postPath } from '../lib/posts';
import { site } from '../lib/site';

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site: astroSite }) => {
  const base = astroSite?.href.replace(/\/$/, '') ?? '';
  const posts = sortPosts(published(await getCollection('posts')));

  const items = posts
    .map((post) => {
      const url = `${base}${postPath(post)}`;
      return [
        '    <item>',
        `      <title>${escape(post.data.title)}</title>`,
        `      <link>${escape(url)}</link>`,
        `      <guid isPermaLink="true">${escape(url)}</guid>`,
        `      <pubDate>${post.data.date.toUTCString()}</pubDate>`,
        `      <description>${escape(excerptOf(post))}</description>`,
        post.data.category ? `      <category>${escape(post.data.category)}</category>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(site.title)}</title>
    <link>${escape(base)}/</link>
    <description>${escape(site.description)}</description>
    <language>${site.lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};