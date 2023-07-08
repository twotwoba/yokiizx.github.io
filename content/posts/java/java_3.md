---
title: 'Java_3'
date: 2023-06-30T10:18:33+08:00
tags: []
series: [java]
categories: [study notes]
---

面向对象编程三大特性：`封装、继承和多态`。

## 封装

封装（英语：Encapsulation）是指一种将抽象性函式接口的实现细节部分包装、隐藏起来的方法。

### 基础形式

- 属性私有化 `private`
- 提供公开的 getter/setter 方法

## 继承

与 JS 一样，使用 `extends` 来实现继承。

### 注意细节

有以下注意点：

- 子类总是继承了所有的属性和方法，只是私有属性和方法不能在子类中访问，可以通过调用父类的公共方法间接访问
- 子类初始化时，总是默认会先调用父类的无参构造器，因为子类构造器中默认会有一个 `super()` 的动作。这种机制一直延伸到顶级类 `Object` 类
- 如果父类没有提供无参构造器，则必须在子类中调用 `super()` 指明是哪个构造器
- `super()` 和 `this()` 都必须在构造器第一行，所以不能共存，只能二选一
- 多级继承，`super` 关键字遵循 `就近原则`
- java 继承是`单继承机制`，子类只能继承一个类

### 继承本质

这里借用韩顺平老师的图：

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202307042055445.png)

> 小结：在 new 一个对象的时候，JVM 先在方法区加载类（在这里会加载类的所有祖先类），然后再在堆中分配内存，最后在主栈中创建变量引用。

### 重写

子类中的某个方法和祖先类的某个方法完全一致（返回类型，名称，参数列表），这就叫做方法的重写。

注：1. 父类中方法的返回类型 可以为 子类中重写方法的返回类型的父类; 2. 子类重写方法不得缩小父类方法的访问权限(即修饰符权限不得缩小)

## 多态

方法或对象具有多种形态，是建立在封装和继承之上的。主要目的：`提高代码复用性`，比如方法，可以把入参的参数类型提升到父类，这样就可以避免写一些不必要的重载。

### 方法的多态

- 重载，体现在实例对象调用同名但返回类型或参数不同的方法
- 重写，体现在父子不同对象调用同名方法

### 对象的多态

重点：

- 一个对象的编译类型和运行类型可以不一致
- 编译类型在定义对象时，就确定了，不能改变
- 运行类型是可以变化的
- 编译类型看定义时 `=` 的左边，运行类型看 `=` 的右边

```java
// 基本演示
Animal animal = new Dog()
animal = new Cat() // animal 仍然是 Animal 类型，但是运行类型从 Dog 变成了 Cat
```

> `A instanceof B`，这里判断的是 A 的运行类型是否是 B 类型或 B 类型的子类型

转型细节：

- 向上转型，`父类 xxx = new 子类()`：

  1. xxx 可以访问父类的所有成员(遵守访问权限)，但访问不了子类特有的成员。因为在编译阶段，能调用哪些成员是由编译类型决定的(javac)
  2. 然而，最终的执行结果还是看子类的具体实现(java)

  ```java
  // 简而言之: 属性访问看编译类型, 方法访问看运行类型
  class A {
    int num = 10;
    public void log() {
      System.out.println(this.num);
    }
  }
  class B extends A {
    int num = 20;
    public void log() {
      System.out.println(this.num);
    }
    public void unique() {
      // ...
    }
  }

  // 测试
  B b = new B();
  System.out.println(b.num); // 20
  b.log();                   // 20

  A a = b;
  System.out.println(a.num); // 10  看编译类型
  a.log();                   // 20  看运行类型
  ```

- 向下转型，`子类 xxx = (子类) 父类引用`，可以看成是引用类型的强转：

  1. 解决了向上转型不能访问子类型特有成员的问题
  2. 注意`父类引用`创建时的运行类型必须和这里的编译类型一致

  ```java
  ((B) a).unique();
  ```

### 动态绑定机制（重要）

- 对象调用方法时，方法会和该对象的运行类型绑定
- 但属性没有动态绑定机制，哪里声明哪里用

例子：

```java
class A {
    public int i = 10;

    public int sum() {
        return getI() + 10;
    }

    public int sum1() {
        return i + 10;
    }

    public int getI() {
        return i;
    }
}

class B extends A {
    public int i = 20;

//    public int sum() {
//        return i + 20;
//    }
//    public int sum1() {
//        return i + 20;
//    }

    public int getI() {
        return i;
    }
}

// 向上转型，假如子类中的方法没有注销，那么直接调用运行类型的方法，下述语句应该输出都是40
A a = new B();
// 注释后,sum中的getI方法跟随运行类型
System.out.println(a.sum());  // 30
// sum1中的i不会跟随运行类型,在哪里,用哪里
System.out.println(a.sum1()); // 20
```

---
