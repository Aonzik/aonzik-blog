/* ============================================================
   Aonzik Blog — Interaction
   无依赖、原生 JS。所有功能渐进增强。
   ============================================================ */
(function () {
  "use strict";

  /* ---- 主题切换（持久化到 localStorage） ----------------- */
  const THEME_KEY = "aonzik-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }

  // 首次加载：localStorage > 系统偏好
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  // 切换按钮
  document.querySelectorAll(".btn-theme").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const isDark = root.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  });

  /* ---- 导航栏滚动状态 ----------------------------------- */
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- 移动端菜单 --------------------------------------- */
  const menuBtn = document.querySelector(".btn-menu");
  const drawer = document.querySelector(".nav-drawer");
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", function () {
      const open = drawer.classList.toggle("is-open");
      menuBtn.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---- 滚动进入动画 ------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      revealEls.forEach(function (el, i) {
        // 自动错开延迟
        if (!el.style.getPropertyValue("--reveal-delay")) {
          el.style.setProperty("--reveal-delay", Math.min(i * 60, 360) + "ms");
        }
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  /* ---- 返回顶部 ----------------------------------------- */
  const toTop = document.querySelector(".back-to-top");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });
  }

  /* ---- 阅读进度条 --------------------------------------- */
  const progress = document.querySelector(".read-progress");
  if (progress) {
    const article = document.querySelector(".prose") || document.body;
    window.addEventListener("scroll", function () {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.max(0, Math.min(total, -rect.top));
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      progress.style.width = pct + "%";
    }, { passive: true });
  }

  /* ---- 目录高亮（文章页） ------------------------------- */
  const tocLinks = document.querySelectorAll(".toc-item a");
  if (tocLinks.length) {
    const headings = [];
    tocLinks.forEach(function (link) {
      const id = link.getAttribute("href").slice(1);
      const h = document.getElementById(id);
      if (h) headings.push({ link: link, el: h });
    });
    if ("IntersectionObserver" in window && headings.length) {
      const tocIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          const match = headings.find(function (h) { return h.el === entry.target; });
          if (match) {
            match.link.parentElement.classList.toggle("is-active", entry.isIntersecting);
          }
        });
      }, { rootMargin: "-80px 0px -70% 0px" });
      headings.forEach(function (h) { tocIo.observe(h.el); });
    }
  }

  /* ---- 技能条动画 --------------------------------------- */
  const skillBars = document.querySelectorAll(".skill-bar");
  if (skillBars.length && "IntersectionObserver" in window) {
    const skillIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const pct = entry.target.getAttribute("data-pct");
          entry.target.style.width = pct + "%";
          skillIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    skillBars.forEach(function (bar) { skillIo.observe(bar); });
  }

  /* ---- 搜索浮层（占位交互） ----------------------------- */
  const searchBtns = document.querySelectorAll("[data-search-open]");
  const searchOverlay = document.querySelector(".search-overlay");
  if (searchOverlay) {
    const openSearch = function () {
      searchOverlay.classList.add("is-open");
      setTimeout(function () {
        const input = searchOverlay.querySelector(".search-input");
        if (input) input.focus();
      }, 60);
    };
    const closeSearch = function () {
      searchOverlay.classList.remove("is-open");
    };
    searchBtns.forEach(function (b) { b.addEventListener("click", openSearch); });
    const closeBtn = searchOverlay.querySelector(".search-close");
    if (closeBtn) closeBtn.addEventListener("click", closeSearch);
    searchOverlay.addEventListener("click", function (e) {
      if (e.target === searchOverlay) closeSearch();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSearch();
      // 快捷键：⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchOverlay.classList.contains("is-open") ? closeSearch() : openSearch();
      }
    });
  }
})();
