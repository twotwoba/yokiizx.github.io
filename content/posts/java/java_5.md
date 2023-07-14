---
title: 'Java_5'
date: 2023-07-12T13:43:09+08:00
tags: []
series: [java]
categories: [study notes]
weight: 5
---

之前都是 JAVA 初级的知识点记录，下面进入更高一层级的学习。

## 类变量/类方法(静态变量/静态方法)

### 静态变量

当某个变量需要被`该类的所有实例对象共享`的时候，就需要使用到类变量了。推荐通过类名直接访问。

两个点：

1. static 静态变量在类加载时，就生成了
2. statci 静态变量被该类所有对象实例共享

```java
class People {
    public static int count;

    private String name;
    public People(String name) {
        this.name = name;
    }
}
```

> 类变量的内存在 JDK8 以前是在方法区内，JDK8 及以后是在堆里面的类对应的 class 对象。（这个对象是通过反射机制，在类加载的时候在堆内生成的）

推荐阅读：

- [Java 类的静态变量存放在哪块内存中](https://blog.51cto.com/u_15061941/2591637)
- [Java static 变量保存在哪](https://blog.csdn.net/x_iya/article/details/81260154/)

### 静态方法

当方法中不涉及到任何和对象相关的成员，就可以使用静态方法。

简单说就是`不需要实例化对象就访问`，比如 `Math.xxx()` 之类的`工具类`就是如此。

```java
class MyTools {
  public static void myFn() {
    // xxx
  }
}
```

注意：

1. 静态方法中无法使用 `this/super`
2. 静态方法只能访问静态属性/方法；普通方法则无限制

### main 方法

`public static void main(String[] args)`

1. main 方法是由 jvm 虚拟机调用的，所以方法必须是 public 的
2. jvm 虚拟机在调用的时候不创建对象，所以必须是 static 的
   - 因此，main 方法中不能直接访问非静态变量或方法，必须在方法内实例化一个该类对象，通过这个对象再去访问
3. `String[] args` 是执行 java 命令时，传递给所运行的类的参数
   ```sh
   java xxx arg1 arg2 arg3 # arg1 arg2 arg3 就处理为 String[] args 传给类
   ```

## 代码块(初始化块)

没有方法名，没有返回，没有参数，只有方法体，在加载类时或创建对象时隐式调用：

```java
[static] {
  // ...
};
```

场景：多个构造器中有重复的语句，就可以抽取到初始化块中，提高代码的复用性。

### 细节

1. 类加载时机
   - new
   - 创建子类实例对象，父类也会被加载
   - 访问类的静态成员
2. 代码块执行时机
   - `static` 代码块在类加载时就执行，所以只会执行一次
   - 普通代码块在创建对象时执行，创建一次执行一次；如果只是访问类的静态成员，则不会执行
3. 对象创建时，类中的代码块和属性调用顺序(一个类中)
   - 调用静态代码块和静态属性初始化
   - 调用普通代码块和普通属性初始化
   - 调用构造器。若是有继承关系，创建一个子类对象顺序如下
     1. 父类静态代码块和静态属性初始化
     2. 子类静态代码块和静态属性初始化
     3. 父类普通代码块和普通属性初始化
     4. 父类构造方法
     5. 子类普通代码块和普通属性初始化
     6. 子类构造方法
4. 静态代码块只能调用静态成员

## 单例模式

这是学习 Java 过程中的遇到的第一个设计模式。

记得在 JS 中就是判断是否已经存在实例对象，如果存在就返回来实现简单的单例模式的。Java 相比而言更加的专业~

> 简而言之：保证类的实例对象只有一个，该类提供一个访问对象实例的方法

### 饿汉式

1. 将构造器私有化
2. 在类内部创建静态对象实例
3. 暴露静态方法，该方法访问在类内部创建的对象实例

```java
class Wife {
    public String name;
    private Wife(String name) { // 私有化构造器，方式通过new访问
        this.name = name;
    }

    public static Wife wife = new Wife("hyl"); // 饿汉，类加载时就着急的创建出实例了
    public static Wife getInstance() { // 因为不能通过new访问,所以得使用静态方法
        return wife;
    }
}
```

`java.lang.Runtime` 就是经典的饿汉单例。

### 懒汉式

饿汉式在累加载时创建出来的对象可能压根没有用到，造成了资源浪费，所以就需要懒汉式的单例模式，在使用才创建对象实例。

```java
class Son {
    public String name;
    private Son(String name) {
        this.name = name;
    }

    private static Son son;
    public static Son getInstance() {
        if (son == null) {
            son = new Son("my-son");
        }
        return son;
    }
}
```

看着花里胡哨，其实这就和 js 的防抖节流是否先执行一次有异曲同工之妙~so easy👻

> But! 懒汉式存在线程安全，比如同时三个线程进入就会创建三个对象实例了，破坏了单例模式。怎么解决？TODO

## final

1. 修饰类，禁止类被继承
2. 修饰方法，禁止方法被重写
3. 修饰成员变量和局部变量，则变量不能被修改
