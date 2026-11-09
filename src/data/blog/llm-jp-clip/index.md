---
title: "オープンLLMによる翻訳を活用した日本語CLIPの開発"
author: speed1313
pubDatetime: 2025-02-12
slug: llm-jp-clip
featured: false
draft: false
tags:
  - Models
description: "本稿では、オープンLLMを活用して大規模日本語画像テキスト対データセットを構築し、日本語CLIPを開発した研究について紹介します。"
---

LLM勉強会のマルチモーダルWGの活動で、約20億事例からなる日本語翻訳画像テキスト対データセットを構築し、日本語CLIPをフルスクラッチで学習しました。

以下が公開リソースです。

**画像テキスト対データセット**

- [https://huggingface.co/datasets/llm-jp/relaion2B-en-research-safe-japanese-translation](https://huggingface.co/datasets/llm-jp/relaion2B-en-research-safe-japanese-translation)

**モデル**

- [https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16](https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16)
- [https://huggingface.co/llm-jp/llm-jp-clip-vit-large-patch14](https://huggingface.co/llm-jp/llm-jp-clip-vit-large-patch14)

**日本語CLIP評価コード**

- [https://github.com/llm-jp/clip-eval](https://github.com/llm-jp/clip-eval)

## はじめに

CLIPの学習には、大規模な(画像、テキスト)対データセットが必要です。しかし、オープンな日本語の画像テキスト対データセットは限られており、日本語CLIPの開発の障壁となっていました。

実際、オープンな日本語画像テキスト対データセットとして最大のものは、[ReLAION-5B](https://laion.ai/blog/relaion-5b/)の日本語サブセット(約1.2億事例)であり、これは英語サブセット(約20億事例)に比べて少ない状況でした。

本研究では、大規模な翻訳を高性能・高速・安価に行うことができるオープンLLM (今回は[gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it)) を活用することで、大規模な日本語画像テキスト対データセットを構築し、日本語CLIPを開発しました。

本研究により、オープンな日本語画像テキスト対は20億事例まで拡大しました。

## 画像テキスト対データセット

英語の大規模画像テキスト対データセットであるReLAION-5B英語サブセット(20億事例)のキャプションを、[gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it)を用いて日本語に翻訳することにより構築しました。

翻訳においては、独自に開発した翻訳ツールの[text2dataset](https://github.com/llm-jp/text2dataset)を使用しました。

## モデル

CLIPは、画像埋め込みの計算に画像エンコーダ、テキスト埋め込みの計算にテキストエンコーダを用います。

今回は、画像エンコーダとして$\text{ViT-B/16}$及び$\text{ViT-L/14}$、テキストエンコーダとして、$\text{RoBERTa}_\text{base}$を用いました。トークナイザには、[llm-jp-tokenizer v3](https://github.com/llm-jp/llm-jp-tokenizer)をエンコーダモデル向けに修正したものを用いました。llm-jp-tokenizer v3の語彙数は約10万と大きいため、全体のモデルパラメータ数はやや増加しています。

## 学習方法

データセットの画像をダウンロードした結果得られた約15億事例からなる画像テキスト対データセットを、9エポック分学習しました。学習スクリプトとして[OpenCLIP](https://github.com/mlfoundations/open_clip)を用いました。

## 評価

日本語CLIP、多言語CLIPを比較モデルとし、よく用いられるImageNetを含めた複数のベンチマークタスクで評価しました。

ラベルが日本語でないデータセットについては、日本語に翻訳した上で評価しました。

評価コードは[llm-jp/clip-eval](https://github.com/llm-jp/clip-eval)を用いました。

**評価結果**

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

結果として、llm-jp-clipは同モデルサイズで多くのタスクで高性能であった一方、日本文化ドメインのRecruitデータセットにおいて性能が低かったです。原因として、翻訳元データセットに日本文化ドメインのデータが少ない可能性が考えられます。

今後は、日本文化ドメインのデータを増やすことで、より高性能な日本語CLIPを開発していきたいと考えています。

## おわりに

本稿では、llm-jp-clipについて紹介しました。データセット、モデル、評価コードが公開されているので、ぜひお試しください!!

なお、詳しい内容については、2025年3月に長崎で開催される言語処理学会第31回年次大会 (NLP2025)に投稿した以下のタイトルの原稿をお読みください。

> オープンLLMによる翻訳を活用した日本語CLIPの開発。言語処理学会第31回年次大会 (NLP2025), 2025年3月. 杉浦一瑳、栗田修平、小田悠介、河原大輔、岡崎直観。

NLP2025に参加される方はよろしくお願いいたします!

## 参考文献

- [ReLAION-5B](https://laion.ai/blog/relaion-5b/)
- [gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it)
- [OpenCLIP](https://github.com/mlfoundations/open_clip)
