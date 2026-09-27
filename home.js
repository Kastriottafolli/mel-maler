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
      pause.innerHTML = paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6c0 .9 1 1.5 1.8 1L19.5 13c.7-.5.7-1.5 0-2L9.8 4.2C9 3.7 8 4.3 8 5.2z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2"/></svg>';
      pause.setAttribute('aria-label', paused ? 'Bildwechsel fortsetzen' : 'Bildwechsel pausieren');
      show(i);
      paused ? stop() : start();
    });
    if (paused) { pause.setAttribute('aria-pressed', 'true'); pause.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6c0 .9 1 1.5 1.8 1L19.5 13c.7-.5.7-1.5 0-2L9.8 4.2C9 3.7 8 4.3 8 5.2z"/></svg>'; }
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

/* ---------- Vorher/Nachher-Video: eigener Player ---------- */
(() => {
  const frame = document.querySelector('.bv-frame');
  if (!frame) return;
  const video = frame.querySelector('.bv-video');
  const big = frame.querySelector('.bv-big');
  const toggle = frame.querySelector('.bv-toggle');
  const seek = frame.querySelector('.bv-seek');
  const timeNow = frame.querySelector('.bv-time b');
  const timeDur = frame.querySelector('.bv-dur');
  const full = frame.querySelector('.bv-full');
  const rooms = [...document.querySelectorAll('.bv-rooms li')];
  const CUES = [0, 4.6, 9.4, 14.1, 18.6];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6c0 .9 1 1.5 1.8 1L19.5 13c.7-.5.7-1.5 0-2L9.8 4.2C9 3.7 8 4.3 8 5.2z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="4.5" width="4" height="15" rx="1.4"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.4"/></svg>';

  const mmss = s => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  };

  let hideTimer = 0, scrubbing = false;
  const showControls = () => {
    frame.classList.add('is-ui');
    clearTimeout(hideTimer);
    if (!video.paused) hideTimer = setTimeout(() => frame.classList.remove('is-ui'), 2600);
  };
  const play = () => video.play().catch(() => {});
  const pause = () => video.pause();
  const flip = () => (video.paused ? play() : pause());

  video.addEventListener('play', () => {
    frame.classList.add('is-playing');
    toggle.innerHTML = PAUSE;
    toggle.setAttribute('aria-label', 'Pause');
    big.setAttribute('aria-label', 'Pause');
    showControls();
  });
  video.addEventListener('pause', () => {
    frame.classList.remove('is-playing');
    toggle.innerHTML = PLAY;
    toggle.setAttribute('aria-label', 'Abspielen');
    big.setAttribute('aria-label', 'Video abspielen');
    clearTimeout(hideTimer);
    frame.classList.add('is-ui');
  });

  big.addEventListener('click', flip);
  toggle.addEventListener('click', flip);
  video.addEventListener('click', flip);
  frame.addEventListener('pointermove', showControls);
  frame.addEventListener('touchstart', showControls, { passive: true });
  frame.addEventListener('focusin', showControls);

  video.addEventListener('loadedmetadata', () => { timeDur.textContent = mmss(video.duration); });
  video.addEventListener('timeupdate', () => {
    if (!scrubbing && video.duration) seek.value = String(Math.round(video.currentTime / video.duration * 1000));
    timeNow.textContent = mmss(video.currentTime);
    seek.style.setProperty('--p', (video.duration ? video.currentTime / video.duration * 100 : 0) + '%');
    let i = 0;
    while (i + 1 < CUES.length && video.currentTime >= CUES[i + 1]) i++;
    rooms.forEach((li, k) => li.classList.toggle('is-on', k === i));
  });

  const scrub = () => {
    if (!video.duration) return;
    video.currentTime = seek.value / 1000 * video.duration;
    seek.style.setProperty('--p', seek.value / 10 + '%');
  };
  seek.addEventListener('input', () => { scrubbing = true; scrub(); showControls(); });
  seek.addEventListener('change', () => { scrubbing = false; scrub(); });
  ['pointerup', 'touchend', 'mouseup'].forEach(e => seek.addEventListener(e, () => { scrubbing = false; }));

  rooms.forEach((li, k) => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', 'Zu Raum ' + (k + 1) + ' springen: ' + li.textContent.replace(/^\d+/, '').trim());
    const jump = () => { video.currentTime = CUES[k] + 0.05; play(); showControls(); };
    li.addEventListener('click', jump);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); } });
  });

  full.addEventListener('click', () => {
    const doc = document;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      return;
    }
    if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
    else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();   // iPhone
  });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(e => document.addEventListener(e, () => {
    const on = document.fullscreenElement === frame || document.webkitFullscreenElement === frame;
    frame.classList.toggle('is-full', on);
    full.setAttribute('aria-label', on ? 'Vollbild beenden' : 'Vollbild');
  }));

  frame.addEventListener('keydown', e => {
    if (e.target === seek) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); flip(); showControls(); }
    if (e.key === 'ArrowRight') { video.currentTime = Math.min(video.duration, video.currentTime + 5); showControls(); }
    if (e.key === 'ArrowLeft') { video.currentTime = Math.max(0, video.currentTime - 5); showControls(); }
  });

  frame.classList.add('is-ui');

  // Startet stumm, sobald der Abschnitt im Bild ist; wer selbst eingreift, behält die Kontrolle.
  if (!reduce && 'IntersectionObserver' in window) {
    let auto = true;
    [big, toggle, video, seek].forEach(el => el.addEventListener('pointerdown', () => { auto = false; }));
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { if (auto && video.paused) play(); }
        else if (!video.paused) pause();
      });
    }, { threshold: .55 }).observe(frame);
  }
})();
