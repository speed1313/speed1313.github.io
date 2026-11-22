---
title: "Understanding the Epoch Capabilities Index (ECI): fitting it to simple-evals-mm scores"
description: "How ECI places model capabilities and benchmark difficulties on one scale from many benchmark scores, and what happens when we fit it to the simple-evals-mm leaderboard."
translatedDatetime: 2026-11-22
---

## Introduction

The **Epoch Capabilities Index (ECI)** has become a common way to measure how fast AI capabilities are improving. Besides Epoch AI's public [ECI](https://epoch.ai/eci), OpenAI tracks its models with an internal version, OpenAI ECI (OECI), and uses it as [one of the indicators for monitoring research acceleration](https://openai.com/index/research-acceleration-jagged-frontier/). Anthropic reports an Anthropic ECI (AECI) in its [system cards](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf) to check whether new models depart from the past trend in a way that suggests acceleration.

Whether capability growth is accelerating ties directly into interest in recursive self-improvement (RSI), where AI automates AI research and speeds up progress, so a "single number" like ECI is becoming important. That is why an [Asterisk Magazine article](https://asteriskmag.substack.com/p/the-most-important-number-in-ai) calls ECI "the most important number in AI".

In this post, I explain the method of the paper behind ECI, [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193), and fit ECI to the leaderboard of [simple-evals-mm](https://llm-jp.github.io/simple-evals-mm/), an evaluation framework I help develop. All figures are interactive: hover to see values, and use the sliders and buttons.

## How do we measure a model's overall capability?

The simplest approach is to evaluate every model on a fixed set of benchmarks and average the scores. For example, Artificial Analysis's [Intelligence Index](https://artificialanalysis.ai/methodology/intelligence-benchmarking) (v5) groups nine evaluations, focused on difficult tasks, into four categories and takes a weighted average.

This approach has weaknesses:

- **Every (model, benchmark) pair must be evaluated**: Each new model has to be run on every benchmark, and averages are no longer comparable when some scores are missing.
- **Saturated benchmarks hide differences**: A benchmark on which every model scores nearly 100% squeezes the differences between models in the average. A benchmark that no model can solve yet does not separate them either.
- **Benchmark difficulty is not explicit**: Average scores hint at how hard a benchmark is, but they cannot quantify it, for example as the capability at which a model solves half of it.

With a fixed set, the set must be replaced whenever its benchmarks saturate, which also makes long-run trends hard to follow. Artificial Analysis itself started using a [Progress Index](https://artificialanalysis.ai/methodology/progress-index), built on the same idea as ECI, for its [trend analysis](https://artificialanalysis.ai/trends) in October 2026.

## The ECI method

### Model

ECI models the score of model $m$ on benchmark $b$ with a logistic function:

$$
\text{score}(m, b) = \sigma\bigl(\alpha_b (C_m - D_b)\bigr), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}
$$

- $C_m$: the **capability** of model $m$
- $D_b$: the **difficulty** of benchmark $b$. When $C_m = D_b$, the score is exactly 50%.
- $\alpha_b$: the **slope** of benchmark $b$. The larger it is, the more sharply the score rises around the difficulty.

A model whose capability is well above the difficulty scores close to 100%, and one well below scores close to 0%. The key point is that model capabilities and benchmark difficulties lie on the same number line. It can be seen as the two-parameter model of Item Response Theory (IRT), applied to benchmarks rather than to individual questions.

Try moving $D_b$ and $\alpha_b$ in the figure below. Each dot is a model on the leaderboard; the x-axis is its capability (estimated later) and the y-axis its actual score on the benchmark. The red lines are the errors between the prediction and the actual scores, and fitting means making them small.

<figure>
<div data-eci-chart="sigmoid"></div>
<figcaption>The logistic curve of one benchmark. Moving the difficulty D and the slope α changes the curve and the errors. The dashed curve is the least-squares fit.</figcaption>
</figure>

Changing $D$ shifts the curve left or right, and changing $\alpha$ changes how steeply it rises. A benchmark with a large slope separates models only within a narrow range of capability near its difficulty, and saturates quickly.

### Optimization

The paper estimates all $C_m$, $D_b$, and $\alpha_b$ together by least squares with L2 regularization (Section 2.3 of the [paper](https://arxiv.org/abs/2512.00193), and Epoch AI's [description of the previous method](https://epoch.ai/publications/eci-bayesian-methodology)):

$$
\min_{C, D, \alpha} \sum_{(m, b)} \bigl(\text{score}(m, b) - y_{m,b}\bigr)^2 + \lambda \Bigl(\sum_b (\alpha_b^2 + D_b^2) + \sum_m C_m^2\Bigr), \qquad \lambda = \frac{0.1}{M + 2B - 2}
$$

$y_{m,b}$ is the observed score, and $M$ and $B$ are the numbers of models and benchmarks. The sum runs **only over the observed pairs**, so the estimate works even when some scores are missing.

The implementation details:

- Everything starts at $C_m = D_b = 0$ and $\alpha_b = 1$.
- It is solved with SciPy's `least_squares` (the Trust Region Reflective method), with $\alpha_b \in [0.1, 10]$ and $C_m, D_b \in [-10, 10]$.
- The predictions do not change if everything is rescaled ($\alpha_b \to k\alpha_b$, $C_m \to C_m / k$, $D_b \to D_b / k$) or shifted ($C_m, D_b \to C_m + \delta, D_b + \delta$), so the solution is not unique. To fix it, one benchmark (WinoGrande in the paper) gets a slope of 1 and a difficulty of 0.

Finally, a linear transformation puts the result on an interpretable scale. Epoch AI's ECI is transformed so that Claude 3.5 Sonnet = 130 and GPT-5 = 150. **The absolute value of ECI has no meaning; only differences between models (relative values) do.**

In November 2026, Epoch AI updated its method to [Bayesian estimation](https://epoch.ai/publications/eci-bayesian-methodology) with a beta likelihood and MCMC, which handles uncertainty better. This post uses the paper's least squares, to keep the mechanism easy to follow.

## Computing ECI ourselves

### Data

We use the scores on the [simple-evals-mm leaderboard](https://llm-jp.github.io/simple-evals-mm/) as of November 21, 2026.

- **Models**: 14 models. Each setting with a different reasoning effort counts as a separate model, giving 22 settings.
- **Benchmarks**: 27, in Japanese and English, with text and images.
- **Scores**: 575. The text-only LLM-jp-4.1 8B thinking is evaluated on only 8 text benchmarks, which ECI handles as it is.

simple-evals-mm evaluates every model with the same evaluation harness, so unlike scores collected from external reports, there is little noise from differences in how they were evaluated.

The scale matches simple-evals-mm's [SEM-ECI](https://llm-jp.github.io/simple-evals-mm/trends/): GPT-6 Astra (max) = 150 and Qwen3.5-9B (thinking) = 100. The fixed benchmark is GPQA Diamond. The code is in [experiments/eci](https://github.com/speed1313/speed1313.github.io/tree/main/experiments/eci) in this blog's repository.

### How the optimization proceeds

Let's watch how the curves and the estimated capabilities change as the optimization proceeds. Press "Play" to see an animation that interpolates between the steps that `least_squares` accepted.

<figure>
<div data-eci-chart="optimization"></div>
<figcaption>How the optimization proceeds. Top: each benchmark's curve (the selected one in green) and that benchmark's scores. Bottom: each model's estimated capability. Both use the final ECI scale.</figcaption>
</figure>

At first, every model has the same capability, so the dots line up vertically. In the first few steps, the models spread out in order of capability, while each benchmark's curve shifts sideways and changes its slope to follow the dots. The sum of squared errors falls from 69.7 to 2.1 and nearly converges in 12 steps. The overall fit has $R^2 = 0.946$ and a root mean squared error (RMSE) of 6.1 points.

### Model capabilities

The figure below ranks the models by their estimated capability (ECI). The buttons switch to the values estimated from only the text or only the image benchmarks (see below), the mean score, and simple-evals-mm's SEM-ECI.

<figure>
<div data-eci-chart="ranking"></div>
<figcaption>Models ranked by ECI. The buttons switch the measure.</figcaption>
</figure>

GPT-6 Astra (max) and Claude Opus 5.5 (max) lead, and among open models, Kimi K3.1 Pro (max) reaches 135, above Gemini 3.8 Flash (high). Raising the effort increases a model's ECI by about 2 to 12 points. The ranking broadly matches my impression from using these models.

### Benchmark difficulty

The next figure overlays every benchmark's curve, like "SEM-ECI vs benchmark score" on simple-evals-mm's [Trends](https://llm-jp.github.io/simple-evals-mm/trends/) page. Hover over a curve or select a benchmark to see its scores.

<figure>
<div data-eci-chart="curves"></div>
<figcaption>Each benchmark's expected score as a function of capability. Colors are benchmark categories. The gray band is the range of the evaluated models' capabilities.</figcaption>
</figure>

The difficulty $D_b$ and slope $\alpha_b$ fit in a single figure: the dot is the difficulty (expected score 50%) and the bar the range of capability over which the expected score rises from 10% to 90%. The shorter the bar, the steeper the slope.

<figure>
<div data-eci-chart="difficulty"></div>
<figcaption>Benchmark difficulty. The dot is the difficulty D, and the bar the range where the expected score goes from 10% to 90%.</figcaption>
</figure>

The hardest benchmark is ZeroBench (D = 156): even the most capable model (150) is expected to score below 50%. HLE-Diamond (144) and SimpleQA Verified (126) follow. At the other end, RealWorldQA, JGraphQA-Refined, and CountBenchQA have difficulties of about 30 and are nearly saturated for these models. This matches intuition well.

IFBench has a very long bar (a small $\alpha$) and a fit $R^2$ of only 0.17: even capable models do not score much higher, so its scores are only weakly related to capability.

## How do the mean score and ECI differ?

When every benchmark score is available, ECI and the mean score rank the models almost identically (Kendall's rank correlation τ = 0.98). As the figure shows, the relationship is monotonic but not linear.

<figure>
<div data-eci-chart="mean-vs-eci"></div>
<figcaption>Mean score and ECI. The hollow dot is the model evaluated only on the 8 text benchmarks.</figcaption>
</figure>

The difference shows up when scores are missing. The text-only LLM-jp-4.1 8B thinking has the lowest mean score, 35%, because the benchmarks it took are mostly hard ones. ECI accounts for benchmark difficulty and gives it 81, above the multimodal LLM-jp-4-VL 9B (68).

### Does the ranking survive missing scores?

For the 21 settings with every benchmark, we take the ranking by the mean of all scores as the ground truth, remove some scores, and check how well the mean of the remaining scores and ECI reproduce that ranking. Scores are removed in two ways:

- **Missing at random**: Each score is removed with the same probability.
- **Missing by difficulty**: The weaker half of the models lose scores on the hard benchmarks (the top third by difficulty), and the stronger half on the easy benchmarks (the bottom third), each with the given probability. This is a common real-world situation: older models are not evaluated on new, hard benchmarks, and newer models are not evaluated on old, easy ones.

<figure>
<div data-eci-chart="robustness"></div>
<figcaption>Share of scores removed and Kendall τ with the ranking by the mean of all scores. The mean over 30 draws and the 10th to 90th percentile range.</figcaption>
</figure>

Even when scores are missing at random, ECI preserves the ranking better, with τ = 0.83 after removing 70% of the scores (0.64 for the mean). When scores are missing by difficulty, the gap widens: the mean's τ drops to 0.58, while ECI stays at 0.90. The mean overrates models evaluated only on easy benchmarks, while ECI estimates the difficulties and corrects for this bias. Comparing models evaluated on different benchmarks is the biggest advantage of ECI.

## Predicting scores on benchmarks not yet evaluated

If the ECI model is right, a model's capability and the benchmark parameters should predict scores that have not been measured. For each of the 575 scores, we refit without that score and predicted it (leave-one-out).

<figure>
<div data-eci-chart="prediction"></div>
<figcaption>The prediction of ECI fitted without each score, against the actual score. The dotted line is a perfect prediction.</figcaption>
</figure>

The prediction RMSE is 7.8 points, half that of predicting with "the other models' average on that benchmark" (15.5 points).

Where predictions miss, models' strengths and weaknesses show. The figure below shows the actual score minus the prediction for each model and benchmark.

<figure>
<div data-eci-chart="residuals"></div>
<figcaption>Actual score minus prediction. Blue means better than predicted, red worse. Rows are in order of ECI, and columns from easiest to hardest.</figcaption>
</figure>

- **ScreenSpot-Pro (GUI)**: The hardest benchmark to predict. DeepSeek-V4.1-Flash (max) scored 8.5% against a prediction of 59%, and Muse Glimmer 30B (low) 62% against 17%. Pointing precisely at GUI elements seems to be learned separately from overall capability.
- **LLM-jp-4-VL 9B**: It scores well above the prediction on benchmarks about Japanese culture and knowledge, such as MECHA-ja (predicted 34%, actual 65%), CVQA-JA, and JamC-QA, and below it on English expert-knowledge benchmarks such as MMMU-Pro (predicted 58%, actual 33%). The model was developed with a focus on Japanese and Japanese culture, and that intended profile shows up here.

The gap between prediction and actual score thus quantifies how specialized a model is for a task or domain. The paper gives similar examples: Claude models score above the prediction on SWE-Bench Verified, a coding benchmark, and below it on GeoBench, an image benchmark.

## Do capabilities differ between text and images?

ECI assumes that capability can be expressed by a single number. How well does that hold? As in Epoch AI's domain-specific ECIs, we keep $D_b$ and $\alpha_b$ from the overall fit and re-estimate each model's capability on only the text benchmarks, or only the image benchmarks.

<figure>
<div data-eci-chart="domains"></div>
<figcaption>ECI estimated from only the text benchmarks and only the benchmarks with images. Models with a gap above 6 points are labeled.</figcaption>
</figure>

DeepSeek-V4.1-Flash is 16 to 19 points higher on text, and Gemini 3.8 Flash (high) 11 points higher. Conversely, Muse Glimmer 30B (low) is 13 points higher on images. According to Epoch AI in the [Asterisk article](https://asteriskmag.substack.com/p/the-most-important-number-in-ai), domain differences in Epoch's ECI are usually a few points, but between tasks as different as text and images, the single-number assumption breaks down considerably. When reading a ranking, it matters which benchmarks it was estimated from.

On the other hand, it is precisely because capability is a single number that models evaluated on different benchmarks, such as a text-only model and multimodal models, can be compared on the same scale.

## Comparison with question-level estimation (SEM-ECI)

ECI uses the average score on each benchmark, while simple-evals-mm's [SEM-ECI](https://llm-jp.github.io/simple-evals-mm/trends/) is question-level IRT, which estimates a difficulty and slope for each question from whether it was answered correctly. It also corrects for guessing on multiple-choice questions and adjusts the weight of each benchmark.

<figure>
<div data-eci-chart="sem"></div>
<figcaption>ECI in this post (benchmark level, least squares) and SEM-ECI (question level). The dotted line is where they agree.</figcaption>
</figure>

The two differ by 1.6 points on average and nearly agree. The largest difference is LLM-jp-4-VL 9B (6.3 points). At least on this data, benchmark-level average scores give almost the same capability estimates as question-level data.

As the paper notes, however, benchmark-level estimation has weaknesses. For example, splitting a benchmark into two doubles its weight even though the questions are the same. Question-level estimation is less prone to such problems.

## Parameter count and capability

For open models, let's look at the relationship between total parameter count and ECI.

<figure>
<div data-eci-chart="params"></div>
<figcaption>Total parameters (log scale) and ECI of open models.</figcaption>
</figure>

Larger models tend to be more capable, but models of the same size vary widely: Qwen3.5-9B (100), with 9B parameters, is on par with GLM-5.3 Flash (low), which has over 300B. This also helps find efficient models that are capable for their size, although inference cost, speed, and the active parameters of MoE models are not considered.

## Forecasting future capabilities

An important use of ECI is to forecast future capabilities by extrapolating the frontier. The paper reports that frontier capability has grown linearly at about 0.55 per year (on its original scale), about the gap from GPT-4.5 to GPT-5. On Epoch AI's ECI scale, the pace since reasoning models appeared is about 15 to 18 points per year ([Asterisk](https://asteriskmag.substack.com/p/the-most-important-number-in-ai)). OpenAI reports that the frontier of its models' OECI has grown at 16.4 points per year since August 2025.

Anthropic judges whether acceleration is occurring by whether AECI departs upward from this linear trend. Claude Mythos 5 sits above the trend, but by about as much as its predecessor, Claude Mythos Preview, and Anthropic concludes that this is not evidence of compounding acceleration in capability growth.

The data here covers only models released from March to October 2026, a short period with few frontier models, so we did not extrapolate. Long-term forecasts need model and benchmark data over a long period, as Epoch AI has.

## Caveats in interpreting ECI

From the experiments and the paper's discussion, here are the caveats in interpreting ECI.

- **Domain-specific capabilities are not measured**: With a single number, specialized capabilities such as GUI operation do not show up in the overall ECI. Estimating ECI per domain avoids this to some extent.
- **The choice of benchmarks changes the result**: The ranking depends on which benchmarks are included. For example, including many knowledge benchmarks favors large models. Adding agentic tasks might widen the gaps between models further.
- **Benchmarks whose ceiling is below 100%**: On a benchmark where a perfect score is impossible, for example because of errors in its questions, the difficulty is overestimated.
- **Guessing**: The paper's model has 0% as its floor, so for four-option questions like GPQA Diamond (25% by guessing), the difficulty is underestimated. Here, GPQA Diamond's difficulty was 72, lower than the 81 of SEM-ECI, which corrects for guessing. Epoch AI's Bayesian version and SEM-ECI rescale scores so that guessing counts as 0.
- **Benchmark noise**: Scores on benchmarks with few questions are noisy, which affects the estimates.
- **Different evaluation settings**: Collecting externally reported scores means comparing scores from different settings, such as prompts and inference budgets.
- **Too few hard benchmarks**: When few benchmarks are harder than the most capable model, the differences among top models and their future growth are hard to measure. Here, only ZeroBench and HLE-Diamond were.
- **Differences are hard to interpret**: What a given ECI difference means is not obvious. Proposed interpretations use gaps between known models (for example, multiples of the GPT-4 to GPT-5 gap) or map ECI to METR's task time horizons.
- **Cost and speed are not included**: Inference cost and latency are not taken into account.

## Summary

ECI estimates model capabilities and benchmark difficulties together from many benchmark scores, using a model as simple as a logistic function. Fitting it to the simple-evals-mm scores showed the following:

- The estimated capabilities and difficulties match intuition well, and almost agree with SEM-ECI, which is estimated at the question level.
- When some scores are missing, especially when they are missing by difficulty, ECI preserves the ranking far better than the mean score.
- It predicts unseen scores with an RMSE of 7.8 points, and where the predictions miss, the models' strengths and weaknesses (GUI operation, Japanese) show up.
- Some models differ greatly between text and images, which shows the limits of the single-number assumption.

Several organizations use ECI to track model progress and watch for signs of acceleration. Understanding the assumptions and methods behind that number matters for reading AI progress correctly.

## References

- Anson Ho, Jean-Stanislas Denain, David Atanasov, Samuel Albanie, Rohin Shah. [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193). arXiv, 2025.
- Epoch AI. [Epoch Capabilities Index](https://epoch.ai/eci).
- Epoch AI. [Updating the ECI methodology to use a Bayesian model](https://epoch.ai/publications/eci-bayesian-methodology). 2026.
- Asterisk Magazine. [The most important number in AI](https://asteriskmag.substack.com/p/the-most-important-number-in-ai). 2026.
- OpenAI. [Research acceleration: The jagged frontier](https://openai.com/index/research-acceleration-jagged-frontier/). 2026.
- Anthropic. [Claude Fable 5 & Claude Mythos 5 System Card](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf). 2026.
- Artificial Analysis. [Progress Index methodology](https://artificialanalysis.ai/methodology/progress-index) / [Trends](https://artificialanalysis.ai/trends).
- LLM-jp. [simple-evals-mm leaderboard](https://llm-jp.github.io/simple-evals-mm/) / [Trends (SEM-ECI)](https://llm-jp.github.io/simple-evals-mm/trends/).

<script type="module" src="./eci-charts.js"></script>
