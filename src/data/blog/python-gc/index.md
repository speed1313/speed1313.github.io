---
title: "Python's Garbage Collection"
author: speed1313
pubDatetime: 2024-04-11
slug: python-gc
featured: false
draft: false
tags:
  - Notes
description: "In this post, we will examine the garbage collection (GC) in CPython. Furthermore, we will also look into the relationship between GC and Global Interpreter Lock (GIL)."
lang: en
---

Python is a language designed to be executed by an interpreter, with each interpreter containing built-in garbage collection to automatically manage memory.

Python users typically don't need to worry about memory management.

However, when writing programs that require a large amount of memory, such as for deep learning or diagonalization of large matrices, it is common to encounter Out of Memory (OOM) errors. Understanding the characteristics of garbage collection is necessary when encountering such issues.

In this post, we will examine the garbage collection (GC) in CPython, which is the reference implementation and the most commonly used Python implementation. Furthermore, we will also look into the relationship between GC and Global Interpreter Lock (GIL).

## Fundamental: Reference Counting

The foundation of CPython's garbage collection is reference counting.

The reference counting method is a very simple approach where the count of references to each object is tracked incrementally, and once it reaches zero, the object is collected.

Let's observe the actual behavior of garbage collection.

Below is the experimental code:

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

Define the `Object` class and define the `__del__()` special method that is called when the object is about to be destroyed.

Additionally, use `sys.getrefcount()` to view the reference count of the object. Finally, delete the object with `del x`.

The result is as follows:

```bash
$ python3 src/python_gc/rc.py
Referenced by x and getrefcount: 2
Referenced by x and use_object and getrefcount: 3
Referenced by x and use_object and b and getrefcount: 4
Referenced by x and getrefcount: 2
free
End of File
```

The garbage collector automatically performs reference counting, collecting unnecessary objects once their count drops to zero.

Great!

## Issue with Reference Counting: Circular References

There is a downside to reference counting. Objects that reference each other in a circular manner may never have their reference count reach 0, and therefore cannot be collected.

Circular references often occur, posing a problem as they lead to an accumulation of uncollectable memory and eventual out-of-memory errors.

To address this issue, CPython utilizes the mark-sweep method in addition to reference counting. The mark-sweep method involves graph traversal of all objects to identify objects reachable from the root at the current moment and collect unreachable objects. (My blog post on mark-sweep method can be found [here](https://speed1313.github.io/posts/gomicollector/))

The mark-sweep method can collect circular reference objects that are unreachable from the root.

However, the mark-sweep method involves graph traversal, incurring significant computational costs. Therefore, CPython employs generational garbage collection to mitigate the need for frequent traversals.

Generational garbage collection divides objects into generations and performs the mark-sweep method at different frequencies for each generation.

Thus, CPython's garbage collection combines reference counting and mark-sweep methods.

## Relationship between GIL and Reference Counting

Python has a mechanism called the Global Interpreter Lock (GIL), which ensures that only one thread is executed at a time even if multiple threads are launched.

However, the GIL limits the effectiveness of multithreading, prompting recent efforts to remove it.

[PEP703](https://peps.python.org/pep-0703/), aimed at making the GIL optional, identifies reference counting as requiring significant implementation changes to eliminate the GIL.

The traditional implementation of reference counting in CPython relies on the GIL mechanism, making it not thread-safe without the GIL.
When trying to remove the GIL in this state, data conflicts may happen as multiple threads manipulate reference counts at the same time, causing memory management issues.

Therefore, PEP703 specifies the development of a new garbage collector utilizing techniques like Biased Reference Counting, proposed in 2018, for a thread-safe and efficient garbage collection.

Python 3.13, released in October 2024 ([PEP719](https://peps.python.org/pep-0719/)), includes many changes to the garbage collector [[What's New](https://docs.python.org/3.13/whatsnew/3.13.html#gc)].

According to the Python Developer’s Guide, Python 3.13 includes both the traditional implementation and the thread-safe implementation. The thread-safe (free-threaded) build was experimental in 3.13 and became officially supported in Python 3.14 ([PEP779](https://peps.python.org/pep-0779/)).

> In summary, Python's garbage collection initially combined reference counting and mark-sweep methods, but efforts are underway to develop a new garbage collector independent of the GIL, which is thread-safe. (Summarized from: [https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md](https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md))

## Summary

Python's garbage collection combines reference counting with the mark-sweep method. However, in efforts to remove the GIL dependency, development is underway for a new, thread-safe garbage collector.

Python's garbage collection is worth keeping an eye on in the future!

## References

- kamakuraviel, **[PythonのGarbageCollectionに関する考察](https://kamakuraviel.hatenablog.com/entry/2020/08/23/193446)**
- wikipedia, [https://ja.wikipedia.org/wiki/参照カウント](https://ja.wikipedia.org/wiki/%E5%8F%82%E7%85%A7%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88)
- 遠藤敏夫, 一般教養としての Garbage Collection, [gc.pdf (Internet Archive)](https://web.archive.org/web/20250402235014/http://matsu-www.is.titech.ac.jp/~endo/gc/gc.pdf)
- Python Developer’s Guide, Garbage collector design, [https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md](https://github.com/python/cpython/blob/v3.14.0/InternalDocs/garbage_collector.md)
- Jiho et al., Biased reference counting: minimizing atomic operations in garbage collection, [https://dl.acm.org/doi/abs/10.1145/3243176.3243195](https://dl.acm.org/doi/abs/10.1145/3243176.3243195)
- PEP703: [https://peps.python.org/pep-0703/](https://peps.python.org/pep-0703/)
- Aaron Shi & Zachary DeVito, Understanding GPU Memory 2: Finding and Removing Reference Cycles, [https://pytorch.org/blog/understanding-gpu-memory-2/](https://pytorch.org/blog/understanding-gpu-memory-2/)
- Serdar, Python moves to remove the GIL and boost concurrency, [https://www.infoworld.com/article/3704248/python-moves-to-remove-the-gil-and-boost-concurrency.html](https://www.infoworld.com/article/3704248/python-moves-to-remove-the-gil-and-boost-concurrency.html)
