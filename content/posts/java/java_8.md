---
title: 'Java_8_包装类&String类'
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

{{< admonition>}}
三元运算符要看成一体，最终变量的精度为整体的最高精度
{{</ admonition>}}

## String 类

字符串使用 Unicode 字符编码，一个字符占两个字节（部分字母还是汉字）。与 JS 不同，必须使用双引号。

### 实现接口

`String`类实现了：

```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence{
      // ...
    }
```

- `Serializable` 接口，说明 string 可以串行化：可以在网络传输,可以保存到文件
- `Comparable` 接口，说明 string 可以比较
- `charSequence` 接口

### 本质

1. `String` 是 `final` 类
2. 内部使用 `final char value[]` 来存储字符数组

   ```java
   private final char value[]; // final类型, 不可修改(指的是地址)

   // 经典题：下面创建了几个对象?
   String a = 'hello';
   a = 'world';
   // 2 个，因为final修饰字符串是不可变的，因此常量池中创建了hello 和 world 两个字符串对象，只是改变了 a 变量的引用
   String b = "hello" + "world"; // 1 个对象,编译器不傻,会判断常量池中对象是否被引用
   String c = a + b; // a-hello b-world 呢? 3 个
   // 1. 创建 StringBuilder 实例对象 sb (堆上)
   // 2. 再分别把 a 和 b append 到 sb 上
   // 3. 返回 sb.toString(), 注意 c 指向的是堆中地址
   // 因此： System.out.println(b == c); // false
   ```

### 两种创建方式

1. `String xxx = "xxx"`
2. `String xxx = new String(...)`，构造器很多，查手册

这两种创建方式的本质区别是：

- 方式一：在常量池里寻找是否存在"xxx"，存在就直接指向，否则就在常量池中创建。变量最终指向的是常量池中的空间地址
- 方式二：先在堆中开辟空间，维护了 value 属性，如果常量池中存在 value 就指向常量池空间，否在在常量池中创建。变量最终指向的是堆中的空间地址

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202308152311173.png)

```java
// 经典题
String a = "abc";
String b = "abc";
System.out.println(a.equals(b)); // true
System.out.println(a == b);      // true
/* ---------- 第二种 ---------- */
String a = "abc";
String b = new String("abc");
System.out.println(a.equals(b)); // true
System.out.println(a == b);      // false
```

### intern()

这个方法就是根据 String 的“模样”，去常量池中找，如果有“长得一样的”，就返回这个地址；否则就在常量池中新创建该字符串并返回常量池中的地址。

```java
String a = "hello";
String b = "world";
String c = "helloworld";
System.out.println((a + b).intern() == c);  // T
```

---

## StringBuffer

String 类的效率比较低，每次更新都需要重新开辟空间，所以 java 中设计了 StringBuilder 和 StringBuffer 来提高效率。

### 继承&实现

`StringBuffer` 也实现了 `Serializable` 接口
`StringBuffer` 继承自 `AbstractStringBuilder`，该类内部有 `char[] value` 非 final 属性。
`StringBuffer` 也是 final 类

> 相比较 String，在扩大字符串的时候，是修改的在堆中的 value 的内容，只有当扩容的时候才会修改地址。而 String 每次都是在修改地址。

## StringBuilder

与 StringBuffer 类似，但不保证同步（不是线程安全的，看源码可以看到它的方法都没有 synchronized 关键字修饰的。）。被当做 StringBuffer 的简易替换，**用作字符串缓冲区被单个线程使用的时候**。它比 StringBuffer 要快。

## 比较

- String：效率低，复用率高
- StringBuffer：效率较高，线程安全
- StringBuilder：效率最高，线程不安全。`Array.toString()` 就是用这个拼接的~

## 其它内部类,直接查手册吧~
