---
title: 'Java_8_包装类'
date: 2023-07-23T11:47:25+08:00
tags: []
series: [java]
categories: [study notes]
weight: 8
---

## 包装类

包装类 -- 针对八种基本数据类型有相对应的引用类型。

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202307231151103.png)

> Character, Boolean 的父类是 Object，其他的父类是 Number

### 包装类与基本类型相互转换

JDK5 之前装箱拆箱的动作都是手动的，现在都是自动的了，但是知道都干了什么。

- 装箱，可以通过 `new 包装类(基本类型数据)` or `包装类.valueOf(基本类型数据)`
  ```java
  int i = 666;
  Integer ii = new Integer(i);
  Integer iii = Integer.valueOf(i);
  ```
- 拆箱，调用对应类型的 `xxxValue` 方法即可, xxx 为基本数据类型
  ```java
  int iiii = iii.intValue()
  ```
  > [深入剖析 Java 中的装箱和拆箱](https://www.cnblogs.com/dolphin0520/p/3780005.html)

### 经典题

```java
Object a =  true ? new Integer(1) : new Double(2.0)
System.out.println(a) // 1.0
```

> 三元运算符要看成一体，最终变量的精度为整体的最高精度
