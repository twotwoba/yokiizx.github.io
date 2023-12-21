---
title: 'mybatis-plus'
date: 2023-12-21T13:27:55+08:00
lastmod:
tags: []
# series: [mybatis]
categories: [study notes]
# weight: 1
---

mybatis 写 sql 的时候仍然有一些不便，mybatis-plus 对它进行了增强。

## 入门

### 简单两步

简单两步骤：

1. pom.xml 引入 mp 的依赖，可以去 maven 官网查
2. 接口 xxxMapper 继承 mp 提供的 BaseMapper<T>，即可完成简单的 crud。

```java
public interface UserMapper extends BaseMapper<User> {
  /**
   *  1. BaseMapper 是 mp 提供的，内置了基础的crud
   *  2. BaseMapper<T>  的泛型得是要操作的 实体类
   */
}
```

#### 实体类的约定

mp 基于反射获取实体类信息作为数据表信息

```java
@Data
public class User {          // 类名 驼峰转下划线 作为表名
  private Long id;           // 名为 id 的字段作为 主键
  private String username;
  private String password;
  private String workStatus; // 变量名 驼峰转下划线 作为表的字段名
  private boolean isMan;     // is 开头命名的布尔变量在 mp 中是特殊的，比如这里会被解析为 man
}
```

### 注解

上述两步就能搞定与数据库打交道的前提是遵守了 mp 的约定，当与约定冲突的时候，就需要注解来辅助了。

#### 常用注解

全部注解在 mp 的官网是可以看到的，这里先学习 3 个常用的注解。 [全部注解](https://baomidou.com/pages/223848/)。

- @TableName()，指定表名
- @TableId()，指定主键
- @@TableField()，指定表字段。
  - 成员变量名与数据库字段名不一致
  - 成员变量名以 is 开头，且是布尔值
  - 成员变量名与数据库关键字冲突
  - 成员变量不是数据库字段

```java
@Data
@TableName("sys_user")
public class User {
  // AUTO：数据库自增长;
  // INPUT：通过set方法自行输入;
  // ASSIGN_ID ：mp 分配ID，接口ldentifierGenerator的方法nextld来生成id，默认实现类为DefaultldentifierGenerator雪花算法
  @TableId(value="id", type=IdType.AUTO) 
  private Long id;
  private String username;
  private String password;
  @TableField(exists=false) // 表中不存在
  private String workStatus;
  @TableField("isMan")
  private boolean isMan;
}
```
