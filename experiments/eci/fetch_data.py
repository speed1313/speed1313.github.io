"""Download the simple-evals-mm leaderboard and save a compact snapshot.

The leaderboard (https://llm-jp.github.io/simple-evals-mm/) publishes its
results as `data.js` and its SEM-ECI fit as `trends.js`. This keeps what the
experiment needs: one score per (setting, benchmark), the benchmark metadata,
and SEM-ECI for comparison.

    uv run fetch_data.py
"""

import json
import re
import urllib.request
from pathlib import Path

SITE = "https://llm-jp.github.io/simple-evals-mm"
OUT = Path(__file__).parent / "data" / "leaderboard.json"


def load_js_object(url: str, name: str) -> dict:
    """Parse `window.NAME = {...};` into a dict."""
    with urllib.request.urlopen(url) as r:
        text = r.read().decode("utf-8")
    m = re.search(rf"window\.{name}\s*=\s*", text)
    if not m:
        raise ValueError(f"window.{name} not found in {url}")
    obj, _ = json.JSONDecoder().raw_decode(text[m.end() :])
    return obj


def main() -> None:
    lb = load_js_object(f"{SITE}/data.js", "LB")
    trends = load_js_object(f"{SITE}/trends.js", "TRENDS")

    tasks = [
        {
            "key": t["key"],
            "label": t["label"],
            "category": t["category"],
            "lang": t["lang"],
            # Benchmark level: the "Text" category has no images.
            "modality": "text" if t["category"] == "Text" else "multimodal",
            "n": t["n"],
            "guess": trends["indices"]["all"]["guess"].get(t["key"], 0.0),
        }
        for t in lb["tasks"]
    ]

    settings, scores = [], []
    for m in lb["models"]:
        for cfg in ("max", "low"):
            c = m.get(cfg)
            if not c:
                continue
            key = f"{m['key']}__{c['label']}"
            settings.append(
                {
                    "key": key,
                    "model": m["name"],
                    "effort": c["label"],
                    "dev": m["dev"],
                    "type": m["type"],
                    "released": m["released"],
                    "params_b": m["params_b"],
                    # "max" is the highest effort the leaderboard ran.
                    "best": cfg == "max",
                }
            )
            for task, r in c["tasks"].items():
                if r and r.get("score") is not None:
                    scores.append([key, task, round(r["score"] / 100, 6)])

    sem = {}
    for name, idx in trends["indices"].items():
        sem[name] = {
            "anchors": idx["anchors"],
            "index": {s["key"]: s["index"] for s in idx["settings"]},
            "index_benchmark_level": {
                s["key"]: s.get("index_benchmark_level") for s in idx["settings"]
            },
            "fits": idx.get("fits", {}),
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "source": SITE,
                "updated": lb["updated"],
                "tasks": tasks,
                "settings": settings,
                "scores": scores,
                "sem_eci": sem,
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n"
    )
    print(
        f"{len(settings)} settings, {len(tasks)} benchmarks, "
        f"{len(scores)} scores (updated {lb['updated']}) -> {OUT}"
    )


if __name__ == "__main__":
    main()
