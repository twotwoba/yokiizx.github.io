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

当某个变量需要所有`实例对象共享`的时候，就需要使用到类变量了。可以通过类名直接访问。

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
