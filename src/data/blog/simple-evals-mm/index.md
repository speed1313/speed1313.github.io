---
title: "simple-evals-mmの紹介"
author: speed1313
pubDatetime: 2026-04-07
slug: simple-evals-mm
featured: false
draft: false
tags:
  - Benchmarks
description: "本稿では、新たに開発したVLM評価フレームワーク simple-evals-mm を紹介します。"
---

本稿では、新たに開発したVLM評価フレームワーク [simple-evals-mm](https://github.com/llm-jp/simple-evals-mm) を紹介します。

## simple-evals-mmとは

simple-evals-mmは、視覚言語モデル（VLM）の性能を評価するためのフレームワークで、OpenAIのLLM評価フレームワーク [simple-evals](https://github.com/openai/simple-evals)の設計を踏襲しつつ、VLMの評価に拡張したものです。

simple-evalsの設計を引き継いでいるため、シンプルで使いやすいインターフェースで、モデルやタスクの追加も容易に行えるようになっています。
さらに、独自に追加した機能として、評価結果の図示やモデル出力の分析など、評価を行う上で役立つ機能が備わっています。

## サポートしているタスク

現時点で以下のタスクをサポートしています。

### 日本語

- マルチモーダルタスク: [JAMMEval collection](https://huggingface.co/datasets/llm-jp/JAMMEval) ([CC-OCR](https://arxiv.org/abs/2412.02210), [CVQA](https://arxiv.org/abs/2406.05967), [Heron-Bench](https://arxiv.org/abs/2404.07824), [JA-Multi-Image-VQA](https://huggingface.co/datasets/SakanaAI/JA-Multi-Image-VQA), [JA-VLM-Bench](https://huggingface.co/datasets/SakanaAI/JA-VLM-Bench-In-the-Wild), [JDocQA](https://arxiv.org/abs/2403.19454), [JGraphQA](https://huggingface.co/datasets/r-g2-2024/JGraphQA)), [BusinessSlideVQA](https://github.com/stockmarkteam/business-slide-questions), [JMMMU](https://huggingface.co/datasets/JMMMU/JMMMU), [MECHA-ja](https://huggingface.co/datasets/llm-jp/MECHA-ja)

JAMMEvalは、既存の日本語ベンチマークに含まれる不良事例を人手で精緻化することで構築したベンチマークコレクションです。詳細は先日公開した[こちらの記事](https://speed1313.github.io/posts/JAMMEval/)をご覧ください。simple-evals-mmを用いることで、JAMMEvalの評価結果を再現することができます。

### 英語

- マルチモーダルタスク: [AI2D](https://arxiv.org/abs/1603.07396)、[BLINK](https://arxiv.org/abs/2404.12390), [ChartQA](https://arxiv.org/abs/2203.10244), [CountBenchQA](https://arxiv.org/abs/2302.12066), [DocVQA](https://arxiv.org/abs/2007.00398), [InfoVQA](https://arxiv.org/abs/2104.12756), [MMMU](https://arxiv.org/abs/2311.16502), [OKVQA](https://arxiv.org/abs/1906.00067), [RealWorldQA](https://huggingface.co/datasets/xai-org/RealworldQA), [ScienceQA](https://arxiv.org/abs/2209.09513), [SeedBench-v2](https://arxiv.org/abs/2311.17092), [TextVQA](https://arxiv.org/abs/1904.08920)

- テキストオンリータスク: [GPQA](https://github.com/idavidrein/gpqa/)、[MATH](https://arxiv.org/abs/2103.03874), [MMLU](https://arxiv.org/abs/2009.03300), [SimpleQA](https://openai.com/index/introducing-simpleqa)

## サポートしているモデル

現時点でGPT-5やGemini 3 Pro、InternVL、Qwen-VL、Sarashina、LLM-jp-VLをサポートしています。以下の表に、各バックエンドで利用可能なモデルのプレフィックスを示します。

| Backend                   | Model name prefix                     |
| ------------------------- | ------------------------------------- |
| OpenAI (Chat Completions) | `gpt-4o-2024-11-20`                   |
| OpenAI (Responses API)    | `gpt-5.1-2025-11-13`                  |
| Google Gemini             | `gemini-3-pro-preview`                |
| InternVL                  | `OpenGVLab/InternVL3.5`               |
| Qwen-VL                   | `Qwen/Qwen3-VL`                       |
| Sarashina                 | `sbintuitions/sarashina2.2-vision-3b` |
| LLM-jp-VL                 | `llm-jp/llm-jp-4-vl-9b-beta`          |

タスクやモデルの追加は容易に行えるようになっていますので、ぜひご活用ください。

## 便利機能

### 評価結果の図示

simple-evals-mmは、以下のように評価結果の図を出力する機能も備えています。モデルリリース記事におけるベンチマーク結果の図示などにご活用ください。

```bash
uv run python src/simple_evals_mm/visualize.py --evals heronbench
```

<div align="center">
<img src="https://github.com/llm-jp/simple-evals-mm/raw/8a061baaf7afdd49410765577328f037c9f65a53/assets/benchmark_results.png" alt="Benchmark results" width="60%" />
</div>

### モデル出力の分析

simple-evals-mmは、モデルの回答結果を分析するためのビューワーも備えています。
これにより、モデルの出力を実際の画像や質問文とともに確認することができ、モデルの挙動をより深く理解することができます。
エラーのアノテーションも同時に行うことができますので、エラーの分類にもご活用ください。

```
uv run python -m simple_evals_mm.viewer.app
# Opens http://localhost:5001
```

<div align="center">
<img src="https://github.com/llm-jp/simple-evals-mm/raw/8a061baaf7afdd49410765577328f037c9f65a53/assets/viewer.png" alt="Viewer screenshot" width="60%" />
</div>

## まとめ

今回紹介した[simple-evals-mm](https://github.com/llm-jp/simple-evals-mm)はGitHub上で公開されており、誰でも自由に利用することができます。
ご利用の際はぜひGitHubのスターや、フィードバックをお寄せいただけると嬉しいです。

## 参考文献

- [simple-evals-mm](https://github.com/llm-jp/simple-evals-mm)
  - 今回紹介したsimple-evals-mmのGitHubリポジトリです。
- [simple-evals](https://github.com/openai/simple-evals)
  - simple-evals-mmの設計において参考にした、OpenAIのLLM評価フレームワークです。
- [JAMMEval](https://huggingface.co/datasets/llm-jp/JAMMEval)
  - simple-evals-mmはJAMMEvalプロジェクトの一環として開発されました。
