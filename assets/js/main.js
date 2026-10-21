/* Progressive enhancement only: every page is fully usable without this file. */
(() => {
  const root = document.documentElement;
  window.__kc = 1;

  /* ---------- reveal on scroll (first, so content never stays hidden) ---------- */
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }
  root.classList.add('reveal-ready');

  const readJSON = (id, fallback) => {
    try { return JSON.parse(document.getElementById(id)?.textContent || ''); } catch (e) { return fallback; }
  };
  const siteData = readJSON('site-data', {});
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const live = document.getElementById('live');
  const announce = (msg) => {
    if (!live) return;
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 30);
  };

  /* ---------- theme ---------- */
  const themeColors = { dark: '#151412', light: '#f6f3ec' };
  // Light is the default; dark only when the visitor turns it on.
  const currentTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');
  const syncTheme = () => {
    const t = currentTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(t === 'dark')));
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = themeColors[t]; });
  };
  const toggleTheme = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    syncTheme();
  };
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
  syncTheme();

  /* ---------- nav ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = document.querySelector('[data-menu]');
  const links = document.getElementById('nav-links');
  const closeMenu = (refocus) => {
    if (!links || !links.classList.contains('open')) return;
    links.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    if (refocus) menuBtn?.focus();
  };
  if (menuBtn && links) {
    menuBtn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (ev) => { if (ev.target.closest('a')) closeMenu(false); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeMenu(true); });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('.nav')) closeMenu(false); });
    nav?.addEventListener('focusout', (ev) => { if (ev.relatedTarget && !nav.contains(ev.relatedTarget)) closeMenu(false); });
    const wide = matchMedia('(min-width: 961px)');
    const onWide = (ev) => { if (ev.matches) closeMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  /* ---------- active section (nav on home, table of contents on case pages) ---------- */
  const markers = [...document.querySelectorAll('[data-section]')];
  const sections = [...new Set(markers.map((m) => m.dataset.section))]
    .map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length) {
    let ticking = false;
    let lockUntil = 0;
    const setCurrent = (id) => markers.forEach((m) => {
      if (id && m.dataset.section === id) m.setAttribute('aria-current', 'true');
      else m.removeAttribute('aria-current');
    });
    const update = () => {
      ticking = false;
      if (Date.now() < lockUntil) return;
      // The marker line slides from 35% of the viewport down to the bottom as the page ends,
      // so short trailing sections can still become active.
      const vh = window.innerHeight;
      const remaining = document.documentElement.scrollHeight - (window.scrollY + vh);
      const t = Math.max(0, Math.min(1, 1 - remaining / (vh * 0.65)));
      const line = vh * (0.35 + 0.65 * t);
      let current = null;
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s.id; });
      setCurrent(current);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    markers.forEach((m) => m.addEventListener('click', () => { setCurrent(m.dataset.section); lockUntil = Date.now() + 900; }));
    update();
  }

  /* ---------- copy email ---------- */
  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  };
  const flash = (btn, msg) => {
    announce(msg);
    const label = btn?.querySelector('span');
    if (!label) return;
    if (!label.dataset.orig) label.dataset.orig = label.textContent;
    label.textContent = msg === 'Email address copied' ? 'Copied' : label.dataset.orig;
    btn.classList.add('copy-ok');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { label.textContent = label.dataset.orig; btn.classList.remove('copy-ok'); }, 1600);
  };
  const copyEmail = async (btn) => {
    const email = btn?.dataset.copy || siteData.email;
    if (!email) return;
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; } catch (e) { ok = fallbackCopy(email); }
    if (ok) flash(btn, 'Email address copied');
    else window.prompt('Copy this address:', email);
  };
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyEmail(b)));

  /* ---------- hero: illustrative agent-run trace (plays once) ---------- */
  const trace = document.querySelector('.trace');
  if (trace) {
    const items = [...trace.children];
    if (reduceMotion) {
      items.forEach((li) => li.classList.add('on'));
    } else {
      let i = 0;
      const step = () => {
        items.forEach((li, k) => { li.classList.toggle('on', k <= i); li.classList.toggle('active', k === i); });
        i += 1;
        if (i < items.length) setTimeout(step, 600);
        else setTimeout(() => items.forEach((li) => li.classList.remove('active')), 1400);
      };
      setTimeout(step, 400);
    }
  }

  /* ---------- command menu (Ctrl/Cmd + K) ---------- */
  const dialog = document.getElementById('cmdk');
  const data = readJSON('cmdk-data', []);
  if (dialog && typeof dialog.showModal === 'function') {
    root.classList.add('has-cmdk');
    const input = dialog.querySelector('.cmdk-input');
    const list = dialog.querySelector('.cmdk-list');
    const status = document.getElementById('cmdk-status');
    let shown = [];
    let sel = 0;

    const render = (announceCount) => {
      const q = input.value.trim().toLowerCase();
      shown = data.filter((d) => !q || (d.label + ' ' + d.group).toLowerCase().includes(q));
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      list.innerHTML = '';
      if (!shown.length) {
        input.removeAttribute('aria-activedescendant');
        const li = document.createElement('li');
        li.className = 'cmdk-empty';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-disabled', 'true');
        li.textContent = 'No results';
        list.appendChild(li);
      } else {
        shown.forEach((d, idx) => {
          const li = document.createElement('li');
          li.id = 'cmdk-opt-' + idx;
          li.setAttribute('role', 'option');
          li.setAttribute('aria-selected', String(idx === sel));
          const label = document.createElement('span');
          label.textContent = d.label;
          const group = document.createElement('span');
          group.className = 'g';
          group.textContent = d.group;
          li.append(label, group);
          li.addEventListener('mousemove', () => { if (sel !== idx) { sel = idx; render(false); } });
          li.addEventListener('click', () => run(d));
          list.appendChild(li);
        });
        input.setAttribute('aria-activedescendant', 'cmdk-opt-' + sel);
        list.children[sel]?.scrollIntoView({ block: 'nearest' });
      }
      if (announceCount && status) status.textContent = shown.length ? shown.length + ' results' : 'No results';
    };

    const run = (d) => {
      dialog.close();
      if (d.action === 'theme') toggleTheme();
      else if (d.action === 'copy-email') copyEmail(null);
      else if (d.href) {
        if (/^https?:/.test(d.href)) window.open(d.href, '_blank', 'noopener');
        else window.location.href = d.href;
      }
    };

    const open = () => {
      input.value = '';
      sel = 0;
      render(false);
      dialog.showModal();
      input.focus();
    };

    document.querySelectorAll('[data-cmdk-open]').forEach((b) => b.addEventListener('click', open));
    document.addEventListener('keydown', (ev) => {
      if (ev.defaultPrevented || ev.isComposing || ev.repeat || ev.shiftKey || ev.altKey) return;
      if (!(isMac ? ev.metaKey : ev.ctrlKey)) return;
      if (ev.code !== 'KeyK' && (ev.key || '').toLowerCase() !== 'k') return;
      const t = ev.target;
      if (t instanceof HTMLElement && !dialog.contains(t) && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      ev.preventDefault();
      if (dialog.open) dialog.close(); else open();
    });
    input.addEventListener('input', () => { sel = 0; render(true); });
    input.addEventListener('keydown', (ev) => {
      if (!shown.length) return;
      if (ev.key === 'ArrowDown') { ev.preventDefault(); sel = (sel + 1) % shown.length; render(false); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); sel = (sel - 1 + shown.length) % shown.length; render(false); }
      else if (ev.key === 'Enter') { ev.preventDefault(); run(shown[sel]); }
    });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  }

  if (isMac) document.querySelectorAll('.kbd-btn kbd').forEach((k) => { k.textContent = '⌘K'; });
})();
