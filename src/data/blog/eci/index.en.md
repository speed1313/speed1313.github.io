---
title: "Understanding the Epoch Capabilities Index (ECI)"
description: "How ECI estimates an overall capability value for AI models, and how to interpret and use it, using real evaluation results."
translatedDatetime: 2026-11-23
---

## Introduction

As AI models improve rapidly, the Epoch Capabilities Index ([ECI](https://epoch.ai/eci)), developed by Epoch AI, has drawn attention as a measure for tracking that improvement over the long run. [OpenAI](https://openai.com/index/research-acceleration-jagged-frontier/) and [Anthropic](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf) also compute their own versions of ECI and use them to monitor how fast model development is accelerating.

This post first explains the basic method behind ECI. It then computes ECI from the scores on the leaderboard of the evaluation library [simple-evals-mm](https://llm-jp.github.io/simple-evals-mm/), and shows how to interpret ECI and what it can be used for.

## How do we follow the long-term trend of AI capabilities?

When following the improvement of AI models over the long run, it is convenient to express each model's overall capability as a single value. It makes comparisons between models and changes over time easy to see. ECI is one way of obtaining such a value.

The simplest way to express capability as a single value is to evaluate the models of interest on a fixed set of benchmarks and average their scores. For example, Artificial Analysis's [Intelligence Index](https://artificialanalysis.ai/methodology/intelligence-benchmarking) (v5) compares models by a weighted average of their scores on nine difficult benchmarks.

However, following a long-term trend this way runs into the following problems:

- A comparison needs the score of every (model, benchmark) pair. Each new model has to be evaluated on every benchmark in the set, and older models have to be re-evaluated on every benchmark added to it.
- The set has to be replaced whenever its benchmarks saturate, and scores from before and after a replacement can no longer be compared.

ECI addresses these problems. It estimates the capabilities of AI models and the difficulties of benchmarks together, from whatever (model, benchmark) results are available.

- The scores of all pairs are not needed. Past results are reused as they are, and by simply adding the results of new models and new benchmarks, old and new models evaluated on different benchmarks can be compared on the same scale.
- Because the difficulty of each benchmark is estimated, how much a benchmark affects the estimated differences between models depends on its difficulty. A saturated benchmark, on which the top models score nearly 100%, barely affects the estimated differences between those models, while a hard benchmark, on which even the top models' scores differ, largely determines them. So the long-term trend can be followed by adding new, harder benchmarks, without replacing the set.

## How ECI works

### The statistical model

ECI models the score of AI model $m$ on benchmark $b$ with a statistical model based on the following logistic function:

$$
\text{score}(m, b) = \sigma\bigl(\alpha_b (C_m - D_b)\bigr), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}
$$

- $C_m$: the capability of AI model $m$
- $D_b$: the difficulty of benchmark $b$. When $C_m = D_b$, the score is exactly 50%.
- $\alpha_b$: the slope of benchmark $b$. The larger it is, the more sharply the score rises around the difficulty.

The figure below shows the relationship between capability and score in ECI's statistical model. The more the capability $C_m$ exceeds the difficulty $D_b$, the closer the score gets to 100%, and the more it falls below, the closer the score gets to 0%. $D_b$ shifts the curve left or right, and $\alpha_b$ sets how steeply it rises. A benchmark with a large slope can tell AI models apart only within a narrow range of capability near its difficulty $D_b$, and it saturates quickly.

<figure>
<div data-eci-chart="sigmoid"></div>
<figcaption>The relationship between an AI model's capability <i>C</i><sub>m</sub> and its score on a benchmark, in ECI's statistical model.</figcaption>
</figure>

### How the parameters are estimated

ECI estimates $C_m$, $D_b$, and $\alpha_b$ together by least squares, using the scores $y_{m,b}$ of the (model, benchmark) pairs that are available (for simplicity, the regularization term is omitted here):

$$
\min_{C, D, \alpha} \sum_{(m, b)} \bigl(\text{score}(m, b) - y_{m,b}\bigr)^2
$$

The sum runs only over the available scores, so the estimate works even when some scores are missing.

However, this optimization has no unique solution: adding the same value to every $C_m$ and $D_b$, or scaling everything by a constant, does not change the predictions of ECI's statistical model. So the paper behind ECI, [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193), fixes the difficulty and slope of one benchmark during the optimization, and afterwards puts the result on an interpretable scale with a linear transformation. Epoch AI's ECI is transformed so that Claude 3.5 Sonnet = 130 and GPT-5 = 150. As this shows, the absolute value of ECI has no meaning; only the differences between AI models (relative values) do.

ECI is thus a very simple method that estimates $C_m$, $D_b$, and $\alpha_b$ together from scores by least squares.

## Computing ECI ourselves

From here on, we compute ECI from real evaluation results and check whether the capabilities of AI models and the difficulties and slopes of benchmarks are estimated well.

### Data

We use the scores on the leaderboard of [simple-evals-mm](https://github.com/llm-jp/simple-evals-mm). simple-evals-mm is an evaluation library for evaluating a wide range of AI models, and it supports more than 50 tasks, including text-only tasks and multimodal tasks with images. Its [leaderboard](https://llm-jp.github.io/simple-evals-mm/) shows the results of evaluating models from frontier AI models down to 30B-class and 10B-class open models on many tasks.

Here, we use the scores of every (model, benchmark) pair (13 × 27 = 351 pairs) from the leaderboard as of November 21, 2026, covering 13 AI models evaluated on 27 benchmarks. For simplicity, each model enters only with its highest reasoning setting (effort), and text-only models are left out.

The estimated capabilities $C_m$ are linearly transformed with GPT-6 Astra = 150 and Qwen3.5-9B = 100 as anchors.

### How the estimation proceeds

Let's see how the curves of ECI's statistical model and the estimated capabilities of the AI models change as the estimation proceeds.

<figure>
<div data-eci-chart="optimization"></div>
<figcaption>How the parameters are estimated. Each benchmark's curve (the selected benchmark in green) and the scores of the AI models on that benchmark. The x-axis is the AI models' capability estimated at each step.</figcaption>
</figure>

At first, every AI model's capability and every benchmark's difficulty start at the same value, so the dots line up vertically and all the curves overlap. As the estimation proceeds, more capable AI models move to the right and less capable ones to the left, while at the same time harder benchmarks' curves move to the right and easier ones' to the left, changing their slopes to follow the dots. The sum of squared errors falls from 42.8 to 1.0 and nearly converges in 12 steps.

### The estimated capabilities of the AI models (ECI)

The figure below ranks the AI models by their estimated capability (ECI).

<figure>
<div data-eci-chart="ranking"></div>
<figcaption>AI models ranked by ECI, which can be compared with the ranking by mean score.</figcaption>
</figure>

GPT-6 Astra and Claude Opus 5.5 lead, and among open models, Kimi K3.1 Pro is the highest at 136. The ranking by ECI was almost the same as the ranking by mean score.

### The estimated difficulties of the benchmarks

The figure below shows, against the estimated capabilities, the actual scores on a few benchmarks and the fitted curves of ECI's statistical model.

<figure>
<div data-eci-chart="curves"></div>
<figcaption>Scores on four benchmarks against the AI models' capability. Dots are the actual scores, and curves the fitted statistical model of ECI.</figcaption>
</figure>

JGraphQA-Refined and HakushoBench are benchmarks on reading Japanese charts and tables, CharXiv Reasoning is a benchmark on reading and reasoning about charts in English papers, and ZeroBench is a visual reasoning benchmark designed so that even frontier AI models cannot solve it.

JGraphQA-Refined ($D_b = 29$) is an easy benchmark on which even less capable AI models score high, and HakushoBench ($D_b = 67$) is harder. CharXiv Reasoning ($D_b = 68$) is about as difficult as HakushoBench, and their curves almost overlap. ZeroBench ($D_b = 156$) is a very hard benchmark on which even the most capable model, GPT-6 Astra (150), stays below 50%.

Putting the difficulty $D_b$ and slope $\alpha_b$ of every benchmark into one figure gives the following. The dot is the difficulty (the capability at which the score is 50%), and the bar the range of capability over which the score rises from 10% to 90%. The shorter the bar, the steeper the slope.

<figure>
<div data-eci-chart="difficulty"></div>
<figcaption>Benchmark difficulty. The dot is the difficulty <i>D</i><sub>b</sub>, and the bar the range of capability over which the score goes from 10% to 90%.</figcaption>
</figure>

The hardest is ZeroBench, followed by HLE-Diamond (142) and SimpleQA Verified (129). At the other end, JGraphQA-Refined, RealWorldQA, and CountBenchQA have difficulties of about 30 and are nearly saturated for the models evaluated here. This matches intuition well.

IFBench has a very long bar (a small $\alpha_b$): even capable AI models do not score much higher. This suggests a benchmark whose scores are only weakly related to capability.

### Does the ranking hold when scores are missing?

ECI is designed to compare AI models even when some scores are missing. To check this, we took the ranking of the 13 AI models by the mean of all their scores as the ground truth, removed some of the scores, and measured how well ECI reproduces that ranking. Scores were removed in two ways:

- **Random**: Each score is removed with the same probability.
- **Band**: In evaluation results collected over a long period, older models are often not evaluated on harder benchmarks created later, and newer models are often not evaluated on older, easier benchmarks. To mimic this, each AI model is treated as evaluated only on benchmarks whose difficulty is close to its own capability.

Concretely, as in the figure below, the AI models are ordered by capability (vertically) and the benchmarks by difficulty (horizontally), and only the scores of pairs whose positions in these orders are close are kept. The kept pairs form a band along the diagonal; the narrower the band, the more scores are removed, with less capable AI models keeping only easy benchmarks and more capable ones only hard benchmarks.

<figure>
<div data-eci-chart="window"></div>
<figcaption>Kept scores (filled) and removed scores (outlined) for the two ways of removing them. Rows are AI models (more capable toward the top), and columns benchmarks (harder toward the right). For Random, one example of the removal is shown.</figcaption>
</figure>

<figure>
<div data-eci-chart="robustness"></div>
<figcaption>Share of scores removed, and Kendall's τ between the ranking by ECI and the ranking by the mean of all scores (mean over 30 draws).</figcaption>
</figure>

With Random, ECI kept τ = 0.83 even after removing 70% of the scores. With Band, it also preserves the ranking about as well as Random, at τ = 0.90, until about a third of the scores is removed. ECI uses the remaining scores while taking the differences in benchmark difficulty into account, so it can compare AI models evaluated on different benchmarks.

On the other hand, as the band of Band gets narrower, τ drops, and at about 70% removed (when each AI model keeps only about 4 to 8 benchmarks), the ranking could hardly be reproduced. Even if less and more capable AI models are not evaluated on the same benchmarks, ECI can compare them as long as their evaluations are linked through the AI models in between; when those links become too thin, the estimation breaks down. This shows that ECI needs enough overlap between the evaluations of AI models.

### Predicting scores on benchmarks not yet evaluated

Plugging the estimated capability $C_m$, difficulty $D_b$, and slope $\alpha_b$ into the formula of ECI's statistical model,

$$
\hat{y}_{m,b} = \sigma\bigl(\alpha_b (C_m - D_b)\bigr)
$$

predicts the scores of (model, benchmark) pairs that have not been evaluated yet. For each of the 351 pairs, we refitted ECI's statistical model without that pair's score and predicted the removed score (leave-one-out).

<figure>
<div data-eci-chart="prediction"></div>
<figcaption>The prediction of ECI's statistical model fitted without each score, against the actual score. The dotted line is a perfect prediction.</figcaption>
</figure>

For most pairs, the predictions lie close to the actual scores.

Where a prediction misses by a lot, it indicates that the AI model is particularly good or bad at that benchmark's task. The figure below shows the difference between the actual score and the predicted value for each AI model and benchmark.

<figure>
<div data-eci-chart="residuals"></div>
<figcaption>Difference between the actual score and the predicted value. Blue means better than predicted, and red worse. Rows are in order of ECI, and columns benchmarks from easiest to hardest.</figcaption>
</figure>

- ScreenSpot-Pro (GUI operation) was the benchmark predicted worst. DeepSeek-V4.1-Flash scored far below its prediction, 8.5% against 59%, and Muse Glimmer 30B far above, 62% against 26%. GUI operation seems to follow a different pattern from overall capability.
- LLM-jp-4-VL 9B, trained on data with a larger share of Japanese than the other AI models, scored well above its predictions on benchmarks about Japanese culture and knowledge such as CVQA-JA, MECHA-ja, and JamC-QA, and below them on English expert-knowledge and math benchmarks such as MMMU-Pro and AIME 2026. The composition of its training data likely shows up as these strengths and weaknesses.

The gap between the prediction and the actual score thus quantifies how specialized a model is for a task or domain. The paper behind ECI gives a similar example: Claude models score above their predictions on SWE-Bench Verified, a coding benchmark.

### ECI split into text and multimodal

So far, each AI model's capability has been expressed as a single value $C_m$. In reality, though, some AI models are likely good at text tasks but weaker at tasks with images.

So we estimated the AI models' capabilities separately for text and multimodal tasks. The difficulties $D_b$ and slopes $\alpha_b$ are those estimated from all benchmarks; the capability re-estimated from the scores on the text benchmarks only (7) is the "text ECI", and the one re-estimated from the multimodal benchmarks only (20) is the "multimodal ECI". This is the same method Epoch AI uses for its domain-specific ECIs, and both are on the same scale, so they can be compared directly.

<figure>
<div data-eci-chart="domains"></div>
<figcaption>Text ECI (left) and multimodal ECI (right), with lines joining the same AI model. AI models with a gap of about 6 points or more are labeled.</figcaption>
</figure>

A line sloping down means the AI model is more capable on text, and a line sloping up means it is more capable on multimodal tasks. DeepSeek-V4.1-Flash is 17 points higher on text, and Gemini 3.8 Flash 12 points higher. Conversely, Qwen3.8-27B and Muse Glimmer 30B are about 6 points higher on multimodal tasks.

Between tasks as different as text and multimodal ones, the assumption that capability can be expressed as a single value may thus not hold. When reading a ranking by ECI, it matters which benchmarks it was estimated from.

### Forecasting future capabilities

One important use of ECI is to forecast the future by extrapolating the capabilities of frontier AI models. The paper behind ECI fits a straight line to the capabilities of the AI models that were the most capable at their release (the frontier) and extrapolates it to forecast future capabilities.

The simple-evals-mm data used here covers only a few months of releases in 2026, so here we drew the same kind of chart from Epoch AI's ECI (as of November 23, 2026), which spans a long period. Fitting a straight line to the frontier AI models since September 2024, when reasoning models appeared, ECI grows by about 16.6 points per year. Extrapolating this line forecasts about 188 (95% interval 186 to 191) one year ahead, in November 2027.

<figure>
<div data-eci-chart="frontier"></div>
<figcaption>Epoch AI's ECI over time. Black dots are the AI models with the highest ECI at their release, and the dashed line is the straight line fitted to those AI models since September 2024 and its extrapolation (the band is the 95% interval). Source: made from Epoch AI's <a href="https://epoch.ai/eci">Epoch Capabilities Index</a> data (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>).</figcaption>
</figure>

OpenAI and Anthropic check whether capability growth is accelerating, for example through the automation of AI research, by looking at how the actual ECI deviates from the predicted trend.

## Caveats in interpreting ECI

ECI is a convenient tool for following the progress of AI capabilities, but its values need some care to interpret.

- **ECI alone does not show strengths and weaknesses by domain**: Because ECI expresses an AI model's capability as a single value, domain-specific abilities such as GUI operation and coding are combined with the other abilities into that one value. So AI models with the same ECI can have different strengths and weaknesses across domains. Estimating ECI per domain, or looking at the gaps between predicted and actual scores, reveals them to some extent.
- **The choice of benchmarks changes the result**: Which benchmarks are included changes the estimated ECI values and the ranking of AI models. For example, including many knowledge benchmarks favors AI models with more parameters.
- **Too few hard benchmarks**: When few benchmarks are harder than the most capable AI model, the differences among top models and their future growth are hard to measure.
- **ECI values are hard to interpret**: ECI is an abstract scale whose absolute values have no meaning, so it is read through the differences between AI models. But what ability gap a difference corresponds to is not obvious either. Proposed interpretations use gaps between known models, such as multiples of the GPT-4 to GPT-5 gap, or map ECI to [METR's task time horizons](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/).

There are many other caveats in interpreting ECI. For details, see the [paper](https://arxiv.org/abs/2512.00193), Epoch AI's [ECI page](https://epoch.ai/eci), and the interview with ECI's developer, [The most important number in AI](https://asteriskmag.substack.com/p/the-most-important-number-in-ai) (Asterisk Magazine).

## Summary

This post explained how ECI works, computed ECI from the scores on the simple-evals-mm leaderboard, and showed how to interpret and use it.

ECI is a convenient tool for following the long-term trend of AI capabilities while reusing existing benchmark results. [Anthropic](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf) and [OpenAI](https://openai.com/index/research-acceleration-jagged-frontier/) also compute their own versions of ECI to monitor how fast model development is accelerating. I hope this post helps when reading analyses based on ECI.

## References

- Anson Ho, Jean-Stanislas Denain, David Atanasov, Samuel Albanie, Rohin Shah. [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193). arXiv, 2025.
- Epoch AI. [Epoch Capabilities Index](https://epoch.ai/eci).
- Asterisk Magazine. [The most important number in AI](https://asteriskmag.substack.com/p/the-most-important-number-in-ai). 2026.
- OpenAI. [Research acceleration: The jagged frontier](https://openai.com/index/research-acceleration-jagged-frontier/). 2026.
- Anthropic. [Claude Fable 5 & Claude Mythos 5 System Card](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf). 2026.
- Artificial Analysis. [Intelligence Index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking).
- LLM-jp. [simple-evals-mm leaderboard](https://llm-jp.github.io/simple-evals-mm/).

<script type="module" src="./eci-charts.js"></script>
