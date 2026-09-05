(function () {
  'use strict';

  const NAV_ID = 'sitenav';
  const TOGGLE_ID = 'nav-toggle';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
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

    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const links = Array.from(document.querySelectorAll('.sitenav a[href^="#"]'));
    const linkById = new Map();
    links.forEach(function (l) {
      const id = l.getAttribute('href').slice(1);
      if (id) linkById.set(id, l);
    });

    if (!('IntersectionObserver' in window) || sections.length === 0) return;

    const io = new IntersectionObserver(function (entries) {
      let best = null;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
      });
      if (!best) return;
      const id = best.target.getAttribute('id');
      links.forEach(function (l) { l.classList.remove('active'); });
      const active = linkById.get(id);
      if (active) active.classList.add('active');
    }, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    sections.forEach(function (s) { io.observe(s); });
  });
})();
