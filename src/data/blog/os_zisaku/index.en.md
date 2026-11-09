---
title: "How Building My Own OS Changed the Way I See Operating Systems"
description: "In this post, I describe how building my own OS changed the way I see operating systems."
translatedDatetime: 2026-10-31
---

The other day, I started building my own OS by following **[Writing an OS in 1,000 Lines](https://operating-system-in-1000-lines.vercel.app/ja/welcome)**, a guide written by [nuta](https://github.com/nuta).

As a university student majoring in computer science, I tend to regard the OS, one of the most important components of a computer, as something special among all kinds of software, and I had long admired the idea of building my own OS.

On the other hand, the operating systems in use today, starting with Linux, are extremely complex, and partly because of the difficulty of setting up a development environment, I had never managed to step into actually implementing an OS.

Then I learned about **[Writing an OS in 1,000 Lines](https://operating-system-in-1000-lines.vercel.app/ja/welcome)** on X (formerly Twitter).

After reading its preface, I thought it looked more approachable than any other build-your-own-OS book I had come across, so I started copying the code by hand.

As a result, just as the preface promised, I was able to build the following OS in about three days, and I have also made progress implementing extra features.

[https://github.com/speed1313/cos](https://github.com/speed1313/cos)

In the process of implementing an OS, I learned at the implementation level how an OS, and the kernel in particular, actually works, and the way I see the kernel changed quite a bit.

In this post, I describe how my "view of the OS" changed between before and after building one, something I can probably only write now, right after having started.

> **Attention**
> Note that I use "OS" and "kernel" almost as synonyms.

I have only just started building an OS, so the following may contain mistakes. If you find any, please let me know.

## What I Thought Before Building an OS

I pictured the OS exactly as in the diagram in Wikipedia's [Operating system](https://en.wikipedia.org/wiki/Operating_system) article: an intermediary sitting between the Application and the Hardware.

Something that keeps running all the time, supporting applications from below.

I had a rough idea of the roles and mechanisms of an OS from reading [an OS textbook](https://amzn.to/3seOgk0) and [Patterson and Hennessy](https://www.amazon.co.jp/%E3%82%B3%E3%83%B3%E3%83%94%E3%83%A5%E3%83%BC%E3%82%BF%E3%81%AE%E6%A7%8B%E6%88%90%E3%81%A8%E8%A8%AD%E8%A8%88-MIPS-%E7%AC%AC6%E7%89%88-%E4%B8%8A%E3%83%BB%E4%B8%8B%E9%9B%BB%E5%AD%90%E5%90%88%E6%9C%AC%E7%89%88-David-Patterson-ebook/dp/B0BLTQS81T?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=195BBGMVELDAZ&keywords=%E3%83%91%E3%82%BF%E3%83%98%E3%83%8D&qid=1692239365&s=books&sprefix=%E3%83%91%E3%82%BF%E3%83%98%E3%83%8D,stripbooks,153&sr=1-1&linkCode=sl1&tag=amazon13aff-22&linkId=7d1060ae64b2eebd44735939b0e8abaf&language=ja_JP&ref_=as_li_ss_tl), but I could not imagine what it would look like when actually written as a program.

In particular, I had no idea at all how the interface with the hardware would be written.

I knew the mechanisms and roles of concepts such as paging, exception handling, process scheduling, and memory allocators, yet it was vague to me which part was handled by whom (the OS? the CPU?) and how.

## What I Think After Building an OS

### The Kernel Is (in a Sense) Just a Process

It is obvious in hindsight, given that operating systems existed even in the single-processor era, but the OS (the kernel) is not running all the time; the applications and the kernel take turns running. (Now that multiprocessors are widespread, there may also be designs where the kernel runs all the time, though.)

More precisely: the bootloader loads the boot image (e.g. an ELF file) into memory and sets the pc to the kernel's start address, which starts the kernel. The kernel performs various initializations and starts running the first application (such as a shell). After that, the following cycle repeats: an event such as a system call or an exception triggers the CPU's exception handling mechanism, which rewrites the pc to point to the part of the kernel that handles the context switch into the kernel; the kernel handles the exception in kernel mode according to the event; and once it finishes, control moves back to the application.

Therefore, viewed from the implementation side, switching between an application and the kernel is nothing more than changing values held by the CPU, such as the pc (program counter), the general-purpose registers, the sp (stack pointer), the start address of the page table, and the privilege mode.

I find this fact quite striking, because apart from the change of privilege mode, it is hardly any different from a context switch between applications.

The kernel can be described as a special process with the following characteristics:

- It runs in supervisor mode
- It can, or must, manage many things
- It is the very first thing started by the bootloader

But in the end, it is still a process.

### Assembly Language Is Indispensable

A kernel program performs operations that cannot be written in a high-level programming language, such as directly manipulating registers that hold the start address of the page table or control mode switching.

So it has no choice but to use assembly language.

For this reason, kernel programs either link in assembly files or, using [inline assembly](https://ja.wikipedia.org/wiki/%E3%82%A4%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E3%82%A2%E3%82%BB%E3%83%B3%E3%83%96%E3%83%A9), a compiler extension, embed assembly partially into high-level language code like this:

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

For more on this, [the places in the Linux source code where inline assembly is used](https://github.com/search?q=repo%3Atorvalds%2Flinux%20__asm__&type=code) are a good reference.

### CPUs Have So Many Features

Beyond simple instructions like add and jump, CPUs offer a rich set of features such as mode switching, exception handling, and paging.

For example, on a RISC-V CPU, an instruction like the one below registers the start address of the page table in the satp register, and the CPU then performs paging automatically.

```c
"csrw satp, %[satp]\n"
```

Also, by using the ecall instruction as shown below, you can raise a system call exception and handle the system call in the exception handler, which implements a system call: switching from user mode to kernel mode to do the work.

```
__asm__ __volatile__("ecall"
	                 : "=r"(a0)
	                 : "r"(a0), "r"(a1), "r"(a2), "r"(a3)
	                 : "memory");
```

When building an OS, you make generous use of these CPU features to implement things like system calls, paging, and exception handling.

I used to think the kernel was amazing for doing so many things, but in fact it was wielding a powerful weapon: the CPU.

### Exception Handling Is Very Important

Anything that transitions into kernel mode, such as a system call or a page fault, is implemented by moving the pc to the start address of the exception handler registered with the CPU.

Exceptions can be regarded as events: when an event occurs, the CPU hooks into the exception handler, which does different work for each kind of event, so the kernel can deal with a wide variety of events as they happen.

### The Timer Was Important Too

Timer exceptions, raised by the timer built into the CPU, are indispensable for preemptive multiprocessing such as round-robin scheduling.

I used to wonder why OS textbooks listed timer exceptions alongside system calls and the like as examples of exceptions, but once I learned how important timer exceptions are, it finally made sense.

I underestimated the timer. I'm sorry.

### When the Kernel Panics, Everything Stops

When an application panics, the kernel takes care of it, but when the kernel panics and stops, there is nothing to handle it and recover. So the whole system just stops.

Once the whole system stops, the only option is to reboot the computer, so in practice kernel panics should be avoided.

Come to think of it, when the attempt to bring Rust into Linux began, Linus Torvalds said:

> I do think that the "run-time failure panic" is a fundamental issue.

[LKML: Linus Torvalds: Re: [PATCH 00/13] [RFC] Rust support](https://lkml.org/lkml/2021/4/14/1099)

calling for serious attention to panics.

Looking back after building an OS, I think he is exactly right about how important the handling of panics is in kernel development.

Reference:
[Rust for Linux uses its own alloc library](https://zenn.dev/garasubo/articles/rust-for-linux-alloc)

### OS Development Is a Mixed Martial Art

The technologies you come into contact with when building an OS cover a wide range: compilers, CPUs, shells, file systems, network protocols, and more.

Building an OS is a mixed martial art where every bit of low-level, build-it-yourself experience you have gained in the past comes in handy.

### Black Boxes All the Way Down

I now have a reasonable grasp of what the kernel does, but new black boxes have emerged: the bootloader, device drivers, and how the many features built into the CPU are implemented.

## Conclusion

This time I shared my impressions after looking at a very conventional OS design, but apparently recent research is exploring interesting designs such as:

- Designs that replace software context switches with hardware threads
- Unikernels, in which the application and the kernel are combined into one

(Reference: [自作OSで学ぶマイクロカーネルの設計と実装 (Design and Implementation of Microkernels Learned by Building Your Own OS)](https://www.amazon.co.jp/%E8%87%AA%E4%BD%9COS%E3%81%A7%E5%AD%A6%E3%81%B6%E3%83%9E%E3%82%A4%E3%82%AF%E3%83%AD%E3%82%AB%E3%83%BC%E3%83%8D%E3%83%AB%E3%81%AE%E8%A8%AD%E8%A8%88%E3%81%A8%E5%AE%9F%E8%A3%85-%E6%80%92%E7%94%B0%E6%99%9F%E4%B9%9F/dp/4798068713?&linkCode=sl1&tag=amazon13aff-22&linkId=068f08c484525acde5d055d463500d30&language=ja_JP&ref_=as_li_ss_tl))

There are many ways to specify and implement an OS, and each of them has its own face.

I wonder what face the next OS I meet will have.

## References

- [Writing an OS in 1,000 Lines, nuta](https://operating-system-in-1000-lines.vercel.app/ja/welcome)
  - [repository](https://github.com/nuta/operating-system-in-1000-lines)

  It was a lot of fun to implement an OS in under 1,000 lines of C targeting the RISC-V architecture, so please give it a read. It is easy to read and you can learn a lot from it. Highly recommended.

- [自作OSで学ぶマイクロカーネルの設計と実装 (Design and Implementation of Microkernels Learned by Building Your Own OS), Seiya Nuta, Shuwa System](https://amzn.to/3KKFdh1)

  This book explains a variety of OS-related technologies along with their implementations. It also covers topics such as file systems and internet protocols, and its content is very rich.
  - [support site](https://github.com/nuta/microkernel-book)

  The implementation of HinaOS, the OS built in this book, is available on the support site above. It is an OS written for education, and its implementation is very simple. It also implements a file system and internet protocols.

  It supports multiprocessors too, but because it uses the Big Kernel Lock approach, there are no locks scattered through the code, which keeps the implementation simple and easy to read.

  However, HinaOS is a microkernel and a bit more complex than a monolithic kernel, so I recommend reading [Writing an OS in 1,000 Lines](https://operating-system-in-1000-lines.vercel.app/ja/welcome), which implements a monolithic kernel, first.

- [Xv6 for RISC-V](https://github.com/mit-pdos/xv6-riscv)

  Xv6 is an educational OS used as teaching material in courses at MIT. It is a monolithic kernel, but locks appear all over the code, which I feel makes it a bit hard to read.

  There is also [a Japanese translation of the book explaining its implementation](https://web.archive.org/web/20230608081737/https://www.sugawara-lab.jp/fig/xv6-riscv-jpn.pdf), so it seems good to read the two together.

  (I was surprised to find that one of the authors is [Russ Cox](https://github.com/rsc), a main contributor to the Go language.)

- [コンピュータの構成と設計 (Computer Organization and Design, commonly known as "Patterson and Hennessy"), David Patterson, John Hennessy, translated by Mitsuaki Narita, Nikkei BP](https://www.amazon.co.jp/コンピュータの構成と設計-MIPS-第6版-上・下電子合本版-David-Patterson-ebook/dp/B0BLTQS81T?__mk_ja_JP=カタカナ&crid=195BBGMVELDAZ&keywords=パタヘネ&qid=1692239365&s=books&sprefix=パタヘネ,stripbooks,153&sr=1-1&linkCode=sl1&tag=amazon13aff-22&linkId=7d1060ae64b2eebd44735939b0e8abaf&language=ja_JP&ref_=as_li_ss_tl)

- [オペレーティングシステムの概念 (Operating System Concepts), Abraham Silberschatz et al.](https://amzn.to/3seOgk0)
