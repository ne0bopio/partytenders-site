// PartyTenders — menu, header worlds, parallax and quote request.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- ticker ----
  const star = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 0l2.4 6.3L19 5l-4.6 5L19 15l-6.6-1.3L10 20l-2.4-6.3L1 15l4.6-5L1 5l6.6 1.3z"/></svg>';
  const words = ['Bartenders', 'Servers', 'Grill cooks', 'Catering', 'Rentals', 'Mixer packages', 'The Morning Joe'];
  const run = words.map((w) => `<span>${w}</span>${star}`).join('');
  document.getElementById('ticker').innerHTML = run + run + run + run;

  // ---- laurels: Best of The Bash ----
  const leaf = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="9" transform="rotate(${r} ${x} ${y})" fill="currentColor"/>`;
  function laurel(year) {
    let l = '';
    for (let i = 0; i < 7; i++) {
      const a = (200 - i * 19) * Math.PI / 180; const x = 60 + Math.cos(a) * 42, y = 62 - Math.sin(a) * 42;
      const r = (-(200 - i * 19)) + 90 + 180;
      l += leaf(x, y, r) + leaf(120 - x, y, -r);
    }
    return `<svg viewBox="0 0 120 120" role="img" aria-label="Best of The Bash ${year}">${l}<text x="60" y="58" text-anchor="middle" font-size="13" style="font-size:13px;letter-spacing:.08em">BEST OF</text><text x="60" y="84" text-anchor="middle">${year}</text></svg>`;
  }
  document.getElementById('laurels').innerHTML = ['2019', '2020', '2021', '2023'].map(laurel).join('');

  // ---- menu ----
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');
  function setMenu(open) {
    menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    hdr.classList.toggle('menu-open', open);
    if (open) hdr.dataset.w = 'night';
  }
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // ---- header takes the colour of the world under it ----
  const hdr = document.getElementById('hdr');
  const worlds = [...document.querySelectorAll('[data-world]')];
  const lockup = document.querySelector('.lockup');
  function headerWorld() {
    if (!menu.hidden) return;
    const y = hdr.offsetHeight / 2;
    const under = worlds.find((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    hdr.dataset.w = under ? under.dataset.world : 'night';
    const past = lockup.getBoundingClientRect().bottom < hdr.offsetHeight;
    hdr.classList.toggle('show-mark', past);
    hdr.classList.toggle('solid', past);
  }

  // ---- parallax + sticker spin (scroll position only, so ?s= screenshots are deterministic) ----
  const floats = [...document.querySelectorAll('[data-speed]')];
  floats.forEach((el) => { if (el.dataset.rot) el.style.setProperty('--rot', el.dataset.rot); });
  const spins = [...document.querySelectorAll('[data-spin]')];
  function frame() {
    headerWorld();
    if (reduce) return;
    const vh = innerHeight;
    for (const el of floats) {
      const s = el.closest('section').getBoundingClientRect();
      const off = s.top + s.height / 2 - vh / 2;
      el.style.setProperty('--py', `${(-off * +el.dataset.speed).toFixed(1)}px`);
    }
    for (const el of spins) el.style.setProperty('--spin', (scrollY * 0.05 * +el.dataset.spin - 8 * +el.dataset.spin).toFixed(2));
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { frame(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  // ---- quote form ----
  document.querySelectorAll('.chips').forEach((g) => {
    g.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    g.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const on = b.getAttribute('aria-pressed') !== 'true';
      if (g.hasAttribute('data-single')) g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', on);
    });
  });
  document.querySelectorAll('[data-need]').forEach((a) => a.addEventListener('click', () => {
    const need = a.dataset.need;
    document.querySelectorAll('[data-name="need"] button').forEach((b) => { if (b.textContent === need || (need === 'Servers' && b.textContent === 'Servers')) b.setAttribute('aria-pressed', 'true'); });
  }));
  document.getElementById('qform').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const selected = (name) => [...form.querySelectorAll(`[data-name="${name}"] button[aria-pressed="true"]`)].map((b) => b.textContent.trim());
    const value = (name) => form.elements.namedItem(name)?.value.trim() || '';
    const details = [
      'Hi Danielle, I would like a PartyTenders quote.',
      selected('party').length ? `Event: ${selected('party').join(', ')}` : '',
      selected('need').length ? `Services: ${selected('need').join(', ')}` : '',
      value('guests') ? `Guests: ${value('guests')}` : '',
      value('date') ? `Date: ${value('date')}` : '',
      value('where') ? `Location: ${value('where')}` : '',
      value('name') ? `Name: ${value('name')}` : '',
      value('contact') ? `Contact: ${value('contact')}` : ''
    ].filter(Boolean).join('\n');
    window.location.href = `sms:+14843582578?&body=${encodeURIComponent(details)}`;
  });


})();
