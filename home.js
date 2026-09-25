(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = 'IntersectionObserver' in window;

  /* ---------- Cinematic hero slideshow ---------- */
  const cinema = document.querySelector('.cinema');
  if (cinema) {
    const slides = [...cinema.querySelectorAll('.hs-slide')];
    const dots = [...cinema.querySelectorAll('.hs-dot')];
    const pause = cinema.querySelector('.hs-pause');
    const DUR = 6000;
    let i = 0, timer = null, paused = reduced;

    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => {
        d.classList.toggle('is-active', k === i);
        d.style.setProperty('--dur', paused ? '0ms' : DUR + 'ms');
      });
    };
    const start = () => { if (paused) return; clearInterval(timer); timer = setInterval(() => show(i + 1), DUR); };
    const stop = () => clearInterval(timer);

    dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.go); start(); }));
    pause?.addEventListener('click', () => {
      paused = !paused;
      pause.setAttribute('aria-pressed', String(paused));
      pause.textContent = paused ? '▶' : '❚❚';
      pause.setAttribute('aria-label', paused ? 'Bildwechsel fortsetzen' : 'Bildwechsel pausieren');
      show(i);
      paused ? stop() : start();
    });
    if (paused) { pause.setAttribute('aria-pressed', 'true'); pause.textContent = '▶'; }
    show(0);
    if (io) {
      new IntersectionObserver(e => e[0].isIntersecting ? start() : stop(), { threshold: .2 }).observe(cinema);
    } else start();
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    if (!reduced) {
      let ticking = false;
      const parallax = () => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          cinema.style.setProperty('--py', (y * 0.22).toFixed(1) + 'px');
          cinema.style.setProperty('--fade', Math.max(0, 1 - y / (window.innerHeight * 0.75)).toFixed(3));
        }
        ticking = false;
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
      parallax();
    }
  }

  /* ---------- Scrollytelling ---------- */
  const scrolly = document.querySelector('.scrolly');
  if (scrolly) {
    const steps = [...scrolly.querySelectorAll('.sc-step')];
    const imgs = [...scrolly.querySelectorAll('.sc-img')];
    const bar = scrolly.querySelector('.sc-progress i');
    const go = n => {
      steps.forEach((s, k) => s.classList.toggle('is-active', k === n));
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === n));
      if (bar) bar.style.setProperty('--p', ((n + 1) / steps.length * 100) + '%');
    };
    steps.forEach((s, k) => s.addEventListener('click', () => go(k)));
    go(0);
    if (io && !reduced) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) go(steps.indexOf(en.target)); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(s => obs.observe(s));
    }
  }

  /* ---------- Projekt-Konfigurator ---------- */
  const konf = document.querySelector('.konf-box');
  if (konf) {
    const data = JSON.parse(konf.querySelector('.konf-data').textContent);
    const stage = konf.querySelector('.konf-stage');
    const back = konf.querySelector('.konf-back');
    const count = konf.querySelector('.konf-count');
    const prog = konf.querySelector('.konf-progress i');
    const answers = {};
    let step = 0;

    const icon = d => d ? `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="${d}"/></svg>` : '';

    const render = () => {
      prog.style.setProperty('--step', Math.min(step + 1, 3));
      back.hidden = step === 0;
      if (step < data.steps.length) {
        const s = data.steps[step];
        count.textContent = `Frage ${step + 1} von ${data.steps.length}`;
        stage.innerHTML = `<h3 class="konf-q">${s.q}</h3><div class="konf-opts">${s.opts.map(o =>
          `<button type="button" class="konf-opt" data-v="${o.v}">${icon(o.ico)}<span>${o.t}</span></button>`).join('')}</div>`;
        stage.querySelectorAll('.konf-opt').forEach(b => b.addEventListener('click', () => {
          answers[s.key] = b.dataset.v;
          step++;
          render();
        }));
      } else {
        const r = data.result[answers.was];
        count.textContent = 'Ihr Ergebnis';
        const msg = `Hallo MEL-Team,\n\nich habe Ihren Projekt-Konfigurator genutzt:\n• Vorhaben: ${r.title}\n• Umfang: ${data.size[answers.groesse]}\n• Zeitpunkt: ${data.steps[2].opts.find(o => o.v === answers.wann).t}\n\nBitte melden Sie sich bei mir.`;
        const label = (k, v) => (data.steps.find(s => s.key === k).opts.find(o => o.v === v) || {}).t || '–';
        stage.innerHTML = `<div class="konf-result">
          <div class="konf-main">
            <p class="konf-badge">Das passt zu Ihnen</p>
            <h3>${r.title}</h3>
            <p class="konf-text">${r.text}</p>
            <p class="konf-urgency">${data.urgency[answers.wann]}</p>
            <div class="konf-links">${r.links.map(l => `<a href="${l[0]}">${l[1]} <span aria-hidden="true">↗</span></a>`).join('')}</div>
            <div class="konf-actions">
              <a class="button" href="kontakt.html?leistung=beratung&nachricht=${encodeURIComponent(msg)}#project-form">Anfrage vorbereiten <span aria-hidden="true">↗</span></a>
              <a class="text-link" href="${r.tool[0]}">${r.tool[1]} ↗</a>
            </div>
            <button type="button" class="konf-restart">Von vorn beginnen</button>
          </div>
          <aside class="konf-summary"><h4>Ihre Angaben</h4><dl>
            <div><dt>Vorhaben</dt><dd>${label('was', answers.was)}</dd></div>
            <div><dt>Umfang</dt><dd>${label('groesse', answers.groesse)}</dd></div>
            <div><dt>Zeitpunkt</dt><dd>${label('wann', answers.wann)}</dd></div>
          </dl><p>Diese Angaben übernehmen wir in Ihre Anfrage – Sie ergänzen nur noch Name und E-Mail.</p></aside>
        </div>`;
        stage.querySelector('.konf-restart').addEventListener('click', () => { step = 0; render(); });
      }
      const first = stage.querySelector('button, a');
      if (step > 0 && first) first.focus({ preventScroll: true });
    };
    back.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
    render();
  }

  /* ---------- Desktop sticky action bar ---------- */
  const hero = document.querySelector('.cinema');
  if (hero) {
    const bar = document.createElement('div');
    bar.className = 'jump-bar';
    bar.innerHTML = `<span class="jb-brand">MEL · Wir renovieren</span>
      <nav aria-label="Abschnitte"><a href="#leistungen">Leistungen</a><a href="#konfigurator">Konfigurator</a><a href="#ablauf">Ablauf</a><a href="#einblicke">Projekte</a></nav>
      <span class="jb-cta"><a class="jb-call" href="tel:+4917658135774">0176 581 357 74</a><a class="jb-ask" href="kontakt.html#project-form">Projekt anfragen ↗</a></span>`;
    document.body.append(bar);
    if (io) {
      new IntersectionObserver(e => bar.classList.toggle('is-on', !e[0].isIntersecting), { threshold: 0 }).observe(hero);
    }
    bar.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }));
  }
})();
