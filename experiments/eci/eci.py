"""The ECI model of "A Rosetta Stone for AI Benchmarks" (Ho et al., 2025).

    score(m, b) = sigmoid(alpha_b * (C_m - D_b))

C_m is a model's capability, D_b a benchmark's difficulty and alpha_b its
slope. They are fitted by least squares with L2 regularization, as in the
paper's Section 2.3 and Epoch AI's description of the original (pre-Bayesian)
fit:

    min  sum (pred - obs)^2 + lam * (sum_b (alpha_b^2 + D_b^2) + sum_m C_m^2)
    lam = 0.1 / (M + 2B - 2),  alpha in [0.1, 10],  C, D in [-10, 10]

One benchmark (the anchor) has alpha = 1 and D = 0 fixed, which removes the
scale and shift that the model cannot identify. Everything starts at C = D = 0
and alpha = 1. Scores are fractions in [0, 1].
"""

from dataclasses import dataclass, field

import numpy as np
from scipy.optimize import least_squares
from scipy.special import expit

REG = 0.1
BOUND = 10.0
ALPHA_MIN, ALPHA_MAX = 0.1, 10.0


@dataclass
class Fit:
    models: list[str]
    benchmarks: list[str]
    C: np.ndarray  # (M,)
    D: np.ndarray  # (B,)
    alpha: np.ndarray  # (B,)
    cost: float
    # Accepted iterates of the optimizer: (C, D, alpha, sum of squared errors).
    trace: list[tuple[np.ndarray, np.ndarray, np.ndarray, float]] = field(
        default_factory=list
    )

    def predict(self, m: int | np.ndarray, b: int | np.ndarray) -> np.ndarray:
        return expit(self.alpha[b] * (self.C[m] - self.D[b]))


def fit(
    models: list[str],
    benchmarks: list[str],
    obs: list[tuple[str, str, float]],
    anchor: str,
    reg: float = REG,
    record: bool = False,
) -> Fit:
    """Fit C, D, alpha to the observed (model, benchmark, score) triples."""
    mi = {m: i for i, m in enumerate(models)}
    bi = {b: i for i, b in enumerate(benchmarks)}
    rows = [(mi[m], bi[b], y) for m, b, y in obs if m in mi and b in bi]
    m_idx = np.array([r[0] for r in rows])
    b_idx = np.array([r[1] for r in rows])
    y = np.array([r[2] for r in rows])
    M, B = len(models), len(benchmarks)
    a = bi[anchor]
    free = np.array([i for i in range(B) if i != a])  # benchmarks with free D, alpha
    lam = reg / (M + 2 * B - 2)
    sl = np.sqrt(lam)

    def unpack(x):
        C = x[:M]
        D = np.zeros(B)
        alpha = np.ones(B)
        D[free] = x[M : M + B - 1]
        alpha[free] = x[M + B - 1 :]
        return C, D, alpha

    def residuals(x):
        C, D, alpha = unpack(x)
        pred = expit(alpha[b_idx] * (C[m_idx] - D[b_idx]))
        # Regularization as extra residuals: sum of their squares is
        # lam * (sum C^2 + sum D^2 + sum alpha^2) over the free parameters.
        return np.concatenate([pred - y, sl * x])

    n_obs, n_par = len(y), M + 2 * (B - 1)
    # Position of each benchmark's free parameters in x (-1 for the anchor).
    d_pos = np.full(B, -1)
    d_pos[free] = M + np.arange(B - 1)
    a_pos = np.full(B, -1)
    a_pos[free] = M + B - 1 + np.arange(B - 1)

    def jacobian(x):
        C, D, alpha = unpack(x)
        z = C[m_idx] - D[b_idx]
        p = expit(alpha[b_idx] * z)
        dp = p * (1 - p)
        J = np.zeros((n_obs + n_par, n_par))
        rows_ = np.arange(n_obs)
        J[rows_, m_idx] = dp * alpha[b_idx]
        has = d_pos[b_idx] >= 0
        J[rows_[has], d_pos[b_idx][has]] = -(dp * alpha[b_idx])[has]
        J[rows_[has], a_pos[b_idx][has]] = (dp * z)[has]
        J[n_obs:, :] = sl * np.eye(n_par)
        return J

    x0 = np.concatenate([np.zeros(M), np.zeros(B - 1), np.ones(B - 1)])
    lo = np.concatenate([np.full(M + B - 1, -BOUND), np.full(B - 1, ALPHA_MIN)])
    hi = np.concatenate([np.full(M + B - 1, BOUND), np.full(B - 1, ALPHA_MAX)])

    trace = []
    best = [np.inf]

    def recorded(x):
        r = residuals(x)
        if record:
            cost = float(np.sum(r**2))
            if cost < best[0]:  # an accepted step lowers the cost
                best[0] = cost
                C, D, alpha = unpack(x)
                sse = float(np.sum(r[:n_obs] ** 2))
                trace.append((C.copy(), D.copy(), alpha.copy(), sse))
        return r

    res = least_squares(recorded, x0, jac=jacobian, bounds=(lo, hi), method="trf")
    C, D, alpha = unpack(res.x)
    return Fit(models, benchmarks, C, D, alpha, float(2 * res.cost), trace)


def refit_capabilities(
    fit_: Fit,
    obs: list[tuple[str, str, float]],
    reg: float = REG,
) -> dict[str, float]:
    """Re-estimate each model's C with D and alpha fixed (a domain index).

    As in Epoch AI's domain-specific ECI: the benchmark parameters come from
    the general fit, and only the capabilities are refitted, on `obs`.
    """
    bi = {b: i for i, b in enumerate(fit_.benchmarks)}
    out = {}
    by_model: dict[str, list[tuple[int, float]]] = {}
    for m, b, y in obs:
        if b in bi:
            by_model.setdefault(m, []).append((bi[b], y))
    lam = reg / (len(fit_.models) + 2 * len(fit_.benchmarks) - 2)
    for m, pts in by_model.items():
        b_idx = np.array([p[0] for p in pts])
        y = np.array([p[1] for p in pts])
        al, D = fit_.alpha[b_idx], fit_.D[b_idx]

        def r(x):
            return np.concatenate([expit(al * (x[0] - D)) - y, [np.sqrt(lam) * x[0]]])

        res = least_squares(r, [0.0], bounds=([-BOUND], [BOUND]))
        out[m] = float(res.x[0])
    return out


def rescale(anchors: dict[str, float], C: dict[str, float]) -> tuple[float, float]:
    """Return (scale, shift) mapping raw C to the index: index = scale*C + shift.

    `anchors` gives two models and their index values (e.g. Epoch uses
    Claude 3.5 Sonnet = 130 and GPT-5 = 150).
    """
    (m1, v1), (m2, v2) = anchors.items()
    scale = (v2 - v1) / (C[m2] - C[m1])
    return scale, v1 - scale * C[m1]
