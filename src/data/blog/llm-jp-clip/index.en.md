---
title: "Developing Japanese CLIP Models Leveraging an Open-weight LLM for Large-scale Dataset Translation"
description: "This post introduces our work on building a large-scale Japanese image-text pair dataset with an open LLM and using it to develop a Japanese CLIP model."
translatedDatetime: 2026-10-31
---

As part of the Multimodal Working Group at LLM-jp, we built a translated Japanese image-text pair dataset of about 2 billion examples and trained Japanese CLIP models from scratch.

The released resources are listed below.

**Image-text pair dataset**

- [https://huggingface.co/datasets/llm-jp/relaion2B-en-research-safe-japanese-translation](https://huggingface.co/datasets/llm-jp/relaion2B-en-research-safe-japanese-translation)

**Models**

- [https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16](https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16)
- [https://huggingface.co/llm-jp/llm-jp-clip-vit-large-patch14](https://huggingface.co/llm-jp/llm-jp-clip-vit-large-patch14)

**Japanese CLIP evaluation code**

- [https://github.com/llm-jp/clip-eval](https://github.com/llm-jp/clip-eval)

## Introduction

Training CLIP requires a large-scale dataset of (image, text) pairs. However, open Japanese image-text pair datasets are scarce, which has been a barrier to developing Japanese CLIP models.

In fact, the largest open Japanese image-text pair dataset was the Japanese subset of [ReLAION-5B](https://laion.ai/blog/relaion-5b/) (about 120 million examples), which is small compared with the English subset (about 2 billion examples).

In this work, we used an open LLM (here, [gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it)), which can translate at scale with high quality, high speed, and low cost, to build a large-scale Japanese image-text pair dataset and develop Japanese CLIP models.

This work expands the amount of open Japanese image-text pairs to 2 billion examples.

## Image-Text Pair Dataset

We built the dataset by translating the captions of the English subset of ReLAION-5B (2 billion examples), a large-scale English image-text pair dataset, into Japanese with [gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it).

For the translation, we used [text2dataset](https://github.com/llm-jp/text2dataset), a translation tool we developed ourselves.

## Models

CLIP uses an image encoder to compute image embeddings and a text encoder to compute text embeddings.

We used $\text{ViT-B/16}$ and $\text{ViT-L/14}$ as image encoders and $\text{RoBERTa}_\text{base}$ as the text encoder. As the tokenizer, we used [llm-jp-tokenizer v3](https://github.com/llm-jp/llm-jp-tokenizer), modified for encoder models. Because llm-jp-tokenizer v3 has a large vocabulary of about 100,000 tokens, the total number of model parameters is somewhat larger.

## Training

After downloading the images in the dataset, we obtained an image-text pair dataset of about 1.5 billion examples and trained on it for 9 epochs. We used [OpenCLIP](https://github.com/mlfoundations/open_clip) as the training script.

## Evaluation

We compared our models with Japanese and multilingual CLIP models on several benchmark tasks, including the widely used ImageNet.

For datasets whose labels are not in Japanese, we translated the labels into Japanese before evaluation.

We used [llm-jp/clip-eval](https://github.com/llm-jp/clip-eval) as the evaluation code.

**Evaluation results**

| Model                                                                                                         | Params (M) | ImageNet | Recruit  | CIFAR10  | CIFAR100 | Food101  | Caltech101 | XM3600 I → T | XM3600 T → I | Avg.     |
| ------------------------------------------------------------------------------------------------------------- | ---------- | -------- | -------- | -------- | -------- | -------- | ---------- | ------------ | ------------ | -------- |
| **Japanese CLIP**                                                                                             |            |          |          |          |          |          |            |              |              |          |
| [Rinna ViT-B/16](https://huggingface.co/rinna/japanese-clip-vit-b-16)                                         | 196        | 50.6     | 39.9     | 90.7     | 64.0     | 53.2     | 84.6       | 53.8         | 54.0         | 61.4     |
| [Rinna ViT-B/16 cloob](https://huggingface.co/rinna/japanese-cloob-vit-b-16)                                  | 196        | 54.6     | 41.6     | 88.2     | 60.3     | 57.2     | 80.2       | 53.4         | 53.4         | 61.1     |
| [LY ViT-B/16](https://huggingface.co/line-corporation/clip-japanese-base)                                     | 196        | 52.0     | **83.8** | 96.3     | 76.7     | 73.9     | **88.4**   | **76.9**     | **78.0**     | **78.3** |
| [**llm-jp-ViT-B/16**](https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16)                             | 248        | 54.2     | 59.4     | 91.8     | 69.2     | _82.2_   | 85.6       | 73.6         | 72.7         | 73.6     |
| [StabilityAI ViT-L/16](https://huggingface.co/stabilityai/japanese-stable-clip-vit-l-16)                      | 414        | **62.4** | 70.5     | _97.6_   | **84.1** | 74.0     | 86.7       | 67.3         | 66.0         | 76.1     |
| [**llm-jp-ViT-L/14**](https://huggingface.co/llm-jp/llm-jp-clip-vit-large-patch14)                            | 467        | _59.5_   | 62.9     | 96.4     | 77.0     | **88.2** | _87.8_     | 74.1         | _74.1_       | _77.5_   |
| **Multilingual CLIP**                                                                                         |            |          |          |          |          |          |            |              |              |          |
| [SigLIP B/16-256 multi](https://huggingface.co/google/siglip-base-patch16-256-multilingual)                   | 370        | 51.9     | 71.2     | 92.4     | 65.8     | 78.6     | 85.6       | 45.9         | 43.0         | 66.8     |
| [jina-clip-v2](https://huggingface.co/jinaai/jina-clip-v2)                                                    | 865        | 35.8     | 48.1     | 95.1     | 58.3     | 52.0     | 69.4       | 67.3         | 66.4         | 61.6     |
| [LAION ViT-H/14 multi](https://huggingface.co/laion/CLIP-ViT-H-14-frozen-xlm-roberta-large-laion5B-s13B-b90k) | 1193       | 53.0     | _74.5_   | **97.9** | _78.4_   | 74.3     | 85.1       | _75.0_       | 72.0         | 76.3     |

Overall, llm-jp-clip performed well on many tasks among models of the same size, but it performed poorly on the Recruit dataset, which covers the Japanese culture domain. One possible cause is that the source dataset for translation contains little data from the Japanese culture domain.

Going forward, we hope to develop better Japanese CLIP models by adding more data from the Japanese culture domain.

## Conclusion

In this post, we introduced llm-jp-clip. The dataset, models, and evaluation code are all publicly available, so please give them a try!!

For more details, please read our paper with the title below, submitted to the 31st Annual Meeting of the Association for Natural Language Processing (NLP2025), to be held in Nagasaki in March 2025.

> オープンLLMによる翻訳を活用した日本語CLIPの開発 (Developing a Japanese CLIP Using Translation by an Open LLM). The 31st Annual Meeting of the Association for Natural Language Processing (NLP2025), March 2025. Issa Sugiura, Shuhei Kurita, Yusuke Oda, Daisuke Kawahara, Naoaki Okazaki.

If you are attending NLP2025, we look forward to seeing you there!

## References

- [ReLAION-5B](https://laion.ai/blog/relaion-5b/)
- [gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it)
- [OpenCLIP](https://github.com/mlfoundations/open_clip)
