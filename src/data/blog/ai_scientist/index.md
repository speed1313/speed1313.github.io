---
title: "Let's Apply The AI Scientist to the SEIR Model"
author: speed1313
pubDatetime: 2024-10-09
slug: ai_scientist
featured: false
draft: false
tags:
  - Agents
description: "Let's apply The AI Scientist to the SEIR model, a differential equation-based model used to predict the spread of infectious diseases."
lang: en
---

## Introduction

"The AI Scientist" is a system proposed by Sakana AI that aims to fully automate the scientific discovery process using large language models (LLMs).

The strength of The AI Scientist lies in its ability to independently generate ideas, conduct experiments, write, and review without human assistance (with the exception of the initial preparation of the code base). In particular, during the experiment iteration, the model showcases its potential by autonomously modifying code, extracting data from results, and discovering new insights, thereby expanding the capabilities of large language models (LLMs).

In the original paper, they focused on having The AI Scientists conduct research in the field of deep learning. However, as mentioned in the paper, the potential applications of The AI Scientists are open-ended.

Here, I apply The AI Scientists to the SEIR model, a differential equation-based model used to predict the spread of infectious diseases.

## Background

### The AI Scientist

<figure>
    <img src="./ai_scientist_overview.png" alt="Overview of The AI Scientist" style="width: 80%;">
    <figcaption>Overview of The AI Scientist (Fig: https://arxiv.org/abs/2408.06292) </figcaption>
</figure>

The AI Scientist is a system that aims to fully automate the scientific discovery process using large language models (LLMs).

The process of The AI Scientist is as follows:

The AI Scientist first generate the novel ideas given a seed idea and validate generated ideas with the help of the [Semantic Scholar API](https://www.semanticscholar.org/). Then, The AI Scientist conduct experiment iteration. During the iteration, The AI Scientist automatically modifies the code, executes the code, and extracts data from the results.
After the experiment, The AI Scientist writes a paper based on the previous steps.
Then, The AI Scientist do paper reviewing.

There are some key components of The AI Scientist:

- [Aider](https://aider.chat/): A tool to pair program with LLMs. By using this tool, The AI Scientist can edit code, papers, and other documents with the help of LLMs. You can see the demo of Aider [here](https://aider.chat/).
- Template seed ideas, codebase, and LaTeX files: The AI Scientist iteratively modifies these templates to generate ideas, conduct experiments, and write papers.

### SEIR Model

The SEIR model is a model used to predict the spread of infectious diseases. The model divides the population into four compartments: Susceptible ($S$), Exposed ($E$), Infected ($I$), and Recovered ($R$). The model is based on the following differential equations:

$$
\begin{align*}
\frac{dS}{dt} &= -\beta SI \\
\frac{dE}{dt} &= \beta S I - \sigma E \\
\frac{dI}{dt} &= \sigma E - \gamma I \\
\frac{dR}{dt} &= \gamma I
\end{align*}
$$

where:

- $S$: the number of susceptible individuals
- $E$: the number of exposed individuals
- $I$: the number of infected individuals
- $R$: the number of recovered individuals
- $t$: time
- $\beta$, $\sigma$, $\gamma$: parameters of the model

By solving these equations given the initial conditions, we can obtain the population distribution at each time step like the following image.

<figure>
<img src="./seir_solution.png" alt="Baseline Results of SEIR Model" style="width: 80%;">
<figcaption>Solution of the SEIR Model</figcaption>

</figure>

## Experiment Setup

I will explain the setup of the experiment in this part.
The experimental code used in this experiment can be found at [https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir](https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir) (My template code was merged into the official repo.)

### Template Setup

When we want to conduct custom experiments using The AI Scientist, we need to prepare a template directory that is used as a codebase for LLMs to generate ideas, conduct experiments, and write papers. The template directory is structured as follows:

```
template/
├── latex/            # contains .tex, .sty, and .bst files for writing papers
├── experiment.py     # codebase to conduct experiments
├── plot.py           # codebase for plotting results for the paper
├── seed_ideas.json   # seed ideas for problems you want to solve
├── ideas.json        # JSON file for storing generated ideas
└── prompt.json       # system and task prompts for The AI Scientist
```

To apply The AI Scientist to the SEIR model, I prepared the template directory as follows:

- `latex/`

Basically, I used the content from official GitHub repository as is, but I modified the bibliography items to focus on the SEIR model. Additionally, I changed the filenames of the images in the tex file.

- `experiment.py`

I prepared a code that solves the SEIR model, using the reference from [here](https://github.com/moonmile/seir-model/blob/master/py/seir.py). This code solves the SEIR model given the initial conditions of Susceptible: 3000, Exposed: 0, Infected: 5, and Recovered: 0.

And the results of the experiment.py are designed to save the below information:

- “solution”: The population distribution at each time step.
- “infected_peak_day”: The time of the peak number of infections.
- “infected_peak”: The number of infections at the peak.
- “total_infected”: The total number of recoveries.

However, when reporting the experimental results to the base foundation model, I chose not to include the solution in the prompt, as it is a large list that could potentially have negative effects.

- `plot.py`

I prepared `plot.py` that generates an image that shows the solution of the SEIR model and saves it as `seir_solution_run_0.png`. Since it is crucial to mitigate the peak number of infections during an epidemic, a line has been drawn at the peak section.
The image of the baseline results is shown below.

<figure>
<img src="./seir_solution.png" alt="Baseline Results of SEIR Model" style="width: 80%;">
<figcaption>seir_solution_run_0.png</figcaption>

</figure>

- `seed_ideas.json`

I prepared the following idea in `seed_ideas.json`.

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

I prepared `ideas.json` as an empty file.

- `prompt.json`

I use the same content as in the official template code.

```
{
   "system": "You are an ambitious AI researcher who is looking to publish a paper that will contribute significantly to the field.",
   "task_description": "You are given the following file to work with, which run the SEIR infection model."
}
```

### Configuration

- I used the gpt-4o-mini-2024-07-18 model as the base foundation model. (Warning: When using the gpt-4o-mini-2024-07-18 model, it may not accurately identify the correct sections to edit when working with code or TeX. If you encounter such issues, it is recommended to use a more advanced model like GPT-4. Reference: https://github.com/speed1313/blog-comment/issues/2)

- After this preparation, I executed the below command to start the experiment.

```
$ python launch_scientist.py --model "gpt-4o-mini-2024-07-18" --experiment seir --num-ideas 2
```

## Result

### Idea Generations

The generated ideas are shown below:

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

The novelty scores may be too high, but they appear to be good ideas.

In the following parts, I will focus on the results of the 'network_based_seir' idea, as it generated the most well-written paper.

### Experiment Iteration

In the first run, The AI Scientist added code to calculate the average degree of the randomly generated network graph and multiply beta by the average degree. However, since beta is not used afterward, there is no change in the results compared to the baseline.
The added lines by The AI Scientist are expressed with the prefix "+" in the code below.

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

In the second run to tha last run, similar modifications to the code were made as in the first run, and since beta was not used thereafter, all experiments produced the same results.

### Paper Write-Up

The following pdf was generated in this part. The full paper can be found [here](./network_based_seir.pdf)

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
  <img src="./network_based_seir_page1.png" alt="Page 1 of the generated paper">
  <img src="./network_based_seir_page2.png" alt="Page 2 of the generated paper">
  <img src="./network_based_seir_page3.png" alt="Page 3 of the generated paper">
</div>

<div class="column">
  <figure style="display: flex; flex-direction: column; align-items: center;">
    <div style="display: flex; gap: 1rem;">
      <img src="./network_based_seir_page4.png" alt="Page 4 of the generated paper">
      <img src="./network_based_seir_page5.png" alt="Page 5 of the generated paper">
      <img src="./network_based_seir_page6.png" alt="Page 6 of the generated paper">
    </div>
    <figcaption>
      Incorporating Network Structures in SEIR Dynamics (generated by The AI Scientist)
    </figcaption>
  </figure>

</div>

The generated paper looks good.
However, there are some obvious mistakes. Some examples are listed below:

- Some sections are left blank as follows.

<figure>
    <img src="./duplicated_section.png" alt="Blank section in the paper" style="width: 80%;">
    <figcaption>Blank Section in the Paper</figcaption>
</figure>

- The model incorrectly stated that the hyperparameters for the baseline model were selected based on existing studies. In reality, this was a fabrication, as no such references were actually used in the hyperparameter selection process.
- The number of citations is very low.
- The description of the experiments and results is mostly taken up by the description of the baseline code.

## Findings

When creating base code, it's better to prepare a single function rather than defining multiple small functions. This is because when functions are separated for each process, maintaining consistency between the function definition parameters and the arguments when calling the function becomes necessary during editing. This increases the number of places that need to be edited, leading to more mistakes. This issue might be resolved with higher-performance models than the gpt-4o-mini used in this case.

## Conclusion

In this post, I applied "The AI Scientist" to the SEIR Model. In the experiment, a well-written paper was generated, but the experiment conducted by the LLM was not successful and the quality of the paper was not good.
Although it's not yet perfect, I've discovered that the AI Scientist can not only handle deep learning but also manipulate differential equations to perform various simulations. As differential equations are used in various fields, such as physics and economics, we may see a future where people like policy makers and fund managers can quickly make decisions based on the insights and outcomes generated by The AI Scientists.

### References

- Lu et al., The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery, [https://arxiv.org/abs/2408.06292](https://arxiv.org/abs/2408.06292)
- The AI Scientist Official GitHub Repository, [https://github.com/SakanaAI/AI-Scientist](https://github.com/SakanaAI/AI-Scientist)
- seir-model reference code, [https://github.com/moonmile/seir-model/blob/master/py/seir.py](https://github.com/moonmile/seir-model/blob/master/py/seir.py)
- 日本内科学会, [感染症の数理モデルと対策](https://www.naika.or.jp/wp-content/uploads/2020/11/nichinaishi-109-11-article_4.pdf)
- Code of this experiment, [https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir](https://github.com/SakanaAI/AI-Scientist/tree/main/templates/seir)
