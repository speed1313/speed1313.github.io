---
title: "基盤モデル研究のためのおすすめ論文集"
author: speed1313
pubDatetime: 2025-04-20
slug: paper-list-foundation-model
featured: false
draft: false
tags:
  - Tips
description: "本稿では基盤モデル研究で最初に読むと良さそうな論文をリストアップします。"
---

基盤モデル研究で最初に読むとよさそうな論文や資料をリストアップします。不定期に更新します。他に読むと良い論文があればぜひ教えてください。

## NLP

- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
  - SFTデータを使わない強化学習のみ(DeepSeek-R1-Zero)でもLLMの推論能力を大幅に向上できることを示した。
- [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
  - Llama 3のテクニカルレポート。出版時点での最先端のLLMの学習方法を詳しく説明している。
- [Language Models are Few-Shot Learners](https://proceedings.neurips.cc/paper/2020/file/1457c0d6bfcb4967418bfb8ac142f64a-Paper.pdf)
  - モデル、データセットのスケールを大きくし、few-shot, one-shot, zero-shotの性能を向上させた。
- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
  - 言語モデルのスケール則について網羅的に分析。
- [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
  - 微調整なしで様々なタスクをこなせることを示した。学習データはWebText。
- [Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)
  - GPTシリーズの最初の論文。Decoder-only Transformerを用いて次単語予測を行う。GPT-1ではタスクごとに微調整を行う。
- [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805)
  - BERTを提案した論文。Encoder-only Transformerを用いて双方向の文脈を考慮した埋め込みを行う。MLMとNSPを用いて事前学習を行う。
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
  - Transformerを提案した論文。
- [Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215)
  - Encoder-Decoder構造を用いて系列変換タスクをend-to-endに学習可能であることを示した。

## Vision & Language

- [Visual Instruction Tuning](https://arxiv.org/abs/2304.08485)
  - LLaVAの提案論文。LLMに視覚情報を組み込むことで、マルチモーダルな指示応答が可能になることを示した。
- [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a/radford21a.pdf)
  - Web上の画像・テキスト対データセットを用いて対照学習するCLIPを提案。CLIPのアプリケーションとしてZero-shot画像分類タスクをこなせることを示した。
- [An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929)
  - 画像をパッチに分割してTransformer encoderに入力するViTを提案。

## Audio

- [Moshi: a speech-text foundation model for real-time dialogue](https://arxiv.org/abs/2410.00037)
  - full-duplexな音声対話モデルのためのモデリング手法を提案。
- [Robust Speech Recognition via Large-Scale Weak Supervision](https://cdn.openai.com/papers/whisper.pdf)
  - Whisper (Speech-to-textモデル) の提案論文。
- [SoundStream: An End-to-End Neural Audio Codec](https://arxiv.org/abs/2107.03312)
  - VQ-VAEにResidual Vector Quantizerを組み合わせたNeural Audio Codecを提案。
- [Generative Spoken Language Modeling from Raw Audio](https://arxiv.org/abs/2102.01192)
  - GSLMの提案論文。音声を離散トークンに変換して言語モデルを学習することで音声言語モデルを構築する方法を提案。

## HPC

- [How To Scale Your Model](https://jax-ml.github.io/scaling-book)
  - LLMの学習や推論を効率的に行うための考え方がまとめられている。Arithmetic IntensityやRoofline Modelなどを用いつつ、TPUやGPUの性能を最大限に引き出す方法が解説されている。

## Robotics

- [π0: A Vision-Language-Action Flow Model for General Robot Control](https://arxiv.org/abs/2410.24164)
  - 複数の異なるロボットのポリシーとして利用可能な高性能なVLAモデルを提案。

## Evals

- [Successful language model evals](https://www.jasonwei.net/blog/evals)
  - 良いベンチマークを作るための考え方がまとめられている。
