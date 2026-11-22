---
title: "Epoch Capabilities Index (ECI) を理解する: simple-evals-mm のスコアで実際にフィットしてみる"
author: speed1313
pubDatetime: 2026-11-22
slug: eci
featured: false
draft: false
tags:
  - Benchmarks
description: "多くのベンチマークのスコアから、モデルの能力とベンチマークの難易度を一つの尺度で推定する ECI の仕組みを解説し、simple-evals-mm のリーダーボードのスコアで実際にフィットして挙動を確かめます。"
---

## はじめに

AI モデルの能力がどのくらいの速さで伸びているのかを測る指標として、**Epoch Capabilities Index (ECI)** が広く使われるようになりました。Epoch AI が公開している [ECI](https://epoch.ai/eci) のほか、OpenAI は社内版の OpenAI ECI (OECI) で自社モデルの能力の伸びを追跡し、[研究の加速を監視する指標の一つとして](https://openai.com/index/research-acceleration-jagged-frontier/)使っています。Anthropic も Anthropic ECI (AECI) を [System Card](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf) で報告し、新しいモデルの能力が過去のトレンドから外れて加速していないかを確かめています。

能力の伸びが加速しているかどうかは、AI が AI 研究を自動化して進歩を速める再帰的自己改善 (Recursive Self-Improvement, RSI) への関心とも直結するため、ECI のような「一つの数字」は重要な意味を持ちつつあります。[Asterisk Magazine の記事](https://asteriskmag.substack.com/p/the-most-important-number-in-ai)が ECI を「AI で最も重要な数字」と呼んでいるのもそのためです。

この記事では、ECI の元になった論文 [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193) の方法を解説し、私が開発に関わっている評価フレームワーク [simple-evals-mm](https://llm-jp.github.io/simple-evals-mm/) のリーダーボードのスコアを使って、実際に ECI をフィットしてみます。図はすべてインタラクティブで、カーソルを合わせると値が見え、スライダーやボタンで操作できます。

## モデルの総合的な能力をどう測るか

最も素朴な方法は、決まったベンチマークのセットで全モデルを評価し、スコアを平均することです。たとえば Artificial Analysis の [Intelligence Index](https://artificialanalysis.ai/methodology/intelligence-benchmarking) (v5) は、難しいタスクを中心にした 9 個の評価を 4 つのカテゴリに分け、重み付きで平均しています。

この方法には次のような弱点があります。

- **すべての (モデル, ベンチマーク) の組を評価する必要がある**: 新しいモデルを加えるたびに全ベンチマークを評価しなければならず、一部のスコアが欠けると平均が比較できなくなります。
- **飽和すると差がつかない**: どのモデルもほぼ満点を取るベンチマークは、モデル間の差を平均の中で押しつぶします。逆に、まだどのモデルも解けないベンチマークも差を生みません。
- **ベンチマークの難易度が明示されない**: 平均スコアからベンチマークの難しさはある程度わかりますが、「どの能力のモデルなら半分解けるのか」のように定量化はできません。

固定のセットで評価すると、ベンチマークが飽和するたびにセットを入れ替える必要があり、長期のトレンドも追えません。そのため Artificial Analysis も、2026 年 10 月から ECI と同じ考え方の [Progress Index](https://artificialanalysis.ai/methodology/progress-index) を[トレンドの分析](https://artificialanalysis.ai/trends)に使い始めています。

## ECI の方法

### モデル

ECI は、モデル $m$ のベンチマーク $b$ でのスコアを次のロジスティック関数で表します。

$$
\text{score}(m, b) = \sigma\bigl(\alpha_b (C_m - D_b)\bigr), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}
$$

- $C_m$: モデル $m$ の**能力** (capability)
- $D_b$: ベンチマーク $b$ の**難易度** (difficulty)。$C_m = D_b$ のときスコアがちょうど 50% になります。
- $\alpha_b$: ベンチマーク $b$ の**傾き** (slope)。大きいほど、難易度の付近でスコアが急に立ち上がります。

能力が難易度より十分高ければスコアは 100% に近づき、十分低ければ 0% に近づきます。モデルの能力とベンチマークの難易度が同じ一本の数直線の上に並ぶのがポイントで、項目反応理論 (Item Response Theory, IRT) の 2 パラメータモデルを、問題ではなくベンチマーク単位に適用したものと考えられます。

次の図で、$D_b$ と $\alpha_b$ を動かしてみてください。点はリーダーボードの各モデルで、横軸は後で推定する能力、縦軸はそのベンチマークの実際のスコアです。赤い線が予測と実際の誤差で、これを小さくするのがフィットです。

<figure>
<div data-eci-chart="sigmoid"></div>
<figcaption>一つのベンチマークのロジスティック曲線。スライダーで難易度 D と傾き α を動かすと曲線と誤差が変わります。破線は最小二乗フィットの曲線です。</figcaption>
</figure>

$D$ を動かすと曲線が左右に平行移動し、$\alpha$ を動かすと立ち上がりの急さが変わります。傾きが大きいベンチマークは、難易度の近くの狭い能力の範囲でしかモデルを区別できず、すぐに飽和します。

### 最適化

論文では、すべての $C_m$、$D_b$、$\alpha_b$ を同時に、L2 正則化付きの最小二乗法で推定します ([論文](https://arxiv.org/abs/2512.00193) の 2.3 節、および Epoch AI による[旧手法の説明](https://epoch.ai/publications/eci-bayesian-methodology))。

$$
\min_{C, D, \alpha} \sum_{(m, b)} \bigl(\text{score}(m, b) - y_{m,b}\bigr)^2 + \lambda \Bigl(\sum_b (\alpha_b^2 + D_b^2) + \sum_m C_m^2\Bigr), \qquad \lambda = \frac{0.1}{M + 2B - 2}
$$

$y_{m,b}$ は観測されたスコア、$M$ と $B$ はモデルとベンチマークの数です。和は**観測された組だけ**を取るので、一部のスコアが欠けていてもそのまま推定できます。

実装の詳細は次のとおりです。

- 初期値はすべての $C_m = D_b = 0$、$\alpha_b = 1$ です。
- SciPy の `least_squares` (Trust Region Reflective 法) で解き、$\alpha_b \in [0.1, 10]$、$C_m, D_b \in [-10, 10]$ に制約します。
- このモデルは、全体を定数倍する変換 ($\alpha_b \to k\alpha_b$、$C_m \to C_m / k$、$D_b \to D_b / k$) と、全体を平行移動する変換 ($C_m, D_b \to C_m + \delta, D_b + \delta$) で予測が変わらないため、解が一意に定まりません。そこで、一つのベンチマーク (論文では WinoGrande) の傾きを 1、難易度を 0 に固定します。

最後に、解釈しやすいように線形変換で尺度をそろえます。Epoch AI の ECI は Claude 3.5 Sonnet = 130、GPT-5 = 150 になるように変換しています。**ECI の絶対値には意味がなく、モデル間の差 (相対値) だけが意味を持ちます。**

なお、Epoch AI は 2026 年 11 月に、ベータ分布の尤度と MCMC による[ベイズ推定](https://epoch.ai/publications/eci-bayesian-methodology)に手法を更新しました。不確実性をより正しく扱えるようになりましたが、この記事では仕組みのわかりやすさを優先して、論文の最小二乗法を使います。

## 実際に ECI を計算してみる

### データ

[simple-evals-mm のリーダーボード](https://llm-jp.github.io/simple-evals-mm/) (2026 年 11 月 21 日時点) のスコアを使います。

- **モデル**: 14 モデルです。推論の強さ (effort) を変えた設定はそれぞれ別のモデルとして扱い、22 の設定になります。
- **ベンチマーク**: 日本語と英語、テキストと画像を含む 27 個です。
- **スコア**: 575 個です。テキスト専用モデルの LLM-jp-4.1 8B thinking はテキストの 8 個のベンチマークしか評価されていませんが、ECI ではそのまま扱えます。

simple-evals-mm はすべてのモデルを同じ評価ハーネスで評価しているので、外部の報告値を集めた場合と違って、評価方法の違いによるノイズはほとんどありません。

尺度は simple-evals-mm の [SEM-ECI](https://llm-jp.github.io/simple-evals-mm/trends/) に合わせ、GPT-6 Astra (max) = 150、Qwen3.5-9B (thinking) = 100 になるように変換します。固定するベンチマークは GPQA Diamond にしました。実験のコードはこのブログのリポジトリの [experiments/eci](https://github.com/speed1313/speed1313.github.io/tree/main/experiments/eci) にあります。

### 最適化の経緯

最適化が進むにつれて、曲線と能力の推定値がどう変わるかを見てみましょう。「Play」を押すと、`least_squares` が受け入れた各ステップの間を補間したアニメーションが流れます。

<figure>
<div data-eci-chart="optimization"></div>
<figcaption>最適化の経緯。上段は各ベンチマークの曲線 (選択したベンチマークは緑) とそのベンチマークのスコア、下段は各モデルの能力の推定値です。尺度は最終的な ECI の尺度です。</figcaption>
</figure>

最初はすべてのモデルの能力が同じ値なので、点は縦一列に並びます。最初の数ステップでモデルが能力の順に左右に広がり、同時に各ベンチマークの曲線が左右に移動して、点の並びに沿うように傾きを変えていきます。二乗誤差の和は 69.7 から 2.1 まで下がり、12 ステップでほぼ収束します。全体のフィットは $R^2 = 0.946$、誤差の二乗平均平方根 (RMSE) は 6.1 ポイントでした。

### モデルの能力

推定された能力 (ECI) でモデルを並べたのが次の図です。ボタンで、テキストや画像のベンチマークだけで推定した値 (後述)、平均スコア、simple-evals-mm の SEM-ECI に切り替えられます。

<figure>
<div data-eci-chart="ranking"></div>
<figcaption>ECI によるモデルのランキング。ボタンで指標を切り替えられます。</figcaption>
</figure>

GPT-6 Astra (max) と Claude Opus 5.5 (max) が上位に並び、オープンモデルでは Kimi K3.1 Pro (max) が 135 と、Gemini 3.8 Flash (high) を上回っています。effort を上げると、同じモデルでも 2 から 12 ポイントほど ECI が上がります。順位は実際に使った印象ともおおむね合っています。

### ベンチマークの難易度

各ベンチマークの曲線を重ねたのが次の図です。simple-evals-mm の [Trends](https://llm-jp.github.io/simple-evals-mm/trends/) の「SEM-ECI vs benchmark score」に相当します。曲線にカーソルを合わせるか、ベンチマークを選ぶと、そのベンチマークのスコアが表示されます。

<figure>
<div data-eci-chart="curves"></div>
<figcaption>各ベンチマークの、能力に対する予測スコアの曲線。色はベンチマークのカテゴリです。灰色の帯は、評価したモデルの能力の範囲です。</figcaption>
</figure>

難易度 $D_b$ と傾き $\alpha_b$ を一つの図にまとめると、次のようになります。点が難易度 (予測スコア 50%)、帯は予測スコアが 10% から 90% に上がる能力の範囲で、帯が短いほど傾きが急です。

<figure>
<div data-eci-chart="difficulty"></div>
<figcaption>ベンチマークの難易度。点は難易度 D、帯は予測スコアが 10% から 90% になる範囲です。</figcaption>
</figure>

最も難しいのは ZeroBench (D = 156) で、最も能力の高いモデル (150) でも予測スコアは 50% に届きません。次いで HLE-Diamond (144)、SimpleQA Verified (126) が続きます。反対に、RealWorldQA、JGraphQA-Refined、CountBenchQA は難易度が 30 前後で、今回のモデルにとってはほぼ飽和しています。直感ともよく合う結果です。

IFBench は帯が非常に長く ($\alpha$ が小さく)、フィットの $R^2$ も 0.17 しかありません。能力の高いモデルでもスコアが伸びず、能力とスコアの関係が弱いベンチマークであることがわかります。

## 平均スコアと ECI はどう違うか

すべてのベンチマークのスコアがそろっている場合、ECI と平均スコアの順位はほとんど同じです (Kendall の順位相関 τ = 0.98)。次の図のとおり、関係は単調ですが、直線ではありません。

<figure>
<div data-eci-chart="mean-vs-eci"></div>
<figcaption>平均スコアと ECI。中抜きの点はテキストの 8 個のベンチマークだけで評価したモデルです。</figcaption>
</figure>

違いが大きいのは、スコアが欠けているときです。テキスト専用の LLM-jp-4.1 8B thinking は平均スコアでは 35% と最下位ですが、これは解いたベンチマークが難しいものに偏っているためです。ECI ではベンチマークの難易度が考慮されるので 81 になり、マルチモーダルモデルの LLM-jp-4-VL 9B (68) を上回ります。

### スコアが欠けても順位は保たれるか

すべてのベンチマークがそろった 21 の設定について、全スコアの平均による順位を正解とし、一部のスコアを取り除いたときに、残ったスコアの平均と ECI がどれだけ正解の順位を再現できるかを調べました。取り除き方は次の 2 通りです。

- **ランダムに欠ける**: 各スコアを同じ確率で取り除きます。
- **難易度によって欠ける**: 能力の低い半分のモデルは難しいベンチマーク (難易度の上位 3 分の 1) が、能力の高い半分のモデルは易しいベンチマーク (下位 3 分の 1) が、それぞれの確率で欠けます。古いモデルは新しい難しいベンチマークで評価されず、新しいモデルは古い易しいベンチマークで評価されない、という実際によくある状況です。

<figure>
<div data-eci-chart="robustness"></div>
<figcaption>スコアを取り除いた割合と、全スコアの平均による順位との Kendall τ。30 回の試行の平均と、10% から 90% の範囲です。</figcaption>
</figure>

ランダムに欠ける場合でも ECI のほうが順位をよく保ち、70% を取り除いても τ = 0.83 です (平均では 0.64)。難易度によって欠ける場合は差がさらに広がり、平均の τ は 0.58 まで下がる一方で、ECI は 0.90 を保ちます。平均は易しいベンチマークしか評価されていないモデルを過大評価しますが、ECI は難易度を推定してその偏りを補正できるためです。異なるベンチマークで評価されたモデルを比較できることが、ECI の最大の利点です。

## 評価していないベンチマークのスコアを予測する

ECI のモデルが正しければ、モデルの能力とベンチマークのパラメータから、まだ評価していないスコアも予測できるはずです。575 個のスコアのそれぞれについて、そのスコアだけを除いてフィットし直し、除いたスコアを予測しました (leave-one-out)。

<figure>
<div data-eci-chart="prediction"></div>
<figcaption>そのスコアを除いてフィットした ECI による予測と、実際のスコア。点線は予測が完全に当たる場合です。</figcaption>
</figure>

予測の RMSE は 7.8 ポイントで、「そのベンチマークの他のモデルの平均」で予測した場合 (15.5 ポイント) の半分です。

予測が外れるところには、モデルの得意不得意が表れます。実際のスコアから予測を引いた値をモデルとベンチマークごとに並べたのが次の図です。

<figure>
<div data-eci-chart="residuals"></div>
<figcaption>実際のスコアと予測の差。青は予測より良く、赤は予測より悪いことを表します。行は ECI の順、列は易しい順です。</figcaption>
</figure>

- **ScreenSpot-Pro (GUI 操作)**: 最も予測が外れるベンチマークです。DeepSeek-V4.1-Flash (max) は予測の 59% に対して実際は 8.5%、Muse Glimmer 30B (low) は予測の 17% に対して 62% でした。GUI の要素を正確に指し示す能力は、全体の能力とは別に学習されているようです。
- **LLM-jp-4-VL 9B**: MECHA-ja (予測 34%、実際 65%)、CVQA-JA、JamC-QA といった日本の文化や知識を問うベンチマークでは予測を大きく上回り、MMMU-Pro (予測 58%、実際 33%) のような英語の専門知識のベンチマークでは下回ります。日本語と日本の文化に特化して開発したモデルなので、狙いどおりの特徴が表れています。

このように、予測と実際の差を見ると、タスクやドメインへの特化の度合いを定量的に判断できます。論文でも、Claude のモデルはコーディングの SWE-Bench Verified で予測を上回り、画像の GeoBench で下回るといった例が挙げられています。

## テキストと画像で能力は違うか

ECI は能力を一つの数で表すことを仮定していますが、この仮定はどこまで成り立つでしょうか。Epoch AI のドメイン別の ECI と同じように、全体のフィットで得た $D_b$ と $\alpha_b$ を固定し、テキストのベンチマークだけ、画像のベンチマークだけで各モデルの能力を推定し直しました。

<figure>
<div data-eci-chart="domains"></div>
<figcaption>テキストのベンチマークだけ、画像を含むベンチマークだけで推定した ECI。差が 6 ポイントより大きいモデルに名前を付けています。</figcaption>
</figure>

DeepSeek-V4.1-Flash はテキストのほうが 16 から 19 ポイント高く、Gemini 3.8 Flash (high) も 11 ポイント高くなっています。反対に Muse Glimmer 30B (low) は画像のほうが 13 ポイント高くなっています。Epoch AI の [Asterisk の記事](https://asteriskmag.substack.com/p/the-most-important-number-in-ai)によれば、Epoch の ECI ではドメインによる差はふつう数ポイントとのことですが、テキストと画像のように性質の大きく異なるタスクの間では、一つの数で表す仮定はかなり崩れます。順位を見るときは、どのベンチマークで推定したのかを意識する必要があります。

一方で、このように能力を一つの数で表すからこそ、テキスト専用モデルとマルチモーダルモデルのように、評価できるベンチマークが違うモデルどうしも同じ尺度の上で比較できます。

## 問題単位の推定 (SEM-ECI) との比較

ECI はベンチマークの平均スコアを使いますが、simple-evals-mm の [SEM-ECI](https://llm-jp.github.io/simple-evals-mm/trends/) は、各問題の正誤から問題ごとの難易度と傾きを推定する、問題単位の IRT です。多肢選択の当て推量の補正や、ベンチマークごとの重みの調整も入っています。

<figure>
<div data-eci-chart="sem"></div>
<figcaption>この記事の ECI (ベンチマーク単位、最小二乗法) と SEM-ECI (問題単位)。点線は両者が一致する場合です。</figcaption>
</figure>

二つの値の差は平均 1.6 ポイントで、ほとんど一致します。最も差が大きいのは LLM-jp-4-VL 9B (6.3 ポイント) でした。少なくともこのデータでは、ベンチマークの平均スコアだけでも、問題単位とほぼ同じ能力の推定が得られます。

ただし、論文も述べているように、ベンチマーク単位の推定には弱点もあります。たとえば一つのベンチマークを二つに分割すると、問題は同じなのにそのベンチマークの重みが 2 倍になってしまいます。問題単位の推定ではこのような問題が起きにくくなります。

## パラメータ数と能力

オープンモデルについて、総パラメータ数と ECI の関係を見てみます。

<figure>
<div data-eci-chart="params"></div>
<figcaption>オープンモデルの総パラメータ数 (対数軸) と ECI。</figcaption>
</figure>

大きなモデルほど能力が高い傾向はありますが、同じ規模でのばらつきが大きく、Qwen3.5-9B (100) は 9B ながら 300B を超える GLM-5.3 Flash (low) と同程度です。このように、パラメータ数の割に能力の高い、効率的なモデルを見つけるのにも使えます。ただし、推論のコストや速度、MoE の活性パラメータ数は考慮していません。

## 将来の能力を予測する

ECI の重要な用途は、フロンティアのモデルの能力の推移を外挿して将来を予測することです。論文では、フロンティアの能力が年に約 0.55 (元の尺度) のペースで直線的に伸びていて、これは GPT-4.5 から GPT-5 への差に相当すると報告しています。Epoch AI の ECI の尺度では、推論モデルの登場以降、年に約 15 から 18 ポイントのペースです ([Asterisk](https://asteriskmag.substack.com/p/the-most-important-number-in-ai))。OpenAI も、自社モデルの OECI のフロンティアが 2025 年 8 月以降に年 16.4 ポイントのペースで伸びていると報告しています。

Anthropic は、AECI がこの直線のトレンドから上に外れていくかどうかで、加速が起きているかを判断しています。Claude Mythos 5 は直線のトレンドより上にありましたが、その外れ方は前のモデルの Claude Mythos Preview と同程度で、能力の伸びが複利的に加速している証拠ではないと結論付けています。

今回のデータは 2026 年 3 月から 10 月にリリースされたモデルだけで、期間が短くフロンティアのモデルも少ないため、外挿はしませんでした。長期の予測には、Epoch AI のように長い期間にわたるモデルとベンチマークのデータが必要です。

## ECI を解釈するうえでの注意点

ここまでの実験と論文の議論から、ECI を解釈するうえでの注意点をまとめます。

- **ドメインに特化した能力は測れない**: 能力を一つの数で表すので、GUI 操作のように特化した能力は全体の ECI に表れません。ドメイン別に ECI を推定すればある程度回避できます。
- **ベンチマークの選び方で結果が変わる**: どのベンチマークを含めるかで順位は変わります。たとえば知識を問うベンチマークを多く含めると、大きなモデルが有利になります。エージェントのタスクを加えると、モデル間の差はさらに広がるかもしれません。
- **上限が 100% でないベンチマーク**: 問題の誤りなどで満点が取れないベンチマークでは、難易度が実際より高く推定されます。
- **当て推量**: 論文のモデルは 0% を下限とするので、GPQA Diamond のような 4 択の問題 (当て推量で 25%) では、難易度が低めに推定されます。今回も GPQA Diamond の難易度は 72 で、当て推量を補正した SEM-ECI の 81 より低くなりました。Epoch AI のベイズ版や SEM-ECI は、当て推量の分を 0 にするようにスコアを変換しています。
- **ベンチマークのノイズ**: 問題数の少ないベンチマークのスコアにはノイズがあり、推定に影響します。
- **評価設定の違い**: 外部の報告値を集める場合、プロンプトや推論の予算などの設定が違うスコアを比べることになります。
- **難しいベンチマークの不足**: 能力の最も高いモデルより難しいベンチマークが少ないと、上位のモデルの差や今後の伸びを測りにくくなります。今回は ZeroBench と HLE-Diamond しかありませんでした。
- **差の解釈が難しい**: ECI の差が何を意味するかは自明ではありません。「GPT-4 から GPT-5 への差の何倍」のように既知のモデルの差で解釈するか、METR のタスクの時間 (time horizon) に対応付けて解釈する方法が提案されています。
- **コストや速度は含まれない**: 推論のコストや遅延は考慮されていません。

## まとめ

ECI は、ロジスティック関数というシンプルなモデルで、多くのベンチマークのスコアからモデルの能力とベンチマークの難易度を同時に推定します。simple-evals-mm のスコアで実際にフィットしてみると、次のことがわかりました。

- 推定された能力と難易度は直感とよく合い、問題単位で推定した SEM-ECI ともほぼ一致しました。
- スコアの一部が欠けても、特に難易度に偏って欠けた場合に、平均スコアよりはるかによく順位を保ちました。
- 評価していないスコアを RMSE 7.8 ポイントで予測でき、予測が外れるところからモデルの得意不得意 (GUI 操作や日本語) が見えました。
- テキストと画像では能力が大きく異なるモデルもあり、一つの数で表す仮定の限界も確認できました。

複数の組織が ECI を使ってモデルの進歩を追跡し、加速の兆候を監視しています。その数字がどのような仮定と方法から得られているのかを理解しておくことは、AI の進歩を正しく読み取るうえで大切だと思います。

## 参考文献

- Anson Ho, Jean-Stanislas Denain, David Atanasov, Samuel Albanie, Rohin Shah. [A Rosetta Stone for AI Benchmarks](https://arxiv.org/abs/2512.00193). arXiv, 2025.
- Epoch AI. [Epoch Capabilities Index](https://epoch.ai/eci).
- Epoch AI. [Updating the ECI methodology to use a Bayesian model](https://epoch.ai/publications/eci-bayesian-methodology). 2026.
- Asterisk Magazine. [The most important number in AI](https://asteriskmag.substack.com/p/the-most-important-number-in-ai). 2026.
- OpenAI. [Research acceleration: The jagged frontier](https://openai.com/index/research-acceleration-jagged-frontier/). 2026.
- Anthropic. [Claude Fable 5 & Claude Mythos 5 System Card](https://assets.claude.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf). 2026.
- Artificial Analysis. [Progress Index methodology](https://artificialanalysis.ai/methodology/progress-index) / [Trends](https://artificialanalysis.ai/trends).
- LLM-jp. [simple-evals-mm leaderboard](https://llm-jp.github.io/simple-evals-mm/) / [Trends (SEM-ECI)](https://llm-jp.github.io/simple-evals-mm/trends/).

<script type="module" src="./eci-charts.js"></script>
