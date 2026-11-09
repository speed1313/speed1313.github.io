---
title: "Garbage Collection: The Mark & Sweep Method"
description: "This post explains the mark & sweep method, one of the algorithms used for garbage collection."
translatedDatetime: 2026-10-31
---

This post explains the mark & sweep method, one of the algorithms used for garbage collection.

## Introduction

Garbage collection (GC), the software that automatically manages memory in the heap, is used by many programming languages, including Python, Go, and Java.

GC tends to sound intimidating, but the idea behind mark & sweep, the GC algorithm introduced in this post, is remarkably simple.

In fact, when I implemented a simple garbage collector in Rust, it took only about 100 lines. (Implementation: [https://github.com/speed1313/gomicollector](https://github.com/speed1313/gomicollector))

In this post, let's walk through the mark & sweep algorithm!

## Background

First, let's understand why GC is needed in the first place.

Running a program requires **memory**.

When a program runs, the memory available to it is basically laid out as follows.

| Text segment |
| ------------ |
| Data segment |
| Heap         |
| ↓            |
|              |
|              |
| ↑            |
| Stack        |

The parts to focus on are the heap and the stack. Both grow and shrink dynamically at run time.

By using the stack and the heap for different purposes, memory can be used efficiently.

**The stack**

Modern programs basically operate according to the stack machine, a model of computation that uses a stack to perform calculations.

For example, to compute 5+3 on a stack machine, the arguments (5, 3) are pushed onto the stack, then popped off the top and added together, and finally the result is pushed back, as shown below.

|                 |                 |                 |                 |
| --------------- | --------------- | --------------- | --------------- |
|                 |                 | +               |                 |
|                 |                 | 3               |                 |
|                 | 5               | 5               | 8               |
| ・              | ・              | ・              | ・              |
| ・              | ・              | ・              | ・              |
| ・              | ・              | ・              | ・              |
| Bottom of stack | Bottom of stack | Bottom of stack | Bottom of stack |

Time →

Using a stack in this way makes it possible to evaluate expressions that combine arithmetic operations, such as (5+3)*(3*2), as well as logical operations.

Functions, recursion, if statements, and so on can also be handled by a stack machine.

In this way, program execution basically follows the stack machine model.

For more detail on how programs work, please refer to books on operating systems and compilers (see: [Tsujino, Compilers](https://www.ohmsha.co.jp/book/9784274224720/), [Rui Ueyama, An Introduction to Writing a C Compiler for Those Who Want to Understand Low-Level Systems](https://www.sigbus.info/compilerbook)).

**The heap**

The previous section explained why the stack is needed. So why do we need the heap?

The reason is that programs sometimes need to allocate memory dynamically, and that cannot be done with the stack, whose allocation order and sizes are fixed at compile time.

Memory allocated on the stack is constrained: it can only be allocated and freed at push and pop, and its size must be determined statically.

With the heap, by contrast, memory can be allocated and freed at any time and in any size, within the bounds of the heap.

For example, a tree whose size is determined at run time must have its memory allocated on the heap.

The heap is convenient in this way, but when using heap memory, allocation and deallocation must be done correctly.

For example, the following rules must be observed.

- Always free memory that is no longer needed → the heap is finite, so failing to free memory causes it to overflow
- Never use a pointer to freed memory → this can cause you to read unintended values or write to the wrong place
- Never free memory twice → this may free memory that has since been allocated to something else

If these rules are not followed, the program will behave in unexpected ways.

Freeing heap memory is notoriously tricky and has troubled programmers for a long time. In fact, it is said that a large share of bugs stem from memory.

In a huge, complex program, it is hard to know precisely where memory should be allocated and where it should be freed.

GC addresses this problem by allocating and freeing memory automatically.

Thanks to GC, programmers no longer have to agonize over memory management. (GC does have its own problems, such as slowdowns due to overhead. Trade-offs are everywhere in computer science.)

## Algorithms

Many algorithms for implementing GC have been invented over the years.

Two representative ones are reference counting and mark & sweep.

Reference counting

> A method that counts the number of pointers referencing an object and frees the object when that count reaches zero. It has the problem of circular references. When many objects are freed at once, a naive implementation can cause long pause times.
> (Quoted from [https://ja.wikipedia.org/wiki/ガベージコレクション](https://ja.wikipedia.org/wiki/%E3%82%AC%E3%83%99%E3%83%BC%E3%82%B8%E3%82%B3%E3%83%AC%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3))

Mark & sweep

> A method that follows references from one object to another and discards objects that cannot be reached. (Quoted from [https://ja.wikipedia.org/wiki/ガベージコレクション](https://ja.wikipedia.org/wiki/%E3%82%AC%E3%83%99%E3%83%BC%E3%82%B8%E3%82%B3%E3%83%AC%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3))

Here, I explain mark & sweep with a concrete example.

## The Mark & Sweep Method

In mark & sweep, objects in the heap are traversed recursively starting from the root, and each object visited is marked along the way. Once the traversal finishes, any object without a mark is considered unnecessary, and is discarded and reclaimed.

The algorithm proceeds as follows.

1. Check the list (free_list) that stores the indices of currently available slots in the heap. If the list contains an index, pop one and allocate that memory. Otherwise, do the following to collect garbage and reuse it.
2. Initialization: set marked=false on every object in the heap.
3. Mark phase: recursively traverse objects starting from the root, setting marked=true on each one visited
4. Sweep phase: scan objects from the start of the heap and add each index with marked=false to free_list
5. Pop one index from free_list and return it. If there is none, there is no space left to allocate, so return an error.

The algorithm presented here is just one example of how mark & sweep can be implemented. In fact, although a real heap grows, here it is treated like a fixed-length vector.

There are many ways to do mark & sweep, but the core logic is the same in all of them.

**A concrete example**

Suppose we have a heap with four slots, as shown below.

The table below is fixed-length, but if you interpret it as a table of indices pointing to raw memory, the actual memory can be variable-length. Alternatively, you can assume that only fixed-size memory blocks can be allocated.

| root  |              |             |           |
| ----- | ------------ | ----------- | --------- |
| index | marked: bool | object name | points to |
| 0     |              |             |           |
| 1     |              |             |           |
| 2     |              |             |           |
| 3     |              |             |           |

At first, the heap is unused, so it is initialized with None (None is omitted from the table).

The root is the starting point for marking during GC, and is a variable on the stack. In C, it corresponds to a pointer into the heap.

Just as you can define as many pointers as you like in C, there can be any number of roots, but for simplicity we use just one here.

The set of starting points explored during marking is called the root_set.

One way to store the root_set would be to keep a stack of hash maps that follows the nesting of the program: insert pointer variables that point into the heap when entering a nested scope, and pop them when leaving it.

This way, the pointers are also released when leaving a nested scope.

Memory pointed to by a released pointer cannot be reached during the mark phase if no other pointer points to it, so it is collected as garbage.

However, a hash map is itself a data structure stored in the heap, so this approach seems to lead to a chicken-and-egg problem.

One could, for example, use a different data structure that does not use the heap. I'll leave a deeper discussion to specialized books.

Objects pointed to by the root are currently in use and are not collected by GC.

We also prepare free_list, which stores the available indices in the heap. Initially, it is empty, since we don't yet know which slots are available.

```
free_list: []
```

In this state, memory for obj1 is allocated as follows.

```rust
obj1_id = gc.allocate()
```

The gc then checks free_list for free space.

```
free_list: []
```

Here free_list is empty, so the gc enters the phase of collecting garbage from the heap.

First, it sets marked=false on everything.

| root  |        |             |           |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  |             |           |
| 1     | false  |             |           |
| 2     | false  |             |           |
| 3     | false  |             |           |

Next comes the mark step.

The mark step finds and marks every object currently in use.

It traverses recursively from the root, but here the root does not point to any index, so the mark step finishes without finding a single object.

Next comes the sweep step.

The sweep step reclaims the unreached, that is, unnecessary, slots in the heap and stores them in free_list.

Here it scans indices starting from 0, and since every one has marked=false, the result is

```
free_list: [0, 1, 2, 3]
```

Finally, one index is popped from the end of free_list.

In this case, obj1 is assigned slot 3.

| root  |        |             |           |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  |             |           |
| 1     | false  |             |           |
| 2     | false  |             |           |
| 3     | false  | obj1        |           |

Now memory has been allocated for obj1.

Unfortunately, nothing points to obj1 yet. Keep in mind that, as things stand, it will probably be collected once memory fills up.

Next, in this state, if we run

```rust
obj2_id = gc.allocate()
```

free_list still has free space, as shown below,

```
free_list: [0, 1, 2]
```

so no garbage collection takes place, and obj2 is assigned slot 2.

As a result, the heap looks like this.

| root  |        |             |           |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  |             |           |
| 1     | false  |             |           |
| 2     | false  | obj2        |           |
| 3     | false  | obj1        |           |

Calling allocate() two more times fills up the entire heap, as shown below.

| root  |        |             |           |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  | obj4        |           |
| 1     | false  | obj3        |           |
| 2     | false  | obj2        |           |
| 3     | false  | obj1        |           |

```
free_list: []
```

If we call allocate() in this state, free_list is currently empty, so memory needs to be reclaimed, and the garbage collector collects garbage following the mark & sweep method.

Once again, the root points to nothing, so after mark() every marked is false, and after the sweep free_list becomes

```
free_list: [0, 1, 2, 3]
```

This means that **unreachable objects** such as obj1, … , obj4, which nothing points to, **are unnecessary and are automatically freed by GC**.

Then an index is popped from free_list, and obj5 is assigned slot 3.

| root  |        |             |           |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  |             |           |
| 1     | false  |             |           |
| 2     | false  |             |           |
| 3     | false  | obj5        |           |

Sure enough, GC has reclaimed the unneeded slots and allocated new memory.

Now let's go back to the state just before obj5 was allocated. This is the state below, where the entire heap is allocated.

| root  |        |             |           |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  | obj4        |           |
| 1     | false  | obj3        |           |
| 2     | false  | obj2        |           |
| 3     | false  | obj1        |           |

In this state, let's make the root point to obj1:

```rust
root = *heap[obj1_id]
```

| root  |        |             | obj1      |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  | obj4        |           |
| 1     | false  | obj3        |           |
| 2     | false  | obj2        |           |
| 3     | false  | obj1        |           |

If we now call allocate() for obj5, the heap looks like this when mark() finishes.

| root  |        |             | obj1      |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  | obj4        |           |
| 1     | false  | obj3        |           |
| 2     | false  | obj2        |           |
| 3     | true   | obj1        |           |

root→obj1

Because of this, calling mark(root) sets marked=true on obj1 only.

Therefore, after sweep(), free_list looks like this.

```
free_list: [0, 1, 2]
```

This means that **reachable objects are not collected**.

GC never collects anything that is still reachable, that is, still needed.

After obj5 is allocated, the heap and free_list look like this.

| root  |        |             | obj1      |
| ----- | ------ | ----------- | --------- |
| index | marked | object name | points to |
| 0     | false  |             |           |
| 1     | false  |             |           |
| 2     | false  | obj5        |           |
| 3     | true   | obj1        |           |

```
free_list: [0, 1]
```

From this example, we have seen that GC distinguishes reachable from unreachable objects using marked=true and false, and collects garbage so that the heap can be used as fully as possible.

This post simplifies things considerably, for example by replacing the heap structure with a vector.

For how allocation actually works, please refer to resources such as the video below.

The following video explains the inner workings of malloc() in great detail.

[The 67th Yokohama kernel reading party](https://youtu.be/0-vWT-t0UHg)

## Summary

This post explained mark & sweep, a representative garbage collection algorithm.

GC may sound difficult from the name alone, but we have seen that mark & sweep is a simple algorithm:

**Traverse objects, mark the ones that can be reached, and treat unmarked ones as unnecessary and free their memory.**

For a more detailed look at how it works, I implemented a mark & sweep GC in about 100 lines of Rust, so please take a look. A star would be appreciated, too.

- [https://github.com/speed1313/gomicollector](https://github.com/speed1313/gomicollector)

What I covered here only scratches the surface of GC.

Making it practical involves many more complex topics, such as tuning when garbage is collected, compacting the heap, and making collection concurrent (I don't yet know anything about them beyond the names of the main topics).

I encourage you to dive deeper.

## References

- [https://github.com/speed1313/gomicollector](https://github.com/speed1313/gomicollector)

- [https://github.com/munificent/mark-sweep](https://github.com/munificent/mark-sweep)
- [https://github.com/jorendorff/gc-in-50-lines](https://github.com/jorendorff/gc-in-50-lines)

- [Garbage Collection: Theory and Implementation of Automatic Memory Management (Japanese edition of The Garbage Collection Handbook), Richard Jones et al.](https://amzn.to/44jVEbh)

- [Crafting Interpreters, Robert Nystrom](https://craftinginterpreters.com/garbage-collection.html)
