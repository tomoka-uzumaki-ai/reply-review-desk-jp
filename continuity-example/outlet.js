/* Preserve a buyer's chosen storefront through this product's free sample. */
'use strict';
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'itch') return;
  const gumroad = 'https://jikkenlog.gumroad.com/l/continuity-desk';
  const itch = 'https://tiny-deduction-lab.itch.io/continuity-desk';
  const ownPages = /\/continuity-example\/(?:index\.html|two-shot-brief\.html)?$/;
  for (const a of document.querySelectorAll('a[href]')) {
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#')) continue;
    const u = new URL(raw, location.href);
    if (u.href === gumroad) {
      a.href = itch;
      a.textContent = a.textContent.replace('on Gumroad', 'on itch.io');
    } else if (u.href === itch) {
      a.href = gumroad;
      a.textContent = a.textContent.replace('itch.io', 'Gumroad');
    } else if (u.origin === location.origin && ownPages.test(u.pathname)) {
      u.searchParams.set('from', 'itch');
      a.href = u.pathname + u.search + u.hash;
    }
  }
  for (const label of document.querySelectorAll('[data-alternative-store]')) {
    label.textContent = 'Gumroad';
  }
})();
