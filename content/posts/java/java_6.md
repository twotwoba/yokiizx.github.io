---
title: 'Java_6'
date: 2023-07-16T08:50:57+08:00
tags: []
series: [java]
categories: [study notes]
weight: 6
---

## 接口

### 基本概念

接口就是给出一些没有实现的方法，封装到一起，在某个类需要使用的时候，再根据具体情况把这些方法实现。

```java
interface XxxXxx {
  // 1. 抽象方法，接口中有无a bstract 关键字都行，默认会加上
  // 2. jdk1.8后 default 方法, 具体实现
  // 3. jdk1.8后 static  方法
}

class LeiName implements XxxXxx {
  // 必须实现接口的抽象方法
}
```

### 应用场景

制定规格规范，方便统一。

```java
// 定义数据库连接规范，这样对于不同数据库连接，
// 即使是不同人来写，也得遵守方法规范，减轻心智模型
interface DBInterface {
  public void connect();
  public void close();
}

public class Mysql implements DBInterface {
  public void connect() {
    System.out.println("connect mysql...");
  }

  public void close(){
    System.out.println("close mysql...");
  }
}

public class Oracle implements DBInterface {
  public void connect() {
    System.out.println("connect oracle...");
  }

  public void close(){
    System.out.println("close oracle...");
  }
}
// .... other db

// use
public class Test {
    public static void main(String[] args) {
        Mysql mysql = new Mysql();
        Oracle oracle = new Oracle();

        db(mysql);
        db(oracle);
    }

    // 形参体现接口的多态
    public static void db(DBInterface dbInterface) {
        dbInterface.connect();
        dbInterface.close();
    }
}
```

### 细节

- 接口不能被实例化，都是需要类来实现的，可以看成某一类型的规范
- 接口中所有方法是 `public abstract`(可省略) 的
- 普通类必须实现接口中的所有抽象方法；抽象类可以不用实现接口的方法
- 一个类可以同时实现多个接口；一个接口可以继承多个接口
- 接口中的属性都是 `public static final`(可省略) 的，且必须初始化

### 比较

实现接口可以看出是继承类的补充。

比如：小猴子继承老猴子，天生就会爬树，但是想要飞翔就得实现飞行的接口，想要游泳就得实现游泳的接口，因为老猴子本身并不具备这两种能力。

```java
interface Swimming {
  void swmiiing();
}
interface Fly {
  void fly();
}

class LittleMonkey extends Monkey implements Swimming,Fly {
  // ...
}
```

- 类继承价值在于`复用性`和`可维护性`
- 接口价值在于`制定规范，让其他类实现，更加灵活`
- 接口在一定程度上实现代码解耦 [接口规范性+动态绑定]

> [接口与其他概念比较](https://www.runoob.com/java/java-interfaces.html)

---

## 内部类

TODO
