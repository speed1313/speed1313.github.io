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
const pct = y => `${(y * 100).toFixed(1)}%`;
const fmt = (x, n = 1) => (x === null || x === undefined ? "–" : x.toFixed(n));
const label = s => `${s.model} (${s.effort})`;

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
  if (xLabel)
    el(
      "text",
      {
        x: (x0 + x1) / 2,
        y: y0 + 36,
        "text-anchor": "middle",
        class: "eci-axis-label",
      },
      ax
    ).textContent = xLabel;
  if (yLabel)
    el(
      "text",
      {
        x: -(y0 + y1) / 2,
        y: x0 - 44,
        transform: "rotate(-90)",
        "text-anchor": "middle",
        class: "eci-axis-label",
      },
      ax
    ).textContent = yLabel;
}

// A tooltip that follows the pointer inside a chart.
function tooltip(container) {
  const tip = html("div", { class: "eci-tip", role: "status" }, container);
  tip.hidden = true;
  return {
    show(evt, lines) {
      tip.replaceChildren();
      lines.forEach((l, i) => html(i === 0 ? "strong" : "div", {}, tip, l));
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

function select(parent, labelText, options, value, onChange) {
  const wrap = html("label", { class: "eci-field" }, parent);
  html("span", {}, wrap, labelText);
  const s = html("select", {}, wrap);
  for (const [v, t] of options) {
    const o = html("option", { value: v }, s, t);
    if (v === value) o.selected = true;
  }
  s.addEventListener("change", () => onChange(s.value));
  return s;
}

function slider(parent, labelText, { min, max, step, value }, onInput) {
  const wrap = html("label", { class: "eci-field eci-slider" }, parent);
  const name = html("span", {}, wrap, labelText);
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
  return { input, name, set: v => ((input.value = String(v)), update()) };
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

function button(parent, text, onClick) {
  const b = html(
    "button",
    { type: "button", class: "eci-button" },
    parent,
    text
  );
  b.addEventListener("click", onClick);
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

// One benchmark's curve, with sliders for D and alpha.
charts.sigmoid = (root, d) => {
  const W = 640,
    H = 340,
    m = { l: 56, r: 16, t: 14, b: 48 };
  let key = "mathvision";
  const ctl = controls(root);
  const svg = svgRoot(root, W, H);
  const info = html("p", { class: "eci-note" }, root);
  const tip = tooltip(root);
  const x = linear([40, 180], [m.l, W - m.r]);
  const y = linear([0, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yFmt: t => `${t * 100}%`,
    xLabel: "Model capability (ECI)",
    yLabel: "Benchmark score",
  });
  const gResid = el("g", {}, svg);
  const midline = el("line", { stroke: DIM, "stroke-dasharray": "3 3" }, svg);
  const midText = el("text", { class: "eci-small", fill: DIM }, svg);
  const fitPath = el(
    "path",
    {
      fill: "none",
      stroke: DIM,
      "stroke-dasharray": "5 4",
      "stroke-width": 1.5,
    },
    svg
  );
  const path = el(
    "path",
    { fill: "none", stroke: ACCENT, "stroke-width": 3 },
    svg
  );
  const gPts = el("g", {}, svg);

  let D, alpha;
  const sD = slider(
    ctl,
    "Difficulty D",
    { min: 20, max: 180, step: 0.5, value: 100 },
    v => {
      D = v;
      draw();
      return v.toFixed(1);
    }
  );
  const sA = slider(
    ctl,
    "Slope α",
    { min: 0.005, max: 0.2, step: 0.001, value: 0.05 },
    v => {
      alpha = v;
      draw();
      return v.toFixed(3);
    }
  );
  select(ctl, "Benchmark", benchOptions(d), key, v => {
    key = v;
    reset();
  });
  button(ctl, "Reset to the fit", reset);

  function reset() {
    const b = d.benchMap.get(key);
    sD.set(b.D);
    sA.set(b.alpha);
  }

  function draw() {
    if (D === undefined || alpha === undefined) return;
    const b = d.benchMap.get(key);
    const pts = d.byBenchmark.get(key);
    path.setAttribute("d", curvePath(x, y, D, alpha, x.domain));
    fitPath.setAttribute("d", curvePath(x, y, b.D, b.alpha, x.domain));
    midline.setAttribute("x1", x(D));
    midline.setAttribute("x2", x(D));
    midline.setAttribute("y1", y(0));
    midline.setAttribute("y2", y(0.5));
    midText.setAttribute("x", x(D) + 4);
    midText.setAttribute("y", y(0) - 6);
    midText.textContent = "D (score 50%)";
    gResid.replaceChildren();
    gPts.replaceChildren();
    let sse = 0,
      sseFit = 0;
    for (const p of pts) {
      const yhat = sigmoid(alpha * (p.s.eci - D));
      sse += (yhat - p.y) ** 2;
      sseFit += (p.fit - p.y) ** 2;
      el(
        "line",
        {
          x1: x(p.s.eci),
          x2: x(p.s.eci),
          y1: y(p.y),
          y2: y(yhat),
          stroke: "#e15759",
          "stroke-width": 1.2,
          opacity: 0.7,
        },
        gResid
      );
      const c = el(
        "circle",
        { cx: x(p.s.eci), cy: y(p.y), r: 5, fill: FG, opacity: 0.85 },
        gPts
      );
      hoverable(c, tip, () => [
        label(p.s),
        `ECI ${fmt(p.s.eci)}`,
        `Score ${pct(p.y)}`,
        `Curve ${pct(sigmoid(alpha * (p.s.eci - D)))}`,
      ]);
    }
    info.textContent = `${b.label}: sum of squared errors ${sse.toFixed(4)} (least-squares fit: ${sseFit.toFixed(4)}, D = ${b.D.toFixed(1)}, α = ${b.alpha.toFixed(3)}). Red lines are the errors.`;
  }
  reset();
};

// The optimizer's path, from C = D = 0, alpha = 1 to the fit.
charts.optimization = (root, d) => {
  const W = 640,
    H = 420,
    m = { l: 56, r: 16, t: 14, b: 40 };
  const frames = d.frames;
  const settings = d.settings;
  const bIndex = new Map(d.benchmarks.map((b, i) => [b.key, i]));
  let key = "mathvision";
  const ctl = controls(root);
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const all = frames.flatMap(f => [...f.C, ...f.D]).filter(Number.isFinite);
  const lo = Math.floor(Math.min(...frames.at(-1).C, 40) / 10) * 10;
  const hi = Math.ceil(Math.max(...frames.at(-1).C, 170) / 10) * 10;
  const domain = [Math.min(lo, Math.floor(Math.min(...all) / 10) * 10), hi];
  const x = linear(domain, [m.l, W - m.r]);
  const yTop = linear([0, 1], [270, m.t]);
  axes(svg, x, yTop, {
    yTicks: [0, 0.5, 1],
    yFmt: t => `${t * 100}%`,
    yLabel: "Score",
  });
  // Strip of capabilities under the curves.
  const stripY = 330;
  el(
    "line",
    { x1: m.l, x2: W - m.r, y1: stripY, y2: stripY, stroke: DIM },
    svg
  );
  for (const t of niceTicks(...domain))
    el(
      "text",
      { x: x(t), y: stripY + 22, "text-anchor": "middle", class: "eci-small" },
      svg
    ).textContent = t;
  el(
    "text",
    {
      x: (m.l + W - m.r) / 2,
      y: stripY + 44,
      "text-anchor": "middle",
      class: "eci-axis-label",
    },
    svg
  ).textContent =
    "Model capability C (each dot is a model setting), on the final ECI scale";
  el(
    "text",
    { x: m.l, y: stripY - 10, class: "eci-small", fill: DIM },
    svg
  ).textContent = "Capabilities";
  const gCurves = el("g", {}, svg);
  const curves = d.benchmarks.map(() =>
    el("path", { fill: "none", stroke: FAINT, "stroke-width": 1.2 }, gCurves)
  );
  const sel = el(
    "path",
    { fill: "none", stroke: ACCENT, "stroke-width": 3 },
    svg
  );
  const gPts = el("g", {}, svg);
  const gStrip = el("g", {}, svg);
  const stepText = el(
    "text",
    { x: m.l + 8, y: m.t + 12, "text-anchor": "start", class: "eci-big" },
    svg
  );
  const sseText = el(
    "text",
    {
      x: m.l + 8,
      y: m.t + 30,
      "text-anchor": "start",
      class: "eci-small",
      fill: DIM,
    },
    svg
  );

  const dots = settings.map((s, i) => {
    const c = el(
      "circle",
      { r: 5, cy: stripY, fill: s.type === "open" ? ACCENT : FG, opacity: 0.8 },
      gStrip
    );
    hoverable(c, tip, () => [
      label(s),
      `C = ${fmt(lerp(t).C[i])} (final ${fmt(s.eci)})`,
    ]);
    return c;
  });

  let t = 0,
    playing = false,
    raf;
  const n = frames.length - 1;

  function lerp(tt) {
    const i = Math.min(Math.floor(tt), n - 1);
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
    f.D.forEach((D, i) =>
      curves[i].setAttribute("d", curvePath(x, yTop, D, f.alpha[i], domain))
    );
    const bi = bIndex.get(key);
    sel.setAttribute("d", curvePath(x, yTop, f.D[bi], f.alpha[bi], domain));
    gPts.replaceChildren();
    for (const p of d.byBenchmark.get(key)) {
      const i = settings.indexOf(p.s);
      const c = el(
        "circle",
        { cx: x(f.C[i]), cy: yTop(p.y), r: 4.5, fill: FG, opacity: 0.85 },
        gPts
      );
      hoverable(c, tip, [label(p.s), `Score ${pct(p.y)}`]);
    }
    dots.forEach((c, i) => c.setAttribute("cx", x(f.C[i])));
    stepText.textContent = `Step ${Math.round(t)} / ${n}`;
    sseText.textContent = `Sum of squared errors: ${f.sse.toFixed(3)}`;
    scrub.set(t);
  }

  const play = button(ctl, "Play", () => (playing ? stop() : start()));
  const scrub = slider(
    ctl,
    "Step",
    { min: 0, max: n, step: 0.01, value: 0 },
    v => {
      if (Math.abs(v - t) > 1e-6) {
        t = v;
        stop();
        draw();
      }
      return "";
    }
  );
  scrub.name.textContent = "Step";
  select(ctl, "Benchmark", benchOptions(d), key, v => {
    key = v;
    draw();
  });

  function start() {
    if (t >= n) t = 0;
    playing = true;
    play.textContent = "Pause";
    let last = performance.now();
    const tick = now => {
      t = Math.min(n, t + ((now - last) / 1000) * 1.6);
      last = now;
      draw();
      if (t < n && playing) raf = requestAnimationFrame(tick);
      else stop();
    };
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    playing = false;
    play.textContent = "Play";
    cancelAnimationFrame(raf);
  }
  draw();
};

// Models ranked by an index, switchable.
charts.ranking = (root, d) => {
  const metrics = [
    ["eci", "ECI (all)"],
    ["text", "ECI (text)"],
    ["multimodal", "ECI (multimodal)"],
    ["mean", "Mean score"],
    ["sem_all", "SEM-ECI (item level)"],
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
      ).textContent = `${label(s)}${s.text_only ? " †" : ""}`;
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
        `ECI ${fmt(s.eci)} · text ${fmt(s.text)} · multimodal ${fmt(s.multimodal)}`,
        `Mean score ${pct(s.mean)} over ${s.n_scores} benchmarks`,
        `SEM-ECI ${fmt(s.sem_all)}`,
      ]);
      return [s.key, { g, bar, val }];
    })
  );
  legend(root, [
    ["Proprietary", FG],
    ["Open weights", ACCENT],
  ]);
  html(
    "p",
    { class: "eci-note" },
    root,
    "† Text-only model: its ECI comes from 8 text benchmarks only."
  );

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

// Every benchmark's fitted curve, like the SEM-ECI trends page.
charts.curves = (root, d) => {
  const W = 640,
    H = 380,
    m = { l: 56, r: 16, t: 14, b: 48 };
  const ctl = controls(root);
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const x = linear([20, 200], [m.l, W - m.r]);
  const y = linear([0, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yFmt: t => `${t * 100}%`,
    xLabel: "Model capability (ECI)",
    yLabel: "Expected score",
  });
  // Where the models are.
  const [cmin, cmax] = [
    Math.min(...d.settings.map(s => s.eci)),
    Math.max(...d.settings.map(s => s.eci)),
  ];
  el(
    "rect",
    {
      x: x(cmin),
      y: m.t,
      width: x(cmax) - x(cmin),
      height: H - m.b - m.t,
      fill: FAINT,
      opacity: 0.5,
    },
    svg
  );
  el(
    "text",
    { x: x(cmin) + 4, y: m.t + 12, class: "eci-small", fill: DIM },
    svg
  ).textContent = "range of the models";
  const gCurves = el("g", {}, svg);
  const gPts = el("g", {}, svg);
  let active = null;
  const paths = new Map(
    d.benchmarks.map(b => {
      const p = el(
        "path",
        {
          d: curvePath(x, y, b.D, b.alpha, x.domain),
          fill: "none",
          stroke: CATEGORY_COLORS[b.category],
          "stroke-width": 2,
          opacity: 0.55,
        },
        gCurves
      );
      hoverable(
        p,
        tip,
        () => [
          b.label,
          `${b.category} · ${b.lang === "ja" ? "Japanese" : "English"}`,
          `D ${fmt(b.D)} · α ${b.alpha.toFixed(3)}`,
          `Fit R² ${fmt(b.r2, 2)}`,
        ],
        () => highlight(b.key),
        () => highlight(chosen.value || null)
      );
      return [b.key, p];
    })
  );
  const chosen = select(
    ctl,
    "Highlight",
    [["", "None"], ...benchOptions(d)],
    "",
    v => highlight(v || null)
  );

  function highlight(key) {
    if (key === active) return;
    active = key;
    for (const [k, p] of paths) {
      p.setAttribute("opacity", key ? (k === key ? 1 : 0.12) : 0.55);
      p.setAttribute("stroke-width", k === key ? 3.5 : 2);
    }
    if (key) gCurves.appendChild(paths.get(key));
    gPts.replaceChildren();
    if (!key) return;
    for (const p of d.byBenchmark.get(key)) {
      const c = el(
        "circle",
        { cx: x(p.s.eci), cy: y(p.y), r: 4.5, fill: FG, opacity: 0.85 },
        gPts
      );
      hoverable(c, tip, [
        label(p.s),
        `ECI ${fmt(p.s.eci)}`,
        `Score ${pct(p.y)} (curve ${pct(p.fit)})`,
      ]);
    }
  }
  legend(
    root,
    Object.entries(CATEGORY_COLORS)
      .filter(([c]) => d.benchmarks.some(b => b.category === c))
      .map(([c, col]) => [c, col, "line"])
  );
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
    "ECI (dot: difficulty D, where the expected score is 50%; bar: 10% to 90%)";
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
      `D ${fmt(b.D)} · α ${b.alpha.toFixed(3)}`,
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

charts["mean-vs-eci"] = (root, d) => {
  scatter(
    root,
    d.settings.map(s => ({
      x: s.mean * 100,
      y: s.eci,
      color: s.type === "open" ? ACCENT : FG,
      hollow: s.text_only,
      tip: [
        label(s),
        `Mean score ${pct(s.mean)} (${s.n_scores} benchmarks)`,
        `ECI ${fmt(s.eci)}`,
      ],
    })),
    {
      xDomain: [30, 95],
      yDomain: [60, 155],
      xLabel: "Mean score over the model's benchmarks (%)",
      yLabel: "ECI",
    }
  );
  legend(root, [
    ["Proprietary", FG],
    ["Open weights", ACCENT],
    ["Text-only (8 text benchmarks)", ACCENT, "ring"],
  ]);
};

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
    if (Math.abs(diff) > 6)
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
    ["Not evaluated", "transparent", "ring"],
  ]);
  html(
    "p",
    { class: "eci-note" },
    root,
    "Rows: settings by ECI. Columns: benchmarks from easiest to hardest. Darker means a larger gap (30 points or more is darkest)."
  );
};

// Ranking agreement as scores go missing.
charts.robustness = (root, d) => {
  let scenario = "difficulty";
  const ctl = controls(root);
  toggle(
    ctl,
    [
      ["difficulty", "Missing by difficulty"],
      ["random", "Missing at random"],
    ],
    scenario,
    v => {
      scenario = v;
      draw();
    }
  );
  const W = 640,
    H = 340,
    m = { l: 60, r: 20, t: 14, b: 48 };
  const svg = svgRoot(root, W, H);
  const tip = tooltip(root);
  const x = linear([0, 0.7], [m.l, W - m.r]);
  const y = linear([0.4, 1], [H - m.b, m.t]);
  axes(svg, x, y, {
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    xFmt: t => `${Math.round(t * 100)}%`,
    yFmt: t => t.toFixed(1),
    xLabel: "Share of scores removed",
    yLabel: "Kendall τ with the full mean ranking",
  });
  const g = el("g", {}, svg);
  function draw() {
    g.replaceChildren();
    const rows = d.robustness.filter(r => r.scenario === scenario);
    for (const [k, col, name] of [
      ["mean", DIM, "Mean of available scores"],
      ["eci", ACCENT, "ECI"],
    ]) {
      const band = rows
        .map(r => `${x(r.p)},${y(r[k][2])}`)
        .concat(rows.map(r => `${x(r.p)},${y(r[k][1])}`).reverse());
      el("polygon", { points: band.join(" "), fill: col, opacity: 0.15 }, g);
      el(
        "polyline",
        {
          points: rows.map(r => `${x(r.p)},${y(r[k][0])}`).join(" "),
          fill: "none",
          stroke: col,
          "stroke-width": 2.5,
        },
        g
      );
      for (const r of rows) {
        const c = el(
          "circle",
          { cx: x(r.p), cy: y(r[k][0]), r: 4, fill: col },
          g
        );
        hoverable(c, tip, [
          name,
          `${Math.round(r.p * 100)}% removed`,
          `τ = ${r[k][0].toFixed(3)} (10–90%: ${r[k][1].toFixed(2)}–${r[k][2].toFixed(2)})`,
        ]);
      }
    }
  }
  draw();
  legend(root, [
    ["ECI", ACCENT, "line"],
    ["Mean of available scores", DIM, "line"],
  ]);
  html(
    "p",
    { class: "eci-note" },
    root,
    "Missing by difficulty: the weaker half of the models lose scores on the hardest third of the benchmarks, the stronger half on the easiest third, each with the given probability. Bands: 10th to 90th percentile over 30 draws."
  );
};

charts.sem = (root, d) => {
  scatter(
    root,
    d.settings
      .filter(s => s.sem_all)
      .map(s => ({
        x: s.eci,
        y: s.sem_all,
        color: s.type === "open" ? ACCENT : FG,
        tip: [
          label(s),
          `ECI (benchmark level, least squares) ${fmt(s.eci)}`,
          `SEM-ECI (question level) ${fmt(s.sem_all)}`,
          `Difference ${(s.sem_all - s.eci).toFixed(1)}`,
        ],
      })),
    {
      xDomain: [60, 155],
      yDomain: [60, 155],
      xLabel: "ECI, this post (benchmark scores, least squares)",
      yLabel: "SEM-ECI (every question)",
      diagonal: true,
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
      hollow: s.text_only,
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
.eci-svg text{fill:var(--foreground);font-size:11px}
.eci-svg .eci-small{font-size:10.5px}
.eci-svg .eci-tiny{font-size:9.5px}
.eci-svg .eci-big{font-size:14px;font-weight:600}
.eci-svg .eci-axis-label{font-size:11.5px;opacity:.8}
.eci-axis text{opacity:.7}
.eci-wide{max-width:none}
.eci-chart:has(.eci-wide){overflow-x:auto}
.eci-controls{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;margin-bottom:.5rem}
.eci-field{display:inline-flex;gap:.4rem;align-items:center}
.eci-field select{border:1px solid var(--border);background:var(--background);color:inherit;border-radius:.4rem;padding:.15rem .3rem}
.eci-slider input{width:8.5rem;accent-color:var(--accent)}
.eci-slider output{font-variant-numeric:tabular-nums;min-width:3.2rem}
.eci-toggle{display:inline-flex;flex-wrap:wrap;gap:.25rem}
.eci-toggle button,.eci-button{border:1px solid var(--border);border-radius:999px;padding:.15rem .7rem;background:var(--background);color:inherit;cursor:pointer}
.eci-toggle button[aria-pressed=true]{background:var(--foreground);color:var(--background);border-color:var(--foreground)}
.eci-legend{display:flex;flex-wrap:wrap;gap:.2rem .9rem;margin-top:.3rem;opacity:.85}
.eci-legend span{display:inline-flex;align-items:center;gap:.35rem}
.eci-legend i{display:inline-block;width:.7rem;height:.7rem;border-radius:50%;box-sizing:border-box}
.eci-legend i.line{height:.2rem;width:1rem;border-radius:2px}
.eci-note{margin:.4rem 0 0;opacity:.75;font-size:.78rem;line-height:1.5}
.eci-tip{position:absolute;z-index:5;pointer-events:none;background:var(--background);border:1px solid var(--border);border-radius:.5rem;padding:.4rem .6rem;box-shadow:0 4px 14px rgb(0 0 0/.15);font-size:.75rem;line-height:1.45;max-width:18rem}
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
