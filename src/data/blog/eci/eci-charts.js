// Interactive charts for the ECI post. Plain SVG, no dependencies.
// Each chart is a <div data-eci-chart="name"> in the post; the data comes from
// eci-data.json next to this file (written by experiments/eci/run.py).

const NS = "http://www.w3.org/2000/svg";
const DATA_URL = new URL("./eci-data.json", import.meta.url);
let dataPromise;

const CATEGORY_COLORS = {
  Text: "#4e79a7",
  "STEM & Reasoning": "#e15759",
  "Chart & Table": "#f28e2b",
  Document: "#59a14f",
  OCR: "#b07aa1",
  "General VQA": "#76b7b2",
  Counting: "#edc948",
  GUI: "#9c755f",
  "Multi-image": "#ff9da7",
};
const FG = "var(--foreground)";
const ACCENT = "var(--accent)";
const FAINT = "color-mix(in srgb, var(--foreground) 15%, transparent)";
const DIM = "color-mix(in srgb, var(--foreground) 55%, transparent)";

// ---------------------------------------------------------------------------
// Small helpers

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}

function html(tag, attrs = {}, parent, text) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

function linear([d0, d1], [r0, r1]) {
  const f = x => r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
  f.invert = y => d0 + ((y - r0) / (r1 - r0)) * (d1 - d0);
  f.domain = [d0, d1];
  return f;
}

function niceTicks(lo, hi, n = 6) {
  const raw = (hi - lo) / n;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw);
  const out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) {
    out.push(+t.toFixed(10));
  }
  return out;
}

const sigmoid = z => 1 / (1 + Math.exp(-z));

// "D_b" in a label is written as an italic D with a subscript b, as in the post.
const MATH = /([A-Za-zα])_([a-z])/g;
function mathText(node, str) {
  node.textContent = "";
  let last = 0;
  for (const m of String(str).matchAll(MATH)) {
    if (m.index > last) node.append(str.slice(last, m.index));
    el("tspan", { "font-style": "italic" }, node).textContent = m[1];
    // A small gap and a thin outline, so the subscript's outline (for
    // labels drawn over lines) does not cover the italic letter.
    el(
      "tspan",
      { dx: "0.12em", dy: "0.3em", "font-size": "75%", "stroke-width": 2 },
      node
    ).textContent = m[2];
    // Back to the baseline for the rest of the label.
    el("tspan", { dy: "-0.3em" }, node).textContent = "\u200b";
    last = m.index + m[0].length;
  }
  if (last < String(str).length) node.append(String(str).slice(last));
  return node;
}
const mathHTML = str =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(MATH, "<i>$1</i><sub>$2</sub>");
const pct = y => `${(y * 100).toFixed(1)}%`;
const fmt = (x, n = 1) => (x === null || x === undefined ? "–" : x.toFixed(n));
const label = s => s.model;

function svgRoot(container, width, height) {
  return el(
    "svg",
    {
      viewBox: `0 0 ${width} ${height}`,
      class: "eci-svg",
      role: "img",
    },
    container
  );
}

// x and y axes with gridlines.
function axes(
  g,
  x,
  y,
  { xTicks, yTicks, xFmt = String, yFmt = String, xLabel, yLabel, grid = true }
) {
  const [x0, x1] = [x(x.domain[0]), x(x.domain[1])];
  const [y0, y1] = [y(y.domain[0]), y(y.domain[1])];
  const ax = el("g", { class: "eci-axis" }, g);
  for (const t of xTicks ?? niceTicks(...x.domain)) {
    if (grid)
      el("line", { x1: x(t), x2: x(t), y1: y0, y2: y1, stroke: FAINT }, ax);
    el(
      "text",
      { x: x(t), y: y0 + 16, "text-anchor": "middle" },
      ax
    ).textContent = xFmt(t);
  }
  for (const t of yTicks ?? niceTicks(...y.domain)) {
    if (grid)
      el("line", { x1: x0, x2: x1, y1: y(t), y2: y(t), stroke: FAINT }, ax);
    el(
      "text",
      { x: x0 - 6, y: y(t) + 4, "text-anchor": "end" },
      ax
    ).textContent = yFmt(t);
  }
  el("line", { x1: x0, x2: x1, y1: y0, y2: y0, stroke: DIM }, ax);
  if (xLabel) {
    const t = el(
      "text",
      {
        x: (x0 + x1) / 2,
        y: y0 + 36,
        "text-anchor": "middle",
        class: "eci-axis-label",
      },
      ax
    );
    mathText(t, xLabel);
  }
  if (yLabel) {
    const t = el(
      "text",
      {
        x: -(y0 + y1) / 2,
        y: x0 - 44,
        transform: "rotate(-90)",
        "text-anchor": "middle",
        class: "eci-axis-label",
      },
      ax
    );
    mathText(t, yLabel);
  }
}

// A tooltip that follows the pointer inside a chart.
function tooltip(container) {
  const tip = html("div", { class: "eci-tip", role: "status" }, container);
  tip.hidden = true;
  return {
    show(evt, lines) {
      tip.replaceChildren();
      lines.forEach((l, i) => {
        html(i === 0 ? "strong" : "div", {}, tip).innerHTML = mathHTML(l);
      });
      tip.hidden = false;
      const box = container.getBoundingClientRect();
      const px = evt.clientX - box.left;
      const py = evt.clientY - box.top;
      const w = tip.offsetWidth;
      tip.style.left = `${Math.min(Math.max(px + 12, 0), box.width - w - 4)}px`;
      tip.style.top = `${py + 14}px`;
    },
    hide() {
      tip.hidden = true;
    },
  };
}

function hoverable(node, tip, lines, onEnter, onLeave) {
  node.style.cursor = "pointer";
  node.addEventListener("pointermove", e => {
    tip.show(e, typeof lines === "function" ? lines() : lines);
    onEnter?.();
  });
  node.addEventListener("pointerleave", () => {
    tip.hide();
    onLeave?.();
  });
}

function controls(container) {
  return html("div", { class: "eci-controls" }, container);
}

// A menu like the site's Sort menu: a pill button whose chevron turns when
// open, and a panel of options.
let openMenu = null;
function select(parent, labelText, options, value, onChange) {
  const wrap = html("div", { class: "eci-menu" }, parent);
  const btn = html(
    "button",
    {
      type: "button",
      class: "eci-menu-button",
      "aria-expanded": "false",
      "aria-haspopup": "listbox",
    },
    wrap
  );
  html("span", { class: "eci-menu-label" }, btn, labelText);
  const current = html("span", {}, btn);
  const chev = el(
    "svg",
    { viewBox: "0 0 24 24", class: "eci-chevron", "aria-hidden": "true" },
    btn
  );
  el(
    "path",
    {
      d: "M15 6l-6 6l6 6",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    chev
  );
  const panel = html(
    "div",
    { class: "eci-menu-panel", role: "listbox", "aria-label": labelText },
    wrap
  );
  panel.hidden = true;
  const items = options.map(([v, t]) => {
    const o = html(
      "button",
      { type: "button", role: "option", class: "eci-menu-option" },
      panel
    );
    html("span", { class: "eci-radio", "aria-hidden": "true" }, o);
    o.append(t);
    o.addEventListener("click", () => {
      choose(v);
      close(true);
      onChange(v);
    });
    return [v, t, o];
  });
  function choose(v) {
    value = v;
    for (const [ov, t, o] of items) {
      o.setAttribute("aria-selected", String(ov === v));
      if (ov === v) current.textContent = t;
    }
  }
  function open() {
    if (openMenu && openMenu !== close) openMenu();
    openMenu = close;
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    items.find(([v]) => v === value)?.[2].focus();
  }
  function close(refocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (openMenu === close) openMenu = null;
    if (refocus) btn.focus();
  }
  btn.addEventListener("click", () => (panel.hidden ? open() : close()));
  wrap.addEventListener("keydown", e => {
    if (e.key === "Escape") close(true);
  });
  document.addEventListener("click", e => {
    if (!wrap.contains(e.target)) close();
  });
  choose(value);
  return {
    get value() {
      return value;
    },
    // Change the shown choice without calling onChange.
    set: v => choose(v),
  };
}

function slider(parent, labelText, { min, max, step, value }, onInput) {
  const wrap = html("label", { class: "eci-field eci-slider" }, parent);
  const name = html("span", {}, wrap);
  name.innerHTML = mathHTML(labelText);
  const input = html(
    "input",
    { type: "range", min, max, step, value: String(value) },
    wrap
  );
  const out = html("output", {}, wrap);
  const update = () => {
    out.textContent = onInput(+input.value);
  };
  input.addEventListener("input", update);
  update();
  return {
    input,
    name,
    // Set and redraw, or only move the thumb (for an animation).
    set: v => ((input.value = String(v)), update()),
    show: v => (input.value = String(v)),
  };
}

function toggle(parent, options, value, onChange) {
  const wrap = html("div", { class: "eci-toggle", role: "group" }, parent);
  const buttons = options.map(([v, t]) => {
    const b = html(
      "button",
      { type: "button", "aria-pressed": String(v === value) },
      wrap,
      t
    );
    b.addEventListener("click", () => {
      buttons.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      onChange(v);
    });
    return b;
  });
  return wrap;
}

// A round play / pause / replay button with an icon instead of text.
const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  replay: "M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z",
};
function playButton(parent, onClick) {
  const b = html("button", { type: "button", class: "eci-play" }, parent);
  const svg = el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, b);
  const path = el("path", { fill: "currentColor" }, svg);
  b.addEventListener("click", onClick);
  const labels = { play: "Play", pause: "Pause", replay: "Replay" };
  b.setState = state => {
    path.setAttribute("d", ICONS[state]);
    b.setAttribute("aria-label", labels[state]);
    b.title = labels[state];
  };
  b.setState("play");
  return b;
}

function legend(parent, items) {
  const wrap = html("div", { class: "eci-legend" }, parent);
  for (const [text, color, shape] of items) {
    const item = html("span", {}, wrap);
    const sw = html("i", {}, item);
    sw.style.background = color;
    if (shape === "ring") {
      sw.style.background = "transparent";
      sw.style.border = `2px solid ${color}`;
    }
    if (shape === "line") sw.className = "line";
    item.append(text);
  }
  return wrap;
}

function curvePath(x, y, D, alpha, [lo, hi]) {
  let d = "";
  for (let i = 0; i <= 120; i++) {
    const c = lo + ((hi - lo) * i) / 120;
    d += `${i ? "L" : "M"}${x(c).toFixed(1)},${y(sigmoid(alpha * (c - D))).toFixed(1)}`;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Data shaping

function prepare(data) {
  const settings = new Map(data.settings.map(s => [s.key, s]));
  const benchmarks = new Map(data.benchmarks.map(b => [b.key, b]));
  const byBenchmark = new Map(data.benchmarks.map(b => [b.key, []]));
  for (const [m, b, y, fit, loo] of data.scores) {
    byBenchmark.get(b).push({ s: settings.get(m), y, fit, loo });
  }
  return { ...data, settingsMap: settings, benchMap: benchmarks, byBenchmark };
}

const benchOptions = d =>
  [...d.benchmarks]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(b => [b.key, b.label]);

// ---------------------------------------------------------------------------
// Charts

const charts = {};

// The ECI formula on its own: sliders for D, alpha, and a model's C.
charts.sigmoid = root => {
  const W = 640,
    H = 340,
    m = { l: 56, r: 16, t: 14, b: 48 };
  const ctl = controls(root);
  const svg = svgRoot(root, W, H);
  const x = linear([0, 200], [m.l, W - m.r]);
  const y = linear([0, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yFmt: t => `${t * 100}%`,
    xLabel: "Model capability C_m",
    yLabel: "Predicted score",
  });
  const half = el("line", { stroke: DIM, "stroke-dasharray": "3 3" }, svg);
  const halfText = el("text", { class: "eci-small", fill: DIM }, svg);
  const path = el(
    "path",
    { fill: "none", stroke: ACCENT, "stroke-width": 3 },
    svg
  );
  const guideV = el(
    "line",
    { stroke: FG, "stroke-dasharray": "2 3", opacity: 0.6 },
    svg
  );
  const guideH = el(
    "line",
    { stroke: FG, "stroke-dasharray": "2 3", opacity: 0.6 },
    svg
  );
  const dot = el("circle", { r: 6, fill: FG }, svg);
  const dotText = el("text", { class: "eci-label" }, svg);

  const v = { D: 100, alpha: 0.05, C: 130 };
  slider(
    ctl,
    "Difficulty D_b",
    { min: 0, max: 200, step: 1, value: v.D },
    n => {
      v.D = n;
      draw();
      return n.toFixed(0);
    }
  );
  slider(
    ctl,
    "Slope α_b",
    { min: 0.01, max: 0.2, step: 0.005, value: v.alpha },
    n => {
      v.alpha = n;
      draw();
      return n.toFixed(3);
    }
  );
  slider(
    ctl,
    "Capability C_m",
    { min: 0, max: 200, step: 1, value: v.C },
    n => {
      v.C = n;
      draw();
      return n.toFixed(0);
    }
  );

  function draw() {
    const { D, alpha, C } = v;
    if ([D, alpha, C].some(n => n === undefined)) return;
    path.setAttribute("d", curvePath(x, y, D, alpha, x.domain));
    half.setAttribute("x1", x(D));
    half.setAttribute("x2", x(D));
    half.setAttribute("y1", y(0));
    half.setAttribute("y2", y(0.5));
    halfText.setAttribute("x", x(D) + 4);
    halfText.setAttribute("y", y(0) - 6);
    mathText(halfText, "C_m = D_b: score 50%");
    const p = sigmoid(alpha * (C - D));
    guideV.setAttribute("x1", x(C));
    guideV.setAttribute("x2", x(C));
    guideV.setAttribute("y1", y(0));
    guideV.setAttribute("y2", y(p));
    guideH.setAttribute("x1", x(0));
    guideH.setAttribute("x2", x(C));
    guideH.setAttribute("y1", y(p));
    guideH.setAttribute("y2", y(p));
    dot.setAttribute("cx", x(C));
    dot.setAttribute("cy", y(p));
    const right = x(C) < W - 170;
    dotText.setAttribute("x", x(C) + (right ? 10 : -10));
    dotText.setAttribute("y", y(p) - 10);
    dotText.setAttribute("text-anchor", right ? "start" : "end");
    dotText.textContent = `score = ${pct(p)}`;
  }
  draw();
};

// The optimizer's path, from C = D = 0, alpha = 1 to the fit.
charts.optimization = (root, d) => {
  const W = 640,
    H = 340,
    m = { l: 56, r: 16, t: 14, b: 48 };
  const frames = d.frames;
  const settings = d.settings;
  const bIndex = new Map(d.benchmarks.map((b, i) => [b.key, i]));
  let key = "mathvision";
  const ctl = controls(root);
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const x = linear([20, 180], [m.l, W - m.r]);
  const y = linear([0, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yFmt: t => `${t * 100}%`,
    xLabel: "Model capability (ECI)",
    yLabel: "Benchmark score",
  });
  const gCurves = el("g", {}, svg);
  let hovered = -1;
  let frame; // parameters at the current step, for the tooltips
  const curves = d.benchmarks.map((b, i) => {
    const line = el(
      "path",
      { fill: "none", stroke: FAINT, "stroke-width": 1.2 },
      gCurves
    );
    // A wider invisible path makes the thin curve easy to point at.
    const hit = el(
      "path",
      { fill: "none", stroke: "transparent", "stroke-width": 10 },
      gCurves
    );
    hoverable(
      hit,
      tip,
      () => [
        b.label,
        `D_b ${fmt(frame.D[i])} · α_b ${frame.alpha[i].toFixed(3)} at this step`,
        "Click to select",
      ],
      () => {
        hovered = i;
        styleCurves();
      },
      () => {
        hovered = -1;
        styleCurves();
      }
    );
    hit.addEventListener("click", () => {
      key = b.key;
      menu.set(key);
      draw();
    });
    return { line, hit };
  });
  function styleCurves() {
    curves.forEach(({ line }, i) => {
      line.setAttribute("stroke", i === hovered ? DIM : FAINT);
      line.setAttribute("stroke-width", i === hovered ? 2.5 : 1.2);
    });
  }
  const sel = el(
    "path",
    { fill: "none", stroke: ACCENT, "stroke-width": 3 },
    svg
  );
  const selLabel = el("text", { class: "eci-label", fill: ACCENT }, svg);
  const gPts = el("g", {}, svg);
  const stepText = el(
    "text",
    { x: m.l + 8, y: m.t + 12, class: "eci-big" },
    svg
  );
  const sseText = el(
    "text",
    { x: m.l + 8, y: m.t + 30, class: "eci-small", fill: DIM },
    svg
  );

  let t = 0,
    playing = false,
    ready = false,
    raf;
  const n = frames.length - 1;

  function lerp(tt) {
    const i = Math.max(0, Math.min(Math.floor(tt), n - 1));
    const f = tt - i;
    const a = frames[i],
      b = frames[Math.min(i + 1, n)];
    const mix = (u, v) => u.map((ui, k) => ui + (v[k] - ui) * f);
    return {
      C: mix(a.C, b.C),
      D: mix(a.D, b.D),
      alpha: mix(a.alpha, b.alpha),
      sse: a.sse + (b.sse - a.sse) * f,
    };
  }

  function draw() {
    const f = lerp(t);
    frame = f;
    f.D.forEach((D, i) => {
      const path = curvePath(x, y, D, f.alpha[i], x.domain);
      curves[i].line.setAttribute("d", path);
      curves[i].hit.setAttribute("d", path);
    });
    const bi = bIndex.get(key);
    sel.setAttribute("d", curvePath(x, y, f.D[bi], f.alpha[bi], x.domain));
    // The selected benchmark's name, beside its curve at the 50% point.
    const mid = Math.min(Math.max(f.D[bi], x.domain[0]), x.domain[1]);
    selLabel.setAttribute("x", x(mid) + 10);
    selLabel.setAttribute("y", y(0.5) + 4);
    selLabel.textContent = d.benchMap.get(key).label;
    gPts.replaceChildren();
    for (const p of d.byBenchmark.get(key)) {
      const i = settings.indexOf(p.s);
      const c = el(
        "circle",
        { cx: x(f.C[i]), cy: y(p.y), r: 4.5, fill: FG, opacity: 0.85 },
        gPts
      );
      hoverable(c, tip, () => [
        label(p.s),
        `Score ${pct(p.y)}`,
        `Capability now ${fmt(lerp(t).C[i])} (final ${fmt(p.s.eci)})`,
      ]);
    }
    stepText.textContent = `Step ${Math.round(t)} / ${n}`;
    sseText.textContent = `Sum of squared errors: ${f.sse.toFixed(3)}`;
    scrub.show(t);
  }

  const play = playButton(ctl, () => (playing ? stop() : start()));
  const scrub = slider(
    ctl,
    "Step",
    { min: 0, max: n, step: 0.01, value: 0 },
    v => {
      // The slider calls this once when it is created (before drawing starts)
      // and then on every drag; the animation moves the thumb with show().
      if (!ready) return "";
      t = v;
      stop();
      draw();
      return "";
    }
  );
  const menu = select(ctl, "Benchmark", benchOptions(d), key, v => {
    key = v;
    draw();
  });

  function start() {
    if (t >= n) t = 0;
    playing = true;
    play.setState("pause");
    let last = performance.now();
    const tick = now => {
      // The first frame can be stamped slightly before `last`.
      t = Math.min(n, t + (Math.max(0, now - last) / 1000) * 1.2);
      last = now;
      draw();
      if (t < n && playing) raf = requestAnimationFrame(tick);
      else stop();
    };
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    playing = false;
    play.setState(t >= n ? "replay" : "play");
    cancelAnimationFrame(raf);
  }
  ready = true;
  draw();
};

// Models ranked by an index, switchable.
charts.ranking = (root, d) => {
  const metrics = [
    ["eci", "ECI"],
    ["mean", "Mean score"],
  ];
  let metric = "eci";
  const ctl = controls(root);
  toggle(ctl, metrics, metric, v => {
    metric = v;
    draw();
  });
  const rows = d.settings;
  const W = 640,
    rowH = 19,
    m = { l: 210, r: 54, t: 8, b: 36 };
  const H = m.t + rows.length * rowH + m.b;
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const gAxis = el("g", {}, svg);
  const gRows = el("g", {}, svg);
  const rowEls = new Map(
    rows.map(s => {
      const g = el("g", { class: "eci-row" }, gRows);
      el(
        "text",
        {
          x: m.l - 8,
          y: rowH / 2 + 4,
          "text-anchor": "end",
          class: "eci-small",
        },
        g
      ).textContent = label(s);
      const bar = el(
        "rect",
        {
          x: m.l,
          y: 3,
          height: rowH - 6,
          rx: 3,
          fill: s.type === "open" ? ACCENT : FG,
          opacity: 0.75,
        },
        g
      );
      const val = el("text", { y: rowH / 2 + 4, class: "eci-small" }, g);
      hoverable(g, tip, () => [
        label(s),
        `ECI ${fmt(s.eci)}`,
        `Mean score ${pct(s.mean)}`,
      ]);
      return [s.key, { g, bar, val }];
    })
  );
  legend(root, [
    ["Proprietary", FG],
    ["Open weights", ACCENT],
  ]);

  function draw() {
    const isMean = metric === "mean";
    const val = s => (isMean ? s.mean * 100 : s[metric]);
    const shown = rows.filter(
      s => val(s) !== null && val(s) !== undefined && val(s) !== 0
    );
    shown.sort((a, b) => val(b) - val(a));
    const lo = isMean ? 0 : 50;
    const hi = isMean ? 100 : 160;
    const x = linear([lo, hi], [m.l, W - m.r]);
    gAxis.replaceChildren();
    const yEnd = m.t + shown.length * rowH;
    for (const t of niceTicks(lo, hi, 6)) {
      el(
        "line",
        { x1: x(t), x2: x(t), y1: m.t, y2: yEnd, stroke: FAINT },
        gAxis
      );
      el(
        "text",
        { x: x(t), y: yEnd + 16, "text-anchor": "middle", class: "eci-small" },
        gAxis
      ).textContent = isMean ? `${t}%` : t;
    }
    el(
      "text",
      {
        x: (m.l + W - m.r) / 2,
        y: yEnd + 32,
        "text-anchor": "middle",
        class: "eci-axis-label",
      },
      gAxis
    ).textContent = metrics.find(([k]) => k === metric)[1];
    svg.setAttribute("viewBox", `0 0 ${W} ${yEnd + m.b}`);
    for (const s of rows) {
      const r = rowEls.get(s.key);
      const i = shown.indexOf(s);
      r.g.style.display = i < 0 ? "none" : "";
      if (i < 0) continue;
      r.g.setAttribute("transform", `translate(0,${m.t + i * rowH})`);
      const v = val(s);
      r.bar.setAttribute("width", Math.max(0, x(v) - m.l));
      r.val.setAttribute("x", x(v) + 4);
      r.val.textContent = isMean ? `${v.toFixed(1)}%` : v.toFixed(1);
    }
  }
  draw();
};

// A few benchmarks' fitted curves, each labeled, with their scores.
charts.curves = (root, d) => {
  // [benchmark, color, label position (capability, score), text anchor,
  //  capability where the leader line meets the curve]
  const shown = [
    ["jgraphqa", "#59a14f", [3, 0.93], "start", 45],
    ["hakushobench", "#f28e2b", [74, 0.38], "start", 62],
    ["charxiv", "#e15759", [74, 0.27], "start", 56],
    ["zerobench", "#4e79a7", [150, 0.64], "end", 163],
  ];
  const W = 640,
    H = 380,
    m = { l: 56, r: 16, t: 14, b: 48 };
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const x = linear([0, 200], [m.l, W - m.r]);
  const y = linear([0, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yFmt: t => `${t * 100}%`,
    xLabel: "Model capability (ECI)",
    yLabel: "Benchmark score",
  });
  el(
    "line",
    {
      x1: x(0),
      x2: x(200),
      y1: y(0.5),
      y2: y(0.5),
      stroke: DIM,
      "stroke-dasharray": "3 3",
    },
    svg
  );
  for (const [key, col, [lx, ly], anchor, cx] of shown) {
    const b = d.benchMap.get(key);
    const curve = el(
      "path",
      {
        d: curvePath(x, y, b.D, b.alpha, x.domain),
        fill: "none",
        stroke: col,
        "stroke-width": 3,
      },
      svg
    );
    // A wider invisible copy makes the curve easy to point at.
    const hit = el(
      "path",
      {
        d: curve.getAttribute("d"),
        fill: "none",
        stroke: "transparent",
        "stroke-width": 12,
      },
      svg
    );
    const spread = Math.log(9) / b.alpha;
    hoverable(
      hit,
      tip,
      [
        b.label,
        `D_b ${fmt(b.D)}`,
        `α_b ${b.alpha.toFixed(3)}`,
        `Score 10% to 90% from ${fmt(b.D - spread)} to ${fmt(b.D + spread)}`,
      ],
      () => curve.setAttribute("stroke-width", 5),
      () => curve.setAttribute("stroke-width", 3)
    );
    // A label in empty space, joined to its curve by a thin line.
    const cy = sigmoid(b.alpha * (cx - b.D));
    el(
      "line",
      {
        x1: x(lx) + (anchor === "start" ? -2 : 2),
        y1: y(ly) - 4,
        x2: x(cx),
        y2: y(cy),
        stroke: col,
        "stroke-width": 1,
      },
      svg
    );
    el(
      "text",
      {
        x: x(lx),
        y: y(ly),
        "text-anchor": anchor,
        fill: col,
        class: "eci-label",
      },
      svg
    ).textContent = "";
    mathText(svg.lastChild, `${b.label} (D_b = ${b.D.toFixed(0)})`);
    for (const p of d.byBenchmark.get(key)) {
      const c = el(
        "circle",
        { cx: x(p.s.eci), cy: y(p.y), r: 4.5, fill: col, opacity: 0.85 },
        svg
      );
      hoverable(c, tip, [
        `${label(p.s)} · ${b.label}`,
        `ECI ${fmt(p.s.eci)}`,
        `Score ${pct(p.y)} (curve ${pct(p.fit)})`,
      ]);
    }
  }
};

// Benchmark difficulty, with the range where the score rises from 10% to 90%.
charts.difficulty = (root, d) => {
  const rows = [...d.benchmarks].sort((a, b) => b.D - a.D);
  const W = 640,
    rowH = 18,
    m = { l: 150, r: 16, t: 26, b: 40 };
  const H = m.t + rows.length * rowH + m.b;
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const x = linear([-40, 240], [m.l, W - m.r]);
  const yEnd = m.t + rows.length * rowH;
  for (const t of niceTicks(-40, 240, 7)) {
    el("line", { x1: x(t), x2: x(t), y1: m.t, y2: yEnd, stroke: FAINT }, svg);
    el(
      "text",
      { x: x(t), y: yEnd + 16, "text-anchor": "middle", class: "eci-small" },
      svg
    ).textContent = t;
  }
  el(
    "text",
    {
      x: (m.l + W - m.r) / 2,
      y: yEnd + 34,
      "text-anchor": "middle",
      class: "eci-axis-label",
    },
    svg
  ).textContent =
    "ECI (dot: difficulty D_b, where the expected score is 50%; bar: 10% to 90%)";
  const top = d.settings.reduce((a, s) => (s.eci > a.eci ? s : a));
  const low = d.settings.reduce((a, s) => (s.eci < a.eci ? s : a));
  for (const [s, name] of [
    [top, "best model"],
    [low, "weakest model"],
  ]) {
    el(
      "line",
      {
        x1: x(s.eci),
        x2: x(s.eci),
        y1: m.t - 6,
        y2: yEnd,
        stroke: ACCENT,
        "stroke-dasharray": "4 3",
      },
      svg
    );
    el(
      "text",
      {
        x: x(s.eci),
        y: m.t - 10,
        "text-anchor": "middle",
        class: "eci-small",
        fill: ACCENT,
      },
      svg
    ).textContent = `${name} (${fmt(s.eci, 0)})`;
  }
  const spread = Math.log(9);
  rows.forEach((b, i) => {
    const g = el("g", { transform: `translate(0,${m.t + i * rowH})` }, svg);
    el(
      "text",
      { x: m.l - 8, y: rowH / 2 + 4, "text-anchor": "end", class: "eci-small" },
      g
    ).textContent = b.label;
    const col = CATEGORY_COLORS[b.category];
    const lo = b.D - spread / b.alpha,
      hi = b.D + spread / b.alpha;
    el(
      "rect",
      {
        x: x(Math.max(lo, -40)),
        y: 5,
        width: x(Math.min(hi, 240)) - x(Math.max(lo, -40)),
        height: rowH - 10,
        rx: 3,
        fill: col,
        opacity: 0.35,
      },
      g
    );
    el("circle", { cx: x(b.D), cy: rowH / 2, r: 5, fill: col }, g);
    const hit = el(
      "rect",
      { x: 0, y: 0, width: W, height: rowH, fill: "transparent" },
      g
    );
    hoverable(hit, tip, [
      b.label,
      `${b.category} · ${b.lang === "ja" ? "Japanese" : "English"}`,
      `D_b ${fmt(b.D)} · α_b ${b.alpha.toFixed(3)}`,
      `10% at ${fmt(lo)}, 90% at ${fmt(hi)}`,
      `${b.n_obs} scores · fit R² ${fmt(b.r2, 2)}`,
    ]);
  });
  legend(
    root,
    Object.entries(CATEGORY_COLORS)
      .filter(([c]) => d.benchmarks.some(b => b.category === c))
      .map(([c, col]) => [c, col])
  );
};

// Generic scatter plot.
function scatter(
  root,
  pts,
  { xDomain, yDomain, xLabel, yLabel, xFmt, yFmt, diagonal, xLog, H = 380 }
) {
  const W = 640,
    m = { l: 60, r: 20, t: 14, b: 48 };
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const tx = xLog ? Math.log10 : v => v;
  const x0 = linear(xLog ? xDomain.map(Math.log10) : xDomain, [m.l, W - m.r]);
  const x = v => x0(tx(v));
  x.domain = xDomain;
  const y = linear(yDomain, [H - m.b, m.t]);
  const xTicks = xLog
    ? [1, 3, 10, 30, 100, 300, 1000, 3000].filter(
        t => t >= xDomain[0] && t <= xDomain[1]
      )
    : undefined;
  axes(svg, x, y, { xTicks, xFmt, yFmt, xLabel, yLabel });
  if (diagonal) {
    const lo = Math.max(xDomain[0], yDomain[0]),
      hi = Math.min(xDomain[1], yDomain[1]);
    el(
      "line",
      {
        x1: x(lo),
        y1: y(lo),
        x2: x(hi),
        y2: y(hi),
        stroke: DIM,
        "stroke-dasharray": "4 4",
      },
      svg
    );
  }
  for (const p of pts) {
    const c = el(
      "circle",
      {
        cx: x(p.x),
        cy: y(p.y),
        r: p.r ?? 5,
        fill: p.hollow ? "none" : p.color,
        stroke: p.color,
        "stroke-width": p.hollow ? 2 : 0,
        opacity: 0.85,
      },
      svg
    );
    hoverable(c, tip, p.tip);
  }
  return svg;
}

// Text vs multimodal capability, one line per setting.
charts.domains = (root, d) => {
  const rows = d.settings.filter(s => s.text !== null && s.multimodal !== null);
  const W = 640,
    H = 460,
    m = { t: 30, b: 20 };
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const xs = [250, 390];
  const y = linear([60, 155], [H - m.b, m.t]);
  for (const t of niceTicks(60, 155, 8)) {
    el(
      "line",
      { x1: xs[0] - 20, x2: xs[1] + 20, y1: y(t), y2: y(t), stroke: FAINT },
      svg
    );
    el(
      "text",
      { x: xs[0] - 26, y: y(t) + 4, "text-anchor": "end", class: "eci-small" },
      svg
    ).textContent = t;
  }
  el(
    "text",
    { x: xs[0], y: m.t - 12, "text-anchor": "middle", class: "eci-axis-label" },
    svg
  ).textContent = "Text";
  el(
    "text",
    { x: xs[1], y: m.t - 12, "text-anchor": "middle", class: "eci-axis-label" },
    svg
  ).textContent = "Multimodal";
  const labels = [];
  const groups = rows.map(s => {
    const diff = s.text - s.multimodal;
    const col = diff > 3 ? "#4e79a7" : diff < -3 ? "#e15759" : DIM;
    const g = el("g", { opacity: 0.85 }, svg);
    el(
      "line",
      {
        x1: xs[0],
        y1: y(s.text),
        x2: xs[1],
        y2: y(s.multimodal),
        stroke: col,
        "stroke-width": 2,
      },
      g
    );
    el("circle", { cx: xs[0], cy: y(s.text), r: 4, fill: col }, g);
    el("circle", { cx: xs[1], cy: y(s.multimodal), r: 4, fill: col }, g);
    if (Math.abs(diff) > 5.5)
      labels.push({
        y: y(s.multimodal),
        col,
        text: `${label(s)} (${diff > 0 ? "+" : ""}${diff.toFixed(1)})`,
      });
    const hit = el(
      "line",
      {
        x1: xs[0],
        y1: y(s.text),
        x2: xs[1],
        y2: y(s.multimodal),
        stroke: "transparent",
        "stroke-width": 10,
      },
      g
    );
    hoverable(
      hit,
      tip,
      [
        label(s),
        `Text ${fmt(s.text)} · Multimodal ${fmt(s.multimodal)}`,
        `Text − multimodal: ${diff > 0 ? "+" : ""}${diff.toFixed(1)}`,
        `All ${fmt(s.eci)}`,
      ],
      () => groups.forEach(x => x.setAttribute("opacity", x === g ? 1 : 0.15)),
      () => groups.forEach(x => x.setAttribute("opacity", 0.85))
    );
    return g;
  });
  // Labels at the right, pushed apart so they do not overlap.
  labels.sort((a, b) => a.y - b.y);
  let last = -Infinity;
  for (const l of labels) {
    const ly = Math.max(l.y, last + 13);
    last = ly;
    el(
      "line",
      {
        x1: xs[1] + 6,
        y1: l.y,
        x2: xs[1] + 14,
        y2: ly,
        stroke: l.col,
        opacity: 0.6,
      },
      svg
    );
    el(
      "text",
      { x: xs[1] + 16, y: ly + 4, class: "eci-small", fill: l.col },
      svg
    ).textContent = l.text;
  }
  legend(root, [
    ["Stronger on text (> 3)", "#4e79a7", "line"],
    ["Stronger on images (> 3)", "#e15759", "line"],
    ["Within 3 points", DIM, "line"],
  ]);
};

// Held-out prediction vs actual score.
charts.prediction = (root, d) => {
  const pts = d.scores.map(([m, b, y, , loo]) => {
    const s = d.settingsMap.get(m),
      bb = d.benchMap.get(b);
    return {
      x: loo * 100,
      y: y * 100,
      r: 3.5,
      color: CATEGORY_COLORS[bb.category],
      tip: [
        `${label(s)} · ${bb.label}`,
        `Actual ${pct(y)}`,
        `Predicted without this score ${pct(loo)}`,
        `Actual − predicted ${((y - loo) * 100).toFixed(1)} pt`,
      ],
    };
  });
  scatter(root, pts, {
    xDomain: [0, 100],
    yDomain: [0, 100],
    xLabel: "Predicted score, fitted without it (%)",
    yLabel: "Actual score (%)",
    diagonal: true,
    H: 420,
  });
  legend(
    root,
    Object.entries(CATEGORY_COLORS)
      .filter(([c]) => d.benchmarks.some(b => b.category === c))
      .map(([c, col]) => [c, col])
  );
};

// Actual minus held-out prediction, for every model and benchmark.
charts.residuals = (root, d) => {
  const rows = [...d.settings].sort((a, b) => b.eci - a.eci);
  const cols = [...d.benchmarks].sort((a, b) => a.D - b.D);
  const cell = 17,
    m = { l: 190, t: 118, r: 70, b: 10 };
  const W = m.l + cols.length * cell + m.r,
    H = m.t + rows.length * cell + m.b;
  const svg = svgRoot(root, W, H);
  svg.classList.add("eci-wide");
  const tip = tooltip(root);
  const resid = new Map(
    d.scores.map(([mm, b, y, , loo]) => [`${mm}|${b}`, [y, loo]])
  );
  const color = v => {
    const a = Math.min(Math.abs(v) / 0.3, 1);
    return v > 0
      ? `rgba(78,121,167,${0.15 + 0.85 * a})`
      : `rgba(225,87,89,${0.15 + 0.85 * a})`;
  };
  cols.forEach((b, j) => {
    el(
      "text",
      {
        x: 0,
        y: 0,
        transform: `translate(${m.l + j * cell + cell / 2 + 4},${m.t - 6}) rotate(-60)`,
        class: "eci-tiny",
      },
      svg
    ).textContent = b.label;
  });
  rows.forEach((s, i) => {
    el(
      "text",
      {
        x: m.l - 6,
        y: m.t + i * cell + cell / 2 + 4,
        "text-anchor": "end",
        class: "eci-tiny",
      },
      svg
    ).textContent = label(s);
    cols.forEach((b, j) => {
      const v = resid.get(`${s.key}|${b.key}`);
      const r = el(
        "rect",
        {
          x: m.l + j * cell + 1,
          y: m.t + i * cell + 1,
          width: cell - 2,
          height: cell - 2,
          rx: 2,
          fill: v ? color(v[0] - v[1]) : "none",
          stroke: v ? "none" : FAINT,
        },
        svg
      );
      if (v)
        hoverable(r, tip, [
          `${label(s)} · ${b.label}`,
          `Actual ${pct(v[0])} · predicted ${pct(v[1])}`,
          `Actual − predicted ${((v[0] - v[1]) * 100).toFixed(1)} pt`,
        ]);
    });
  });
  legend(root, [
    ["Better than predicted", "rgb(78,121,167)"],
    ["Worse than predicted", "rgb(225,87,89)"],
  ]);
};

// Ranking agreement as scores go missing, for both ways of removing them.
charts.robustness = (root, d) => {
  const W = 640,
    H = 340,
    m = { l: 60, r: 20, t: 14, b: 48 };
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const x = linear([0, 0.75], [m.l, W - m.r]);
  const y = linear([0, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    xFmt: t => `${Math.round(t * 100)}%`,
    yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
    yFmt: t => t.toFixed(1),
    xLabel: "Share of all scores removed",
    yLabel: "Kendall τ with the full mean ranking",
  });
  const series = [
    ["random", ACCENT, "Missing at random"],
    ["window", "#4e79a7", "Only benchmarks near the model's level"],
  ];
  for (const [scenario, col, name] of series) {
    const rows = d.robustness.filter(r => r.scenario === scenario);
    const band = rows
      .map(r => `${x(r.removed)},${y(r.eci[2])}`)
      .concat(rows.map(r => `${x(r.removed)},${y(r.eci[1])}`).reverse());
    el("polygon", { points: band.join(" "), fill: col, opacity: 0.12 }, svg);
    el(
      "polyline",
      {
        points: rows.map(r => `${x(r.removed)},${y(r.eci[0])}`).join(" "),
        fill: "none",
        stroke: col,
        "stroke-width": 2.5,
      },
      svg
    );
    for (const r of rows) {
      const c = el(
        "circle",
        { cx: x(r.removed), cy: y(r.eci[0]), r: 4, fill: col },
        svg
      );
      hoverable(c, tip, [
        name,
        `${Math.round(r.removed * 100)}% of the scores removed`,
        `τ = ${r.eci[0].toFixed(3)}`,
      ]);
    }
  }
  legend(
    root,
    series.map(([, col, name]) => [name, col, "line"])
  );
};

// Which scores the window keeps: models by capability (rows) against
// benchmarks by difficulty (columns).
charts.window = (root, d) => {
  const steps = d.robustness.filter(r => r.scenario === "window");
  const models = [...d.settings].sort((a, b) => b.mean - a.mean);
  const benches = [...d.benchmarks].sort((a, b) => a.D - b.D);
  // Same positions as the experiment: 0 (weakest, easiest) to 1.
  const posM = new Map(
    [...models].reverse().map((s, i) => [s.key, i / (models.length - 1)])
  );
  const posB = new Map(
    benches.map((b, i) => [b.key, i / (benches.length - 1)])
  );
  const ctl = controls(root);
  const cell = 15,
    m = { l: 150, t: 34, r: 10, b: 30 };
  const W = m.l + benches.length * cell + m.r,
    H = m.t + models.length * cell + m.b;
  const svg = svgRoot(root, W, H);
  const status = el(
    "text",
    { x: m.l, y: 14, class: "eci-label", fill: FG },
    svg
  );
  el(
    "text",
    { x: m.l, y: m.t - 6, class: "eci-small", fill: DIM },
    svg
  ).textContent = "Benchmarks: easiest → hardest";
  el(
    "text",
    {
      x: m.l + (benches.length * cell) / 2,
      y: H - 8,
      "text-anchor": "middle",
      class: "eci-small",
      fill: DIM,
    },
    svg
  ).textContent = "Filled: score kept · empty: score removed";
  models.forEach((s, i) => {
    el(
      "text",
      {
        x: m.l - 6,
        y: m.t + i * cell + cell / 2 + 4,
        "text-anchor": "end",
        class: "eci-tiny",
      },
      svg
    ).textContent = label(s);
  });
  const rects = models.map((s, i) =>
    benches.map((b, j) =>
      el(
        "rect",
        {
          x: m.l + j * cell + 1,
          y: m.t + i * cell + 1,
          width: cell - 2,
          height: cell - 2,
          rx: 2,
        },
        svg
      )
    )
  );
  function draw(k) {
    const step = steps[k];
    const w = step.q;
    models.forEach((s, i) => {
      const dist = benches.map(b =>
        Math.abs(posM.get(s.key) - posB.get(b.key))
      );
      // A model keeps at least its 4 nearest benchmarks, as in the experiment.
      const fourth = [...dist].sort((a, b) => a - b)[3];
      benches.forEach((b, j) => {
        const keep = dist[j] <= w || dist[j] <= fourth;
        rects[i][j].setAttribute("fill", keep ? ACCENT : "none");
        rects[i][j].setAttribute("stroke", keep ? "none" : FAINT);
      });
    });
    status.textContent = `${Math.round(step.removed * 100)}% of the scores removed · τ = ${step.eci[0].toFixed(2)}`;
  }
  slider(
    ctl,
    "Window",
    { min: 0, max: steps.length - 1, step: 1, value: 3 },
    k => {
      draw(k);
      return steps[k].q === 1 ? "all" : `±${steps[k].q}`;
    }
  );
};

charts.params = (root, d) => {
  const pts = d.settings
    .filter(s => s.params_b)
    .map(s => ({
      x: s.params_b,
      y: s.eci,
      color: ACCENT,
      tip: [
        label(s),
        `${s.params_b >= 100 ? s.params_b.toFixed(0) : s.params_b}B parameters (total)`,
        `ECI ${fmt(s.eci)}`,
      ],
    }));
  scatter(root, pts, {
    xDomain: [5, 4000],
    yDomain: [60, 145],
    xLog: true,
    xFmt: t => `${t}B`,
    xLabel: "Total parameters (log scale)",
    yLabel: "ECI",
  });
};

// ---------------------------------------------------------------------------

const STYLE = `
.eci-chart{position:relative;margin:1.5rem 0;font-size:.8rem;color:var(--foreground)}
.eci-svg{display:block;width:100%;height:auto;overflow:visible;font-family:inherit}
.eci-svg text{font-size:11px}
.eci-svg text:not([fill]){fill:var(--foreground)}
.eci-svg .eci-small{font-size:10.5px}
.eci-svg .eci-tiny{font-size:9.5px}
.eci-svg .eci-big{font-size:14px;font-weight:600}
.eci-svg .eci-label{font-size:12.5px;font-weight:600;paint-order:stroke;stroke:var(--background);stroke-width:4px;stroke-linejoin:round}
.eci-svg .eci-axis-label{font-size:11.5px;opacity:.8}
.eci-axis text{opacity:.7}
.eci-wide{max-width:none}
.eci-chart:has(.eci-wide){overflow-x:auto}
.eci-controls{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;margin-bottom:.5rem}
.eci-field{display:inline-flex;gap:.4rem;align-items:center}
.eci-menu{position:relative}
.eci-menu-button{display:inline-flex;align-items:center;gap:.4rem;border:0;border-radius:999px;padding:.3rem .75rem;background:transparent;color:inherit;cursor:pointer}
.eci-menu-button:hover,.eci-menu-button[aria-expanded=true]{background:var(--surface)}
.eci-menu-label{opacity:.65}
.eci-chevron{width:1rem;height:1rem;transform:rotate(-90deg);transition:transform .2s}
.eci-menu-button[aria-expanded=true] .eci-chevron{transform:rotate(90deg)}
@media (prefers-reduced-motion:reduce){.eci-chevron{transition:none}}
.eci-menu-panel{position:absolute;z-index:6;top:100%;left:0;margin-top:.4rem;min-width:14rem;max-height:18rem;overflow-y:auto;border-radius:.75rem;background:var(--surface);padding:.5rem;box-shadow:0 10px 25px rgb(0 0 0/.15)}
.eci-menu-option{display:flex;width:100%;align-items:center;gap:.6rem;border:0;border-radius:.25rem;padding:.35rem .5rem;background:transparent;color:inherit;text-align:left;cursor:pointer}
.eci-menu-option:hover,.eci-menu-option:focus-visible{background:color-mix(in srgb,var(--foreground) 5%,transparent);outline:none}
.eci-radio{width:.85rem;height:.85rem;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--foreground) 45%,transparent);flex:none}
.eci-menu-option[aria-selected=true] .eci-radio{border:4px solid var(--foreground)}
.eci-slider input{width:8.5rem;accent-color:var(--accent)}
.eci-slider output{font-variant-numeric:tabular-nums;min-width:3.2rem}
.eci-toggle{display:inline-flex;flex-wrap:wrap;gap:.25rem}
.eci-toggle button,.eci-button{border:1px solid var(--border);border-radius:999px;padding:.15rem .7rem;background:var(--background);color:inherit;cursor:pointer}
.eci-toggle button[aria-pressed=true]{background:var(--foreground);color:var(--background);border-color:var(--foreground)}
.eci-play{display:inline-grid;place-items:center;width:2.1rem;height:2.1rem;border-radius:50%;border:0;background:var(--accent);color:var(--background);cursor:pointer;flex:none}
.eci-play svg{width:1.15rem;height:1.15rem}
.eci-play:hover{opacity:.85}
.eci-legend{display:flex;flex-wrap:wrap;gap:.2rem .9rem;margin-top:.3rem;opacity:.85}
.eci-legend span{display:inline-flex;align-items:center;gap:.35rem}
.eci-legend i{display:inline-block;width:.7rem;height:.7rem;border-radius:50%;box-sizing:border-box}
.eci-legend i.line{height:.2rem;width:1rem;border-radius:2px}
.eci-note{margin:.4rem 0 0;opacity:.75;font-size:.78rem;line-height:1.5}
.eci-tip{position:absolute;z-index:5;pointer-events:none;background:var(--background);border:1px solid var(--border);border-radius:.5rem;padding:.4rem .6rem;box-shadow:0 4px 14px rgb(0 0 0/.15);font-size:.75rem;line-height:1.45;max-width:18rem}
.eci-chart sub{margin-left:.12em}
.eci-tip strong{display:block;margin-bottom:.1rem}
`;

async function init() {
  // Claim the charts before waiting for the data, so a second call (the
  // page-load event right after the first run) does not draw them again.
  const roots = [...document.querySelectorAll("[data-eci-chart]")].filter(
    r => !r.dataset.ready
  );
  if (!roots.length) return;
  roots.forEach(r => (r.dataset.ready = "true"));
  if (!document.getElementById("eci-style")) {
    const s = document.createElement("style");
    s.id = "eci-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }
  dataPromise ??= fetch(DATA_URL)
    .then(r => r.json())
    .then(prepare);
  const d = await dataPromise;
  for (const root of roots) {
    root.classList.add("eci-chart");
    const draw = charts[root.dataset.eciChart];
    if (draw) draw(root, d);
  }
}

document.addEventListener("astro:page-load", init);
init();
