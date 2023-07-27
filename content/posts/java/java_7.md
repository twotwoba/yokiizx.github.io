---
title: 'Java_7_异常'
date: 2023-07-20T13:40:31+08:00
tags: []
series: [java]
categories: [study notes]
weight: 7
---

## 异常

老生常谈了，为了程序的健壮性，不能因为一个不算致命的问题，就导致整个系统崩溃。

### 分类

程序执行过程中的异常可以分为两大类：

- `Error`: JVM 虚拟机无法解决，比如 StackOverflowError、OOM 等，程序会崩溃
- `Exception`: 因为变成错误或偶然的外在因素导致的一般性问题，比如 空指针，读取不存在的文件等，又分为：
  - 运行时异常，java.lang.RuntimeException 及其子类
  - 编译时异常

> 对于异常，多写代码就有经验了。

### 类图

进入 `Throwable` 源码，右键 `Diagram` 可以查看/操作类图。

### 处理方式

与 JS 基本类似，有两种：

- tray-catch-finally，捕获异常，自行处理
- throws，抛出异常，交给调用者（方法）来处理，最顶级的处理者就是 JVM

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202307222056115.png)

> 如果没有 try，那么默认就是 throws 抛出

### t-c-f 注意点

当 catch 和 finally 中都有 return 的时候，最终返回的是 finally 的;  
当只有 catch 中有返回变量的时候，这个变量是在内存中暂存的，finally 执行完之后会返回。

```java
public class Demo {

    public static int method() {
        String[] names = new String[2];
        int i = 1;
        try {
            if (names[10] == null) { // 数组越界
                i++;
            }
            return 1;
        } catch (Exception e) {
            return ++i; // i 的值会存到一个临时变量里, 此时为 2;
        } finally {
            // return ++i; // 这里有 return 那么最终返回的就是 --- 3
            ++i; // 没有 return 那么返回的就是 catch 的中临时变量 --- 2
        }
    }

    public static void main(String[] args) {
        System.out.println(method());
    }
};
```

### 自定义异常

一般继承自 RuntimeException.

```java

public class CustomException {
    public static void main(String[] args) {
        int age = 180;
        if (age > 160) {
            throw new AgeException("不可能活到这么大~");
        }
        System.out.println("年龄正常");
    }
}

class AgeException extends RuntimeException {
    public AgeException(String message) {
        super(message);
    }
}
```

### throw & throws

- throws，异常处理的一种方式，后面跟异常类型，在方法声明处
- throw，手动生成异常对象关键字，后面跟异常对象，在方法体中

### IDEA 快捷操作

选中需要被 `try` 的代码，`F19 + S` 即可。
