---
title: "音声言語モデルLlama-Mimiの紹介"
author: speed1313
pubDatetime: 2025-09-21
slug: llama-mimi
featured: false
draft: false
tags:
  - Models
description: "本稿では、LLM勉強会で開発した音声言語モデルのLlama-Mimiを紹介します。"
---

本稿では、LLM勉強会の対話WGの活動で開発した音声言語モデルのLlama-Mimiを紹介します。

## 音声言語モデル

近年、大規模言語モデル (LLM) が非常に発展しています。LLMは文章をトークン列として扱い、大規模なコーパスを用いて、次のトークンを予測するNext Token Predictionタスクを用いてトークン列の確率分布を学習し、推論時にはその確率分布を用いて文章を生成することができます。

この方法は、テキストデータだけでなく、トークン化できるあらゆるデータに対しても適用可能です。
音声言語モデルは、音声を音声トークナイザを用いてトークン列として表現し、そのトークン列に対してLLMと同様にNext Token Predictionタスクを用いて学習するモデルです。
音声をトークン化する方法としては、Self-supervised Learning (SSL) に基づいて学習されたモデル (e.g. [HuBERT](https://arxiv.org/abs/2106.07447)、[WavLM](https://arxiv.org/abs/2110.13900)) の中間層の特徴量をk-meansクラスタリングで離散化する方法や、VAEの潜在表現が離散バージョンの[VQ-VAE](https://arxiv.org/abs/1711.00937)を用いる方法などがあります。
Lakhotiaらによって[GSLM](https://arxiv.org/abs/2102.01192)という音声言語モデルが提案されて以来、音声言語モデルの研究が活発に進められています。

## Llama-Mimi

<div style="text-align: center;">
<figure>
<img src="https://speed1313.github.io/llama-mimi/data/llama-mimi.svg" alt="Llama-Mimiの全体像" style="width: 80%;">
<figcaption>Llama-Mimi</figcaption>
</figure>

</div>

Llama-Mimiは、音声言語モデルの一種で、Transformer decoderとして[Llama 3](https://arxiv.org/abs/2407.21783)、音声トークナイザとして[Mimi](https://arxiv.org/abs/2410.00037)を用いたモデルです。
音声言語モデルのアーキテクチャが複雑化する中で、LLMやVLMがシンプルなアーキテクチャで高性能を達成していることに着目し、できるだけシンプルなアーキテクチャで音声言語モデルを構築することを目指しました。

Mimiは、[Unified Speech Tokenizer](https://arxiv.org/abs/2308.16692)の一種で、音声をフレーム単位でトークン化することができます。1フレームを表現するトークンは1つではなく、複数のトークンで表現され、1番目のトークンがphoneticな情報を多く含むトークン、2番目以降はacousticな情報を多く含むトークンとなっています。

Llama-Mimiでは、これらのトークンを、直列化して、Transformer decoderに入力します。Llamaに音声トークンを入力するために、Llamaの語彙に音声トークンを追加しています。
このため、将来的にはテキストと音声を混在させたデータで学習することも可能です。

## 学習

今回は、英語の音声データ240k hoursを用いて、Llama 3 1Bと8Bをそれぞれ学習しました。

音声をMimiでトークン化した後は、LLMと同様に学習できるので、LLM学習フレームワークの[TorchTitan](https://github.com/pytorch/torchtitan)を改良したコードベースを用意して学習しました。

このコードは[GitHub](https://github.com/llm-jp/llama-mimi)で公開しており、誰でもLlama-Mimiを学習することができます。

## 評価

我々の[論文](https://arxiv.org/abs/2509.14882)では、Llama-MimiをLikelihoodベースとGenerationベースで評価しました。
Llama-Mimiは、感情や性別が途中で変化するような異常音声と正常音声を区別するAcoustic consistencyタスクでSoTAの性能を達成しました。
一方で、よりグローバルな情報を取り扱う必要のある意味的な性能では、[TWIST](https://arxiv.org/abs/2305.13009)等のsemanticトークンのみを用いるモデルにやや劣る結果となりました。これはトークン列が長くなることにより、長期依存関係を捉えるのが難しくなることが原因と考えられます。
詳細については、論文をご覧ください。

## 生成事例

学習したLlama-Mimiを用いて、音声promptを与えると、その続きを生成することができます。

以下はpromptとして "It was a great day。It started." という音声を与えたときの、Llama-Mimi 1Bと8Bの生成例です。

| Prompt                                                                                                                                                                                                   | Llama-Mimi 1B                                                                                                                                                                                                                            | Llama-Mimi 8B                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <audio controls class="audio-player"><source src="https://speed1313.github.io/llama-mimi/data/prompt/natural/great_day_gt.wav" type="audio/wav">Your browser does not support the audio element.</audio> | <audio controls class="audio-player"><source src="https://speed1313.github.io/llama-mimi/data/continuation/natural/Llama-3.2-1B_all-q4-s1024/great_day_gt.wav" type="audio/wav">Your browser does not support the audio element.</audio> | <audio controls class="audio-player"><source src="https://speed1313.github.io/llama-mimi/data/continuation/natural/Llama-3.1-8B_all-q4-s1024/great_day_gt.wav" type="audio/wav">Your browser does not support the audio element.</audio> |

モデルサイズが大きいほど、より自然な音声を生成できることがわかります。
その他の生成例や他のモデルとの比較は、我々の[デモサイト](https://speed1313.github.io/llama-mimi/)で確認できます。

我々のモデルは[Hugging Face](https://huggingface.co/llm-jp/Llama-Mimi-1.3B)で公開しています。ぜひ試してみてください。

## おわりに

本稿では、LLM勉強会で開発した音声言語モデルのLlama-Mimiを紹介しました。
音声言語モデルは、まだまだ言語モデルに比べて長い音声を意味的に一貫した形で生成するのが難しい状況ですが、GPT-2からGPT-4までの進化を考えると、今後の発展が非常に楽しみな分野です。

## リンク

- Paper: [https://arxiv.org/abs/2509.14882](https://arxiv.org/abs/2509.14882)
- Code: [https://github.com/llm-jp/llama-mimi](https://github.com/llm-jp/llama-mimi)
- Model: [https://huggingface.co/llm-jp/Llama-Mimi-1.3B](https://huggingface.co/llm-jp/Llama-Mimi-1.3B)
- Demo: [https://speed1313.github.io/llama-mimi](https://speed1313.github.io/llama-mimi)
