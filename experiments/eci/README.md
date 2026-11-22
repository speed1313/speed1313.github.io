# ECI on simple-evals-mm

Experiments for the post [Epoch Capabilities Index (ECI) を理解する](https://speed1313.github.io/posts/eci/). They fit the ECI model of [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193) (least squares with L2 regularization) to the [simple-evals-mm leaderboard](https://llm-jp.github.io/simple-evals-mm/).

```sh
cd experiments/eci
uv run fetch_data.py   # refresh data/leaderboard.json from the leaderboard (optional)
uv run run.py          # fit and analyze -> src/data/blog/eci/eci-data.json
```

| File | Contents |
| --- | --- |
| `eci.py` | The model, `score = sigmoid(alpha_b (C_m - D_b))`, its fit (`scipy.optimize.least_squares`, with the optimizer's path), domain refits, and rescaling to an index. |
| `fetch_data.py` | Downloads the leaderboard's `data.js` and `trends.js` and keeps one score per (setting, benchmark), benchmark metadata, and SEM-ECI. |
| `run.py` | Main fit, optimization path, text and multimodal indices, leave-one-out prediction, robustness to missing scores (random and band), and the frontier trend of Epoch AI's ECI. |
| `data/leaderboard.json` | Snapshot of the leaderboard (updated 2026-11-21). |
| `data/epoch_eci_scores.csv` | Epoch AI's published ECI scores (retrieved 2026-11-23, [CC BY 4.0](https://epoch.ai/eci)), for the frontier trend. |

The interactive charts in the post (`src/data/blog/eci/eci-charts.js`) read `eci-data.json`.
