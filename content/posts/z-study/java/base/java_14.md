---
title: 'Java_14_反射'
date: 2023-11-24T15:08:33+08:00
lastmod:
series: [java]
categories: [study notes]
weight: 14
draft: true
---

## 场景

反射机制是 java 的灵魂。

比如，需要通过外部文件配置，在不修改源码的情况下，来控制程序。这也符合设计模式的 ocp 原则（开闭原则）。

简单 demo：`根据配置文件，控制程序`

```java
// 常规实例化一个对象，并调用它的方法
public class Demo {
    public static void main(String[] args) {
        Car car = new Car();
        car.sayHello();
    }
}
/* ---------- 根据配置文件控制程序 ---------- */
// Car.properties
classPath=com.yk.Car
method=sayHello

// 1. 读取配置文件
public class Demo {
    // Exception 省略。。。
    public static void main(String[] args) {
        // 1. 读取配置
        String configPath = "/Users/yokiizx/Desktop/Java_Demo/untitled/src/com/yk/Car.properties";
        Properties properties = new Properties();
        properties.load(new FileReader(configPath));
        String classPath = properties.getProperty("classPath"); // 得到配置的类路径
        String methodName = properties.getProperty("method"); // 得到具体方法名

        // 2. 反射魔法
        Class<?> aClass = Class.forName(classPath); // 真正获取到 “类对象”

        /* ---------- Object o = aClass.newInstance(); 无参构造器可以直接实例化 ---------- */
        Constructor<?> constructor1 = aClass.getConstructor(); // 获取无参构造器
        Constructor<?> constructor2 = aClass.getConstructor(String.class); // 获取有参构造器
        Object o = constructor1.newInstance(); // 创建对象实例

        // 反射获取非私有属性
        Field name = aClass.getField("name");
        System.out.println(name.get(o)); // god is a girl

        // 反射执行方法
        Method method = aClass.getMethod(methodName);
        method.invoke(o); // hello world
    }
}
```

## 反射机制

Java 反射机制可以完成：

- 在运行时判断任意一个对象所属的类
- 在运行时构造任意一个类的对象
- 在运行时得到任意一个类所具有的成员变量和方法
- 在运行时调用任意一个对象的成员变量和方法
- 生成动态代理

反射的优缺点：

- 优点：可以动态创建和使用对象（框架底层的核心），使用灵活。
- 缺点：使用反射基本是解释执行，对执行速度有影响。可以通过 ·禁用访问安全检查· `setAccessible(true)`来优化，Method、Field 和 Constructor 对象都有这个方法。
  > setAccessible(true)，也称为爆破，可以使得访问私有的成员～

> Class, Method, Field, Constructor 相关 api 建议查文档，用多了就熟悉了，不赘述

---

### Java 程序在计算机的三个阶段

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202311291125177.png)

由此可见，类对象是反射的核心，关于类对象需要知道以下内容：

1. Class 也是一个类，继承自 Object
2. Class 类对象不是 new 出来的，是系统创建的
3. Class 类对象在内存只有一份，因为类只会加载一次
4. 每个类的实例都会记得自己是由哪个 Class 类对象所生成
5. Class 类对象是存放在堆的
6. 类的字节码二进制数据，是放在方法区的，有的地方称为类的元数据（包括方法代码，变量名，方法名，访问权限等）

### 获取 Class 类对象的方式

- `Class.forName("类的全路径")`，场景：多用于通过配置文件加载类
- `类.class`，已知具体类，该方式最为安全可靠，程序性能最高，场景：多用于参数传递，比如上例通过反射获取构造器时，传递参数 `String.class`
- `对象.getClass()`，场景：通过实例对象获取类对象
- 源码中的方式：`ClassLoader cl = 对象.getClass().getClassLoader(); cl.loadClass("类的全类名")`
- 基本数据获取 Class 类对象：`基本数据类型.class`
- 基本数据类型的包装类获取 Class 类对象：`包装类.TYPE`

#### 那些类型有 Class 对象

1. 类
2. 接口
3. 数组
4. 枚举
5. 注解
6. 基本数据类型
7. void

### 类加载时机

#### 静态记载&动态加载

- 静态加载，编译的时候就加载相关类了，如果没有对应的类，则会报错
- 动态加载，代码执行到才会加载相关类，如果没有执行到，即使没有对应的类，也不会报错

动态加载优点像前端的懒加载的概念，用到了才会去引入。

```java
// 静态加载
public static void test() {
    if (true) {
        System.out.println(true);
    } else {
        Car car = new Cat(); // 即使肯定执行不到这里，但是编译的时候会加载Cat类，由于没有此类，所以报错
        System.out.println(car);
    }
}
// 反射 动态加载
public static void test() throws ClassNotFoundException, InstantiationException, IllegalAccessException {
    if (true) {
        System.out.println(true);
    } else {
        // 使用反射 - 则可以顺利 javac 和执行，因为代码始终走不到这里，就不会去加载Cat类
        Class<?> aClass = Class.forName("Cat");
        Object o = aClass.newInstance();
        System.out.println(o);
    }
}
```

四种会加载类的情况：

- new 创建对象
- 子类被加载时，父类也被加载
- 调用类中的静态成员
- 反射。（上面 3 个都是静态加载，此处为动态加载）

#### 类加载的三个阶段

前面说的 Class 类加载阶段又可以详细分为三个阶段：

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202311301513296.png)

补充：

1. 连接 - 验证阶段：包括文件格式验证（是否以魔数 oxcafebabe 开头）、元数据验证、字节码验证和符号引用验证。可以考虑使用 `-Xverifyinone` 参数来关闭大部分的类验证措施，缩短虚拟机类加载的时间。
2. 连接 - 准备阶段：需要注意这里**默认初始化**的是 `静态变量`，且初始化的是**默认值**，真正的初始化赋值是在初始化阶段的。
   ```java
   public int a = 10; // 不是静态变量，准备阶段不会分配内存和初始化
   public static b = 20; // 准备阶段初始化为 0
   public static final c = 30; // 因为是final，所以准备阶段直接初始化为 30
   ```
3. 连接 - 解析阶段：直接引用就是具体引用地址的指针，符号引用就是字符串符号的形式来表示引用
