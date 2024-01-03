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

### 用它

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

### 常用配置

[直接看官网，一般 ide 也会有提示建议的](https://baomidou.com/pages/56bac0/#%E5%9F%BA%E6%9C%AC%E9%85%8D%E7%BD%AE)

## 核心功能

### 条件语句

mp 的很多删改查的接口的参数为 `Wrapper<T>`，这个 Wrapper 就是用来构造条件 where 语句的。

关系如下：

`Wrapper -> AbstractWrapper :   
            1. QueryWrapper 2. UpdateWrapper 3. AbstractLambdaWrapper :   
                                                3.1 LambdaUpdateWrapper 3.2 LambdaQueryWrapper`

> LambdaXxx 是为了解决 sql 字符串硬编码的问题。UpdateWrapper 只有在 set 语句比较特殊的时候才会使用。

---

QueryWrapper demo:

```java
// query
// select id, username, balance from user where username like ? and balance >= ?
void test() {
  // 构建查询条件
  QueryWrapper<User> wrapper = new QueryWrapper<User>()
    .select("id", "username", "balance")
    .like("username", "o")
    .ge("balance", 1000)
  // 查询
  List<User> users = userMapper.selectList(wrapper);
  users.forEach(System.out::println);
}
// update
// update user set balance = 2000 where (username = "jack")
void test() {
  // 更新数据
  User user = new User();
  user.setBalance(2000);
  // 更新条件
  QueryWrapper<User> wrapper = new QueryWrapper<User>()
    .eq("username", "jack");
  // 更新
  userMapper.update(user, wrapper);
}
```

UpdaterWrapper demo: 给 id 为 1，2，4 的用户余额 -2000

```java
// update user set balance = balance - 2000 where id in (1,2,4);
// 这种情况，用queryWrapper就不太好处理
void test() {
  List<Long> ids = List.of(1L,2L,4L);
  UpdateWrapper<User> wrapper = new UpdateWrapper<User>()
    .setSql("balance = balance - 2000")
    .in("id", ids);
  userMapper.update(null, wrapper);
}
```

**推荐 Lambda**：

```java
// lambda 解决硬编码
void testLambda() {
  LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>()
    .select(User::getId, User::getUsername, User::getBalance)
    .like(User::getUsername, "o")
    .ge(User::getBalance, 1000);
  // 查询
  List<User> users = userMapper.selectList(wrapper);
  users.forEach(System.out::println);
}
```

### 自定义 sql

上方 UpdateWrapper 的一个问题是：setSql("balance = balance - 2000"); 属于直接在业务层写 sql 了，有些公司要求，只能在 xml 里写 sql，怎么办呢？

通过自定义 sql 方法 -- 用 mp 的 Wrapper 生成 where 条件（这更方便呀！），然后把 wrapper 传递到自定义的 sql 中。

```java
void test() {
  List<Long> ids = List.of(1L, 2L, 4L);
  int amount = 200;

  LambdaWrapper<User> wrapper = new LambdaWrapper<User>()
    .in(User::getId, ids);
  userMapper.updateBalanceByIds(wrapper, amount); // updateBalanceByIds 是在 UserMapper 内的自定义方法。
}

class UserMapper extends BaseMapper<User> {
  // 注意 这里 Constants.WRAPPER 为 "ew", wrapper的注解必须为这个！
  void updateBalanceByIds(@Param(Constants.WRAPPER) LambdaQueryWrapper<User> wrapper, @Param("amount") int amount);
}

// 最后自定义sql可以在 updateBalanceByIds 上用注解写，也可以在xml中写，如：
<Update id="updateBalanceByIds">
  Update user set balance = balance - #{amount} ${ew.customSqlSegment}
</Update>
```

### service 接口

在上面继承了 BaseMapper 后，增删改查都交给 mp 了。

mp 提供了 `IService` 接口和对应的实现类 `ServiceImpl`，以此来简化 service 层的 crud 操作（底层还是调用的 mapper）。

比如我们有自定义 UserService 接口，和 UserServiceImpl 实现类，一般都会让 UserService 继承 IService，再 UserServiceImpl 继承 ServiceImpl。

```java
// 1. 接口继承
public interface UserService extends IService<User>{}

// 2. 为了不实现所有方法直接继承 ServiceImpl
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {}
```

> IService 提供的 LambdaQuery 和 LambdaUpdate 平时更加常用于复杂的查询和更新。

剩下的就需要赶紧进行实操啦～～～
