---
title: "The World of Computer Science: A Letter to My First-Year Self"
description: "In this post, written for my first-year university self who was a stray sheep, I lay down a “highway of knowledge”: I explain how a browser works from the bottom up and, along the way, list good books on each topic to show how to approach learning computer science."
translatedDatetime: 2026-10-31
---

## Introduction

The first time I ever touched a computer was in my first year of university. Back then, I had no clear idea of how to learn a field as vast as computer science, and it was one round of trial and error after another.

In this post, I look back on how I, a lost first-year student, made my way through computer science. I explain how a browser works from the bottom up and introduce books that are useful for each topic along the way.

## Key Concepts in Computer Science

Before getting into the main part, here are three key concepts in computer science worth keeping in mind.

**"Divide each difficulty" (René Descartes)**

The IT systems in the world are extremely complex.

Have you ever seen a photo of a CPU? A CPU is made up of an enormous number of gates. PCs and smartphones are built by combining such complex hardware. IT systems are made up of huge numbers of electronic devices connected by cables and electromagnetic waves.

Building such complex systems is a complex problem.

The approach that has long been used to deal with complex problems like this is "divide each difficulty." You break a complex problem down into small, (relatively) simple problems, solve them one by one, and then combine the solutions to solve the whole problem.

This may sound obvious, but it comes up again and again when you study computer science.

Examples include modularization in programming, divide-and-conquer in algorithms, and the way components are assembled in digital circuits.

If you keep "divide each difficulty" in mind, you will find the courage to tackle even complex problems when you run into them.

**Building on existing technology**

This applies to science in general, but information technology is built by stacking technologies on top of one another.

New technology is made by building on existing technologies that already work well.

You solve the problems you split up in the "divide each difficulty" step one by one, then combine those solutions cleverly to create new technology.

Examples where you can see this layering include the layered structure of communication protocols and the organization of hardware.

**Specifications and standardization**

The concepts so far apply to science in general, but specifications and standardization may be concepts unique to information technology.

Information technology is not derived from nature the way physics is (although, of course, things like the performance limits of hardware are). Instead, people decide on specifications and build systems on top of them.

And standardization, the act of getting many people to agree on a single specification, is extremely important for running and inventing the IT systems of the world efficiently.

Examples where specifications and standardization matter include communication protocols and the OS as the interface between hardware and software.

Wherever there are humans, there is standardization.

I believe the three concepts above are essential for dealing with complex, intricate problems.

Of course, there are many other important concepts as well.

- [UNIXという考え方―その設計思想と哲学 (The UNIX Philosophy), Mike Gancarz](https://www.amazon.co.jp/UNIX%E3%81%A8%E3%81%84%E3%81%86%E8%80%83%E3%81%88%E6%96%B9%E2%80%95%E3%81%9D%E3%81%AE%E8%A8%AD%E8%A8%88%E6%80%9D%E6%83%B3%E3%81%A8%E5%93%B2%E5%AD%A6-Mike-Gancarz/dp/4274064069/ref=sr_1_1?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=3UWAH5M0DRIY1&keywords=UNIX%E3%81%A8%E3%81%84%E3%81%86%E8%80%83%E3%81%88%E6%96%B9&qid=1689856430&s=books&sprefix=unix%E3%81%A8%E3%81%84%E3%81%86%E8%80%83%E3%81%88%E6%96%B9%2Cstripbooks%2C173&sr=1-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=6423b2c609c438feea6d3565ff668eff&camp=247&creative=1211)

UNIX is the OS from which many of today's widely used operating systems descend.

This book introduces the core ideas of UNIX and gets you thinking about what kind of software ends up being used by many people for a long time.

## What Is a Browser?

A browser is software that sends and receives website data, renders pages (displays them), and so on.

Well-known browsers include Safari, Google Chrome, Firefox, and the late Internet Explorer.

Making a browser work requires almost all of the main technologies of computer science: communication, computers, operating systems, programs, and more.

On top of that, it lets you deepen your understanding of the three key concepts in information technology mentioned above, especially specifications.

Below, we look at the technologies of computer science from the bottom up, in this order: communication, computers, operating systems, programs, and browsers.

## How Does Communication Work?

In this world, information is transmitted by electric currents flowing through cables and electromagnetic waves flying through the air.

What flies around there are not the numbers and letters we use when we talk. Instead, information is carried by physical signals, such as a voltage being on or off.

So why 0 and 1? Actually, it does not have to be 0 and 1. If the medium can represent three or more states, 0, 1, and 2 would work just as well.

However, restricting things to the two states 0 and 1, the smallest unit of information, gives more stability.

For example, suppose a voltage can take any value continuously from 5V to 0V. If you divide the voltage range into three parts versus two parts, the latter is more stable. That is because in the real world, physical quantities that take continuous values are affected by noise such as cosmic rays and temperature, so they are not stable.

So, to separate states clearly, you need to keep a large distance between one state and the next.

**Why can information be transmitted with 0s and 1s?**

Why can 0s and 1s carry information?

It is because information is "encoded."

The numbers and letters we use every day, such as "0", "1", ... or "a", are each represented by a different symbol so that we can tell them apart.

In fact, there is no necessity for them to be represented by those particular symbols.

For example, in ASCII, a well-known character encoding, "A" is represented by the number 0x41 (01000001 in binary). This is where the concept of "specifications and standardization" comes in.

If you decide in advance, as a specification, how to represent symbols with 0s and 1s, you can encode each symbol and represent it with 0s and 1s.

**Information and communication**

In communication, what matters is how 0s and 1s are sent and received.

For example, when 0001 is sent, the sender and receiver may agree on the timing at which to split it into 0, 0, 0, 1; there are also clever methods such as [Manchester code](https://www.digikey.jp/ja/blog/old-but-still-useful-the-manchester-code). For the start of a transmission, too, you can simply assign some symbol, just like the start codon in DNA.

Here you can catch a glimpse of how important "specifications" are.

**Information theory**

Information theory is the field that studies how to encode information efficiently, and how to encode and decode it when there is instability such as noise.

QR codes are an interesting application of information theory.

I will only introduce information theory briefly here and leave the rest to the books below.

- [情報理論 (Information Theory), Amari](https://www.amazon.co.jp/%25E6%2583%2585%25E5%25A0%25B1%25E7%2590%2586%25E8%25AB%2596-Math%25EF%25BC%2586Science-%25E3%2581%25A1%25E3%2581%258F%25E3%2581%25BE%25E5%25AD%25A6%25E8%258A%25B8%25E6%2596%2587%25E5%25BA%25AB-%25E7%2594%2598%25E5%2588%25A9%25E4%25BF%258A%25E4%25B8%2580-ebook/dp/B01MXVVIMA/ref=sr_1_2?keywords=%25E6%2583%2585%25E5%25A0%25B1%25E7%2590%2586%25E8%25AB%2596&qid=1671339526&s=books&sr=1-2&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=79be6dcc975e7b97944df9c0eb5e1dfb&camp=247&creative=1211&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=a62e6cbb89cfe8b3b0910f3d875f042d&camp=247&creative=1211)

- [情報理論 改訂2版 (Information Theory, Revised 2nd Edition), Imai](https://www.amazon.co.jp/%E6%83%85%E5%A0%B1%E7%90%86%E8%AB%96-%E6%94%B9%E8%A8%822%E7%89%88-%E4%BB%8A%E4%BA%95-%E7%A7%80%E6%A8%B9/dp/4274223256/ref=sr_1_1?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=2P21PWOKOC15C&keywords=%E6%83%85%E5%A0%B1%E7%90%86%E8%AB%96+%E6%94%B9%E8%A8%822%E7%89%88&qid=1689856335&s=books&sprefix=%2Cstripbooks%2C202&sr=1-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=bb6d7b6b3b7fdc87c5e6b39a91ad7a55&camp=247&creative=1211)

If you want a theory book that uses plenty of math while carefully explaining what it all means, this is the one.

**Protocols and the layered structure**

In communication, you need routing: deciding who sends what to where.

That is because in the real world, not every device is connected one-to-one by a cable or wireless link. Instead, devices can reach each other by hopping through other devices on a network connected like a mesh.

So, besides the devices that send and receive information, you also need devices that route information (such as routers) and someone to find the destination (such as DNS servers).

Moreover, in addition to the content you want to convey, the information itself has to carry what communication needs, such as the sender and the receiver.

This cannot be attached arbitrarily; it must follow "specifications" (or protocols) defined through "standardization."

If you just keep adding to such specifications, they become too complex.

So they are split into layers to "divide the difficulty."

Today, the TCP/IP model is widely used, and it plays a big part in how browsers work.

- [マスタリングTCP/IP―入門編―(第6版) (Mastering TCP/IP: Introduction, 6th Edition), Inoue et al.](https://www.amazon.co.jp/%E3%83%9E%E3%82%B9%E3%82%BF%E3%83%AA%E3%83%B3%E3%82%B0TCP-IP%E2%80%95%E5%85%A5%E9%96%80%E7%B7%A8%E2%80%95-%E7%AC%AC6%E7%89%88-%E4%BA%95%E4%B8%8A-%E7%9B%B4%E4%B9%9F/dp/4274224473/ref=tmm_hrd_swatch_0?_encoding=UTF8&qid=1689855440&sr=8-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=c497ece702d01f1f62a09a567757d8ac&camp=247&creative=1211)

This book covers the TCP/IP model, and communication in general, in detail. Reading it will give you a solid understanding of the fundamentals of communication, starting from how things work.

## How Do Computers Compute?

How does a computer process the information it receives through communication?

**Components of a computer**

A computer is made up of several components working together.

The main ones are the following.

- CPU

The CPU is the hardware that processes information: it computes, moves, and temporarily stores data.

It is the most important piece of hardware in a computer.

- Memory

Hardware that stores data such as programs.

Depending on the physical medium, memory differs in volatility (volatile or non-volatile), access speed, and capacity.

Modern computers improve performance, such as speed and capacity, through tricks like arranging different kinds of memory into a hierarchy.

- Input/output devices

Input/output devices include displays, keyboards, and equipment for sending and receiving communications.

Data obtained through this hardware is processed by the CPU or stored in memory.

**What computers can do**

Using the components above, a computer can do a handful of things.

By combining them, it does bigger things. That is exactly "building on existing technology."

1. Moving data

A computer can move data.

You might think, "Moving? How trivial," but this is an important operation that could be called the essence of information processing.

In fact, if you look at the code you get when a program in a high-level language (such as C) is compiled (translated) into assembly language (a program in a form closer to what the machine reads, such as x86), you will see that most of it consists of mov instructions, which move data.

- Arithmetic: basic operations such as addition, subtraction, multiplication, division, shifts, and logical operations.

- Comparison: comparing data lets you branch the processing.

- Jump: jumps make loops and conditional branches possible.

There are many other operations, but computation proceeds by using these basic ones.

Computers can do surprisingly few things, don't you think? And yet, by combining them, they can do amazing things!

What makes this possible is programming. You can see that programming is a truly creative activity.

I will leave the details to the books below.

- [コンピュータの構成と設計 MIPS Edition 第6版 上 (Computer Organization and Design MIPS Edition, 6th Edition, Vol. 1; known in Japan as "Patahene"), Patterson & Hennessy](https://www.amazon.co.jp/%E3%82%B3%E3%83%B3%E3%83%94%E3%83%A5%E3%83%BC%E3%82%BF%E3%81%AE%E6%A7%8B%E6%88%90%E3%81%A8%E8%A8%AD%E8%A8%88-MIPS-%E7%AC%AC6%E7%89%88-%E4%B8%8A-David-Patterson-ebook/dp/B09KN4LWMZ/ref=sr_1_1?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&keywords=%E3%83%91%E3%82%BF%E3%83%98%E3%83%8D&qid=1671339683&s=books&sr=1-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=5d93ae87924ab7589439840f9e1a7f61&camp=247&creative=1211)

This book covers the interface between software and hardware in detail. Specifically, it covers topics such as CPU design and instruction sets (ISAs). The authors are giants who lead this field.

- [ディジタル回路設計とコンピュータアーキテクチャ 第2版 (Digital Design and Computer Architecture, 2nd Edition; known in Japan as "the Harris book"), Harris et al.](https://www.amazon.co.jp/%E3%83%87%E3%82%A3%E3%82%B8%E3%82%BF%E3%83%AB%E5%9B%9E%E8%B7%AF%E8%A8%AD%E8%A8%88%E3%81%A8%E3%82%B3%E3%83%B3%E3%83%94%E3%83%A5%E3%83%BC%E3%82%BF%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%81%E3%83%A3-%E7%AC%AC2%E7%89%88-Sarah-L-Harris/dp/4798147524/ref=tmm_pap_swatch_0?_encoding=UTF8&qid=1671339740&sr=1-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=c6f7bf7ccd1c4bbe7ddf6f63c3aa659c&camp=247&creative=1211)

It covers similar ground to Patahene, but explains everything from the lower gate level up to building a CPU. A distinctive feature of this book is its wealth of hardware description language (HDL) implementation examples.

## What Is an OS (Operating System)?

An OS is software, such as Windows, Linux, Mac OS, or iOS, that underpins PCs and smartphones.

Any app, whatever it is, needs basic operations to do its computing: allocating memory, working with files, managing hardware, managing communication, and so on.

The software that handles all of this comprehensively is the OS.

The OS assumes that the hardware works correctly and uses it to manage that hardware. That is exactly "building on existing technology."

That said, given its role, the OS covers a very broad range and sits at a low level, so explaining how it works in detail within limited space is difficult.

So I will leave the details to the books below.

- [Goならわかるシステムプログラミング 第2版 (Systems Programming Made Clear with Go, 2nd Edition), Shibukawa](https://www.amazon.co.jp/Go%E3%81%AA%E3%82%89%E3%82%8F%E3%81%8B%E3%82%8B%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0-%E7%AC%AC2%E7%89%88-%E6%B8%8B%E5%B7%9D%E3%82%88%E3%81%97%E3%81%8D/dp/4908686122/ref=sr_1_1?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=WMOTE1UXG3B3&keywords=Go%E3%81%AA%E3%82%89%E3%82%8F%E3%81%8B%E3%82%8B%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0+%E7%AC%AC2%E7%89%88&qid=1689855583&s=books&sprefix=%E3%81%93%E3%81%AE%E7%94%BB%E5%83%8F%E3%82%92%E8%A1%A8%E7%A4%BA+go%E3%81%AA%E3%82%89%E3%82%8F%E3%81%8B%E3%82%8B%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0+%E7%AC%AC2%E7%89%88%2Cstripbooks%2C200&sr=1-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=3d6b2218842911e4677f1e1c7a15ac7b&camp=247&creative=1211)

Using Go, a modern language, this book explains what the OS does and what operations you can perform with it.

- [オペレーティングシステムの概念 (Operating System Concepts), Abraham et al.](https://www.amazon.co.jp/%E3%82%AA%E3%83%9A%E3%83%AC%E3%83%BC%E3%83%86%E3%82%A3%E3%83%B3%E3%82%B0%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AE%E6%A6%82%E5%BF%B5-Abraham-Silberschatz/dp/4320122534/ref=sr_1_1?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=TRYOK4HUK4US&keywords=%E3%82%AA%E3%83%9A%E3%83%AC%E3%83%BC%E3%83%86%E3%82%A3%E3%83%B3%E3%82%B0%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AE%E6%A6%82%E5%BF%B5&qid=1671340030&sprefix=%E3%82%AA%E3%83%9A%E3%83%AC%E3%83%BC%E3%83%86%E3%82%A3%E3%83%B3%E3%82%B0%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AE%E6%A6%82%E5%BF%B5%2Caps%2C291&sr=8-1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=058991f4afd7dc5f8fddf301e29b6379&camp=247&creative=1211)

A very thick book, but one of those books that is thick precisely because its explanations are so careful.

- [ゼロからのOS自作入門 (Introduction to Building Your Own OS from Scratch), Uchida](https://www.amazon.co.jp/%E3%82%BC%E3%83%AD%E3%81%8B%E3%82%89%E3%81%AEOS%E8%87%AA%E4%BD%9C%E5%85%A5%E9%96%80-%E5%86%85%E7%94%B0-%E5%85%AC%E5%A4%AA/dp/4839975868?&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=fa7ec8711d3cd97b4b0a78dec9aafca0&camp=247&creative=1211)

A book where you build your own OS.

## What Is a Program?

So far, we have covered communication, computers, and operating systems.

Here, I explain what programs, which you need in order to build real applications on top of all this, are like.

Below is a program that computes Fibonacci numbers.

```python
def fibonacci(n):
  # 基本条件
  if n <= 1:
    return n
  # 再帰的な手続き
  else:
    return fibonacci(n - 1) + fibonacci(n - 2)

# フィボナッチ数列の 10 番目の数を求める
print(fibonacci(10))
```

As you can see, a program carries out computation using "variables" and "functions."

In practice, a program like this is interpreted and executed by an interpreter.

Alternatively, it is translated into assembly language or machine code by software called a compiler and then executed.

**Algorithms and data structures**

What matters in a program are algorithms and data structures.

According to Wikipedia, an algorithm

> refers to a procedure that correctly finds the solution to a "computable" problem whose solution is well defined

So a program can be described as an abstract thing called an algorithm turned into code.

Moreover, to solve problems, the concept of data structures is also indispensable.

According to Wikipedia, a data structure

> is an organization that makes it easy to manage stored data, such as looking up and modifying each item

By using a data structure that suits the nature of your data, you can make problems easier to deal with.

I will leave the details to the book below.

- [問題解決力を鍛える!アルゴリズムとデータ構造 (KS情報科学専門書) (Algorithms and Data Structures for Building Problem-Solving Skills), Otsuki](https://www.amazon.co.jp/%E5%95%8F%E9%A1%8C%E8%A7%A3%E6%B1%BA%E5%8A%9B%E3%82%92%E9%8D%9B%E3%81%88%E3%82%8B-%E3%82%A2%E3%83%AB%E3%82%B4%E3%83%AA%E3%82%BA%E3%83%A0%E3%81%A8%E3%83%87%E3%83%BC%E3%82%BF%E6%A7%8B%E9%80%A0-KS%E6%83%85%E5%A0%B1%E7%A7%91%E5%AD%A6%E5%B0%82%E9%96%80%E6%9B%B8-%E5%A4%A7%E6%A7%BB-%E5%85%BC%E8%B3%87/dp/4065128447/ref=asc_df_4065128447/?tag=jpgo-22&linkCode=df0&hvadid=342458612368&hvpos=&hvnetw=g&hvrand=17145578494957185875&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=1009547&hvtargid=pla-939742448341&psc=1&th=1&psc=1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=dc6e95c91c9459f388420d81ce8e4ab5&camp=247&creative=1211)

When learning data structures and algorithms, it is also important to actually write programs.

Competitive programming contests are a great way to learn while having fun.

In Japan, [AtCoder](https://atcoder.jp/) is a well-known competitive programming site.

I also recommend [アルゴ式 (Algo Method)](https://web.archive.org/web/20260802052601/https://algo-method.com/), a site with learning materials across many areas.

**Program development is a world of splitting problems and abstraction**

Personally, I think program development is a world of splitting problems and abstraction.

Large-scale programs can reach tens of millions of lines. To develop programs that large, the idea of "divide each difficulty" and the idea of abstracting things to make them easy to reuse become important.

In that sense, I think programming is packed with the essence of computer science.

**Compilers**

By now, many readers may be wondering how programs connect to the OS and the computer.

Questions like: what is the difference between an interpreter and a compiler, and why can a program run on a computer that only understands 0s and 1s?

An important topic for understanding why programs run is compilers.

Earlier, I explained the operations a computer can perform. In practice, these are specified by instruction sets (ISAs) such as x86, and the computer can execute a program once a high-level language such as C has been translated into an assembly language such as x86.

Compilers are packed with the essence of computer science. What I find especially fascinating is how much theory contributes to implementation. So I recommend the following.

- [低レイヤを知りたい人のためのCコンパイラ作成入門 (An Introduction to Writing a C Compiler for Those Who Want to Know the Low Level), Rui Ueyama](https://www.sigbus.info/compilerbook)

Of all the books I read in university, this is the one (a website, actually) that influenced me the most.

I think the best way to really learn information technology is, after all, to write programs and build things yourself.

In this book, you actually write a C compiler in C. Because you build it incrementally (a little at a time) so that the compiler always works, it is easy to stay motivated and keep enjoying it. The book also covers techniques and tools for developing large-scale software, which will be very helpful for your future development work.

- [コンパイラ(第2版) (Compilers, 2nd Edition), Tsujino](https://www.amazon.co.jp/%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%A9-%E7%AC%AC2%E7%89%88-%E8%BE%BB%E9%87%8E-%E5%98%89%E5%AE%8F/dp/4274224724/ref=asc_df_4274224724/?tag=jpgo-22&linkCode=df0&hvadid=407530502627&hvpos=&hvnetw=g&hvrand=7904605230057517870&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=1009547&hvtargid=pla-854840472175&psc=1&th=1&psc=1&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=354343e4e9770ceedf337f9d0c7f533b&camp=247&creative=1211)

Although it is a relatively thin book, it gives you a comprehensive grounding in compiler fundamentals.

- [コンパイラ―原理・技法・ツール (Information & Computing) (Compilers: Principles, Techniques, and Tools), Aho et al.](https://www.amazon.co.jp/%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%A9%E2%80%95%E5%8E%9F%E7%90%86%E3%83%BB%E6%8A%80%E6%B3%95%E3%83%BB%E3%83%84%E3%83%BC%E3%83%AB-Information-Computing-V-%E3%82%A8%E3%82%A4%E3%83%9B/dp/478191229X?&_encoding=UTF8&tag=amazon13aff-22&linkCode=ur2&linkId=8a6484bea070e3ee322fc8aa71559cae&camp=247&creative=1211)

For a more detailed book on compilers, try this one. It is thick, but it covers many topics. At first, it may be best to use it like a dictionary.

## How Does a Browser Work?

First, what does a browser need in order to work? It needs resources, such as the design, text, and images used to display a web page.

To get these resources, you need to send a request to a web server saying "please give me the resource." To send this request, you need to define the specification of the request message and make use of the OS, the computer, and communication. That is exactly "building on existing technology."

The server that receives the request then sends back the requested resource.

The browser receives it and displays the page on the screen based on that resource. This requires a program for displaying it.

Browsers also have a JavaScript execution engine and send, receive, and process all kinds of data for each page.

I will leave the finer details to the books and sites below, but I hope you can now see that a browser is made possible by drawing on many technologies.

- [How browsers work, web.dev](https://web.dev/howbrowserswork/)

This covers HTML/CSS, which describe static content, and goes into detail on how the engines that render them work.

- [https://github.com/d0iasm/vulbr, d0iasm](https://github.com/d0iasm/vulbr)

A repository implementing a browser in Rust.

- [Let's build a browser engine!, Matt Brubeck](https://limpet.net/mbrubeck/2014/08/08/toy-layout-engine-1.html)

A blog series that implements browser rendering in Rust.

## Advice for Your Future Learning

**Make the most of the browser**

The browser, which has driven the information society, is a powerful weapon for learning and development.

However, its vast amount of information is a mixed bag of gems and junk, and the drawback is that it is very hard to sort out what to use.

- Search skills + fundamentals

That is why search skills matter. Searching for the information you want is a skill that takes quite a bit of practice. An important factor in improving that search skill is having a solid foundation in the subject you are searching for. Still, in practice, how much information you can get depends on your search skills. Start by building your foundation with good books.

**Official documentation matters**

One thing I have come to feel strongly is the importance of official documentation. In IT, documentation is often in English, so you tend to rely on Japanese blog posts and the like, but most of what is in those blogs is written in the official documentation. And very often, the slow and steady way turns out to be the fastest. Make a conscious effort to read the official documentation.

**Take part in events**

There are many events that bring together students, working professionals, and researchers specializing in information technology.

Taking part in them gives you opportunities to boost your motivation and technical skills, and to broaden your interests through the people you meet.

Here are some well-known events.

- [セキュリティキャンプ (Security Camp)](https://www.ipa.go.jp/jinzai/camp/index.html)

I took part in this one myself and was greatly inspired by the other participants and the instructors. I highly encourage you to apply.

Others include

- [SecHack365](https://sechack365.nict.go.jp/)
- [未踏事業 (Mitou Program)](https://www.ipa.go.jp/jinzai/mitou/index.html)
- [サイボウズ・ラボユース (Cybozu Labs Youth)](https://labs.cybozu.co.jp/youth.html)

and more. Do look them up.

**Ask questions**

This applies to everything, but asking questions is important. The knowledge you gain from the answers matters, of course, but the process of coming up with a question also makes you think things through and shows you what you do and do not understand.

**Write code**

What I regret about my first year of university is that I focused only on deepening my understanding through reading and hardly wrote any code.

Writing code may be hard at first, but once you get the hang of it, it gives you a lot of freedom and is really fun.

Writing code also deepens your understanding even further. As you go through trial and error in your implementation, you start paying attention to the fine details, such as corner cases.

As Feynman put it, "What I cannot create, I do not understand."

**Output matters**

This overlaps with writing code, but I have found that output matters.

In my first year, almost everything I did was input, and I often felt anxious, not knowing whether I really understood things.

By programming, you can check that your program actually works correctly,

and by rereading articles where you summarized your understanding, you can see how well you understood things at each point in time.

## Conclusion

This completes the laying of the "highway of knowledge."

From here on, it is you who will drive down this "highway of knowledge." In the world of computer science, where new technologies keep emerging one after another, mastering the foundational technologies will give you great strength.

And with that, **Let's deep dive!**
