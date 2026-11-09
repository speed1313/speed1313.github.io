---
title: "Pitfalls in Model Evaluation"
description: "Model evaluation is full of pitfalls. This post walks through the many factors that affect evaluation scores."
translatedDatetime: 2026-10-31
---

Benchmarks are widely used to compare the capabilities of models quantitatively.
However, evaluation scores change with many factors, such as the prompt and the inference settings, and model evaluation is full of pitfalls.
When you evaluate other models as baselines for your proposed method, comparing them without drawing out each model's full capability leads to an unfair comparison and can lead to wrong conclusions.
It can also create a gap between officially reported performance and your own evaluation results.

In this post, I organize the factors that affect evaluation scores and summarize what to watch out for to avoid these pitfalls.

## LLMs

### Prompts

Changes in the prompt can affect the score.
Few-shot prompts and CoT prompts used to be common, and it was well known that scores varied with the number of shots and the choice of examples.
Zero-shot prompts are now the norm, but even small rephrasings or differences in how the output format is specified can cause non-negligible differences in scores.

When comparing against other models, the basic rule is to use the same prompt for all models, but you should also check whether that prompt favors or disfavors particular models.

### max_new_tokens

If max_new_tokens, the upper limit on the number of generated tokens, is too small, answers may be cut off midway and judged as incorrect.
Reasoning models in particular generate long thinking tokens before the final answer, so a small limit cuts generation off in the middle of reasoning, and the model fails problems it could otherwise solve.
When evaluating a model, it is important to set max_new_tokens large enough.

In addition, by recording why each sample's generation finished and checking the fraction of samples that were cut off by the limit, you can check whether generation stopped in the middle of reasoning.
However, if those samples are just the same sentence repeated over and over, increasing max_new_tokens will not lead to a correct answer, so they are not a problem.

### Inference parameters

In LLM text generation, the generated text changes with the inference parameters.
Examples include temperature, top_p, and repetition penalty.
Since they change the generated text, they naturally affect the score as well.
In general, the safe choice is to use the recommended settings from the official model card or similar documentation.

For example, the [Qwen3.5-4B model card](https://huggingface.co/Qwen/Qwen3.5-4B) explicitly lists recommended inference settings such as temperature and top_p.
For some models, temperature=0 (greedy decoding) is discouraged, so choosing greedy decoding "to make it deterministic" can lower the score and fail to draw out the model's real performance.

Note that when temperature is not 0, the outputs change from run to run, so you should run the evaluation multiple times and report the mean and std.

### Floating-point precision

An LLM computes the next-token prediction distribution by repeating computations such as matrix multiplications and activation functions, and then generates tokens.
Changing the floating-point precision can change this distribution through numerical errors, which may change the generated token sequence.
To draw out the model's performance, it is best to run inference at the recommended precision.

### Inference engines

Scores can also change depending on which inference engine you use, such as HF Transformers, vLLM, or SGLang.
Since implementations can differ between engines, the same model with the same settings does not always produce exactly the same output.
Behavior can also change between versions of the same engine.

### API providers

When you use open-weight models through services such as OpenRouter, the score can change depending on the provider.
Each provider serves models differently, so different providers may return different responses.
Even the same provider may change its internal implementation over time.
OpenRouter lets you specify the provider, so it is best to pin the provider during evaluation.

## Grading

Grading model answers also requires care.

With rule-based grading using regular expressions and the like, small differences in wording can cause a correct answer to fail to match and be marked as incorrect.

To address this problem with rule-based grading, LLM-as-a-Judge gives an LLM the model's output and the reference answer and grades more flexibly.
On the other hand, LLM-as-a-Judge has problems such as:

- Grading results can change from run to run
- [The judge model has biases](https://arxiv.org/abs/2306.05685)
- A weak judge model lowers grading quality

It is best to use as strong a model as possible for grading and, if possible, to check its agreement with human grading.
You should also report the name of the model used as the judge.

## VLMs

Evaluating VLMs adds pitfalls that come from image inputs, on top of the ones for text.

### Image format

When you pass an image to a VLM through SGLang, the OpenAI API, or similar, the image is first encoded, for example as base64.
If the image is re-encoded as JPEG (lossy compression) or resized along the way, the pixel values change, and so does the input to the model.
For document images with fine text, this degradation from compression can affect the score.
As a countermeasure, figure out where and how images are transformed in your evaluation pipeline, and avoid unintended degradation, for example by passing images in lossless PNG format.

### Number of soft tokens per image

A VLM converts an image into soft tokens with a vision encoder and feeds them to the LLM, and many models have a parameter that controls the number of soft tokens per image.
For example, [Gemma 4 12B](https://huggingface.co/google/gemma-4-12B-it) lets you change the maximum number of soft tokens per image.

In general, for tasks that require reading fine details, such as PDF images, increasing the number of tokens per image improves performance.
Conversely, with fewer tokens the effective resolution of the image drops, and information that could have been read is lost.
If a model scores low when evaluated with the default settings, the problem may be the settings rather than the model's capability.

## Agents

Evaluating LLM agents involves many components besides the model, so there are even more factors that affect the score.

### Harnesses

The harness, which defines things like context management and tool definitions for an LLM agent, leaves a lot of freedom in its implementation.
There are many harnesses today, such as [OpenCode](https://opencode.ai/), [Terminus](https://github.com/laude-institute/harbor), and [mini-swe-agent](https://github.com/swe-agent/mini-swe-agent), and they differ in their system prompts, available tools, context compression methods, how they present code to the agent, and more.
For example, the [Terminal-Bench](https://arxiv.org/abs/2601.11868) evaluation shows that the same model can perform very differently with different harnesses.
It is important to understand that scores reported on agent benchmarks reflect the combination of the model and the harness.

### Execution environment

The agent's execution environment also leaves room for choice.
Scores change depending on settings such as how much compute you give the agent, how you set the time limit, and whether you allow network access.
For example, if the time limit is too short, the agent is cut off while still working on a task and fails tasks it could have solved.
As a result, you end up unfairly underestimating the agent's performance.
Also, in search benchmarks, agents may use external search engines to gather information, but search results change over time, so the information an agent can obtain for the same task depends on when it runs.

## Summary

In this post, I organized the many factors that affect evaluation scores.
From inference settings to grading methods and execution environments, pitfalls lurk everywhere in the evaluation pipeline.

What matters throughout is looking at the actual data.
Instead of stopping at the evaluation score, look at the model's outputs and the grading results.
Are answers being cut off midway? Are correct answers being marked as incorrect? Is the agent behaving in unexpected ways?
Many of the pitfalls described in this post can be found by looking at the data.

## References

- https://epoch.ai/gradient-updates/why-benchmarking-is-hard
  - A more detailed explanation of evaluation pitfalls than this post, with many real examples. A must-read.
- https://epoch.ai/publications/what-skills-does-swe-bench-verified-evaluate
  - Useful if you want to learn about pitfalls in evaluation datasets, not just evaluation methods.
- https://www.jasonwei.net/blog/evals
  - Explains the conditions that successful benchmarks meet.
