---
title: 'Java_10_泛型&单元测试 JUnit'
date: 2023-10-19
tags: []
series: [java]
categories: [study notes]
weight: 10
---

前端学过 TypeScript，对泛型是一定的理解，来看看 java 的泛型吧。

---

## 作用

不使用泛型会有以下比较明显的问题：

1. 不能对类型进修约束，不安全
2. 比如 ArrayList，遍历的时候需要进行类型转换，如过集合的数据量过大，对效率有影响

```java
// 简单使用 demo
ArrayList<Dog> list = new ArrayList<Dog>();
```

> 其实还是 TS 的那种理解，无非就是一个可变类型。声明接口、类等等时占位，然后在实例化的时候给定准确类型罢了。哈哈哈~

## 注意点

- Java 中的泛型只能是引用类型，比如 `new ArrayList<Integer>`，而不能是 `int`。
- 制定类型后，可以传入指定类型的子类型。
- 一般简写即可，`ArrayList<String> = new ArrayList<>()`
- 泛型如过不传，默认为 Object 类型

## 自定义泛型

注意点：

- 使用泛型的数组不能初始化
- 静态方法中不能使用类的泛型

```java
class LeiName<T,X...> {
  T[] name; // 因为未确定类型，不知道开辟多少空间

  // 如过加上 static 就会抛错，因为类先加载，这时候还不能确定类型
  public String getName(X m) {
    // ....
  }

  // 泛型方法
  public <K,V> void setName(K k, V v) {
    // ....
  }
}
```

## 通配符&约束

```java
// <?>，支持任意类型
// <? extends A>，支持 A 及 A 的子类，和 TS 中的约束类似哦~
// <? super B>，支持 B 及 B 的父类
```

## 单元测试

个人感觉 Java 的单元测试做起来比前端的单元测试要简单的多。

为了便于对某个方法做测试，只需要在方法上添加注解 `@Test`，然后 `option + enter` 既可添加 JUnit 不同版本，现在一般使用 v5+，之后就可以进行单独的运行方法了。

```java
@Test
public void m1() {
    System.out.println("单元测试");
}
```
