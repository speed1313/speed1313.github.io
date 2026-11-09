---
title: "Introducing simple-evals-mm"
description: "This post introduces simple-evals-mm, a new VLM evaluation framework we have developed."
translatedDatetime: 2026-10-31
---

This post introduces [simple-evals-mm](https://github.com/llm-jp/simple-evals-mm), a new VLM evaluation framework we have developed.

## What is simple-evals-mm?

simple-evals-mm is a framework for evaluating the performance of vision-language models (VLMs). It follows the design of OpenAI's LLM evaluation framework [simple-evals](https://github.com/openai/simple-evals) and extends it to VLM evaluation.

Because it inherits the design of simple-evals, it has a simple, easy-to-use interface, and adding new models and tasks is straightforward.
On top of that, it comes with features we added ourselves that are useful in practice, such as plotting evaluation results and analyzing model outputs.

## Supported Tasks

The following tasks are currently supported.

### Japanese

- Multimodal tasks: [JAMMEval collection](https://huggingface.co/datasets/llm-jp/JAMMEval) ([CC-OCR](https://arxiv.org/abs/2412.02210), [CVQA](https://arxiv.org/abs/2406.05967), [Heron-Bench](https://arxiv.org/abs/2404.07824), [JA-Multi-Image-VQA](https://huggingface.co/datasets/SakanaAI/JA-Multi-Image-VQA), [JA-VLM-Bench](https://huggingface.co/datasets/SakanaAI/JA-VLM-Bench-In-the-Wild), [JDocQA](https://arxiv.org/abs/2403.19454), [JGraphQA](https://huggingface.co/datasets/r-g2-2024/JGraphQA)), [BusinessSlideVQA](https://github.com/stockmarkteam/business-slide-questions), [JMMMU](https://huggingface.co/datasets/JMMMU/JMMMU), [MECHA-ja](https://huggingface.co/datasets/llm-jp/MECHA-ja)

JAMMEval is a benchmark collection built by manually refining the flawed examples in existing Japanese benchmarks. For details, see [this post](https://speed1313.github.io/en/posts/JAMMEval/) I published recently. With simple-evals-mm, you can reproduce the JAMMEval evaluation results.

### English

- Multimodal tasks: [AI2D](https://arxiv.org/abs/1603.07396), [BLINK](https://arxiv.org/abs/2404.12390), [ChartQA](https://arxiv.org/abs/2203.10244), [CountBenchQA](https://arxiv.org/abs/2302.12066), [DocVQA](https://arxiv.org/abs/2007.00398), [InfoVQA](https://arxiv.org/abs/2104.12756), [MMMU](https://arxiv.org/abs/2311.16502), [OKVQA](https://arxiv.org/abs/1906.00067), [RealWorldQA](https://huggingface.co/datasets/xai-org/RealworldQA), [ScienceQA](https://arxiv.org/abs/2209.09513), [SeedBench-v2](https://arxiv.org/abs/2311.17092), [TextVQA](https://arxiv.org/abs/1904.08920)

- Text-only tasks: [GPQA](https://github.com/idavidrein/gpqa/), [MATH](https://arxiv.org/abs/2103.03874), [MMLU](https://arxiv.org/abs/2009.03300), [SimpleQA](https://openai.com/index/introducing-simpleqa)

## Supported Models

GPT-5, Gemini 3 Pro, InternVL, Qwen-VL, Sarashina, and LLM-jp-VL are currently supported. The table below lists the model name prefixes available for each backend.

| Backend                   | Model name prefix                     |
| ------------------------- | ------------------------------------- |
| OpenAI (Chat Completions) | `gpt-4o-2024-11-20`                   |
| OpenAI (Responses API)    | `gpt-5.1-2025-11-13`                  |
| Google Gemini             | `gemini-3-pro-preview`                |
| InternVL                  | `OpenGVLab/InternVL3.5`               |
| Qwen-VL                   | `Qwen/Qwen3-VL`                       |
| Sarashina                 | `sbintuitions/sarashina2.2-vision-3b` |
| LLM-jp-VL                 | `llm-jp/llm-jp-4-vl-9b-beta`          |

Adding tasks and models is easy, so please give it a try.

## Handy Features

### Plotting Evaluation Results

simple-evals-mm can also output plots of evaluation results, like the one below. You can use it, for example, to create the benchmark result figures for a model release post.

```bash
uv run python src/simple_evals_mm/visualize.py --evals heronbench
```

<div align="center">
<img src="https://github.com/llm-jp/simple-evals-mm/raw/8a061baaf7afdd49410765577328f037c9f65a53/assets/benchmark_results.png" alt="Benchmark results" width="60%" />
</div>

### Analyzing Model Outputs

simple-evals-mm also includes a viewer for analyzing model responses.
It lets you inspect model outputs alongside the actual images and questions, giving you a deeper understanding of how the model behaves.
You can annotate errors at the same time, so it is also handy for categorizing errors.

```
uv run python -m simple_evals_mm.viewer.app
# Opens http://localhost:5001
```

<div align="center">
<img src="https://github.com/llm-jp/simple-evals-mm/raw/8a061baaf7afdd49410765577328f037c9f65a53/assets/viewer.png" alt="Viewer screenshot" width="60%" />
</div>

## Conclusion

[simple-evals-mm](https://github.com/llm-jp/simple-evals-mm), introduced in this post, is publicly available on GitHub and free for anyone to use.
If you use it, I would be glad if you starred the repository on GitHub or sent us feedback.

## References

- [simple-evals-mm](https://github.com/llm-jp/simple-evals-mm)
  - The GitHub repository of simple-evals-mm introduced in this post.
- [simple-evals](https://github.com/openai/simple-evals)
  - OpenAI's LLM evaluation framework, which served as a reference for the design of simple-evals-mm.
- [JAMMEval](https://huggingface.co/datasets/llm-jp/JAMMEval)
  - simple-evals-mm was developed as part of the JAMMEval project.
