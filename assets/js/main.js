(() => {
  // smooth wheel scrolling (Lenis), skipped for reduced motion
  let lenis = null;
  if (window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -80 });
    }));
  }

  // header shadow on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile menu
  const burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', false);
  }));

  // reveal on scroll (subtle, staggered)
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach((el, i) => {
    const sib = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    el.style.transitionDelay = Math.min(sib.indexOf(el), 5) * 70 + 'ms';
    io.observe(el);
  });

  // FAQ: one open at a time, first open by default
  const qas = document.querySelectorAll('.qa');
  qas.forEach(qa => qa.querySelector('button').addEventListener('click', () => {
    const wasOpen = qa.classList.contains('open');
    qas.forEach(q => { q.classList.remove('open'); q.querySelector('button').setAttribute('aria-expanded', false); });
    if (!wasOpen) { qa.classList.add('open'); qa.querySelector('button').setAttribute('aria-expanded', true); }
  }));

  // project hover scroll: header to footer
  const setShift = proj => {
    const box = proj.querySelector('.shot'), img = box.querySelector('img');
    const shift = img.offsetHeight - box.offsetHeight;
    if (shift > 0) {
      proj.style.setProperty('--shift', -shift + 'px');
      proj.style.setProperty('--dur', Math.max(6, shift / 170).toFixed(1) + 's');
    }
  };
  document.querySelectorAll('.proj').forEach(p => {
    const img = p.querySelector('img');
    img.complete ? setShift(p) : img.addEventListener('load', () => setShift(p));
  });
  window.addEventListener('resize', () => document.querySelectorAll('.proj').forEach(setShift));
  // touch screens: scroll the preview while the card is in view
  if (matchMedia('(hover: none)').matches) {
    const pio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('auto', e.isIntersecting)), { threshold: .6 });
    document.querySelectorAll('.proj').forEach(p => pio.observe(p));
  }

  // hero avatar intro
  const av = document.getElementById('avatar'), vid = document.getElementById('introVideo'),
        play = document.getElementById('playIntro'), note = document.getElementById('videoNote');
  // Safari cannot show WebM transparency: use the MP4 there
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) { vid.src = vid.dataset.mp4; }
  const stop = () => { vid.pause(); vid.currentTime = 0; av.classList.remove('playing'); play.setAttribute('aria-expanded', false); };
  const start = () => {
    av.classList.add('playing'); play.setAttribute('aria-expanded', true);
    if (matchMedia('(max-width:860px)').matches) av.scrollIntoView({ behavior: 'smooth', block: 'center' });
    vid.play().catch(() => { note.hidden = false; });
  };
  play.addEventListener('click', start);
  document.getElementById('stagePlay').addEventListener('click', start);
  vid.addEventListener('error', () => { note.hidden = false; }, true);
  vid.addEventListener('ended', stop);
  document.getElementById('closeIntro').addEventListener('click', stop);

  // quote form: email via Web3Forms + WhatsApp alert via CallMeBot
  const WEB3FORMS_KEY = '';      // web3forms.com access key (public by design)
  const CALLMEBOT_KEY = '';      // callmebot.com apikey for +923019194202
  const form = document.getElementById('quoteForm'), fnote = document.getElementById('formNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const f = new FormData(form), v = k => (f.get(k) || '').toString().trim();
    if (f.get('botcheck')) return;
    const msg = `New project enquiry
Name: ${v('name')}
Agency: ${v('agency')}
Email: ${v('email')}
WhatsApp: ${v('whatsapp')}
Platform: ${v('platform')}
Pages: ${v('pages')}
Details: ${v('details')}`;
    if (!WEB3FORMS_KEY) { window.open('https://wa.me/923019194202?text=' + encodeURIComponent(msg), '_blank', 'noopener'); return; }
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true; fnote.className = 'form-note'; fnote.textContent = 'Sending...';
    try {
      f.append('access_key', WEB3FORMS_KEY);
      f.append('subject', `New enquiry from ${v('name')} (${v('agency') || 'WebByAbrar site'})`);
      f.append('from_name', 'WebByAbrar Website');
      const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: f, headers: { Accept: 'application/json' } });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      if (CALLMEBOT_KEY) {
        const alert = `New form entry on WebByAbrar from ${v('name')} (${v('email')}). Full details sent to your email.`;
        fetch(`https://api.callmebot.com/whatsapp.php?phone=923019194202&text=${encodeURIComponent(alert)}&apikey=${CALLMEBOT_KEY}`, { mode: 'no-cors' }).catch(() => {});
      }
      form.reset(); fnote.className = 'form-note ok'; fnote.textContent = 'Thank you. Your project details have been sent. We will reply within working hours.';
    } catch (err) {
      fnote.className = 'form-note err'; fnote.textContent = 'Something went wrong. Please message us on WhatsApp instead.';
    } finally { btn.disabled = false; }
  });
})();
