---
title: 'Java_4'
date: 2023-07-08T21:11:35+08:00
tags: []
series: [java]
categories: [study notes]
weight: 4
---

## Object 类

### `==` 和 `equals`

- `==`，判断基本类型，判断的是值；判断引用类型，判断的是引用地址
- `equals`，只判断引用类型,(JAVA 中字符串是引用类型)
- 子类中往往会重写该方法，用于比较内容是否相等，比如 Integer、String 类就不太相同，直接看源码：

  ```java
  // Object类中 -- 很简单
  public boolean equals(Object obj) {
      return (this == obj);
  }

  // String
  public boolean equals(Object anObject) {
    if (this == anObject) { // 和自己比直接返回真
        return true;
    }
    if (anObject instanceof String) {
        String anotherString = (String)anObject; // 向下转型,需要得到作为String内的各个属性
        int n = value.length;
        if (n == anotherString.value.length) {
            char v1[] = value;
            char v2[] = anotherString.value;
            int i = 0;
            while (n-- != 0) {
                if (v1[i] != v2[i])
                    return false;
                i++;
            }
            return true;
        }
    }
    return false;
  }

  // Integer
  public boolean equals(Object obj) {
    if (obj instanceof Integer) {
        return value == ((Integer)obj).intValue();
    }
    return false;
  }
  ```

### hashCode()

返回对象的哈希码值。往往也需要被重写。

作用：提高具有哈希表结构数据类型的性能

小结:

- 对于对象，两个引用一致的对象返回的 `hashCode` 一定是一样的
- 哈希值与内存地址对应，并不是真正的内存地址
- [ ] 学习到 hashMap hashSet 时再深入

### toString()

```java
public String toString() {
    // getClass().getName() 返回全类名(包名+类名)
    return getClass().getName() + "@" + Integer.toHexString(hashCode());
}
```

> 直接输出对象，默认就会调用 toString() 方法

### finalize

当对象被回收时，系统自动调用对象的 `finalize` 方法。一般是需要重写的。

> 触发回收: 1. `引用 = null`; 2. `System.gc()`

## 拓展阅读

- [Java HashCode 详解](https://blog.csdn.net/tanggao1314/article/details/51505705)
