# Experiments

Code behind posts that run their own experiments. Each experiment lives in a directory named after the post's slug, so `experiments/<slug>/` belongs to `src/data/blog/<slug>/`.

```
experiments/<slug>/
├── README.md        # what it does and how to run it
├── pyproject.toml   # its own environment (uv)
├── uv.lock
├── data/            # inputs, small enough to commit (snapshots of public data)
└── *.py             # scripts
```

- Each experiment is its own [uv](https://docs.astral.sh/uv/) project, so experiments do not share or break each other's dependencies. Run scripts with `uv run <script>.py` from the experiment's directory.
- Scripts write what the post needs (figures, or JSON for interactive charts) into `src/data/blog/<slug>/`, so a rerun updates the post. Keep large or intermediate outputs out of the repository.
- Save a snapshot of any external data in `data/` with its source and date, so results can be reproduced after the source changes.
- The site's build, lint, and format ignore this directory.
