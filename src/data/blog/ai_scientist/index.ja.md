---
title: "The AI ScientistをSEIRモデルに適用してみる"
description: "感染症の流行予測に用いられる微分方程式ベースのモデルであるSEIRモデルに、The AI Scientistを適用してみます。"
translatedDatetime: 2026-10-31
---

## はじめに

「The AI Scientist」は、大規模言語モデル (LLM) を用いて科学的発見のプロセスを完全に自動化することを目指して、Sakana AIが提案したシステムです。

The AI Scientistの強みは、アイデアの生成、実験、執筆、査読を人の手を借りずに自律的に行える点にあります (最初のコードベースの準備を除く)。特に実験の反復において、モデルが自らコードを修正し、結果からデータを抽出し、新たな知見を発見することで、LLMの可能性を広げています。

元論文では、The AI Scientistに深層学習分野の研究を行わせることに焦点を当てていました。しかし論文でも述べられているように、The AI Scientistの応用先は特定の分野に限られません。

本稿では、感染症の流行予測に用いられる微分方程式ベースのモデルであるSEIRモデルに、The AI Scientistを適用してみます。

## 背景

### The AI Scientist

<figure>
    <img src="./ai_scientist_overview.png" alt="The AI Scientistの概要" style="width: 80%;">
    <figcaption>The AI Scientistの概要 (図: https://arxiv.org/abs/2408.06292) </figcaption>
</figure>

The AI Scientistは、LLMを用いて科学的発見のプロセスを完全に自動化することを目指したシステムです。

The AI Scientistの処理の流れは次のとおりです。

まず、与えられたシードアイデアをもとに新しいアイデアを生成し、[Semantic Scholar API](https://www.semanticscholar.org/) を用いて生成したアイデアを検証します。次に実験を反復します。この反復の中で、The AI Scientistはコードの修正、実行、結果からのデータ抽出を自動で行います。
実験の後、それまでのステップをもとに論文を執筆します。
最後に、論文の査読を行います。

The AI Scientistの主な構成要素は次のとおりです。

- [Aider](https://aider.chat/): LLMとペアプログラミングを行うためのツールです。このツールを使うことで、The AI ScientistはLLMの助けを借りてコードや論文などの文書を編集できます。Aiderのデモは[こちら](https://aider.chat/)で見られます。
- テンプレート (シードアイデア、コードベース、LaTeXファイル): The AI Scientistはこれらのテンプレートを繰り返し修正しながら、アイデアの生成、実験、論文執筆を行います。

### SEIRモデル

SEIRモデルは、感染症の流行を予測するために用いられるモデルです。このモデルでは、集団を感受性者 ($S$)、潜伏感染者 ($E$)、感染者 ($I$)、回復者 ($R$) の4つの区画に分けます。モデルは次の微分方程式に基づいています。

$$
\begin{align*}
\frac{dS}{dt} &= -\beta SI \\
\frac{dE}{dt} &= \beta S I - \sigma E \\
\frac{dI}{dt} &= \sigma E - \gamma I \\
\frac{dR}{dt} &= \gamma I
\end{align*}
$$

ここで、

- $S$: 感受性者の数
- $E$: 潜伏感染者の数
- $I$: 感染者の数
- $R$: 回復者の数
- $t$: 時間
- $\beta$、$\sigma$、$\gamma$: モデルのパラメータ

です。初期条件を与えてこれらの方程式を解くことで、次の図のように各時刻における人口の分布が得られます。

<figure>
<img src="./seir_solution.png" alt="SEIRモデルのベースラインの結果" style="width: 80%;">
<figcaption>SEIRモデルの解</figcaption>

</figure>

## 実験設定

ここでは実験の設定について説明します。
本実験で用いたコードは [https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir](https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir) にあります (私のテンプレートコードが公式リポジトリにマージされました)。

### テンプレートの準備

The AI Scientistで独自の実験を行うには、LLMがアイデアの生成、実験、論文執筆を行う際のコードベースとなるテンプレートディレクトリを用意する必要があります。テンプレートディレクトリの構成は次のとおりです。

```
template/
├── latex/            # contains .tex, .sty, and .bst files for writing papers
├── experiment.py     # codebase to conduct experiments
├── plot.py           # codebase for plotting results for the paper
├── seed_ideas.json   # seed ideas for problems you want to solve
├── ideas.json        # JSON file for storing generated ideas
└── prompt.json       # system and task prompts for The AI Scientist
```

The AI ScientistをSEIRモデルに適用するために、テンプレートディレクトリを次のように用意しました。

- `latex/`

基本的には公式のGitHubリポジトリの内容をそのまま使いましたが、参考文献の項目をSEIRモデルに関するものに変更しました。また、texファイル内の画像のファイル名を変更しました。

- `experiment.py`

[こちら](https://github.com/moonmile/seir-model/blob/master/py/seir.py)を参考に、SEIRモデルを解くコードを用意しました。このコードは、感受性者: 3000、潜伏感染者: 0、感染者: 5、回復者: 0 という初期条件のもとでSEIRモデルを解きます。

experiment.pyの実行結果として、次の情報を保存するようにしました。

- “solution”: 各時刻における人口の分布
- “infected_peak_day”: 感染者数がピークに達した時刻
- “infected_peak”: ピーク時の感染者数
- “total_infected”: 回復者の総数

ただし、実験結果を基盤モデルに報告する際には、solutionはプロンプトに含めないことにしました。大きなリストであり、悪影響を及ぼす可能性があるためです。

- `plot.py`

SEIRモデルの解を図示した画像を生成し、`seir_solution_run_0.png` として保存する `plot.py` を用意しました。感染症の流行時には感染者数のピークを抑えることが重要なので、ピークの位置に線を引いています。
ベースラインの結果の画像は次のとおりです。

<figure>
<img src="./seir_solution.png" alt="SEIRモデルのベースラインの結果" style="width: 80%;">
<figcaption>seir_solution_run_0.png</figcaption>

</figure>

- `seed_ideas.json`

`seed_ideas.json` には次のアイデアを用意しました。

```
[
 {
     "Name": "time_varying_vaccination_seir",
     "Title": "Modeling the Impact of Time-Varying Vaccination on SEIR Dynamics",
     "Experiment": "Enhance the seir_eq function to include a new compartment for vaccinated individuals (V) with a time-varying vaccination rate. Update the equations to reflect individuals transitioning from S to V, allowing the vaccination rate to change at specified intervals. Simulate scenarios with different vaccination strategies and analyze their effects on final infection counts and peak infections. This will offer insights into how dynamic vaccination efforts can influence infection spread.",
     "Interestingness": 9,
     "Feasibility": 7,
     "Novelty": 9
 }
]
```

- `ideas.json`

`ideas.json` は空のファイルとして用意しました。

- `prompt.json`

公式のテンプレートコードと同じ内容を使いました。

```
{
   "system": "You are an ambitious AI researcher who is looking to publish a paper that will contribute significantly to the field.",
   "task_description": "You are given the following file to work with, which run the SEIR infection model."
}
```

### 設定

- 基盤モデルとして gpt-4o-mini-2024-07-18 を使いました。(注意: gpt-4o-mini-2024-07-18 を使うと、コードやTeXを編集する際に編集すべき箇所を正しく特定できないことがあります。そのような問題が起きた場合は、GPT-4のようなより高性能なモデルを使うことをおすすめします。参考: https://github.com/speed1313/blog-comment/issues/2)

- 以上の準備の後、次のコマンドを実行して実験を開始しました。

```
$ python launch_scientist.py --model "gpt-4o-mini-2024-07-18" --experiment seir --num-ideas 2
```

## 結果

### アイデアの生成

生成されたアイデアは次のとおりです (生成結果のため原文のまま掲載します)。

- "Name": "threshold_behavioral_response_seir"
  - "Title": "Modeling Threshold-Based Behavioral Responses in SEIR Dynamics"
  - "Experiment": "Modify the seir_eq function to implement multiple thresholds for adjusting the contact rate based on the proportion of infected individuals. Define specific behavior change scenarios (e.g., reduced contact rates at 1%, 5%, 10% infection levels) and analyze their impacts on peak infections and total infections. This will allow for a more detailed understanding of how varying public health responses can influence disease spread."
  - "Interestingness": 9
  - "Feasibility": 8
  - "Novelty": 9
  - "novel": true

- "Name": "vaccination_strategy_seir"
  - "Title": "Incorporating Vaccination Strategies in SEIR Dynamics"
  - "Experiment": "Modify the seir_eq function to include a vaccination term that reduces the susceptible population over time. Implement two primary vaccination scenarios: a constant vaccination rate and a ramp-up vaccination rate. Analyze the impacts of each scenario on peak infections and total infections. Compare results to assess the effectiveness of vaccination in mitigating outbreaks.",
  - "Interestingness": 9
  - "Feasibility": 8
  - "Novelty": 8
  - "novel": true

- "Name": "network_based_seir"
  - "Title": "Incorporating Network Structures in SEIR Dynamics"
  - "Experiment": “Modify the SEIR model by implementing a basic random - graph where individuals are nodes and edges represent potential contacts. Adjust the infection rate based on the number of contacts each individual has. Conduct a comparative analysis between the traditional SEIR model and this network-based model to evaluate the impact of network structure on peak infections and total infections. Analyze how targeted public health interventions could be designed based on observed network characteristics."
  - "Interestingness": 9
  - "Feasibility": 8
  - "Novelty": 9
  - "novel": true

新規性 (Novelty) のスコアは高すぎるかもしれませんが、どれも良いアイデアに見えます。

以降では、最もよく書けた論文を生成した 'network_based_seir' のアイデアの結果に絞って紹介します。

### 実験の反復

1回目の実行で、The AI Scientistはランダムに生成したネットワークグラフの平均次数を計算し、betaに平均次数を掛けるコードを追加しました。しかし、その後betaは使われていないため、ベースラインと比べて結果は変わりません。
The AI Scientistが追加した行は、以下のコードで "+" を付けて示しています。

```python
import os
import json
import numpy as np
import argparse
+ import networkx as nx
from scipy.integrate import odeint

# -----------------------------------------------------------------------------
# SEIR model is a differential equation model that describes the dynamics of infectious diseases such as COVID-19.
# The model divides the population into four compartments: S (susceptible), E (exposed), I (infectious), and R (recovered).
# -----------------------------------------------------------------------------


parser = argparse.ArgumentParser(description="Run experiment")
parser.add_argument("--out_dir", type=str, default="run_0", help="Output directory")
args = parser.parse_args()

if __name__ == "__main__":
    out_dir = args.out_dir
    os.makedirs(out_dir, exist_ok=True)

    def seir_eq(v, t, beta, lp, ip):
        """Differential equation of SEIR model
        v: [S, E, I, R] Distribution of people in each state
        t: Time
        beta: Infection rate
        lp: Latent period
        ip: Infectious period
        """
        dS = -beta * v[0] * v[2]
        dE = beta * v[0] * v[2] - (1 / lp) * v[1]
        dI = (1 / lp) * v[1] - (1 / ip) * v[2]
        dR = (1 / ip) * v[2]
        return np.array([dS, dE, dI, dR])

+
+     # Create a random graph
+     num_nodes = 1000
+     edge_creation_prob = 0.01
+     G = nx.erdos_renyi_graph(num_nodes, edge_creation_prob)
+
+     # Calculate the average degree
+     avg_degree = np.mean([deg for node, deg in G.degree()])
+
+     # Adjust infection rate based on average degree
+     beta = 0.001 * avg_degree  # Scale infection rate by average degree

    # Solve SEIR model
    init_state = np.array([3000, 0, 5, 0])
    solution = odeint(
        seir_eq,
        init_state,
        t=np.arange(0, 100, 1),
        args=(0.001, 14, 7),
    )

    final_info = {
        "solution": solution.tolist(),
        "infected_peak_day": np.argmax(solution[:, 2]).item(),
        "infected_peak": np.max(solution[:, 2]).item(),
        "tolal_infected": solution[-1, 3].item(),
    }
    with open(os.path.join(out_dir, "final_info.json"), "w") as f:
        json.dump(final_info, f)
```

2回目から最後の実行まで、1回目と同様のコード修正が行われました。その後betaは使われないため、すべての実験で同じ結果になりました。

### 論文の執筆

この段階で次のPDFが生成されました。論文の全文は[こちら](./network_based_seir.pdf)で見られます。

<style>
.column {
  display: flex;
  gap: 1rem;
}
.column img {
  width: 30%;
}
</style>

<div class="column">
  <img src="./network_based_seir_page1.png" alt="生成された論文の1ページ目">
  <img src="./network_based_seir_page2.png" alt="生成された論文の2ページ目">
  <img src="./network_based_seir_page3.png" alt="生成された論文の3ページ目">
</div>

<div class="column">
  <figure style="display: flex; flex-direction: column; align-items: center;">
    <div style="display: flex; gap: 1rem;">
      <img src="./network_based_seir_page4.png" alt="生成された論文の4ページ目">
      <img src="./network_based_seir_page5.png" alt="生成された論文の5ページ目">
      <img src="./network_based_seir_page6.png" alt="生成された論文の6ページ目">
    </div>
    <figcaption>
      Incorporating Network Structures in SEIR Dynamics (The AI Scientistが生成)
    </figcaption>
  </figure>

</div>

生成された論文は一見よくできています。
しかし、明らかな誤りもいくつかあります。例を挙げます。

- 次のように、空のままになっているセクションがあります。

<figure>
    <img src="./duplicated_section.png" alt="論文中の空のセクション" style="width: 80%;">
    <figcaption>論文中の空のセクション</figcaption>
</figure>

- ベースラインモデルのハイパーパラメータを既存研究に基づいて選んだと誤って記述しています。実際にはハイパーパラメータの選定にそのような文献は使っておらず、捏造です。
- 引用数が非常に少ないです。
- 実験と結果の記述の大半が、ベースラインのコードの説明で占められています。

## 知見

ベースのコードを作る際は、小さな関数を複数定義するよりも、1つの関数にまとめた方が良いです。処理ごとに関数を分けると、編集の際に関数定義のパラメータと呼び出し時の引数の整合性を保つ必要が生じます。編集すべき箇所が増え、ミスが増えるためです。この問題は、今回使ったgpt-4o-miniより高性能なモデルであれば解決するかもしれません。

## おわりに

本稿では、「The AI Scientist」をSEIRモデルに適用しました。実験では一見よく書けた論文が生成されましたが、LLMが行った実験はうまくいっておらず、論文の質も良くありませんでした。
まだ完璧ではありませんが、The AI Scientistは深層学習だけでなく、微分方程式を操作して様々なシミュレーションを行えることが分かりました。微分方程式は物理学や経済学など様々な分野で使われているので、政策立案者やファンドマネージャーのような人々が、The AI Scientistの生み出す知見や結果をもとに素早く意思決定を行う未来が来るかもしれません。

### 参考文献

- Lu et al., The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery, [https://arxiv.org/abs/2408.06292](https://arxiv.org/abs/2408.06292)
- The AI Scientist 公式GitHubリポジトリ、[https://github.com/SakanaAI/AI-Scientist](https://github.com/SakanaAI/AI-Scientist)
- seir-model の参考コード、[https://github.com/moonmile/seir-model/blob/master/py/seir.py](https://github.com/moonmile/seir-model/blob/master/py/seir.py)
- 日本内科学会、[感染症の数理モデルと対策](https://www.naika.or.jp/wp-content/uploads/2020/11/nichinaishi-109-11-article_4.pdf)
- 本実験のコード、[https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir](https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir)
