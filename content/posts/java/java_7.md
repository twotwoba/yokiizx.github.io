---
title: 'Java_7'
date: 2023-07-19T13:30:33+08:00
tags: []
series: [java]
categories: [study notes]
weight: 7
---

## 枚举

比如季节只有四个，传统创建季节类，可能 new n 个不同季节，不合理，所以就需要枚举类来实现。

枚举是一组常量的集合，可以理解为是一种特殊的类，包含了一组有限的特定的对象。

```java
public enum Season {
    // 定义的常量 必须写在最前面
    SPRING("春天", "温暖"), SUMMER("夏天", "炎热"), AUTUMN("秋天", "凉爽"), WINTER("冬天", "寒冷");
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
- enum 类也可以作为内部类中使用，也可以有成员属性和方法
- 定义的常量，必须写在最前面，且需要知道使用的是哪个构造器；如果是无参构造器，则括号可以省略，多个常量之间使用 `,` 号分割

### values(), ordinal(), valueOf()

```java
for (Season season : Season.values()) {
    System.out.println(season); // 默认调用 Enum 的 toString方法
    System.out.println(season.ordinal()); // 常量的索引
}

 System.out.println(Season.valueOf("SPRING")); // 根据字符串拿到常量
// 其他具体方法可以去 Enum 类中查看
```

### 枚举实现接口

枚举不能继承，因为底层已经继承了 Enum 了，但是仍然可以实现接口。

```java
interface Job {
    public void work();
}

public enum Gender implements Job {
    MAN, WOMAN;

    @Override
    public void work() {
        if (this == MAN) {
            System.out.println("男人需要工作");
        } else {
            System.out.println("女人也需要工作");
        }
    }
}
// psvm
Gender.MAN.work();
Gender.WOMAN.work();
```

---

## 注解

### JDK 内置基本注解

- `@Override`，修饰重写方法，如果加上了编译器就会去检查是否真的重写了父类的方法
  ```java
  // IEDA查看源码
  @Target(ElementType.METHOD)
  @Retention(RetentionPolicy.SOURCE)
  public @interface Override { // 这里的 @interface 表示一个注解类 和接口无关
  }
  ```
- `@Deprecated`，修饰类/属性/方法/包/参数等，表示已经过时，（不推荐使用但并不是不能用），往往用来做新旧版本兼容过度
- `@SuppressWarnings`，抑制编译器警告，类型很多，不用背，idea 会给出

### JDK 元注解: 对注解进行注解(了解,辅助看源码)

- `@Retention`，指定注解作用范围，保留时间
  - RetentionPolicy.SOURCE，记录在源码层面，编译器 javac 使用后，直接丢弃这种策略的注释
  - RetentionPolicy.CLASS，编译器把注释记录在 class 文件中，JVM 不会保留注释，（默认）
  - RetentionPolicy.RUNTIME，编译器把注释记录在 class 文件中，java 程序运行时，JVM 会保留注释
- `@Target`，指定注解在哪些地方可以使用
- `@Documented`，指定注解是否在 javadoc 中体现
- `@Inherited`，子类会继承父类注解
