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

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202309161520534.png)

### List

- 存储有序
- 有索引
- 可重复

#### 三种常用的 List 实现类

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

- 存储无序
- 无索引
- 不允许重复，至多一个 null

#### 两种常用的 Set 实现类

- `HashSet`，底层实际上是`HashMap`，而`HashMap`的底层是`数组+链表+红黑树`，
  - 当 Set 小于 64(MIN_TREEIFY_CAPACITY) 的时候，数组+链表（邻接表---数组存储链表头）就够了
  - 当 Set 大于 64(MIN_TREEIFY_CAPACITY) 且某条链表超过 8(TREE_THRESHOULD) 时，整个表会进行树化（红黑树）。
  ```java
  // 经典题
  set.add(new String('hello'));
  set.add(new String('hello')); // 可以加入吗？ 答案是：NO！
  // 底层添加的原理 hash + equals
  // 添加一个元素时，先得到hash值，回转成索引值，根据索引值找到链表，当链表不为空时，调用 equals 方法进行比较，如果相同就放弃添加。String的equals是比较字符串内容，所以上述不能添加进去。
  ```
- `TreeSet`.

## Map

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202309161519964.png)
