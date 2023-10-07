---
title: 'Java_9_集合'
date: 2023-09-14 09:53:06
tags: []
series: [java]
categories: [study notes]
weight: 9
---

Java 种数组需要手动扩容，使用起来很不方便，因此，更常用的是集合。

## Collection 接口

### List

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202309161520534.png)

- `ArrayList`，线程不安全，内部是一个 `Object[]` 数组: `elementData`。
  - 扩容机制：使用 `Arrays.copyOf()`， 1. `new ArrayList()`，初始大小为 0，加入一个元素后变成 10，装满后再装就变成 1.5 倍; 2. `new Array(int)`，初始为 int，装满后也是扩容到 1.5 倍。
- `Vector`，线程安全，操作方法都带有 `synchronized` 修饰。另外它的扩容是按照 2 倍扩容。
- `LinkedList`，线程也不安全，底层使用双向链表实现，因此，增删的效率高，改查的效率低。

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202310072214653.png)

### iterator 和 增强 for

学过 js 的 generator 函数应该很容易理解这一部分内容。

```java
ArrayList<String> test = new ArrayList<String>();
test.add("111");
test.add("222");
test.add("333");

Iterator<String> iterator = test.iterator();
while (iterator.hasNext()) {
    String next = iterator.next();
    System.out.println(next);
}

// 增强 for 的底层使用的也是迭代器
for (String s : test) {
    System.out.println(s);
}

// 另外一种就是普通for循环了~
```

### Set

## Map

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202309161519964.png)
