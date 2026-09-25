(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = (n, d = 0) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const field = (root, name) => {
    const checked = root.querySelector(`[name="${name}"]:checked`);
    const el = root.querySelector(`[name="${name}"]`);
    if (!el) return null;
    if (el.type === 'checkbox' && root.querySelectorAll(`[name="${name}"]`).length === 1) return el.checked;
    if (el.type === 'radio') return checked ? checked.value : null;
    if (el.type === 'checkbox') return [...root.querySelectorAll(`[name="${name}"]:checked`)].map(c => c.value);
    return el.value;
  };
  const num = (root, name) => parseFloat(String(field(root, name)).replace(',', '.')) || 0;
  const label = (root, name) => {
    const c = root.querySelector(`[name="${name}"]:checked`);
    return c ? (c.dataset.label || c.closest('label').textContent.trim()) : '';
  };

  function tween(el, to, decimals = 0) {
    const from = parseFloat(el.dataset.value || '0');
    el.dataset.value = to;
    if (reduceMotion || !isFinite(from) || from === to) { el.textContent = fmt(to, decimals); return; }
    const start = performance.now(), dur = 650;
    const step = now => {
      const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e, decimals);
      if (p < 1 && el.dataset.value == to) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const out = (root, key, value, decimals = 0) => {
    root.querySelectorAll(`[data-out="${key}"]`).forEach(el => {
      if (typeof value === 'number') tween(el, value, decimals); else el.textContent = value;
    });
  };

  const svg = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  };
  const stage = (root, viewBox, labelText) => {
    const holder = root.querySelector('.tool-visual');
    holder.textContent = '';
    const s = svg('svg', { viewBox, role: 'img', 'aria-label': labelText });
    holder.appendChild(s);
    return s;
  };
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => clamp(Math.round(v * (1 + amt)), 0, 255));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  };

  function setSummary(root, lines) {
    const link = root.querySelector('.tool-send');
    if (!link) return;
    const service = root.dataset.service;
    const text = 'Hallo MEL-Team,\n\nich habe Ihren Online-Rechner genutzt:\n' + lines.map(l => '• ' + l).join('\n') + '\n\nIch freue mich über eine Rückmeldung.';
    link.href = `kontakt.html?leistung=${encodeURIComponent(service)}&nachricht=${encodeURIComponent(text)}#project-form`;
  }

  const tools = {};

  /* ---------- Fassade: Heizkosten-Sparrechner ---------- */
  const CARRIERS = {
    gas: { eta: 0.9, price: 0.12, co2: 0.201, unit: '€ je kWh Gas' },
    oil: { eta: 0.85, price: 0.11, co2: 0.266, unit: '€ je kWh Heizöl' },
    district: { eta: 0.98, price: 0.14, co2: 0.18, unit: '€ je kWh Fernwärme' },
    hp: { eta: 3, price: 0.3, co2: 0.38, unit: '€ je kWh Strom' }
  };
  tools.fassade = root => {
    const priceInput = root.querySelector('[name="price"]');
    const priceUnit = root.querySelector('[data-out="priceUnit"]');
    priceInput.addEventListener('input', () => { priceInput.dataset.touched = '1'; });
    root.addEventListener('change', e => {
      if (e.target.name === 'carrier') { priceInput.dataset.touched = ''; }
    });
    const s = stage(root, '0 0 360 250', 'Haus mit Wärmeverlusten über die Außenwand');
    svg('path', { d: 'M20 222H340', class: 'fx-ground' }, s);
    const ins = svg('rect', { x: 88, y: 98, width: 184, height: 124, rx: 3, class: 'fx-ins' }, s);
    svg('rect', { x: 96, y: 104, width: 168, height: 118, class: 'fx-wall' }, s);
    svg('path', { d: 'M78 108L180 36L282 108Z', class: 'fx-roof' }, s);
    [[116, 128], [206, 128]].forEach(([x, y]) => svg('rect', { x, y, width: 38, height: 34, class: 'fx-window' }, s));
    svg('rect', { x: 164, y: 172, width: 32, height: 50, class: 'fx-door' }, s);
    const heat = svg('g', { class: 'fx-heat' }, s);
    const arrows = [
      [88, 125, -1], [88, 160, -1], [88, 195, -1],
      [272, 125, 1], [272, 160, 1], [272, 195, 1]
    ].map(([x, y, dir], i) => {
      const g = svg('g', { class: 'fx-arrow', style: `--i:${i}` }, heat);
      svg('path', { d: `M${x} ${y}c${dir * 10} -6 ${dir * 16} 6 ${dir * 28} 0`, class: 'fx-wave' }, g);
      svg('path', { d: `M${x + dir * 28} ${y}l${-dir * 7} -5M${x + dir * 28} ${y}l${-dir * 7} 5`, class: 'fx-wave' }, g);
      return g;
    });
    const uText = svg('text', { x: 180, y: 244, class: 'fx-label', 'text-anchor': 'middle' }, s);
    const barNow = root.querySelector('.fx-bar-now'), barNew = root.querySelector('.fx-bar-new');

    const update = () => {
      const carrier = field(root, 'carrier') || 'gas', c = CARRIERS[carrier];
      if (!priceInput.dataset.touched) priceInput.value = String(c.price).replace('.', ',');
      if (priceUnit) priceUnit.textContent = c.unit;
      const price = num(root, 'price') || c.price;
      const A = num(root, 'area'), U0 = num(root, 'year'), d = num(root, 'insul') / 100;
      const U1 = d > 0 ? 1 / (1 / U0 + d / 0.035) : U0;
      const q0 = U0 * A * 66, q1 = U1 * A * 66;
      const e0 = q0 / c.eta, e1 = q1 / c.eta, de = e0 - e1;
      const save = de * price, co2 = de * c.co2 / 1000, pct = (1 - U1 / U0) * 100;
      out(root, 'save', Math.round(save / 10) * 10);
      out(root, 'save20', Math.round(save * 20 / 100) * 100);
      out(root, 'kwh', Math.round(de / 10) * 10);
      out(root, 'co2', co2, 1);
      out(root, 'pct', Math.round(pct));
      out(root, 'u0', U0, 2); out(root, 'u1', U1, 2);
      out(root, 'cost0', Math.round(e0 * price / 10) * 10);
      out(root, 'cost1', Math.round(e1 * price / 10) * 10);
      if (barNow) barNow.style.setProperty('--w', '100%');
      if (barNew) barNew.style.setProperty('--w', Math.max(2, 100 * U1 / U0) + '%');
      const strength = clamp(U1 / 1.5, 0.08, 1);
      arrows.forEach(a => { a.style.opacity = strength; a.style.transform = `scale(${0.55 + strength * 0.6})`; });
      ins.setAttribute('x', 96 - d * 60); ins.setAttribute('width', 168 + d * 120);
      ins.setAttribute('y', 104 - d * 30); ins.setAttribute('height', 118 + d * 30);
      ins.style.opacity = d > 0 ? 1 : 0;
      uText.textContent = `U-Wert Wand: ${fmt(U0, 2)} → ${fmt(U1, 2)} W/(m²K)`;
      setSummary(root, [
        `Außenwandfläche: ca. ${fmt(A)} m²`,
        `Baualtersklasse: ${root.querySelector('[name="year"]').selectedOptions[0].textContent}`,
        `Gewünschte Dämmstärke: ${fmt(d * 100)} cm`,
        `Heizung: ${label(root, 'carrier')}`,
        `Geschätzte Ersparnis laut Rechner: ca. ${fmt(Math.round(save / 10) * 10)} € pro Jahr`
      ]);
    };
    return update;
  };

  /* ---------- Malerarbeiten: Farbbedarf + 3D-Raum ---------- */
  tools.maler = root => {
    const holder = root.querySelector('.tool-visual');
    const update = () => {
      const L = num(root, 'len'), W = num(root, 'wid'), H = num(root, 'hgt');
      const win = num(root, 'win'), door = num(root, 'door'), coats = num(root, 'coats') || 2;
      const ceiling = field(root, 'ceiling');
      const color = field(root, 'color') || '#d8c8b5';
      const walls = Math.max(0, 2 * (L + W) * H - win * 1.5 - door * 2);
      const ceil = ceiling ? L * W : 0;
      const area = walls + ceil;
      const liters = area * coats / 7 * 1.1;
      let rest = Math.ceil(liters * 2) / 2, n10 = Math.floor(rest / 10); rest -= n10 * 10;
      let n5 = 0, n25 = 0;
      if (rest > 5) n10++; else if (rest > 2.5) n5 = 1; else if (rest > 0) n25 = 1;
      const buckets = [n10 && `${n10} × 10 L`, n5 && `${n5} × 5 L`, n25 && `${n25} × 2,5 L`].filter(Boolean).join(' + ') || '–';
      out(root, 'walls', walls, 1); out(root, 'ceil', ceil, 1); out(root, 'area', area, 1);
      out(root, 'liters', liters, 1); out(root, 'buckets', buckets);
      out(root, 'colorName', label(root, 'color'));

      const s = 22;
      const P = (x, y, z) => [(x - y) * 0.866 * s, (x + y) * 0.5 * s - z * s];
      const pts = (...list) => list.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ');
      const all = [P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(0, W, 0), P(0, 0, H), P(L, 0, H), P(0, W, H)];
      const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
      const pad = 16, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
      holder.textContent = '';
      const g = svg('svg', { viewBox: `${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`, role: 'img', 'aria-label': `Raummodell ${fmt(L, 1)} × ${fmt(W, 1)} m, Höhe ${fmt(H, 2)} m` });
      holder.appendChild(g);
      svg('polygon', { points: pts([0, 0, 0], [L, 0, 0], [L, W, 0], [0, W, 0]), class: 'room-floor' }, g);
      for (let i = 1; i < W / 0.5; i++) svg('polyline', { points: pts([0, i * 0.5, 0], [L, i * 0.5, 0]), class: 'room-plank' }, g);
      svg('polygon', { points: pts([0, 0, 0], [L, 0, 0], [L, 0, H], [0, 0, H]), fill: color, class: 'room-wall' }, g);
      svg('polygon', { points: pts([0, 0, 0], [0, W, 0], [0, W, H], [0, 0, H]), fill: shade(color, -0.12), class: 'room-wall' }, g);
      for (let i = 0; i < win; i++) {
        const cx = L * (i + 1) / (win + 1), w = Math.min(1.1, L / (win + 1) * 0.7), z0 = Math.min(0.9, H * 0.35), z1 = Math.min(2.2, H - 0.25);
        svg('polygon', { points: pts([cx - w / 2, 0, z0], [cx + w / 2, 0, z0], [cx + w / 2, 0, z1], [cx - w / 2, 0, z1]), class: 'room-window' }, g);
      }
      for (let i = 0; i < door; i++) {
        const cy = W * (i + 1) / (door + 1), w = Math.min(0.9, W / (door + 1) * 0.7);
        svg('polygon', { points: pts([0, cy - w / 2, 0], [0, cy + w / 2, 0], [0, cy + w / 2, Math.min(2.05, H - 0.1)], [0, cy - w / 2, Math.min(2.05, H - 0.1)]), class: 'room-door' }, g);
      }
      svg('polyline', { points: pts([0, W, H], [0, 0, H], [L, 0, H]), class: 'room-edge' }, g);
      setSummary(root, [
        `Raum: ca. ${fmt(L, 1)} × ${fmt(W, 1)} m, Höhe ${fmt(H, 2)} m`,
        `Zu streichende Fläche: ca. ${fmt(area, 1)} m² (${ceiling ? 'mit' : 'ohne'} Decke, ${coats} Anstrich${coats > 1 ? 'e' : ''})`,
        `Farbwunsch: ${label(root, 'color')}`
      ]);
    };
    return update;
  };

  /* ---------- Tapezierarbeiten: Rollenrechner ---------- */
  tools.tapete = root => {
    const update = () => {
      const width = num(root, 'width'), H = num(root, 'hgt'), rollW = num(root, 'roll');
      const rapport = num(root, 'rapport') / 100, openings = num(root, 'openings');
      const reserve = field(root, 'reserve');
      const strip = H + rapport + 0.1, per = Math.floor(10.05 / strip);
      const net = Math.max(0, width - openings * 0.5);
      const strips = Math.ceil(net / rollW - 1e-9);
      const rolls = per > 0 ? Math.ceil(strips / per) + (reserve ? 1 : 0) : 0;
      out(root, 'strips', strips); out(root, 'per', per); out(root, 'rolls', rolls); out(root, 'strip', strip, 2);
      root.querySelector('.tool-warning').hidden = per > 0;

      const maxShow = 36, shown = Math.min(strips, maxShow);
      const sw = 22, gap = 1, wallW = Math.max(shown, 6) * (sw + gap) + 20, wallH = 150;
      const s = stage(root, `0 0 ${wallW} ${wallH + 46}`, `Wand mit ${strips} Tapetenbahnen aus ${rolls} Rollen`);
      svg('rect', { x: 0, y: 10, width: wallW, height: wallH, class: 'wp-wall', rx: 6 }, s);
      const tones = ['#c9b79c', '#b5c2b4', '#d2b4a0', '#b8c1c9', '#cfc59f', '#c4b1c1'];
      for (let i = 0; i < shown; i++) {
        const roll = per > 0 ? Math.floor(i / per) : 0;
        const g = svg('g', { class: 'wp-strip', style: `--i:${i}` }, s);
        svg('rect', { x: 10 + i * (sw + gap), y: 18, width: sw, height: wallH - 16, fill: tones[roll % tones.length] }, g);
        for (let k = 0; k < 6; k++) svg('circle', { cx: 10 + i * (sw + gap) + sw / 2, cy: 30 + k * 22 + (roll % 2) * 11, r: 3.2, class: 'wp-dot' }, g);
      }
      if (strips > maxShow) svg('text', { x: wallW - 14, y: wallH / 2 + 14, class: 'wp-more', 'text-anchor': 'end' }, s).textContent = `+${strips - maxShow}`;
      const legend = svg('g', {}, s);
      for (let r = 0; r < Math.min(rolls - (reserve ? 1 : 0), 6); r++) {
        svg('rect', { x: 10 + r * 64, y: wallH + 24, width: 12, height: 12, rx: 3, fill: tones[r % tones.length] }, legend);
        svg('text', { x: 28 + r * 64, y: wallH + 34, class: 'wp-legend' }, legend).textContent = `Rolle ${r + 1}`;
      }
      setSummary(root, [
        `Wandbreite gesamt: ca. ${fmt(width, 1)} m, Raumhöhe ${fmt(H, 2)} m`,
        `Rollenformat: ${label(root, 'roll')}, Rapport: ${label(root, 'rapport')}`,
        `Rechner-Ergebnis: ${strips} Bahnen, ca. ${rolls} Rollen${reserve ? ' (inkl. 1 Reserve)' : ''}`
      ]);
    };
    return update;
  };

  /* ---------- Parkett & Boden: Verlegerechner ---------- */
  tools.boden = root => {
    const update = () => {
      const L = num(root, 'len'), W = num(root, 'wid'), pack = num(root, 'pack') || 2;
      const doors = num(root, 'doors'), pattern = field(root, 'pattern') || 'straight';
      const waste = { straight: 0.07, diagonal: 0.12, herring: 0.15 }[pattern];
      const area = L * W, need = area * (1 + waste), packs = Math.ceil(need / pack);
      const skirting = Math.max(0, 2 * (L + W) - doors * 0.9) * 1.05, pieces = Math.ceil(skirting / 2.4);
      out(root, 'area', area, 1); out(root, 'need', need, 1); out(root, 'packs', packs);
      out(root, 'waste', Math.round(waste * 100)); out(root, 'skirting', skirting, 1); out(root, 'pieces', pieces);

      const k = 240 / Math.max(L, W), w = L * k, h = W * k;
      const s = stage(root, `-10 -10 ${w + 20} ${h + 44}`, `Grundriss ${fmt(L, 1)} × ${fmt(W, 1)} m mit Verlegemuster`);
      const defs = svg('defs', {}, s);
      const id = 'p' + Math.random().toString(36).slice(2, 7);
      const unit = Math.max(6, k * 0.2);
      let pat;
      if (pattern === 'herring') {
        pat = svg('pattern', { id, width: unit * 4, height: unit * 2, patternUnits: 'userSpaceOnUse' }, defs);
        svg('rect', { width: unit * 4, height: unit * 2, fill: '#c89e6f' }, pat);
        svg('path', { d: `M0 ${unit * 2}L${unit * 2} 0L${unit * 4} ${unit * 2}M0 ${unit}L${unit} 0M${unit * 3} 0L${unit * 4} ${unit}M${unit} ${unit * 2}L${unit * 2} ${unit}L${unit * 3} ${unit * 2}`, class: 'fl-line' }, pat);
      } else {
        const len = unit * 6, bw = unit;
        pat = svg('pattern', { id, width: len, height: bw * 2, patternUnits: 'userSpaceOnUse', patternTransform: pattern === 'diagonal' ? 'rotate(45)' : '' }, defs);
        svg('rect', { width: len, height: bw * 2, fill: '#c89e6f' }, pat);
        svg('rect', { x: 0, y: 0, width: len, height: bw, fill: '#cfa678', class: 'fl-board' }, pat);
        svg('rect', { x: -len / 2, y: bw, width: len, height: bw, fill: '#c2966a', class: 'fl-board' }, pat);
        svg('rect', { x: len / 2, y: bw, width: len, height: bw, fill: '#c2966a', class: 'fl-board' }, pat);
      }
      svg('rect', { width: w, height: h, fill: `url(#${id})`, class: 'fl-room', rx: 4 }, s);
      svg('rect', { width: w, height: h, class: 'fl-frame', rx: 4 }, s);
      svg('text', { x: w / 2, y: h + 22, 'text-anchor': 'middle', class: 'fl-dim' }, s).textContent = `${fmt(L, 2)} m`;
      svg('text', { x: w + 4, y: h / 2, class: 'fl-dim', transform: `rotate(90 ${w + 4} ${h / 2})`, 'text-anchor': 'middle' }, s).textContent = `${fmt(W, 2)} m`;
      setSummary(root, [
        `Raum: ca. ${fmt(L, 2)} × ${fmt(W, 2)} m (${fmt(area, 1)} m²)`,
        `Verlegeart: ${label(root, 'pattern')}`,
        `Rechner-Ergebnis: ca. ${fmt(need, 1)} m² Material inkl. Verschnitt, ${fmt(skirting, 1)} m Sockelleiste`
      ]);
    };
    return update;
  };

  /* ---------- Bodenbeschichtung: Planer mit Zeitstrahl ---------- */
  tools.beschichtung = root => {
    const preview = root.querySelector('.coat-floor');
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const flakes = svg('svg', { viewBox: '0 0 400 220', class: 'coat-flakes', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
    const flakeColors = ['#f4f2ec', '#2f3336', '#8d8f8a', '#c9c1b2'];
    for (let i = 0; i < 520; i++) svg('rect', { x: rnd() * 400, y: rnd() * 220, width: 1.2 + rnd() * 3, height: 1 + rnd() * 2.2, fill: flakeColors[i % 4] }, flakes);
    preview.appendChild(flakes);
    const update = () => {
      const area = num(root, 'area'), use = field(root, 'use') || 'keller', finish = field(root, 'finish') || 'glatt';
      const color = field(root, 'color') || '#a8a69d';
      const layers = use === 'keller' ? 1 : 2;
      preview.style.setProperty('--coat', color);
      preview.dataset.finish = finish;
      preview.classList.remove('is-shining'); void preview.offsetWidth; preview.classList.add('is-shining');
      const days = [
        ['Untergrund prüfen, schleifen & absaugen', 1, 1],
        ['Grundierung', 1, 1],
        ...Array.from({ length: layers }, (_, i) => [`${i + 1}. Beschichtung${finish === 'chips' && i === layers - 1 ? ' mit Farbchips' : ''}${finish === 'rutsch' && i === layers - 1 ? ' mit Einstreuung' : ''}`, 2 + i, 1]),
        ...(finish === 'chips' || finish === 'rutsch' ? [['Versiegelung', 2 + layers, 1]] : [])
      ];
      const last = days[days.length - 1][1];
      const walk = last + 1, full = last + 7;
      const tl = root.querySelector('.coat-timeline');
      tl.textContent = '';
      const total = full;
      days.concat([['Wieder begehbar (Richtwert)', walk, 0], ['Voll belastbar (Richtwert)', full, 0]]).forEach(([name, day, len], i) => {
        const row = document.createElement('div');
        row.className = 'coat-row' + (len ? '' : ' is-milestone');
        row.style.setProperty('--i', i);
        row.style.setProperty('--start', ((day - 1) / total * 100) + '%');
        row.style.setProperty('--len', (len ? len / total * 100 : 0) + '%');
        row.innerHTML = `<span class="coat-name"></span><span class="coat-track"><i></i></span><span class="coat-day">Tag ${day}</span>`;
        row.querySelector('.coat-name').textContent = name;
        tl.appendChild(row);
      });
      out(root, 'area', area); out(root, 'layers', layers); out(root, 'walk', walk); out(root, 'full', full);
      out(root, 'colorName', label(root, 'color'));
      setSummary(root, [
        `Fläche: ca. ${fmt(area)} m²`,
        `Nutzung: ${label(root, 'use')}, Oberfläche: ${label(root, 'finish')}`,
        `Farbwunsch: ${label(root, 'color')}`
      ]);
    };
    return update;
  };

  /* ---------- Trockenbau: Ständerwand-Baukasten ---------- */
  tools.trockenbau = root => {
    const update = () => {
      const L = num(root, 'len'), H = num(root, 'hgt'), layers = num(root, 'layers') || 1;
      const cw = num(root, 'cw') || 75, insul = field(root, 'insul'), door = field(root, 'door');
      const opening = door ? 0.9 * 2.1 : 0;
      const area = Math.max(0, L * H - opening);
      const boards = Math.ceil(area * 2 * layers / 3.125 * 1.1);
      const studs = Math.floor(L / 0.625) + 1 + (door ? 2 : 0);
      const uw = Math.max(0, 2 * L - (door ? 0.9 : 0));
      const thick = cw + 2 * layers * 12.5;
      out(root, 'area', area, 1); out(root, 'boards', boards); out(root, 'studs', studs);
      out(root, 'uw', uw, 1); out(root, 'insul', insul ? area : 0, 1); out(root, 'thick', thick, 0);

      const k = 300 / Math.max(L, 3), w = L * k, h = H * k;
      const s = stage(root, `-12 -12 ${w + 24} ${h + 48}`, `Ständerwand ${fmt(L, 2)} m lang, ${fmt(H, 2)} m hoch`);
      svg('rect', { x: 0, y: 0, width: w, height: h, class: 'dw-bg' }, s);
      const n = Math.floor(L / 0.625);
      const doorX = L * 0.3 * k;
      if (insul) {
        for (let i = 0; i < n + 1; i++) {
          const x0 = i * 0.625 * k, x1 = Math.min(w, (i + 1) * 0.625 * k);
          if (x1 - x0 < 2) continue;
          svg('rect', { x: x0 + 3, y: 6, width: x1 - x0 - 6, height: h - 12, class: 'dw-insul', style: `--i:${i}` }, s);
        }
      }
      for (let i = 0; i <= n; i++) svg('rect', { x: i * 0.625 * k - 3, y: 0, width: 6, height: h, class: 'dw-stud', style: `--i:${i}` }, s);
      if (L % 0.625 > 0.01) svg('rect', { x: w - 3, y: 0, width: 6, height: h, class: 'dw-stud', style: `--i:${n + 1}` }, s);
      svg('rect', { x: -6, y: -6, width: w + 12, height: 8, class: 'dw-track' }, s);
      svg('rect', { x: -6, y: h - 2, width: w + 12, height: 8, class: 'dw-track' }, s);
      const bw = 1.25 * k, startX = w * 0.55;
      for (let x = startX, i = 0; x < w; x += bw, i++) {
        svg('rect', { x, y: 0, width: Math.min(bw, w - x), height: h, class: 'dw-board', style: `--i:${i}` }, s);
      }
      if (door) {
        const dw = 0.9 * k, dh = Math.min(2.1, H - 0.05) * k;
        svg('rect', { x: doorX, y: h - dh, width: dw, height: dh, class: 'dw-door' }, s);
        svg('rect', { x: doorX - 4, y: h - dh - 4, width: dw + 8, height: 6, class: 'dw-track' }, s);
      }
      svg('text', { x: w / 2, y: h + 30, 'text-anchor': 'middle', class: 'fl-dim' }, s).textContent = `${fmt(L, 2)} m · Achsabstand 62,5 cm`;
      setSummary(root, [
        `Wand: ca. ${fmt(L, 2)} m lang, ${fmt(H, 2)} m hoch${door ? ', mit Türöffnung' : ''}`,
        `Aufbau: CW ${cw}, ${layers}-lagig beplankt${insul ? ', mit Dämmung' : ''} (ca. ${fmt(thick)} mm)`,
        `Rechner-Richtwert: ${boards} Platten, ${studs} CW-Profile`
      ]);
    };
    return update;
  };

  /* ---------- Lackierarbeiten: Lack-Planer ---------- */
  const OBJECTS = {
    tuer: '<rect x="70" y="14" width="120" height="206" rx="3" class="lk-obj"/><rect x="86" y="32" width="88" height="70" rx="2" class="lk-inset"/><rect x="86" y="118" width="88" height="86" rx="2" class="lk-inset"/><circle cx="174" cy="118" r="5" class="lk-knob"/>',
    fenster: '<rect x="40" y="24" width="180" height="176" rx="3" class="lk-obj"/><rect x="56" y="40" width="68" height="144" class="lk-glass"/><rect x="136" y="40" width="68" height="144" class="lk-glass"/><rect x="118" y="108" width="6" height="22" rx="2" class="lk-knob"/>',
    heizkoerper: '<rect x="30" y="70" width="200" height="120" rx="8" class="lk-obj"/>' + Array.from({ length: 9 }, (_, i) => `<rect x="${42 + i * 21}" y="80" width="12" height="100" rx="6" class="lk-inset"/>`).join('') + '<rect x="40" y="190" width="10" height="24" class="lk-obj"/><rect x="210" y="190" width="10" height="24" class="lk-obj"/>',
    moebel: '<rect x="44" y="40" width="172" height="160" rx="4" class="lk-obj"/><rect x="58" y="54" width="144" height="40" rx="2" class="lk-inset"/><rect x="58" y="102" width="144" height="40" rx="2" class="lk-inset"/><rect x="58" y="150" width="144" height="40" rx="2" class="lk-inset"/><rect x="118" y="70" width="24" height="6" rx="3" class="lk-knob"/><rect x="118" y="118" width="24" height="6" rx="3" class="lk-knob"/><rect x="118" y="166" width="24" height="6" rx="3" class="lk-knob"/><rect x="54" y="200" width="10" height="16" class="lk-obj"/><rect x="196" y="200" width="10" height="16" class="lk-obj"/>',
    metall: '<rect x="20" y="40" width="220" height="10" rx="5" class="lk-obj"/><rect x="20" y="196" width="220" height="8" class="lk-obj"/>' + Array.from({ length: 11 }, (_, i) => `<rect x="${28 + i * 20}" y="50" width="6" height="146" class="lk-obj"/>`).join(''),
    holzaussen: '<rect x="40" y="20" width="84" height="196" rx="3" class="lk-obj"/><rect x="136" y="20" width="84" height="196" rx="3" class="lk-obj"/>' + Array.from({ length: 12 }, (_, i) => `<rect x="50" y="${32 + i * 15}" width="64" height="8" rx="2" class="lk-inset"/><rect x="146" y="${32 + i * 15}" width="64" height="8" rx="2" class="lk-inset"/>`).join('')
  };
  const GLOSS = {
    matt: ['Matt', 'Wirkt ruhig, spiegelt kaum und lässt kleine Unebenheiten weniger auffallen.'],
    seidenmatt: ['Seidenmatt', 'Der Allrounder: dezenter Glanz, pflegeleicht und vielseitig einsetzbar.'],
    glaenzend: ['Glänzend', 'Sehr strapazierfähig und leicht zu reinigen – zeigt Unebenheiten im Untergrund aber deutlicher.']
  };
  tools.lack = root => {
    const holder = root.querySelector('.tool-visual');
    const update = () => {
      const obj = field(root, 'obj') || 'tuer', cond = field(root, 'cond') || 'intakt', gloss = field(root, 'gloss') || 'seidenmatt';
      const color = field(root, 'color') || '#f6f4ef', count = num(root, 'count');
      holder.innerHTML = `<svg viewBox="0 0 260 234" role="img" aria-label="Vorschau: ${label(root, 'obj')} in ${label(root, 'color')}, ${GLOSS[gloss][0]}"><defs><linearGradient id="lkSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="260" height="234" rx="12" fill="#e4dccd"/><rect y="214" width="260" height="20" fill="#cdbfa9"/><g class="lk-paint" style="--paint:${color};--paint-dark:${shade(color, -0.14)}">${OBJECTS[obj]}</g><rect x="0" y="0" width="260" height="234" fill="url(#lkSheen)" class="lk-sheen" data-gloss="${gloss}"/></svg>`;
      const outside = obj === 'holzaussen' || obj === 'metall';
      const steps = ['Umgebung abdecken, Beschläge abkleben oder demontieren'];
      if (cond === 'blaettert') steps.push('Lose und abblätternde Altbeschichtung entfernen', 'Kanten beischleifen und Fehlstellen ausbessern');
      if (cond === 'intakt') steps.push('Reinigen, entfetten und die Oberfläche anschleifen');
      if (cond === 'roh') steps.push(obj === 'metall' || obj === 'heizkoerper' ? 'Rost und Verschmutzungen entfernen, entfetten' : 'Holz schleifen und entstauben');
      if (obj === 'metall' || (obj === 'heizkoerper' && cond !== 'intakt')) steps.push('Rostschutz-Grundierung auftragen');
      else if (obj === 'holzaussen' && cond !== 'intakt') steps.push('Holz grundieren – außen mit geeignetem Holzschutz');
      else if (cond !== 'intakt') steps.push('Grundierung bzw. Vorlack auftragen');
      else steps.push('Bei Bedarf Haftgrund passend zur Altbeschichtung');
      steps.push('Zwischenschliff für eine glatte Oberfläche');
      steps.push(obj === 'heizkoerper' ? `Hitzebeständigen Heizkörperlack (${GLOSS[gloss][0].toLowerCase()}) auftragen` : `Schlusslack ${GLOSS[gloss][0].toLowerCase()}${outside ? ', witterungsbeständig' : ''} – je nach Untergrund 1–2 Anstriche`);
      const list = root.querySelector('.lk-steps');
      list.textContent = '';
      steps.forEach((t, i) => { const li = document.createElement('li'); li.style.setProperty('--i', i); li.textContent = t; list.appendChild(li); });
      out(root, 'glossName', GLOSS[gloss][0]); out(root, 'glossText', GLOSS[gloss][1]);
      out(root, 'stepCount', steps.length);
      setSummary(root, [
        `Objekt: ${label(root, 'obj')} (Anzahl: ${fmt(count)})`,
        `Zustand: ${label(root, 'cond')}`,
        `Wunsch: ${label(root, 'color')}, ${GLOSS[gloss][0]}`
      ]);
    };
    return update;
  };

  /* ---------- Renovierung: Reihenfolge-Planer ---------- */
  const TRADES = [
    ['trockenbau', 'Trockenbau', 'Neue Wände, Vorsatzschalen und Decken zuerst – hier entsteht der meiste Staub.', 'Rohbau & Struktur'],
    ['beschichtung-vor', 'Boden schleifen (für Beschichtung)', 'Schleif- und Absaugarbeiten erledigen wir, bevor Wände und Decken ihre neue Oberfläche bekommen.', 'Rohbau & Struktur'],
    ['spachteln', 'Spachteln & Untergrund vorbereiten', 'Glatte, tragfähige Untergründe sind die Basis für Tapete und Farbe.', 'Wand & Decke'],
    ['tapezieren', 'Tapezieren', 'Tapeten kommen vor dem Anstrich – überstreichbare Vliese werden danach gestrichen.', 'Wand & Decke'],
    ['streichen', 'Wände & Decken streichen', 'Decke vor Wand, damit keine Spritzer auf fertigen Flächen landen.', 'Wand & Decke'],
    ['lackieren', 'Türen, Fenster & Heizkörper lackieren', 'Lackarbeiten nach dem Anstrich – so bleiben Kanten sauber.', 'Details'],
    ['beschichtung', 'Bodenbeschichtung', 'Die Beschichtung folgt nach den Wand- und Deckenarbeiten, damit die Oberfläche geschützt bleibt.', 'Boden'],
    ['boden', 'Parkett, Vinyl oder Laminat verlegen', 'Der neue Boden kommt möglichst zum Schluss und bleibt so unbeschädigt.', 'Boden'],
    ['fassade', 'Fassadenarbeiten', 'Außenarbeiten sind unabhängig vom Innenausbau und hängen vor allem vom Wetter ab.', 'Außen']
  ];
  tools.renovierung = root => {
    const list = root.querySelector('.rv-plan');
    const update = () => {
      const chosen = new Set(field(root, 'works') || []);
      if (chosen.has('streichen') || chosen.has('tapezieren')) chosen.add('spachteln');
      if (chosen.has('beschichtung')) chosen.add('beschichtung-vor');
      const rooms = num(root, 'rooms'), lived = field(root, 'lived') === 'ja';
      const plan = TRADES.filter(t => chosen.has(t[0]));
      list.textContent = '';
      plan.forEach(([, name, why, phase], i) => {
        const li = document.createElement('li');
        li.style.setProperty('--i', i);
        li.innerHTML = '<span class="rv-no"></span><div><small></small><strong></strong><p></p></div>';
        li.querySelector('.rv-no').textContent = String(i + 1).padStart(2, '0');
        li.querySelector('small').textContent = phase;
        li.querySelector('strong').textContent = name;
        li.querySelector('p').textContent = why;
        list.appendChild(li);
      });
      if (!plan.length) list.innerHTML = '<li class="rv-empty">Wählen Sie links die geplanten Arbeiten aus – der Planer sortiert sie in eine sinnvolle Reihenfolge.</li>';
      const tip = root.querySelector('.rv-tip');
      tip.textContent = lived
        ? `Bei bewohnten Räumen ist oft ein raumweises Vorgehen sinnvoll. Bei ${fmt(rooms)} Raum${rooms > 1 ? 'en' : ''} stimmen wir gemeinsam ab, in welcher Reihenfolge die Räume frei sein müssen.`
        : `Leere Räume erleichtern die Arbeit: Mehrere Gewerke lassen sich bei ${fmt(rooms)} Raum${rooms > 1 ? 'en' : ''} gut aufeinander abstimmen.`;
      out(root, 'count', plan.length);
      setSummary(root, [
        `Geplante Arbeiten: ${plan.map(p => p[1]).join(', ') || 'noch offen'}`,
        `Anzahl Räume: ${fmt(rooms)}`,
        `Räume während der Arbeiten bewohnt: ${lived ? 'ja' : 'nein'}`
      ]);
    };
    return update;
  };

  /* ---------- Hausmeisterservice: Bedarfs-Check ---------- */
  tools.hausmeister = root => {
    const card = root.querySelector('.hm-card');
    const update = () => {
      const tasks = [...root.querySelectorAll('[name="tasks"]:checked')].map(c => c.closest('label').textContent.trim());
      const units = num(root, 'units');
      out(root, 'type', label(root, 'type'));
      out(root, 'units', `${fmt(units)} Einheit${units > 1 ? 'en' : ''}`);
      out(root, 'freq', label(root, 'freq'));
      out(root, 'start', label(root, 'start'));
      out(root, 'taskCount', tasks.length);
      const tags = card.querySelector('.hm-tags');
      tags.textContent = '';
      (tasks.length ? tasks : ['Noch keine Aufgaben gewählt']).forEach((t, i) => {
        const span = document.createElement('span');
        span.textContent = t; span.style.setProperty('--i', i);
        if (!tasks.length) span.className = 'is-empty';
        tags.appendChild(span);
      });
      card.classList.remove('is-stamped'); void card.offsetWidth; card.classList.add('is-stamped');
      setSummary(root, [
        `Objekt: ${label(root, 'type')} mit ${fmt(units)} Einheit${units > 1 ? 'en' : ''}`,
        `Gewünschte Aufgaben: ${tasks.join(', ') || 'noch offen'}`,
        `Häufigkeit: ${label(root, 'freq')}, Start: ${label(root, 'start')}`
      ]);
    };
    return update;
  };

  document.querySelectorAll('.tool[data-tool]').forEach(root => {
    const make = tools[root.dataset.tool];
    if (!make) return;
    const form = root.querySelector('form');
    form?.addEventListener('submit', e => e.preventDefault());
    const syncRanges = () => root.querySelectorAll('input[type=range]').forEach(r => {
      const b = r.closest('label')?.querySelector('.range-val');
      if (b) b.textContent = fmt(parseFloat(r.value), (r.step.split('.')[1] || '').length) + (b.dataset.unit ? ' ' + b.dataset.unit : '');
      r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    });
    const update = make(root);
    let frame = 0;
    const run = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { syncRanges(); update(); }); };
    root.addEventListener('input', run);
    root.addEventListener('change', run);
    syncRanges(); update();
    root.classList.add('is-ready');
  });
})();
