---
title: 'Java_13_网络编程'
date: 2023-11-15T17:50:14+08:00
lastmod:
series: [java]
categories: [study notes]
weight: 13
---

作为前端开发，对网络这块大体还是比较熟悉的，如需要深度学习网络，可以后续深度学习～

---

java.net 包下提供了一系列的类和接口，来完成网络通讯。

### InetAddress

```java
/* ---------- InetAddress ---------- */
// 获取本机主机名和 ip 地址
InetAddress localHost = InetAddress.getLocalHost();

// 通过域名获取远程 ip
InetAddress baidu = InetAddress.getByName("www.baidu.com");
System.out.println(baidu);
```

### socket

通信的两端都要有 socket（套接字）。
