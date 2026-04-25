/* =========================================================
   漓江泉 — 交互脚本
   设计原则：克制、温和、不干扰阅读
   ========================================================= */

(() => {
  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');

  /* ---- 1. 滚动后导航变实 ---- */
  const navObserver = new IntersectionObserver(
    ([entry]) => {
      nav.classList.toggle('is-solid', !entry.isIntersecting);
    },
    { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
  );
  if (hero) navObserver.observe(hero);

  /* ---- 2. 字符切分（在揭示之前） ---- */
  // 把 .split-reveal 内的所有文字节点按字符切分，保留 <em> / <br> 等标签
  // 中文标题：所有空白字符（换行 / 缩进 / 空格）一律忽略，避免误显示
  const splitChars = (root) => {
    let i = 0;
    const walk = (node) => {
      const kids = [...node.childNodes];
      kids.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          if (!n.textContent.trim()) {
            n.parentNode.removeChild(n);
            return;
          }
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((ch) => {
            if (/\s/.test(ch)) return;
            const span = document.createElement('span');
            span.className = 'char';
            span.style.setProperty('--i', i++);
            span.textContent = ch;
            frag.appendChild(span);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(root);
  };
  document.querySelectorAll('.split-reveal').forEach(splitChars);

  /* ---- 3. 规格行序号（stagger 用） ---- */
  document.querySelectorAll('.ps-spec').forEach((ul) => {
    [...ul.children].forEach((li, i) => li.style.setProperty('--i', i));
  });

  /* ---- 4. 入场揭示 ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          revealObserver.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---- 5. 温和视差 ---- */
  const parallaxEls = document.querySelectorAll('.parallax');
  if (parallaxEls.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const update = () => {
      const vh = innerHeight;
      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const speed = parseFloat(el.dataset.speed || '0.15');
        const center = r.top + r.height / 2 - vh / 2;
        const offset = -center * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---- 6. 视频懒启播 ---- */
  const video = document.querySelector('.hero-video');
  if (video) {
    const tryPlay = () => video.play().catch(() => {});
    if (document.readyState === 'complete') tryPlay();
    else addEventListener('load', tryPlay, { once: true });
  }

  /* ---- 7. 锚链微滚动校正 ---- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + scrollY - 24;
      scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---- 8. 产品切换（Tabs / 场景 / 同步瓶身/卡片/场景） ---- */
  const ps = document.querySelector('.ps');
  if (ps) {
    const tabs    = ps.querySelectorAll('.ps-tab');
    const scenes  = ps.querySelectorAll('.ps-scenes .scene');
    const bottles = ps.querySelectorAll('.ps-bottle');
    const cards   = ps.querySelectorAll('.ps-card');

    const setActive = (id) => {
      if (!id || ps.dataset.active === id) return;
      ps.dataset.active = id;

      const sync = (list) =>
        list.forEach((el) => el.classList.toggle('is-active', el.dataset.id === id));

      sync(tabs); sync(scenes); sync(bottles); sync(cards);

      // 触发卡片内规格行的 stagger 重播
      const card = ps.querySelector(`.ps-card[data-id="${id}"]`);
      if (card) {
        card.querySelectorAll('.ps-spec li').forEach((li) => {
          li.style.transition = 'none';
          li.style.opacity = '0';
          li.style.transform = 'translateY(10px)';
          // 强制 reflow 重启过渡
          void li.offsetWidth;
          li.style.transition = '';
          li.style.opacity = '';
          li.style.transform = '';
        });
      }
    };

    tabs.forEach((t)  => t.addEventListener('click', () => setActive(t.dataset.id)));
    scenes.forEach((s)=> s.addEventListener('click', () => setActive(s.dataset.id)));

    // 站内任意带 data-ps-id 的元素（页脚商店链接、Hero CTA 等）也能驱动切换
    document.querySelectorAll('[data-ps-id]').forEach((el) => {
      el.addEventListener('click', () => setActive(el.dataset.psId));
    });
  }
})();
