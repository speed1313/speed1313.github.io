---
title: "OS自作で変わったOSを見る目"
author: speed1313
pubDatetime: 2023-08-17
slug: os_zisaku
featured: false
draft: false
tags:
  - Notes
description: "本稿では、自作OSを通じて変わったOSを見る目について述べます。"
---

先日[nuta](https://github.com/nuta)さんによって書かれた**[Writing an OS in 1,000 Lines](https://operating-system-in-1000-lines.vercel.app/ja/welcome)** という資料をもとに自作OSを始めた。

大学で情報科学を専攻している身として、計算機の最重要コンポーネントの一つであるOSは様々なソフトウェアの中でも特別視している節があり、自作OSには憧れがあった。

その一方、現代で使われているLinuxをはじめとするOSは非常に複雑であり、また環境構築のむずかしさなどからOSの実装に踏み入れられないでいた。

そんな中X(旧Twitter)で**[Writing an OS in 1,000 Lines](https://operating-system-in-1000-lines.vercel.app/ja/welcome)** の存在を知った。

序文を読んだところ、今まで見かけたどんな自作OS本よりも敷居が低そうだと思い写経をし始めた。

その結果序文の通り3日程度で以下のような自作OSを作ることができ、拡張機能の実装なども進めることができた。

[https://github.com/speed1313/cos](https://github.com/speed1313/cos)

OSを実装する過程では、OS、特にカーネルがどのような仕組みで動いているのか実装レベルで知ることができ、カーネルを見る目がかなり変わった。

本稿では自作OSを始めた瞬間の今でしか書けないであろう、自作OSをする前後で変わった「OSを見る目」について述べる。

> **Attention**
> OSとカーネルをほとんど同義語として使っていることに注意。

私はOS自作を始めたばかりで以下の内容には誤りを含む可能性があるので、見つけたらぜひ教えてください。

## OS自作前の認識

Wikipediaに載っている[Operating system](https://en.wikipedia.org/wiki/Operating_system)の図にあるような、まさにApplicationとHardwareの間に位置する仲介人といったイメージ。

常に起動し続け、アプリケーションの面倒を下から支える。

[OSの教科書](https://amzn.to/3seOgk0)や[パタヘネ](https://www.amazon.co.jp/%E3%82%B3%E3%83%B3%E3%83%94%E3%83%A5%E3%83%BC%E3%82%BF%E3%81%AE%E6%A7%8B%E6%88%90%E3%81%A8%E8%A8%AD%E8%A8%88-MIPS-%E7%AC%AC6%E7%89%88-%E4%B8%8A%E3%83%BB%E4%B8%8B%E9%9B%BB%E5%AD%90%E5%90%88%E6%9C%AC%E7%89%88-David-Patterson-ebook/dp/B0BLTQS81T?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=195BBGMVELDAZ&keywords=%E3%83%91%E3%82%BF%E3%83%98%E3%83%8D&qid=1692239365&s=books&sprefix=%E3%83%91%E3%82%BF%E3%83%98%E3%83%8D,stripbooks,153&sr=1-1&linkCode=sl1&tag=amazon13aff-22&linkId=7d1060ae64b2eebd44735939b0e8abaf&language=ja_JP&ref_=as_li_ss_tl)を読んでOSの役割や仕組みはざっくり知っていたが、いざプログラムとして記述しようとするとどうなるか想像がつかない。

特にハードウェアとのインターフェースの部分の記述はてんでわからない。

ページングや例外処理、プロセススケジューリング、メモリアロケータといった概念について仕組みや役割を知っているのに、どの部分を誰が(OS? CPU?)どのようにして担っているか曖昧としていた。

## OS自作後の認識

### カーネルも(ある意味)プロセスにすぎない

シングルプロセッサ時代でもOSが存在していることから当たり前と言えば当たり前なのだが、OS(カーネル)は常に動いているわけではなく、アプリケーションとカーネルが交互に動いている。(マルチプロセッサの普及が進み、カーネルが常時動いているという設計もあるだろうが)

より正確には、ブートローダが起動イメージ(e.g. ELFファイル)をメモリに読み込み、pcをカーネルの開始番地に設定することでカーネルが動き出し、種々の初期化をし、最初のアプリケーション(shellなど)の実行をはじめ、その後はシステムコールや例外といったイベントを皮切りにCPUの例外処理機能によってカーネルにコンテキストスイッチする処理が書かれた部分にpcを書き換え、イベントに応じた例外処理をカーネルモードで行い、例外処理を終えたらアプリケーションに移る、という動作が続く。

ゆえに、アプリケーションとカーネルの間のスイッチングを実装の観点で見ると、pc(プログラムカウンタ)や汎用レジスタ、sp(スタックポインタ)、ページテーブルの開始番地や権限モードといったCPUの持つ値の変更にすぎない。

この事実はかなり衝撃的に思う。というのも、権限モードの変更以外はアプリケーションのコンテキストスイッチとほとんど相違ないのだから。

カーネルは

- スーパバイザモードで実行
- 管理できる、またはしなければならない対象が多い
- 一番最初にブートローダによって起動する

といった特徴を持つ、特別なプロセスと言えるが、結局のところ、プロセスである。

### アセンブリ言語での記述が必要不可欠

カーネルプログラムはページテーブルの開始番地やモード切り替えのためのレジスタ等を直接操作するという、高水準プログラミング言語では記述できないような処理をする。

そのため、アセンブリ言語で記述せざるを得ない。

そこで、カーネルプログラムではアセンブリファイルがリンクされていたり、コンパイラの拡張機能である[インラインアセンブラ](https://ja.wikipedia.org/wiki/%E3%82%A4%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E3%82%A2%E3%82%BB%E3%83%B3%E3%83%96%E3%83%A9)によって以下のように高水準プログラミング言語のコードに部分的に差し込まれていたりする。

```c
void boot(void){
    __asm__ __volatile__(
        "mv sp, %[stack_top]\n" /* set stack pointer to the top of the stack */
        "j kernel_main\n" /* jump to kernel_main */
        :
        : [stack_top] "r"(__stack_top) /* __stack_top is stored in a general purpose register named stack_top */
    );
}
```

これについては、[Linuxのソースコードのうち、インラインアセンブラが使われている箇所](https://github.com/search?q=repo%3Atorvalds%2Flinux%20__asm__&type=code)が参考になる。

### CPUの機能が豊富すぎる

CPUはモード切り替えや例外処理、ページングなど、addやjumpといった単純な命令にとどまらない豊富な機能を有する。

例えば、RISC-VアーキテクチャのCPUでは以下のような命令により、satpレジスタにページテーブルの先頭アドレスを登録することができ、CPUが自動的にページングを行ってくれる。

```c
"csrw satp, %[satp]\n"
```

また、以下のようにecall命令を用いることで、システムコール例外を発生させ、例外ハンドラでシステムコールの処理をするという、ユーザモードからカーネルモードに移行して処理をするシステムコールを実現できる。

```
__asm__ __volatile__("ecall"
	                 : "=r"(a0)
	                 : "r"(a0), "r"(a1), "r"(a2), "r"(a3)
	                 : "memory");
```

OS自作ではこれらのCPUの機能を惜しみなく使い、システムコールやページング、例外処理といった処理を実現する。

カーネルはいろいろやっていてすごいと思っていたが、実際はCPUという強力な武器を使っていたのだった。

### 例外処理がとても重要

システムコールやページフォルトなど、カーネルモードに遷移するという処理は、CPUに登録された例外ハンドラの開始番地にpcを動かすことによって実現される。

例外はイベントとみなすことができ、イベントが起きたらCPUが例外ハンドラをフックしてイベントごとに異なる処理をすることで多様なイベントに随時対処することができる。

### タイマーも重要だった

CPUに備わっているタイマーによって起きるタイマー例外は、ラウンドロビン方式のようなプリエンプティブなマルチプロセッシングを実現するために必要不可欠である。

以前はOSの教科書の例外の例として、システムコール等に並んでタイマー例外があるのを不思議に思っていたが、タイマー例外の重要性を知り腑に落ちた。

タイマーのこと舐めてました。ごめんなさい。

### カーネルパニックしたら全体が止まる

アプリケーションがパニックしてもカーネルが対処してくれるが、カーネルがパニックして止まったらそれを対処して復帰するようなことをしてくれるものはない。よってそのまま全体が止まってしまう。

全体が止まってしまったらコンピュータを再起動するしかないためカーネルパニックは実用上避けるべきだ。

そういえばLinuxのRust移植が試み始められた際、Linus Torvaldsが

> I do think that the "run-time failure panic" is a fundamental issue.

[LKML: Linus Torvalds: Re: [PATCH 00/13] [RFC] Rust support](https://lkml.org/lkml/2021/4/14/1099)

と、panicに大きな関心を呼びかけていた。

OS自作後振り返ってみると、カーネル開発におけるpanicの取り扱いの重要さはその通りだと思った。

参考:
[Rust for Linuxでは独自のallocライブラリを使っている](https://zenn.dev/garasubo/articles/rust-for-linux-alloc)

### OSは総合格闘技

OS自作で触れることになる技術は、コンパイラやCPU、シェル、ファイルシステム、ネットワークプロトコルなど多岐にわたる。

OS自作は過去にやってきた低レイヤ自作が至る所で活かせる総合格闘技だ。

### ブラックボックスはどこまでも

カーネルの処理部分はある程度把握することができたが、ブートローダやデバイスドライバ、CPUに備わる豊富な機能の実装方法といった新たなブラックボックスが浮かび上がってきた。

## おわりに

今回はごく一般的なOSの設計をみた感想を述べたが、最新の研究では

- ソフトウェアでのコンテキストスイッチをハードウェアスレッドに代替する設計
- アプリケーションとカーネルが一体となったユニカーネル(unikernel)

といった面白い設計が考えられているそうだ。(参考: [自作OSで学ぶマイクロカーネルの設計と実装](https://www.amazon.co.jp/%E8%87%AA%E4%BD%9COS%E3%81%A7%E5%AD%A6%E3%81%B6%E3%83%9E%E3%82%A4%E3%82%AF%E3%83%AD%E3%82%AB%E3%83%BC%E3%83%8D%E3%83%AB%E3%81%AE%E8%A8%AD%E8%A8%88%E3%81%A8%E5%AE%9F%E8%A3%85-%E6%80%92%E7%94%B0%E6%99%9F%E4%B9%9F/dp/4798068713?&linkCode=sl1&tag=amazon13aff-22&linkId=068f08c484525acde5d055d463500d30&language=ja_JP&ref_=as_li_ss_tl))

OSの仕様や実装方法は多岐にわたり、それぞれには違った顔が備わっている。

次に会うOSはどんな顔だろう。

## 参考文献

- [Writing an OS in 1,000 Lines, nuta](https://operating-system-in-1000-lines.vercel.app/ja/welcome)
  - [repository](https://github.com/nuta/operating-system-in-1000-lines)

  C言語でRISC-Vアーキテクチャをターゲットとした1000行未満のOSが実装できてとても面白かったのでぜひ読んでみてください。手軽に読めてたくさんのことが学べておすすめです。

- [自作OSで学ぶマイクロカーネルの設計と実装、怒田晟也、秀和システム](https://amzn.to/3KKFdh1)

  こちらの本はOSにまつわる様々な技術が実装も交えて解説されています。ファイルシステムやインターネットプロトコルといった解説もされており、内容が充実しています。
  - [support site](https://github.com/nuta/microkernel-book)

  こちらの本で実装されているHinaOSの実装は、上記のsupport siteにあります。教育用に書かれたOSで、実装がとてもシンプルです。ファイルシステムやインターネットプロトコルも実装されています。

  マルチプロセッサにも対応していますが、Big Kernel Lockという方式を使っているためコード内にロックの記述がなく実装が簡素になっており読みやすいです。

  ただ、HinaOSはマイクロカーネルでモノリシックカーネルよりやや複雑なため、先にモノリシックカーネルを実装する[Writing an OS in 1,000 Lines](https://operating-system-in-1000-lines.vercel.app/ja/welcome)を読むのがおすすめです。

- [Xv6 for RISC-V](https://github.com/mit-pdos/xv6-riscv)

  Xv6はMITの授業で教材として用いられている教育用OSです。モノリシックカーネルですが、ロックの記述が至る所にありやや読みづらい気がします。

  [和訳の実装の解説本](https://web.archive.org/web/20230608081737/https://www.sugawara-lab.jp/fig/xv6-riscv-jpn.pdf)もあるため、合わせて読むのが良さそうです。

  (Go言語のメインコントリビュータの[Russ Cox](https://github.com/rsc)氏が著者の一人でびっくりしました)

- [コンピュータの構成と設計(通称パタヘネ), David Patterson (著), John Hennessy (著)、成田 光彰 (翻訳)、日経BP](https://www.amazon.co.jp/コンピュータの構成と設計-MIPS-第6版-上・下電子合本版-David-Patterson-ebook/dp/B0BLTQS81T?__mk_ja_JP=カタカナ&crid=195BBGMVELDAZ&keywords=パタヘネ&qid=1692239365&s=books&sprefix=パタヘネ,stripbooks,153&sr=1-1&linkCode=sl1&tag=amazon13aff-22&linkId=7d1060ae64b2eebd44735939b0e8abaf&language=ja_JP&ref_=as_li_ss_tl)

- [オペレーティングシステムの概念、Abraham Silberschatz+](https://amzn.to/3seOgk0)
