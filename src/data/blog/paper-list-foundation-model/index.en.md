---
title: "Recommended Papers for Foundation Model Research"
description: "This post lists papers that are good to read first when starting foundation model research."
translatedDatetime: 2026-10-31
---

This post lists papers and resources that seem good to read first when starting foundation model research. I will update it from time to time. If you know of other papers worth reading, please let me know.

## NLP

- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
  - Showed that reinforcement learning alone, without SFT data (DeepSeek-R1-Zero), can greatly improve the reasoning ability of LLMs.
- [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
  - The technical report for Llama 3. It describes in detail how state-of-the-art LLMs were trained at the time of publication.
- [Language Models are Few-Shot Learners](https://proceedings.neurips.cc/paper/2020/file/1457c0d6bfcb4967418bfb8ac142f64a-Paper.pdf)
  - Scaled up the model and dataset, improving few-shot, one-shot, and zero-shot performance.
- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
  - A comprehensive analysis of scaling laws for language models.
- [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
  - Showed that a language model can handle a variety of tasks without fine-tuning. The training data is WebText.
- [Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)
  - The first paper in the GPT series. It uses a decoder-only Transformer for next-word prediction. GPT-1 is fine-tuned separately for each task.
- [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805)
  - The paper that proposed BERT. It uses an encoder-only Transformer to produce embeddings that take bidirectional context into account. It is pre-trained with MLM and NSP.
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
  - The paper that proposed the Transformer.
- [Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215)
  - Showed that sequence transduction tasks can be learned end-to-end with an encoder-decoder architecture.

## Vision & Language

- [Visual Instruction Tuning](https://arxiv.org/abs/2304.08485)
  - The paper that proposed LLaVA. It showed that incorporating visual information into an LLM enables multimodal instruction following.
- [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a/radford21a.pdf)
  - Proposed CLIP, which is trained with contrastive learning on a dataset of image-text pairs from the web. As an application of CLIP, it showed that the model can perform zero-shot image classification.
- [An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929)
  - Proposed ViT, which splits an image into patches and feeds them into a Transformer encoder.

## Audio

- [Moshi: a speech-text foundation model for real-time dialogue](https://arxiv.org/abs/2410.00037)
  - Proposed a modeling approach for full-duplex spoken dialogue models.
- [Robust Speech Recognition via Large-Scale Weak Supervision](https://cdn.openai.com/papers/whisper.pdf)
  - The paper that proposed Whisper (a speech-to-text model).
- [SoundStream: An End-to-End Neural Audio Codec](https://arxiv.org/abs/2107.03312)
  - Proposed a neural audio codec that combines a VQ-VAE with a residual vector quantizer.
- [Generative Spoken Language Modeling from Raw Audio](https://arxiv.org/abs/2102.01192)
  - The paper that proposed GSLM. It proposed building a spoken language model by converting speech into discrete tokens and training a language model on them.

## HPC

- [How To Scale Your Model](https://jax-ml.github.io/scaling-book)
  - Summarizes how to think about training and running inference for LLMs efficiently. Using tools such as arithmetic intensity and the roofline model, it explains how to get the most out of TPUs and GPUs.

## Robotics

- [π0: A Vision-Language-Action Flow Model for General Robot Control](https://arxiv.org/abs/2410.24164)
  - Proposed a high-performing VLA model that can serve as a policy for multiple different robots.

## Evals

- [Successful language model evals](https://www.jasonwei.net/blog/evals)
  - Summarizes ideas on how to build good benchmarks.
