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

## 四种内部类

### 介绍

顾名思义，一个类中包含了另一个类。

```java
class Outer{       // 外部类
  class Inner {    // 内部类
    // ...
  }
}
```

> 当内/外部类有重名的属性遵循就近原则，访问外部需要 `外部类名.this.xxx`

内部类的最大特点是：可以直接访问外部类的私有属性或方法，并且可以体现类与类之间的包含关系。

### 分类

- 局部内部类，定义在方法中，不能添加访问修饰符，但是可以加 final

  ```java
  public class Outer {

    public static void main(String[] args) {
        new Outer().part();
    }

    public static int num = 1;

    public void part() {
        class Inner {
            private String num = "yy";

            public void log() {
                System.out.println(num + "---" + Outer.this.num);
            }
        }
        // 访问内部类 实例化对象即可
        Inner inner = new Inner();
        inner.log();
    }
  }
  ```

- 匿名内部类，无类名的局部内部类
  `new 接口/类名(参数) { ... };`

  ```java
  // 场景: 传统接口一定要先被类实现，再重写方法，但是这个实现的类假如只使用一次呢？
  // 那么每次创建类再实现接口就有点浪费了，可以直接使用匿名内部类来完成
  class AnonymousOuter {
    public void demo() {
        // 语法 直接 new 接口/类名() { // ... };
        // 编译类型是 Animal; 运行类型是 AnonymousOuter$1, 如有多个多个就外部类$1..n
        Animal tiger = new Animal() {
            @Override
            public void cry() {
                System.out.println("tiger cry...");
            }
        };

        tiger.cry(); // tiger一直存在，但是匿名内部类只使用一次
    }
  }

  public static void main(String[] args) {
      AnonymousOuter anonymousOuter = new AnonymousOuter();
      anonymousOuter.demo();
  }

  // 实践，可以直接作为参数传递给方法。
  ```

- 成员内部类，无 static，不在方法里而再在类成员位置写类，可以用所有修饰符

  ```java
  class MemberOuter {
    public class MemberInner {
        public void log() {
            System.out.println("访问成员内部类...");
        }
    }
  }
  // 外部其他类使用内部类的情况
  public static void main(String[] args) {
      MemberOuter memberOuter = new MemberOuter();
      MemberOuter.MemberInner memberInner = memberOuter.new MemberInner();
      memberInner.log();
  }
  ```

- 静态内部类，有 static，限制了不能访问非静态的成员

  ```java
  // 把上方成员内部类变成静态成员内部类后访问方式
  public static void main(String[] args) {
      MemberOuter.MemberInner memberInner = new MemberOuter.MemberInner();
  }
  ```

> 入门视频更详细 ---[B 站](https://www.bilibili.com/video/BV1fh411y7R8/?p=414&spm_id_from=pageDriver&vd_source=fbca740e2a57caf4d6e7c18d1010346e)
