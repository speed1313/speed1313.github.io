// Structured content for the About page.
// Edit entries here; the layout is rendered by src/pages/about.astro.
// Author strings keep the original `<u>self name</u>` markup — the page styles
// underlined names as bold accent, so highlighting needs no extra bookkeeping.

export interface PubLink {
  label: string;
  href: string;
}

// Canonical link ordering so every entry shows links in the same sequence:
// Paper → Code → Dataset → Model → Demo → Blog → Project Page → Poster → Slide.
function linkRank(label: string): number {
  const l = label.toLowerCase();
  if (l.includes("paper")) return 0;
  if (l.includes("code")) return 1;
  if (l.includes("dataset") || l.includes("waon")) return 2;
  if (l.includes("model")) return 3;
  if (l.includes("demo")) return 4;
  if (l.includes("blog")) return 5;
  if (l.includes("project") || l.includes("leaderboard")) return 6;
  if (l.includes("poster")) return 7;
  if (l.includes("slide")) return 8;
  return 99;
}

export function sortLinks(links: PubLink[] = []): PubLink[] {
  return [...links].sort((a, b) => linkRank(a.label) - linkRank(b.label));
}

export interface Publication {
  title: string;
  venue: string;
  date: string;
  /** HTML string; wrap your own name in <u>…</u> to highlight it. */
  authors: string;
  links?: PubLink[];
  award?: string;
  /** e.g. "27%" */
  acceptanceRate?: string;
  /** One-line impact note (HTML), e.g. who uses the work. */
  note?: string;
}

export interface EducationEntry {
  degree: string;
  program: string;
  institution: string;
  period: string;
  gpa?: string;
}

export interface ExperienceEntry {
  period: string;
  organization: string;
  position: string;
  description?: string;
  /** Results, strongest first (HTML strings). */
  bullets?: string[];
}

export const profile = {
  name: "Issa Sugiura",
  image: "/speed-icon.jpeg",
  intro:
    "I am a first year PhD student at Institute of Science Tokyo, majoring in Computer Science.",
  researchIntro:
    "I work on vision-language models (VLMs) and evaluations (evals).",
  researchBullets: [
    '<strong>VLMs</strong>: developing VLMs through the whole process, from building large-scale training data (<a href="https://speed1313.github.io/WAON">WAON</a>, <a href="https://speed1313.github.io/Jagle">Jagle</a>) to training models (<a href="https://huggingface.co/llm-jp/llm-jp-4-vl-9b">LLM-jp-4-VL 9B</a>) and evaluating them (<a href="https://speed1313.github.io/JAMMEval">JAMMEval</a>, <a href="https://huggingface.co/datasets/llm-jp/HakushoBench">HakushoBench</a>, <a href="https://llm-jp.github.io/simple-evals-mm/">simple-evals-mm</a>).',
    '<strong>Evals</strong>: building benchmarks for tasks that frontier models are expected to take on, such as financial analysis (<a href="https://arxiv.org/abs/2506.08762">EDINET-Bench</a>, <a href="https://arxiv.org/abs/2611.18130">JFinBench</a>) and running a business honestly (<a href="https://arxiv.org/abs/2606.16613">CoffeeBench</a>).',
  ],
  tagline: "I like to learn by building things.",
};

// The strongest evidence, for skimming. Counts as of the date given.
export const highlights: string[] = [
  "<strong>First-author papers at ICLR, COLM, and NeurIPS (E&amp;D) 2026</strong>, plus two at AACL 2026 Findings.",
  "<strong>Best Paper Award at NLP2026</strong> (3/789, top 0.4%) and four other awards.",
  '<strong>Open datasets and models with 85K+ Hugging Face downloads</strong>; WAON, Jagle, and WAON-Bench are used by <a href="https://zenn.dev/noetra_techblog/articles/0cea39ce67d2c2">Noetra</a> to build its multimodal foundation model.',
];

export const education: EducationEntry[] = [
  {
    degree: "Doctoral Program (Expected)",
    program:
      "Course of Artificial Intelligence, Department of Computer Science, School of Computing",
    institution: "Institute of Science Tokyo, Japan",
    period: "Apr 2026 – present",
  },
  {
    degree: "Master's Degree",
    program:
      "Course of Communications and Computer Engineering, Graduate School of Informatics",
    institution: "Kyoto University, Japan",
    period: "Apr 2024 – Mar 2026",
  },
  {
    degree: "Bachelor's Degree",
    program:
      "Software Science Course, Department of Information and Computer Sciences, School of Engineering Science",
    institution: "Osaka University, Japan",
    period: "Apr 2020 – Mar 2024",
    gpa: "3.57/4.00",
  },
];

export const experience: ExperienceEntry[] = [
  {
    period: "Apr 2026 – present",
    organization: "Institute of Science Tokyo, Japan",
    position: "Research Assistant",
    description: "Research on VLMs.",
  },
  {
    period: "Dec 2024 – present",
    organization: "Sakana AI, Japan",
    position: "Student Intern",
    description:
      "Building benchmarks for tasks that frontier models are expected to take on.",
    bullets: [
      "<strong>Led EDINET-Bench</strong> (ICLR 2026), a benchmark of fraud detection, earnings forecasting, and industry classification built from 10 years of Japanese annual reports; frontier LLMs barely beat logistic regression.",
      "<strong>Led CoffeeBench</strong> (NeurIPS 2026 E&amp;D, with KPMG AZSA), where six LLM coding agents run a coffee supply chain for 90 simulated days. Under a revenue target, GPT-6 Astra proposes circular trades that inflate revenue, and whether they happen depends on the counterparty (Claude Sonnet 5.5 refuses).",
      "<strong>Led JFinBench</strong>, 321 questions from the 2026 editions of six Japanese certification exams in accounting, tax, financial planning, and banking, built with a human-in-the-loop coding-agent pipeline so it can be refreshed with each new exam.",
    ],
  },
  {
    period: "Feb 2024 – present",
    organization: "National Institute of Informatics, Japan",
    position: "Research Assistant",
    description:
      "Developing Japanese VLMs through the whole process, from data to training and evaluation.",
    bullets: [
      '<strong>Built WAON</strong> (AACL 2026 Findings), the largest native Japanese image-text dataset (155M pairs), and WAON-Bench. <a href="https://zenn.dev/noetra_techblog/articles/0cea39ce67d2c2">Noetra</a> uses WAON to train its in-house vision encoder and WAON-Bench to evaluate Japanese cultural understanding.',
      "<strong>Built Jagle</strong> (COLM 2026; JSAI Annual Conference Award), the largest Japanese multimodal post-training dataset (9.2M examples). A 2.2B model trained on it beats InternVL3.5-2B on ten Japanese tasks, and Noetra uses it to post-train its multimodal LLM.",
      "<strong>Developed LLM-jp-4-VL 9B</strong>, whose beta matches Qwen3-VL-8B-Instruct on Japanese tasks.",
      "<strong>Built Japanese VLM evaluation</strong>: HakushoBench (AACL 2026 Findings), JAMMEval, and simple-evals-mm, a reproducible and reliable evaluation framework on 50+ benchmarks.",
      "Trained the speech language model <strong>Llama-Mimi</strong> (Best Paper Award, NLP2026) and <strong>llm-jp-modernbert</strong>.",
    ],
  },
];

export const peerReviewed: Publication[] = [
  {
    title:
      "CoffeeBench: Benchmarking Long-Horizon LLM Agents in Heterogeneous Multi-Agent Economies",
    venue: "NeurIPS 2026 Evaluations and Datasets Track",
    acceptanceRate: "26%",
    date: "Dec 2026",
    authors:
      "<u>Issa Sugiura</u>, Daichi Hattori, Kazuo Araragi, Keita Ogawa, Shota Onose, Taro Makino, Teppei Usuki, Takashi Ishida",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2606.16613" },
      { label: "Code", href: "https://github.com/SakanaAI/CoffeeBench" },
      { label: "Blog", href: "https://pub.sakana.ai/coffeebench/index.html" },
    ],
  },
  {
    title:
      "Harbor Adapters and Harbor-Index: Infrastructure and a Curated Meta-Dataset for Large-Scale Agentic Evaluation",
    venue: "NeurIPS 2026 Evaluations and Datasets Track",
    date: "Dec 2026",
    authors: "Lin Shi, et al. (incl. <u>Issa Sugiura</u>; 126 authors)",
    links: [{ label: "Paper", href: "https://arxiv.org/abs/2609.04298" }],
  },
  {
    title:
      "HakushoBench: A Japanese Chart and Table VQA Benchmark from Governmental White Papers",
    venue: "AACL-IJCNLP 2026 Findings",
    date: "Nov 2026",
    authors: "<u>Issa Sugiura</u>, Shuhei Kurita, Yusuke Oda, Naoaki Okazaki",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2606.01132" },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/llm-jp/HakushoBench",
      },
      { label: "Code", href: "https://github.com/llm-jp/simple-evals-mm" },
    ],
  },
  {
    title:
      "WAON: A Large-Scale Japanese Image-Text Dataset for Cultural Adaptation in Contrastive Vision-Language Models",
    venue: "AACL-IJCNLP 2026 Findings",
    note: 'Used by <a href="https://zenn.dev/noetra_techblog/articles/0cea39ce67d2c2">Noetra</a> to train its vision encoder; WAON-Bench evaluates its Japanese cultural understanding.',
    date: "Nov 2026",
    authors:
      "<u>Issa Sugiura</u>, Shuhei Kurita, Yusuke Oda, Daisuke Kawahara, Yasuo Okabe, Naoaki Okazaki",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2510.22276" },
      { label: "WAON", href: "https://huggingface.co/datasets/llm-jp/WAON" },
      {
        label: "WAON-Bench",
        href: "https://huggingface.co/datasets/llm-jp/WAON-Bench",
      },
      { label: "Code", href: "https://github.com/llm-jp/WAON" },
    ],
  },
  {
    title:
      "Jagle: Building a Large-Scale Japanese Multimodal Post-Training Dataset for Vision-Language Models",
    venue: "COLM 2026",
    acceptanceRate: "29%",
    note: 'Used by <a href="https://zenn.dev/noetra_techblog/articles/0cea39ce67d2c2">Noetra</a> to post-train its multimodal LLM.',
    date: "Oct 2026",
    authors:
      "<u>Issa Sugiura</u>, Keito Sasagawa, Keisuke Nakao, Koki Maeda, Ziqi Yin, Zhishen Yang, Shuhei Kurita, Yusuke Oda, Ryoko Tokuhisa, Daisuke Kawahara, Naoaki Okazaki",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2604.02048" },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/llm-jp/Jagle",
      },
      { label: "Code", href: "https://github.com/llm-jp/llm-jp-4-vl" },
      {
        label: "Model",
        href: "https://huggingface.co/collections/llm-jp/jagle",
      },
    ],
  },
  {
    title:
      "Cross-Task Evaluation and Empirical Analysis of Japanese Visual Language Models",
    venue: "Journal of Natural Language Processing",
    date: "June 2026",
    authors:
      "Koki Maeda, <u>Issa Sugiura</u>, Yusuke Oda, Shuhei Kurita, Naoaki Okazaki",
    links: [
      {
        label: "Paper",
        href: "https://www.jstage.jst.go.jp/article/jnlp/33/2/33_509/_article/-char/en",
      },
      { label: "Code", href: "https://github.com/llm-jp/llm-jp-eval-mm" },
    ],
  },
  {
    title:
      "EDINET-Bench: Evaluating LLMs on Complex Financial Tasks using Japanese Financial Statements",
    venue: "ICLR 2026",
    acceptanceRate: "27%",
    date: "Apr 2026",
    authors:
      "<u>Issa Sugiura</u>, Takashi Ishida, Taro Makino, Chieko Tazuke, Takanori Nakagawa, Kosuke Nakago, David Ha",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2506.08762" },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/SakanaAI/EDINET-Bench",
      },
      { label: "Code", href: "https://github.com/SakanaAI/EDINET-Bench" },
    ],
  },
  {
    title:
      "Removing Mislabeled Data from Trained Models via Machine Unlearning",
    venue: "IEICE Transactions on Information and Systems",
    date: "Aug 2025",
    authors: "<u>Issa Sugiura</u>, Shingo Okamura, Naoto Yanai",
    links: [
      {
        label: "Paper",
        href: "https://www.jstage.jst.go.jp/article/transinf/E108.D/8/E108.D_2024DAT0002/_article/-char/en",
      },
      {
        label: "Code",
        href: "https://github.com/speed1313/mislabel-unlearning",
      },
    ],
  },
  {
    title:
      "Developing Japanese CLIP Models Leveraging an Open-weight LLM for Large-scale Dataset Translation",
    venue: "NAACL 2025 Student Research Workshop",
    date: "Apr 2025",
    authors:
      "<u>Issa Sugiura</u>, Shuhei Kurita, Yusuke Oda, Daisuke Kawahara, Naoaki Okazaki",
    links: [
      { label: "Paper", href: "https://aclanthology.org/2025.naacl-srw.15/" },
      { label: "Code", href: "https://github.com/speed1313/clip-eval" },
      {
        label: "Model",
        href: "https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16",
      },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/llm-jp/relaion2B-en-research-safe-japanese-translation",
      },
    ],
  },
  {
    title:
      "Constructing Multimodal Datasets from Scratch for Rapid Development of a Japanese Visual Language Model",
    venue: "NAACL 2025 Demo Track",
    date: "Apr 2025",
    authors:
      "Keito Sasagawa, Koki Maeda, <u>Issa Sugiura</u>, Shuhei Kurita, Naoaki Okazaki, Daisuke Kawahara",
    links: [
      { label: "Paper", href: "https://aclanthology.org/2025.naacl-demo.38/" },
      {
        label: "Model",
        href: "https://huggingface.co/llm-jp/llm-jp-3-vila-14b",
      },
    ],
  },
  {
    title: "A Comprehensive Analysis of Memorization in Large Language Models",
    venue: "INLG 2024",
    date: "Sep 2024",
    authors:
      "Hirokazu Kiyomaru*, <u>Issa Sugiura*</u>, Daisuke Kawahara, Sadao Kurohashi (*equal contribution)",
    links: [
      { label: "Paper", href: "https://aclanthology.org/2024.inlg-main.45/" },
      {
        label: "Code",
        href: "https://github.com/speed1313/fast-near-duplicate-matching",
      },
    ],
  },
];

export const preprints: Publication[] = [
  {
    title:
      "JFinBench: A Continuously Refreshable Japanese Financial Benchmark from the Latest Certification Exams",
    venue: "arXiv",
    date: "Nov 2026",
    authors: "<u>Issa Sugiura</u>, Taro Makino, Takashi Ishida",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2611.18130" },
      { label: "Code", href: "https://github.com/SakanaAI/JFinBench" },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/SakanaAI/JFinBench",
      },
      {
        label: "Project Page",
        href: "https://pub.sakana.ai/jfinbench/",
      },
      { label: "Blog", href: "https://sakana.ai/jfinbench/" },
    ],
  },
  {
    title:
      "QD-Rec: Open-Ended Evolution of Recommendations via Quality-Diversity",
    venue: "arXiv",
    date: "Oct 2026",
    authors: "Takashi Ishida, Taro Makino, <u>Issa Sugiura</u>",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2610.23470" },
      { label: "Code", href: "https://github.com/SakanaAI/qd-rec" },
    ],
  },
  {
    title:
      "JAMMEval: A Refined Collection of Japanese Benchmarks for Reliable VLM Evaluation",
    venue: "arXiv",
    date: "Apr 2026",
    authors:
      "<u>Issa Sugiura</u>, Koki Maeda, Shuhei Kurita, Yusuke Oda, Daisuke Kawahara, Naoaki Okazaki",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2604.00909" },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/llm-jp/JAMMEval",
      },
      { label: "Code", href: "https://github.com/llm-jp/simple-evals-mm" },
    ],
  },
  {
    title:
      "Llama-Mimi: Speech Language Models with Interleaved Semantic and Acoustic Tokens",
    venue: "arXiv",
    date: "Sep 2025",
    authors:
      "<u>Issa Sugiura</u>, Shuhei Kurita, Yusuke Oda, Ryuichiro Higashinaka",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2509.14882" },
      { label: "Model", href: "https://huggingface.co/llm-jp/Llama-Mimi-1.3B" },
      { label: "Code", href: "https://github.com/llm-jp/llama-mimi" },
      { label: "Demo", href: "https://speed1313.github.io/llama-mimi/" },
    ],
  },
  {
    title:
      "llm-jp-modernbert: A ModernBERT Model Trained on a Large-Scale Japanese Corpus with Long Context Length",
    venue: "arXiv",
    date: "Apr 2025",
    authors: "<u>Issa Sugiura</u>, Kouta Nakayama, Yusuke Oda",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2504.15544" },
      {
        label: "Model",
        href: "https://huggingface.co/llm-jp/llm-jp-modernbert-base",
      },
      { label: "Code", href: "https://github.com/llm-jp/llm-jp-modernbert" },
    ],
  },
  {
    title:
      "LLM-jp: A Cross-organizational Project for the Research and Development of Fully Open Japanese LLMs",
    venue: "arXiv",
    date: "Jul 2024",
    authors:
      "LLM-jp (incl. <u>Issa Sugiura</u>; 80 authors, listed in alphabetical order)",
    links: [{ label: "Paper", href: "https://arxiv.org/abs/2407.03963" }],
  },
];

export const domestic: Publication[] = [
  {
    title: "Llama-Mimiが生まれるまで：はじめての音声言語モデル研究",
    venue: "自然言語処理 33巻3号 学会記事",
    date: "2026年9月",
    authors: "<u>杉浦一瑳</u>",
    links: [
      {
        label: "Paper",
        href: "https://www.jstage.jst.go.jp/article/jnlp/33/3/33_1731/_article/-char/ja",
      },
    ],
  },
  {
    title:
      "Jagle: 視覚言語モデルのための大規模日本語マルチモーダル事後学習データセットの構築",
    venue: "JSAI2026",
    date: "2026年6月",
    award: "全国大会優秀賞",
    authors:
      "<u>杉浦一瑳</u>, 笹川慶人, 中尾圭佑, 前田航希, Yin Ziqi, Yang Zhishen, 栗田修平, 小田悠介, 徳久良子, 河原大輔, 岡崎直観",
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2604.02048v1" },
      { label: "Poster", href: "/slides/JSAI2026_Jagle_poster.pdf" },
      { label: "Project Page", href: "https://speed1313.github.io/Jagle/" },
    ],
  },
  {
    title: "Llama-Mimi: 意味・音響トークンを交互配置した音声言語モデル",
    venue: "NLP2026",
    date: "2026年3月",
    authors: "<u>杉浦一瑳</u>, 栗田修平, 小田悠介, 東中竜一郎",
    award: "最優秀賞",
    links: [
      {
        label: "Paper",
        href: "https://anlp.jp/proceedings/annual_meeting/2026/pdf_dir/C1-1.pdf",
      },
      { label: "Model", href: "https://huggingface.co/llm-jp/Llama-Mimi-1.3B" },
      { label: "Code", href: "https://github.com/llm-jp/llama-mimi" },
      { label: "Demo", href: "https://speed1313.github.io/llama-mimi/" },
    ],
  },
  {
    title:
      "JAMMEval: 再アノテーションによる日本語VQA評価データセットの信頼性向上",
    venue: "NLP2026",
    date: "2026年3月",
    authors:
      "<u>杉浦一瑳</u>, 前田航希, 栗田修平, 小田悠介, 河原大輔, 岡崎直観",
    links: [
      {
        label: "Paper",
        href: "https://anlp.jp/proceedings/annual_meeting/2026/pdf_dir/C3-1.pdf",
      },
    ],
  },
  {
    title:
      "WAON: 視覚言語モデルのための大規模かつ高品質な日本語画像・テキスト対データセット",
    venue: "NLP2026",
    date: "2026年3月",
    authors:
      "<u>杉浦一瑳</u>, 栗田修平, 小田悠介, 河原大輔, 岡部寿男, 岡崎直観",
    award: "委員特別賞",
    links: [
      {
        label: "Paper",
        href: "https://anlp.jp/proceedings/annual_meeting/2026/pdf_dir/C4-1.pdf",
      },
      { label: "Project Page", href: "https://speed1313.github.io/WAON/" },
    ],
  },
  {
    title: "Common Crawlを用いた大規模音声音響データセットの構築",
    venue: "日本音響学会 2025年秋季研究発表会",
    date: "2025年9月",
    authors:
      "浅井航平, <u>杉浦一瑳</u>, 中田亘, 栗田修平, 高道慎之介, 小川哲司, 東中竜一郎",
    links: [
      {
        label: "Dataset",
        href: "https://gitlab.llm-jp.nii.ac.jp/datasets/ccaudio",
      },
    ],
  },
  {
    title: "オープンLLMによる翻訳を活用した日本語CLIPの開発",
    venue: "NLP2025",
    date: "2025年3月",
    authors: "<u>杉浦一瑳</u>, 栗田修平, 小田悠介, 河原大輔, 岡崎直観",
    links: [
      {
        label: "Paper",
        href: "https://www.anlp.jp/proceedings/annual_meeting/2025/pdf_dir/C4-6.pdf",
      },
      {
        label: "Model",
        href: "https://huggingface.co/llm-jp/llm-jp-clip-vit-base-patch16",
      },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/llm-jp/relaion2B-en-research-safe-japanese-translation",
      },
      { label: "Code", href: "https://github.com/llm-jp/clip-eval" },
    ],
  },
  {
    title: "ロススパイクの影響分析",
    venue: "NLP2025",
    date: "2025年3月",
    authors: "<u>杉浦一瑳</u>, 栗田修平, 小田悠介",
    links: [
      {
        label: "Paper",
        href: "https://www.anlp.jp/proceedings/annual_meeting/2025/pdf_dir/P2-18.pdf",
      },
    ],
  },
  {
    title: "llm-jp-eval-mm: 日本語視覚言語モデルの自動評価基盤",
    venue: "NLP2025",
    date: "2025年3月",
    authors: "前田航希*, <u>杉浦一瑳*</u>, 栗田修平, 小田悠介, 岡崎直観",
    award: "若手奨励賞",
    links: [
      {
        label: "Paper",
        href: "https://www.anlp.jp/proceedings/annual_meeting/2025/pdf_dir/Q3-23.pdf",
      },
      { label: "Code", href: "https://github.com/llm-jp/llm-jp-eval-mm" },
    ],
  },
  {
    title:
      "LLM-jp-3 VILA: 日本語マルチモーダルデータセット及び強力な日本語マルチモーダルモデルの構築",
    venue: "NLP2025",
    date: "2025年3月",
    authors:
      "笹川慶人, 前田航希, <u>杉浦一瑳</u>, 栗田修平, 岡崎直観, 河原大輔",
    award: "委員特別賞",
    links: [
      {
        label: "Paper",
        href: "https://www.anlp.jp/proceedings/annual_meeting/2025/pdf_dir/Q3-2.pdf",
      },
    ],
  },
  {
    title:
      "ミスラベルデータの忘却による学習済みモデルの汎化性能の向上手法の提案",
    venue: "DEIM2024",
    date: "2024年2月",
    authors: "<u>杉浦一瑳</u>, 岡村真吾, 山下恭佑, 矢内直人",
    award: "LINEヤフースポンサー賞",
    links: [
      {
        label: "Code",
        href: "https://github.com/speed1313/mislabel-unlearning",
      },
    ],
  },
];

export interface ModelEntry {
  title: string;
  description: string;
  links?: PubLink[];
}

export const models: ModelEntry[] = [
  {
    title: "LLM-jp-4-VL 9B series (2026)",
    description:
      "Developed a 9B Japanese vision-language model extending the Japanese LLM LLM-jp-4 8B Thinking. To build this model, also constructed the training datasets Jagle, the largest-scale Japanese multimodal dataset, and RefinedVision, a refined version of FineVision addressing its license and quality issues.",
    links: [
      {
        label: "Blog",
        href: "https://llm-jp.nii.ac.jp/blog/llm-jp-4-vl-9b/",
      },
      {
        label: "Blog (beta)",
        href: "https://llm-jp.nii.ac.jp/blog/20260414_llm-jp-4-vl-9b-beta/",
      },
      {
        label: "Model",
        href: "https://huggingface.co/llm-jp/llm-jp-4-vl-9b",
      },
      {
        label: "Model (beta)",
        href: "https://huggingface.co/llm-jp/llm-jp-4-vl-9b-beta",
      },
      {
        label: "Dataset",
        href: "https://huggingface.co/datasets/llm-jp/RefinedVision",
      },
    ],
  },
  {
    title: "simple-evals-mm (2026)",
    description:
      "Developed a reproducible and reliable evaluation framework for LLMs and VLMs on 50+ English and Japanese benchmarks, used by the LLM-jp Multimodal WG, with a public leaderboard.",
    links: [
      {
        label: "Code",
        href: "https://github.com/llm-jp/simple-evals-mm",
      },
      {
        label: "Leaderboard",
        href: "https://llm-jp.github.io/simple-evals-mm",
      },
    ],
  },
];

export interface Award {
  date: string;
  title: string;
  /** e.g. "3/789, top 0.4%" */
  rank?: string;
  /** The awarded work, or what the fellowship is. */
  work: string;
  /** Conference or organization. */
  venue: string;
  /** Official list of the winners, as evidence. */
  url?: string;
}

// Keep in sync with "Awards & Honors" in the CV.
export const awards: Award[] = [
  {
    date: "Jun 2026",
    title: "JSAI Annual Conference Award",
    rank: "66/1,376, top 4.8%",
    work: "Jagle: Building a Large-Scale Japanese Multimodal Post-Training Dataset for VLMs",
    venue: "JSAI2026",
    url: "https://www.ai-gakkai.or.jp/about/award/jsai_award-conf/",
  },
  {
    date: "Mar 2026",
    title: "Best Paper Award",
    rank: "3/789, top 0.4%",
    work: "Llama-Mimi: Speech Language Models with Interleaved Semantic and Acoustic Tokens",
    venue: "NLP2026",
    url: "https://www.anlp.jp/nlp2026/award.html#best",
  },
  {
    date: "Mar 2026",
    title: "Special Committee Award",
    rank: "32/748, top 4.3%",
    work: "WAON: Large-Scale and High-Quality Japanese Image-Text Pair Dataset for VLMs",
    venue: "NLP2026",
    url: "https://www.anlp.jp/nlp2026/award.html#committee",
  },
  {
    date: "Mar 2025",
    title: "Special Committee Award",
    rank: "32/726, top 4.4%",
    work: "LLM-jp-3 VILA: Building a Japanese Multimodal Dataset and a Strong Japanese Multimodal Model (co-author)",
    venue: "NLP2025",
    url: "https://www.anlp.jp/nlp2025/award.html#committee",
  },
  {
    date: "Feb 2024",
    title: "LINE Yahoo Sponsor Award",
    rank: "1/420, top 0.24%",
    work: "Improving Generalization of Trained Models via Unlearning of Mislabeled Data",
    venue: "DEIM2024",
    url: "https://pub.confit.atlas.jp/ja/event/deim2024/content/awards",
  },
];

// Keep in sync with "Fellowships & Scholarships" in the CV.
export const fellowships: Award[] = [
  {
    date: "Jul 2026",
    title: "Full Repayment Exemption for Outstanding Achievement",
    work: "JASSO graduate scholarship",
    venue: "Japan Student Services Organization",
  },
  {
    date: "Apr 2026",
    title: "Science Tokyo Support Program for Doctoral Students",
    work: "Doctoral research fellowship (JST SPRING)",
    venue: "Institute of Science Tokyo",
  },
];

export interface Certification {
  /** HTML string; may contain links. */
  text: string;
  date: string;
}

export const certifications: Certification[] = [
  {
    text: "TOEIC L&amp;R: L 420 + R 425 = 845",
    date: "Oct 19, 2025",
  },
  {
    text: '<a href="https://www.ipa.go.jp/jinzai/camp/index.html">Security Camp</a> organized by IPA (Information-technology Promotion Agency), Web Security Course',
    date: "Aug 2022",
  },
];
