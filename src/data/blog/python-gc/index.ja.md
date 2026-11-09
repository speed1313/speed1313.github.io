---
title: "Pythonのガベージコレクション"
description: "本稿では、CPythonのガベージコレクション (GC) について調べます。さらに、GCとグローバルインタプリタロック (GIL) の関係についても見ていきます。"
translatedDatetime: 2026-10-31
---

Pythonはインタプリタで実行されることを前提に設計された言語であり、各インタプリタにはメモリを自動で管理するガベージコレクションが組み込まれています。

そのため、Pythonのユーザーは通常、メモリ管理を意識する必要がありません。

しかし、深層学習や巨大な行列の対角化など、大量のメモリを必要とするプログラムを書いていると、Out of Memory (OOM) エラーに遭遇することがよくあります。こうした問題に直面したときには、ガベージコレクションの特性を理解しておく必要があります。

本稿では、Pythonの参照実装であり、最も広く使われている実装であるCPythonのガベージコレクション (GC) について調べます。さらに、GCとグローバルインタプリタロック (GIL) の関係についても見ていきます。

## 基本: 参照カウント

CPythonのガベージコレクションの基本は参照カウントです。

参照カウント方式は非常にシンプルな手法で、各オブジェクトへの参照の数を逐次的に数えておき、その数が0になった時点でオブジェクトを回収します。

実際にガベージコレクションの挙動を観察してみましょう。

以下が実験用のコードです。

```python
import sys

class Object:
    def __del__(self):
        print("free")

def use_object(obj):
    print("Referenced by x and use_object and getrefcount:", sys.getrefcount(obj))
    b = obj
    print("Referenced by x and use_object and b and getrefcount:", sys.getrefcount(obj))

x = Object()
print("Referenced by x and getrefcount:", sys.getrefcount(x))
use_object(x)
print("Referenced by x and getrefcount:", sys.getrefcount(x))
del x

print("End of File")
```

`Object` クラスを定義し、オブジェクトが破棄される直前に呼ばれる特殊メソッド `__del__()` を定義します。

また、`sys.getrefcount()` を使ってオブジェクトの参照カウントを確認します。最後に `del x` でオブジェクトを削除します。

実行結果は次のとおりです。

```bash
$ python3 src/python_gc/rc.py
Referenced by x and getrefcount: 2
Referenced by x and use_object and getrefcount: 3
Referenced by x and use_object and b and getrefcount: 4
Referenced by x and getrefcount: 2
free
End of File
```

ガベージコレクタが自動で参照カウントを行い、カウントが0になった不要なオブジェクトを回収していることがわかります。

素晴らしいですね!

## 参照カウントの問題点: 循環参照

参照カウントには欠点があります。互いに循環的に参照し合うオブジェクトは、参照カウントがいつまでも0にならず、回収できないことがあります。

循環参照は頻繁に発生します。回収できないメモリが蓄積し、最終的にメモリ不足エラーにつながるため、これは問題になります。

この問題に対処するため、CPythonは参照カウントに加えてマーク&スイープ方式を利用しています。マーク&スイープ方式では、すべてのオブジェクトをグラフとして探索し、その時点でルートから到達可能なオブジェクトを特定して、到達不可能なオブジェクトを回収します。(マーク&スイープ方式についての私のブログ記事は[こちら](https://speed1313.github.io/posts/gomicollector/))

マーク&スイープ方式であれば、ルートから到達不可能な循環参照オブジェクトも回収できます。

しかし、マーク&スイープ方式はグラフ探索を伴うため、大きな計算コストがかかります。そこでCPythonは、頻繁な探索の必要性を減らすために世代別ガベージコレクションを採用しています。

世代別ガベージコレクションでは、オブジェクトを世代に分け、世代ごとに異なる頻度でマーク&スイープを実行します。

このように、CPythonのガベージコレクションは参照カウントとマーク&スイープ方式を組み合わせています。

## GILと参照カウントの関係

Pythonにはグローバルインタプリタロック (GIL) と呼ばれる仕組みがあり、複数のスレッドを起動しても、一度に実行されるスレッドは1つだけになるように保証しています。

しかし、GILはマルチスレッドの効果を制限してしまうため、近年GILを取り除く取り組みが進められています。

GILをオプションにすることを目指す[PEP703](https://peps.python.org/pep-0703/)では、GILを取り除くために大幅な実装変更が必要な箇所として参照カウントが挙げられています。

CPythonにおける従来の参照カウントの実装はGILの仕組みに依存しているため、GILなしではスレッドセーフではありません。
この状態でGILを取り除こうとすると、複数のスレッドが同時に参照カウントを操作することでデータ競合が起こり、メモリ管理に問題が生じる可能性があります。

そこでPEP703では、スレッドセーフかつ効率的なガベージコレクションを実現するため、2018年に提案されたBiased Reference Countingなどの手法を用いた新しいガベージコレクタを開発することが定められています。

2024年10月にリリースされたPython 3.13 ([PEP719](https://peps.python.org/pep-0719/)) には、ガベージコレクタに対する多くの変更が含まれています [[What's New](https://docs.python.org/3.13/whatsnew/3.13.html#gc)]。

Python Developer’s Guideによると、Python 3.13には従来の実装とスレッドセーフな実装の両方が含まれています。スレッドセーフな (free-threaded) ビルドは3.13では実験的な扱いでしたが、Python 3.14で正式にサポートされました ([PEP779](https://peps.python.org/pep-0779/))。

> まとめると、Pythonのガベージコレクションは当初、参照カウントとマーク&スイープ方式を組み合わせたものでしたが、現在はGILに依存しない、スレッドセーフな新しいガベージコレクタの開発が進められています。(要約元: [https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md](https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md))

## まとめ

Pythonのガベージコレクションは、参照カウントとマーク&スイープ方式を組み合わせたものです。しかし、GILへの依存をなくす取り組みの中で、スレッドセーフな新しいガベージコレクタの開発が進められています。

Pythonのガベージコレクションの今後の動向に注目していきたいですね!

## 参考文献

- kamakuraviel, **[PythonのGarbageCollectionに関する考察](https://kamakuraviel.hatenablog.com/entry/2020/08/23/193446)**
- wikipedia, [https://ja.wikipedia.org/wiki/参照カウント](https://ja.wikipedia.org/wiki/%E5%8F%82%E7%85%A7%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88)
- 遠藤敏夫、一般教養としての Garbage Collection, [gc.pdf (Internet Archive 保存版)](https://web.archive.org/web/20250402235014/http://matsu-www.is.titech.ac.jp/~endo/gc/gc.pdf)
- Python Developer’s Guide, Garbage collector design, [https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md](https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md)
- Jiho et al., Biased reference counting: minimizing atomic operations in garbage collection, [https://dl.acm.org/doi/abs/10.1145/3243176.3243195](https://dl.acm.org/doi/abs/10.1145/3243176.3243195)
- PEP703: [https://peps.python.org/pep-0703/](https://peps.python.org/pep-0703/)
- Aaron Shi & Zachary DeVito, Understanding GPU Memory 2: Finding and Removing Reference Cycles, [https://pytorch.org/blog/understanding-gpu-memory-2/](https://pytorch.org/blog/understanding-gpu-memory-2/)
- Serdar, Python moves to remove the GIL and boost concurrency, [https://www.infoworld.com/article/3704248/python-moves-to-remove-the-gil-and-boost-concurrency.html](https://www.infoworld.com/article/3704248/python-moves-to-remove-the-gil-and-boost-concurrency.html)
