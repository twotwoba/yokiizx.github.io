---
title: 'Jdbc_1'
date: 2023-12-08T22:10:34+08:00
lastmod:
tags: []
series: [JDBC]
categories: [study notes]
weight: 1
---

> 公司项目用的是 `MybatisPlus`，在此之前，先了解下 JDBC

## JDBC

全称： Java Database Connectivity。

### 基本概念

JDBC 是 Java 编程语言的数据库连接 API，用于实现 Java 与数据库之间的连接和交互。它提供了一种机制来查询和更新数据库中的数据，并且支持关系型数据库。通过 JDBC，开发人员可以轻松地在 Java 应用程序中访问和操作数据库。

简单说，有了 JDBC， java 就可以与所有的提供了 JDBC 驱动的数据库的交互统一。

### JDBC API

相关类和借口在 java.sql 和 javax.sql 包中。自行查手册。

### 快速入门

1. 注册驱动 - 加载 Driver 类
2. 获取连接 - 得到 Connection，DriverManager.getConnection(url,user,password);
3. 执行增删改查 - 发送 SQL 给 mysql 执行
4. 释放资源 - 关闭相关连接

> 鉴于只是了解，就看老韩的这个视频吧 [JDBC 快速入门](https://www.bilibili.com/video/BV1fh411y7R8?p=823&vd_source=fbca740e2a57caf4d6e7c18d1010346e)

### Statement

JDBC 在建立连接后，有三个访问数据库 API： Statement, PreparedStatement, CallableStatement.

- Statement 对象用于执行静态 SQL 语句并返回其生成的结果的对象
- Statement 有 Sql 注入风险，为了防范建议使用 `PreparedStatement`.

- PreparedStatement，sql 语句中的参数使用 `?` 替代，然后用 `setXxx(index, ...)` 来设置参数
- 调用 executeQuery() 返回 ResultSet 对象。ResultSet 是一个迭代器对象，类似于 js 中的迭代器。
  ```java
  ResultSet resultSet = PreparedStatement.executeQuery();
  while(resultSet.next()) {
    int id = resultSet.getInt();
    // 按列 获取 有对应类型的 get 方法
  }
  ```
- 调用 executeUpdate() 执行更新操作

### 事务

java 获取 Connection 对象后，默认情况下是自动提交事务。

为了保证一组 sql 按照事务的形式整体执行，得到 Connection 对象后，取消自动提交事务：`setAutoCommit(false)`。

- connection.commit(), 提交事务
- connection.rollback()，回滚事务

### 批处理

为了提高效率，java 有批量更新机制，允许多条语句一次性交给数据库批量处理。

主要有以下方法：

```java
PreparedStatement ps = connection.prepareStatement(sql);
ps.addBatch();
ps.executeBatch();
ps.clearBatch();
```

JDBC 中批处理需要在连接数据库的 url 中添加参数，如 jdbc:mysql://ip:3306/db_name`?rewriteBatchedStatements=true`，往往和 `PreparedStatement` 一起搭配使用，既可以减少编译次数，又减少了运行次数，效率大大提高。

### 数据库连接池

JDBC 传统连接数据库的方式，通过 DriverManager 来获取 Connection 并加入内存中，再验证 ip 地址，用户名和密码，每一次连接都需要消耗一定的资源，如果频繁的进行数据库操作，容易造成服务器崩溃。另外，每一次数据库连接结束后都得断开，不然容易导致内存泄漏。传统获取连接的方式，如果连接过多，也可能导致内存泄漏。

为了解决以上问题，可以使用数据连接池。

**预先在缓冲池中放入一定数量的连接，当需要建立数据库连接时，只需要从连接池中取出一个，使用完毕再放回去。**

数据库连接池负责分配，管理和释放数据库连接，它允许应用程序重复使用一个现有的数据库连接，而不是重新建立一个。当请求连接超过最大数量连接时，这些请求将被加入等待队列。

#### 连接池种类

- JDBC 的数据库连接池使用 javax.sql.DataSource，DataSource 只是一个接口，通常由第三方提供实现
- C3P0 数据库连接池，速度相对较慢，稳定性不错
- DBCP 数据库连接池，相对 c3p0 较快，但不稳定
- Proxool 数据库连接池，有监控连接池状态的功能，稳定性较 c3p0 差一点
- BoneCp 数据库连接池，速度快
- `Druid(德鲁伊)` 是阿里提供的数据库连接吃，集 DBCP，C3P0，Proxool 优点于一身的数据库连接池

### JavaBean

传统 ResultSet 的问题：

1. 关闭 connection 后，resultSet 结果集无法使用
2. resultSet 不利于数据的管理
3. 使用返回信息也不方便

因此，现在开发过程中，一般都会用 `JavaBean`/`POJO(plain old java object)`，来解决：`就是在Java中创建一个类，这个类的字段和数据库表的列一一对应`，并有对应的 getter/setter。再创建一个该类的 `ArrayList<JavaBean>`，这就是一个结果集的另一种存在形式。

一般也称为 domain 层。

### Apache-DBUtils

Apache-DBUtils 简化了上述编码的工作量。

### DAO （

**DAO （data access object）**是专门和数据库交互的，完成对数据库的 crud 操作。

Druid + DBUtils 简化了 JDBC 的开发，但是还有不足：

- SQL 语句是固定，不能通过参数传入，通用性不好，需要进行改进，更方便执行增删改查
- 对于 select 操作，如果有返回值，返回类型不能固定，需要使用泛型
- 将來的表很多，业务需求复杂，不可能只靠一个 Java 类完成

使用 DAO 层可以解决。

### 推荐阅读

- [深入理解 DAO，DTO，DO，VO，AO，BO，POJO，PO，Entity，Model，View 各个模型对象的概念](https://blog.csdn.net/SR02020/article/details/105821816)
