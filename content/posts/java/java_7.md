---
title: 'Java_7'
date: 2023-07-19T13:30:33+08:00
tags: []
series: [java]
categories: [study notes]
weight: 7
---

## 枚举和注解

### 枚举

比如季节只有四个，传统创建季节类，可能 new n 个不同季节，不合理，所以就需要枚举类来实现。

枚举是一组常量的集合，可以理解为是一种特殊的类，包含了一组有限的特定的对象。

```java
public enum Season {
    // 定义的常量 必须写在最前面
    SPRING("春天", "温暖"), SUMMER("秋天", "炎热"), AUTUMN("秋天", "凉爽"), WINTER("冬天", "寒冷");
    // 等价于 public static final SPRING = new Season("春天", "温暖");
    private String name;
    private String prop;

    // 构造器得是 private 的
    private Season(String name, String prop) {
        this.name = name;
        this.prop = prop;
    }
}
```

- enum 类继承自 Enum，且 enum 声明的是 final 类，可以通过 `javap` 反编译查看
- enum 类也可以作为内部类中使用
- 定义的常量，必须写在最前面，且需要知道使用的是哪个构造器；如果是无参构造器，则括号可以省略，多个常量之间使用 `,` 号分割

### 注解
