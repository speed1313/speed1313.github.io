---
title: "My Experience at Security Camp 2022, Track B (Web Security)"
description: "I recently took part in Security Camp 2022, Track B (Web Security)."
translatedDatetime: 2026-10-31
---

I recently took part in Security Camp 2022, Track B (Web Security), a training program for young security engineers organized by IPA and the Security Camp Council.

It was my first tech event, so I was nervous, but it turned out to be a really fruitful and fun time. In this post I'll write about my impressions from the time I applied all the way to the end of the event. (Apparently Security Camp isn't over until you've written the blog post?)

If you're hesitating to apply because Security Camp seems too advanced, I hope this post puts your worries to rest. Go ahead and apply!

## Applying

Around Golden Week, I saw the lecturers promoting the camp on Twitter, so I took a quick look at the application assignments. The Track B assignment interested me and seemed doable if I worked hard, so I decided to give it a try.

The details of how I worked on the assignment are here:

[Sharing my Security Camp 2022 application answers](https://www.notion.so/2022-c518f01951bd44318423c8ce8039cd11?pvs=21)

## The Acceptance Notice Arrives

About two weeks after the assignment deadline, an email arrived announcing the results. You find out whether you've passed by looking for your own number in a PDF posted on the Security Camp website, which gave me the same thrill as checking the results of a high school entrance exam. My heart was pounding.

I wasn't very confident I'd get in, so I was surprised when I found my number.

## A Delivery I Don't Remember Ordering

While I was still enjoying being accepted, a delivery from Amazon that I didn't remember ordering suddenly showed up.

[https://twitter.com/strayer_13/status/1534484204029120512](https://twitter.com/strayer_13/status/1534484204029120512)

When I opened it, I found the massive "Tokumaru book" and the "DK book", a.k.a. イラストでわかるDockerとKubernetes (Docker and Kubernetes, Illustrated).

I had no idea Security Camp gave out books, so I was surprised when they arrived.

[体系的に学ぶ 安全なWebアプリケーションの作り方 (How to Build Secure Web Applications, Learned Systematically), Tokumaru](https://amzn.to/45FWKiJ)

[イラストでわかるDockerとKubernetes (Docker and Kubernetes, Illustrated), Tokunaga](https://amzn.to/3KPJEXV)

It's a chance to get free books, so please apply to Security Camp too.

## A Huge Cardboard Box Arrives

Next, a huge cardboard box arrived.

Inside was a pile of swag and a Security Camp T-shirt!

It was the first time I'd ever received swag, so I was really happy.

There was also something like a whiteboard notebook in there. (⌒▽⌒)

## Here Come the Pre-Camp Assignments

In Track B (Web Security), the camp itself is run as a series of lectures, so you need to have the background knowledge beforehand. To that end, we were given pre-camp assignments.

### Building a Browser

One of the Track B lectures was about building your own browser.

[https://github.com/d0iasm/vulbr](https://github.com/d0iasm/vulbr)

We were given vulbr, a codebase that can already parse and render HTML/CSS/JavaScript, and the assignment was to add features on top of it.

The code is written in Rust, and reading through it was really fun. I also got to learn a lot about how browsers are specified.

### Container & Kubernetes

One of the lectures was about building your own container and learning about container and k8s security.

So I studied by reading the Docker and Kubernetes book and using a learning site the lecturer had prepared for us.

I got to learn about containers and k8s hands-on.

## The Camp Begins

No sooner had I applied than the camp itself arrived.

## Lectures

The lectures covered the following topics:

- B1 作って学ぶWebブラウザ (Learning the Web Browser by Building One)
- B2 マイクロサービス・分散モノリス的アーキテクチャへの攻撃手法 (Attack Techniques against Microservice and Distributed-Monolith Architectures)
- B3 Policy as Code入門 (Introduction to Policy as Code)
- B4 モダンな開発環境のセキュリティ及びCI/CDパイプラインのセキュア化 (Security of Modern Development Environments and Securing CI/CD Pipelines)
- B5&B7 ソフトウェアサプライチェーンセキュリティのこれから (The Future of Software Supply Chain Security)
- B6 実践Linuxコンテナ実行基盤セキュキャン (Practical Linux Container Runtime Security, Security Camp Edition)

As you can see, it's a packed lineup. In fact, some lectures had over 200 slides, so each individual lecture was packed too.

At first glance, you wouldn't guess from this list that the course theme is Web security, but after actually taking the lectures, I realized that the Web connects to everything.

Here are my impressions of each, in order.

- B1 作って学ぶWebブラウザ (Learning the Web Browser by Building One)

In this lecture, someone involved in Chromium development taught us about browser security.

I learned things you'd never find out just by using a browser, especially defense in depth and historical reasons.

- B2 マイクロサービス・分散モノリス的アーキテクチャへの攻撃手法 (Attack Techniques against Microservice and Distributed-Monolith Architectures)

In this lecture, we learned, with hands-on exercises, about vulnerabilities specific to architectures that have become popular in recent years.

What stuck with me was how vulnerabilities arise from mismatched interpretations of a specification. I was amazed that vulnerabilities could come about like that!

- B3 Policy as Code入門 (Introduction to Policy as Code)

In this lecture, we learned about Policy as Code (PaC), the practice of defining policies as code.

I knew nothing about PaC before this lecture, but thanks to the lecturer's careful explanations, I came to appreciate its benefits.

Partly because I had studied Prolog as an undergraduate, I was able to keep up reasonably well with the hands-on exercises in Rego, a policy language that seems to be inspired by Prolog.

- B4 モダンな開発環境のセキュリティ及びCI/CDパイプラインのセキュア化 (Security of Modern Development Environments and Securing CI/CD Pipelines)

In this lecture, we learned about vulnerabilities in CI/CD pipelines and on developers' machines.

The lecture included hands-on exercises on GCP, so we learned in a practical way.

CI/CD is hard to begin with because it's made up of many pieces of software, and I felt that securing it is even harder.

It really brought home to me that thinking about security requires a solid understanding of the fundamentals of the technology.

[開発環境のセキュリティおよびCI/CDパイプラインのセキュア化 (Development Environment Security and Securing CI/CD Pipelines)](https://speakerdeck.com/rung/training-devenv-security-ja)

[https://github.com/rung/training-devenv-security/](https://github.com/rung/training-devenv-security/)

- B5&B7 ソフトウェアサプライチェーンセキュリティのこれから (The Future of Software Supply Chain Security)

In this lecture, we learned about supply chain security, with hands-on exercises using sigstore, a cutting-edge technology.

I had researched dependency confusion attacks for my application assignment, so I found it really interesting.

As the title suggests, it got me thinking about "the future."

- B6 実践Linuxコンテナ実行基盤セキュキャン (Practical Linux Container Runtime Security, Security Camp Edition)

In this lecture, we learned how containers and k8s work from the ground up, with hands-on exercises.

I use containers all the time, but actually exploiting vulnerabilities in the hands-on exercises made me realize how dangerous they can be.

[https://github.com/mrtc0/seccamp-2022](https://github.com/mrtc0/seccamp-2022)

### Lightning Talks, Participant Meetups, Group Work, and Final Presentations

Besides the lectures, Security Camp offered all kinds of opportunities to interact with people. (Online, though.)

Talking with other participants and listening to their presentations, I found that their backgrounds were really diverse, and that every one of them was extremely skilled.

## Overall Impressions

As I mentioned, I was surprised by how diverse everyone's backgrounds were, but it seemed to me that every participant, tutor, and lecturer had one thing in common: they love technology.

In particular, a community that brings together people working on everything from hardware to software is really rare.

The Discord chat was really lively, both during lectures and during presentations, and it was fun to voice chat with all sorts of people.

The knowledge I gained from the lectures was of course valuable, but I think getting to spend time with the Security Camp people was especially precious.

## Things That Left an Impression

- Learning from Doi-san about one of the good things about OSS development: you can talk openly with people outside about the work you do
- During a conversation about some technology, a tutor casually said, "I wonder if there are any vulnerabilities in it." It struck me that they're always thinking about vulnerabilities, which I found amazing
- The trade-off between security and convenience
- Defense in depth
- Historical reasons

## A Dance of Gratitude

My thanks go to the Security Camp participants, tutors, lecturers, everyone involved, the sponsor companies, and all the citizens whose taxes fund Security Camp.

I learned so much through Security Camp 2022 that I want to keep sharpening my skills so I can join Security Camp Next, and maybe become a tutor or even a lecturer(?), to give back~

### Everyone, come join Security Camp!
