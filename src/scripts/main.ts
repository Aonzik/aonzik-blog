/**
 * 全站交互脚本：原站 scripts/main.js 的逐项移植（行为、阈值、class 名完全一致）
 * + 装饰层（decor）模式切换这一新增子系统的前端部分。
 *
 * 全部为渐进增强：脚本不执行时页面依然可用（只是没有滚动浮现、目录高亮等效果）。
 */
import { DECOR_MODES, DECOR_STORAGE_KEY, DECOR_MODE_LABEL, type DecorMode } from '../lib/decorations';

/* ------------------------------------------------------------------
   主题：与原站一致（localStorage -> prefers-color-scheme -> 亮色）
   ------------------------------------------------------------------ */
const THEME_KEY = 'aonzik-theme';

function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.dataset.theme = 'dark';
  } else {
    root.removeAttribute('data-theme');
  }
  const btn = document.querySelector<HTMLButtonElement>('.btn-theme');
  if (btn) {
    const next = theme === 'dark' ? '亮色' : '暗色';
    btn.setAttribute('aria-label', `切换颜色主题（当前${theme === 'dark' ? '暗色' : '亮色'}，点击切换为${next}）`);
    btn.setAttribute('title', `切换颜色主题（当前${theme === 'dark' ? '暗色' : '亮色'}）`);
  }
}

function setupTheme(): void {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial: 'light' | 'dark' = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
  applyTheme(initial);

  const btn = document.querySelector<HTMLButtonElement>('.btn-theme');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next: 'light' | 'dark' = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

/* ------------------------------------------------------------------
   装饰层：on（默认，空槽不占位） / off / debug（虚线框 + 规格标签）
   ------------------------------------------------------------------ */
function isDecorMode(value: unknown): value is DecorMode {
  return typeof value === 'string' && (DECOR_MODES as readonly string[]).includes(value);
}

function applyDecor(mode: DecorMode, persist = true): void {
  document.documentElement.dataset.decor = mode;
  const btn = document.querySelector<HTMLButtonElement>('[data-decor-toggle]');
  if (btn) {
    btn.setAttribute('aria-label', `装饰层：${DECOR_MODE_LABEL[mode]}`);
    btn.setAttribute('title', DECOR_MODE_LABEL[mode]);
    btn.dataset.decorMode = mode;
  }
  if (persist) {
    try {
      localStorage.setItem(DECOR_STORAGE_KEY, mode);
    } catch {
      /* 隐私模式下忽略 */
    }
  }
}

function setupDecor(): void {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('decor');

  let mode: DecorMode = 'on';
  if (isDecorMode(fromQuery)) {
    mode = fromQuery;
  } else {
    const stored = localStorage.getItem(DECOR_STORAGE_KEY);
    if (isDecorMode(stored)) mode = stored;
  }
  applyDecor(mode, isDecorMode(fromQuery));

  if (isDecorMode(fromQuery)) {
    params.delete('decor');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  }

  // 页面内任意 [data-decor-set="<mode>"]（/decor 规格页上的按钮）可直接设定模式
  for (const el of document.querySelectorAll<HTMLElement>('[data-decor-set]')) {
    el.addEventListener('click', () => {
      const wanted = el.dataset.decorSet;
      if (isDecorMode(wanted)) applyDecor(wanted);
    });
  }

  const toggle = document.querySelector<HTMLButtonElement>('[data-decor-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.dataset.decor;
      const index = (DECOR_MODES as readonly string[]).indexOf(current ?? 'on');
      const next = DECOR_MODES[(index + 1) % DECOR_MODES.length];
      applyDecor(next);
    });
  }
}

/* ------------------------------------------------------------------
   导航：滚动后加毛玻璃、移动端抽屉
   ------------------------------------------------------------------ */
function setupNav(): void {
  const nav = document.querySelector<HTMLElement>('.site-nav');
  if (nav) {
    const onScroll = (): void => {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const menuBtn = document.querySelector<HTMLButtonElement>('.btn-menu');
  const drawer = document.querySelector<HTMLElement>('.nav-drawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      menuBtn.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    for (const link of drawer.querySelectorAll('a')) {
      link.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', '打开菜单');
      });
    }
  }
}

/* ------------------------------------------------------------------
   滚动浮现：[data-reveal] 依次延时 60ms（封顶 360ms）
   ------------------------------------------------------------------ */
function setupReveal(): void {
  const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (items.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  items.forEach((el, index) => {
    el.style.setProperty('--reveal-delay', `${Math.min(index * 60, 360)}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------
   返回顶部 / 阅读进度
   ------------------------------------------------------------------ */
function setupBackToTop(): void {
  const btn = document.querySelector<HTMLButtonElement>('.back-to-top');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const onScroll = (): void => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function setupReadProgress(): void {
  const bar = document.querySelector<HTMLElement>('.read-progress');
  const prose = document.querySelector<HTMLElement>('.prose');
  if (!bar || !prose) return;

  const update = (): void => {
    const rect = prose.getBoundingClientRect();
    const total = prose.offsetHeight - window.innerHeight;
    const passed = -rect.top;
    const percent = total <= 0 ? 100 : Math.min(100, Math.max(0, (passed / total) * 100));
    bar.style.width = `${percent}%`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* ------------------------------------------------------------------
   目录高亮（文章页正文内目录 + 右侧粘性目录同步）
   ------------------------------------------------------------------ */
/**
 * 把当前章节的目录项滚进右侧栏的可视区。
 * 只调整「最近的可滚动祖先」(.article-aside) 的 scrollTop，绝不用
 * scrollIntoView —— 那会连带滚动整个页面，读者会感觉页面「跳一下」。
 */
function keepTocInView(link: HTMLAnchorElement): void {
  const box = link.closest<HTMLElement>('.article-aside');
  if (!box || box.scrollHeight <= box.clientHeight) return;
  // 收起来的条目量不到位置（rect 全是 0），别拿它去滚动侧栏
  if (!link.offsetParent) return;
  const pad = 16;
  const item = link.getBoundingClientRect();
  const area = box.getBoundingClientRect();
  if (item.top < area.top + pad) {
    box.scrollTop -= area.top + pad - item.top;
  } else if (item.bottom > area.bottom - pad) {
    box.scrollTop += item.bottom - (area.bottom - pad);
  }
}

/** 目录分组的开合：组标题右侧那颗按钮控制它下面的 .toc-sub */
function setGroupOpen(group: HTMLElement, open: boolean): void {
  const button = group.querySelector<HTMLButtonElement>('.toc-toggle');
  const sub = group.querySelector<HTMLElement>('.toc-sub');
  if (!button || !sub) return;
  button.setAttribute('aria-expanded', String(open));
  sub.classList.toggle('is-collapsed', !open);
}

function isGroupOpen(group: HTMLElement): boolean {
  return group.querySelector('.toc-toggle')?.getAttribute('aria-expanded') === 'true';
}

function setupTocGroups(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.toc-toggle')) {
    const group = button.closest<HTMLElement>('.toc-group');
    if (!group) continue;
    button.addEventListener('click', () => {
      setGroupOpen(group, !isGroupOpen(group));
      // 读者亲手开合过的组，之后不再被「跟随阅读位置」自动开关
      group.dataset.manual = '1';
      group.removeAttribute('data-auto');
    });
  }
}

/**
 * 阅读位置进入某个分组时把它展开，并收起此前自动展开的组。
 * 手动开合的组（dataset.manual）不参与，免得跟读者抢控制权。
 */
function revealTocGroup(link: HTMLAnchorElement): void {
  const nav = link.closest<HTMLElement>('.toc');
  if (!nav) return;
  const group = link.closest<HTMLElement>('.toc-group');
  const hasSub = !!group?.querySelector('.toc-sub');

  if (group && hasSub && group.dataset.manual !== '1' && !isGroupOpen(group)) {
    setGroupOpen(group, true);
    group.dataset.auto = '1';
  }

  for (const other of nav.querySelectorAll<HTMLElement>('.toc-group[data-auto="1"]')) {
    if (other === group) continue;
    setGroupOpen(other, false);
    other.removeAttribute('data-auto');
  }
}

function setupToc(): void {
  // 侧栏目录比视口高时打标记：让挂在目录下方外侧的小装饰让位（见 page-post.css）。
  // 必须放在下面的 early return 之前，否则老浏览器里装饰件会错误地留着。
  const aside = document.querySelector<HTMLElement>('.article-aside');
  if (aside) aside.classList.toggle('is-scrollable', aside.scrollHeight > aside.clientHeight + 4);

  setupTocGroups();

  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc-item a[href^="#"]')];
  const groups = new Map<string, HTMLAnchorElement[]>();
  for (const link of links) {
    const id = decodeURIComponent(link.getAttribute('href')!.slice(1));
    const list = groups.get(id) ?? [];
    list.push(link);
    groups.set(id, list);
  }
  if (groups.size === 0 || !('IntersectionObserver' in window)) return;

  const activate = (id: string | null): void => {
    for (const [key, group] of groups) {
      const on = key === id;
      for (const link of group) {
        link.closest('li')?.classList.toggle('is-active', on);
        if (on) {
          revealTocGroup(link);
          keepTocInView(link);
        }
      }
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activate(entry.target.id);
      }
    },
    { rootMargin: '-80px 0px -70% 0px' },
  );

  for (const id of groups.keys()) {
    const heading = document.getElementById(id);
    if (heading) observer.observe(heading);
  }
}

/* ------------------------------------------------------------------
   技能条：进入视口后按 data-pct 撑开
   ------------------------------------------------------------------ */
function setupSkillBars(): void {
  const bars = [...document.querySelectorAll<HTMLElement>('.skill-bar')];
  if (bars.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    bars.forEach((bar) => bar.style.width = `${bar.dataset.pct ?? 0}%`);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const bar = entry.target as HTMLElement;
        bar.style.width = `${bar.dataset.pct ?? 0}%`;
        observer.unobserve(bar);
      }
    },
    { threshold: 0.4 },
  );
  bars.forEach((bar) => observer.observe(bar));
}

/* ------------------------------------------------------------------
   搜索浮层（原站为纯前端占位：只负责开关，不做检索）
   ------------------------------------------------------------------ */
function setupSearch(): void {
  const overlay = document.querySelector<HTMLElement>('.search-overlay');
  if (!overlay) return;
  const input = overlay.querySelector<HTMLInputElement>('.search-input');
  const close = (): void => {
    overlay.classList.remove('is-open');
    document.body.style.removeProperty('overflow');
  };
  const open = (): void => {
    overlay.classList.add('is-open');
    document.body.style.setProperty('overflow', 'hidden');
    window.setTimeout(() => input?.focus(), 60);
  };
  const toggle = (): void => {
    if (overlay.classList.contains('is-open')) close();
    else open();
  };

  for (const el of document.querySelectorAll<HTMLElement>('[data-search-open]')) {
    el.addEventListener('click', open);
  }
  overlay.querySelector('.search-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      close();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggle();
    }
  });
}

/* ------------------------------------------------------------------
   启动
   ------------------------------------------------------------------ */
function main(): void {
  setupTheme();
  setupDecor();
  setupNav();
  setupReveal();
  setupBackToTop();
  setupReadProgress();
  setupToc();
  setupSkillBars();
  setupSearch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true });
} else {
  main();
}