---
title: 'Java_4'
date: 2023-07-08T21:11:35+08:00
tags: []
series: [java]
categories: [study notes]
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
        String anotherString = (String)anObject; // 向下转型
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
