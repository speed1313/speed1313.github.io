"""Run every analysis in the ECI post and write the data its charts use.

    uv run fetch_data.py   # refresh data/leaderboard.json (optional)
    uv run run.py          # -> src/data/blog/eci/eci-data.json

Each model enters with its highest reasoning effort only, and text-only
models are left out, so every model has a score on every benchmark (13 models
x 27 benchmarks). The index is anchored at GPT-6 Astra = 150 and
Qwen3.5-9B = 100, as SEM-ECI on the leaderboard.
"""

import json
from pathlib import Path

import numpy as np
from scipy.stats import kendalltau

import eci

HERE = Path(__file__).parent
DATA = HERE / "data" / "leaderboard.json"
OUT = HERE.parent.parent / "src" / "data" / "blog" / "eci" / "eci-data.json"

ANCHOR_BENCHMARK = "gpqa"
# Benchmarks in a multimodal category whose text questions a text-only model
# can still answer (its score then covers those questions only).
HAS_TEXT_QUESTIONS = {"hle_diamond"}
ANCHORS = {"qwen35-9b__thinking": 100.0, "gpt6-astra__max": 150.0}
SEED = 0


def r(x, n=3):
    return None if x is None else round(float(x), n)


def main() -> None:
    d = json.loads(DATA.read_text())
    tasks = {t["key"]: t for t in d["tasks"]}
    benchmarks = list(tasks)
    all_scores = {(m, b): y for m, b, y in d["scores"]}
    # A text-only model has no score on a benchmark without text questions.
    text_only = {
        s["key"]
        for s in d["settings"]
        if all(tasks[b]["modality"] == "text" or b in HAS_TEXT_QUESTIONS for (m, b) in all_scores if m == s["key"])
    }
    settings = {s["key"]: s for s in d["settings"] if s["best"] and s["key"] not in text_only}
    models = list(settings)
    obs = [(m, b, y) for m, b, y in d["scores"] if m in settings]
    score = {(m, b): y for m, b, y in obs}
    assert len(obs) == len(models) * len(benchmarks), "expected a complete matrix"

    # --- Main fit -----------------------------------------------------------
    full = eci.fit(models, benchmarks, obs, ANCHOR_BENCHMARK, record=True)
    C = dict(zip(models, full.C))
    scale, shift = eci.rescale(ANCHORS, C)

    def to_index(c):
        return scale * c + shift

    pred = {(m, b): float(full.predict(models.index(m), benchmarks.index(b))) for m, b, _ in obs}

    # --- Domain indices: refit capabilities only, on each modality ----------
    domains = {}
    for dom in ("text", "multimodal"):
        sub = [o for o in obs if tasks[o[1]]["modality"] == dom]
        domains[dom] = {m: to_index(c) for m, c in eci.refit_capabilities(full, sub).items()}

    # --- Leave-one-out: predict each score from a fit without it ------------
    loo = {}
    for k, (m, b, y) in enumerate(obs):
        rest = obs[:k] + obs[k + 1 :]
        f = eci.fit(models, benchmarks, rest, ANCHOR_BENCHMARK)
        loo[(m, b)] = float(f.predict(models.index(m), benchmarks.index(b)))
    # Baseline: the benchmark's average over the other settings.
    bench_avg = {}
    for m, b, _ in obs:
        others = [y for (m2, b2), y in score.items() if b2 == b and m2 != m]
        bench_avg[(m, b)] = float(np.mean(others))
    ys = np.array([y for _, _, y in obs])

    def rmse(p):
        return float(np.sqrt(np.mean((np.array([p[(m, b)] for m, b, _ in obs]) - ys) ** 2)))

    # --- Missing scores: does the ranking survive? ---------------------------
    # Ground truth: the mean over all 27 benchmarks, for the settings that
    # have all of them (the text-only model is left out).
    complete = [m for m in models if all((m, b) in score for b in benchmarks)]
    true_mean = {m: np.mean([score[(m, b)] for b in benchmarks]) for m in complete}
    order_D = sorted(benchmarks, key=lambda b: full.D[benchmarks.index(b)])
    third = len(benchmarks) // 3
    easy, hard = set(order_D[:third]), set(order_D[-third:])
    strong = set(sorted(complete, key=lambda m: -true_mean[m])[: len(complete) // 2])
    rng = np.random.default_rng(SEED)

    def drop(p, scenario):
        kept = []
        for m in complete:
            mine = []
            for b in benchmarks:
                if scenario == "random":
                    q = p
                else:  # older (weaker) models miss hard benchmarks, newer miss easy ones
                    q = p if (b in hard and m not in strong) or (b in easy and m in strong) else 0
                if rng.random() >= q:
                    mine.append((m, b, score[(m, b)]))
            if len(mine) < 4:  # Epoch requires 4 benchmarks for an index
                keep_b = rng.choice(benchmarks, 4, replace=False)
                mine = [(m, b, score[(m, b)]) for b in keep_b]
            kept += mine
        return kept

    def tau(est):
        t = [true_mean[m] for m in complete]
        return float(kendalltau(t, [est[m] for m in complete]).statistic)

    robustness = []
    for scenario in ("random", "difficulty"):
        for p in [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]:
            taus_mean, taus_eci = [], []
            for _ in range(30 if p > 0 else 1):
                kept = drop(p, scenario)
                by_m = {}
                for m, b, y in kept:
                    by_m.setdefault(m, []).append(y)
                taus_mean.append(tau({m: np.mean(v) for m, v in by_m.items()}))
                present = sorted({b for _, b, _ in kept}, key=benchmarks.index)
                anchor = max(present, key=lambda b: sum(1 for _, b2, _ in kept if b2 == b))
                f = eci.fit(complete, present, kept, anchor)
                taus_eci.append(tau(dict(zip(complete, f.C))))
            robustness.append(
                {
                    "scenario": scenario,
                    "p": p,
                    "mean": [r(np.mean(taus_mean)), r(np.percentile(taus_mean, 10)), r(np.percentile(taus_mean, 90))],
                    "eci": [r(np.mean(taus_eci)), r(np.percentile(taus_eci, 10)), r(np.percentile(taus_eci, 90))],
                }
            )

    # --- Optimization path, on the final index scale --------------------------
    frames = [
        {
            "C": [r(to_index(c), 2) for c in Cs],
            "D": [r(to_index(x), 2) for x in Ds],
            "alpha": [r(a / scale, 5) for a in As],
            "sse": r(sse, 4),
        }
        for Cs, Ds, As, sse in full.trace
    ]

    # --- Per-benchmark fit quality -------------------------------------------
    bench_out = []
    for i, b in enumerate(benchmarks):
        pts = [(y, pred[(m, b)]) for m, b2, y in obs if b2 == b]
        yb = np.array([p[0] for p in pts])
        pb = np.array([p[1] for p in pts])
        ss = np.sum((yb - yb.mean()) ** 2)
        t = tasks[b]
        bench_out.append(
            {
                "key": b,
                "label": t["label"],
                "category": t["category"],
                "lang": t["lang"],
                "modality": t["modality"],
                "guess": t["guess"],
                "n_obs": len(pts),
                "D": r(to_index(full.D[i]), 2),
                "alpha": r(full.alpha[i] / scale, 5),
                "rmse": r(np.sqrt(np.mean((yb - pb) ** 2)), 4),
                "r2": r(1 - np.sum((yb - pb) ** 2) / ss if ss > 0 else None, 3),
                "mean": r(yb.mean(), 4),
            }
        )

    setting_out = []
    for m in models:
        s = settings[m]
        mine = [y for (m2, _), y in score.items() if m2 == m]
        setting_out.append(
            {
                "key": m,
                "model": s["model"],
                "effort": s["effort"],
                "dev": s["dev"],
                "type": s["type"],
                "released": s["released"],
                "params_b": s["params_b"],
                "n_scores": len(mine),
                "eci": r(to_index(C[m]), 2),
                "mean": r(np.mean(mine), 4),
                "text": r(domains["text"].get(m), 2),
                "multimodal": r(domains["multimodal"].get(m), 2),
            }
        )

    out = {
        "source": d["source"],
        "updated": d["updated"],
        "anchors": ANCHORS,
        "anchor_benchmark": ANCHOR_BENCHMARK,
        "scale": r(scale, 4),
        "shift": r(shift, 4),
        "fit": {
            "rmse": rmse(pred),
            "r2": r(1 - np.sum((np.array([pred[(m, b)] for m, b, _ in obs]) - ys) ** 2) / np.sum((ys - ys.mean()) ** 2), 4),
            "n_obs": len(obs),
        },
        "prediction": {
            "rmse_loo": r(rmse(loo), 4),
            "rmse_bench_avg": r(rmse(bench_avg), 4),
        },
        "settings": setting_out,
        "benchmarks": bench_out,
        # [setting, benchmark, actual, fitted, leave-one-out prediction]
        "scores": [[m, b, r(y, 4), r(pred[(m, b)], 4), r(loo[(m, b)], 4)] for m, b, y in obs],
        "frames": frames,
        "robustness": robustness,
        "robustness_full_tau": r(tau({m: C[m] for m in complete})),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"R2 {out['fit']['r2']}, RMSE {out['fit']['rmse']:.4f}")
    print(f"held-out RMSE: ECI {out['prediction']['rmse_loo']}, benchmark average {out['prediction']['rmse_bench_avg']}")
    print(f"{len(frames)} optimizer frames; full-data tau(ECI, mean) = {out['robustness_full_tau']}")
    for row in robustness:
        print(row)
    print(f"-> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
