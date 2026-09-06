(function () {
  'use strict';

  const NAV_ID = 'sitenav';
  const TOGGLE_ID = 'nav-toggle';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function getScrollSpyTargets() {
    const anchors = Array.from(document.querySelectorAll('.sitenav a[href^="#"]'));
    const ids = new Set();
    anchors.forEach(function (a) {
      const id = a.getAttribute('href').slice(1);
      if (id) ids.add(id);
    });
    const targets = [];
    ids.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) targets.push({ id: id, el: el });
    });
    return targets;
  }

  function linkMap() {
    const map = new Map();
    document.querySelectorAll('.sitenav a[href^="#"]').forEach(function (a) {
      const id = a.getAttribute('href').slice(1);
      if (id) {
        if (!map.has(id)) map.set(id, []);
        map.get(id).push(a);
      }
    });
    return map;
  }

  function findCurrentTarget(targets, decisionLineAbs) {
    if (targets.length === 0) return null;
    const withPos = targets.map(function (t) {
      const rect = t.el.getBoundingClientRect();
      const absTop = rect.top + window.scrollY;
      return { id: t.id, el: t.el, top: absTop };
    });
    withPos.sort(function (a, b) { return a.top - b.top; });
    let best = null;
    let bestTop = -Infinity;
    for (let i = 0; i < withPos.length; i++) {
      const t = withPos[i];
      if (t.top <= decisionLineAbs && t.top > bestTop) {
        best = t;
        bestTop = t.top;
      }
    }
    if (!best) return withPos[0];
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const atBottom = (window.scrollY / scrollMax) >= 0.94;
    if (atBottom) return withPos[withPos.length - 1];
    return best;
  }

  function setActiveLinks(activeId, linkById) {
    const allLinks = Array.from(document.querySelectorAll('.sitenav a'));
    allLinks.forEach(function (l) { l.classList.remove('active'); });
    const subLists = Array.from(document.querySelectorAll('.sitenav ul.sub'));
    subLists.forEach(function (ul) { ul.classList.remove('is-active-parent'); });
    const subListItems = Array.from(document.querySelectorAll('.sitenav li'));
    subListItems.forEach(function (li) { li.classList.remove('is-active-branch'); });

    if (!activeId) return;

    const active = linkById.get(activeId) || [];
    active.forEach(function (a) { a.classList.add('active'); });

    active.forEach(function (a) {
      let p = a.parentElement;
      while (p && p.tagName !== 'NAV') {
        if (p.tagName === 'LI') p.classList.add('is-active-branch');
        if (p.tagName === 'UL' && p.classList.contains('sub')) p.classList.add('is-active-parent');
        p = p.parentElement;
      }
    });
  }

  onReady(function () {
    const nav = document.getElementById(NAV_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (!nav || !toggle) return;

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.sitenav a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });

    const targets = getScrollSpyTargets();
    const linkById = linkMap();
    if (targets.length === 0) return;

    let ticking = false;
    let lastActiveId = null;

    function update() {
      const viewportAnchor = window.scrollY + Math.round(0.33 * Math.max(400, window.innerHeight || 800));
      const cur = findCurrentTarget(targets, viewportAnchor);
      if (cur && cur.id !== lastActiveId) {
        lastActiveId = cur.id;
        setActiveLinks(cur.id, linkById);
        const activeLink = document.querySelector('.sitenav a.active');
        if (activeLink) {
          const sb = document.querySelector('.sitenav');
          const lr = activeLink.getBoundingClientRect();
          const sbr = sb.getBoundingClientRect();
          if (lr.top < sbr.top + 20 || lr.bottom > sbr.bottom - 20) {
            activeLink.scrollIntoView({ block: 'nearest', behavior: 'auto' });
          }
        }
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') setTimeout(update, 50);
    });
    setTimeout(update, 30);
    update();
  });
})();
