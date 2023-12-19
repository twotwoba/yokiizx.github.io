---
title: 'mybatis'
date: 2023-12-12T19:30:05+08:00
lastmod:
tags: []
# series: [mybatis]
categories: [study notes]
# weight: 1
---

### MVC 和三层架构

- 著名 MVC 架构
  ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312121932695.png)
- 三层架构
  ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312122258621.png)

其中三层架构中的`表示层`就是 MVC 的 `Controller+View` 层；而 Service 业务逻辑层和 Dao 持久化层是 MVC 的 model 和 db 之间的层。

### ORM 思想

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312141810437.png)

### 入门基础

mybatis 中的两种重要配置文件

1. [mybatis-config].xml，这个文件用来核心配置，比如连接数据库信息

   ```java
    // 使用 mybatis io 自带的 Resources.getResourceAsStream() 接口来获取配置文件的输入流
    InputStream is = Resources.getResourceAsStream("mybatis.xml");
    // 底层就是 InputStream is = ClassLoader.getSystemClassLoader().getResourceAsStream("mybatis.xml")
    // 极简配置
    SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
    SqlSessionFactory sqlSessionFactory =  sqlSessionFactoryBuilder.build(is);
    // 开启会话（底层会开启事务）
    SqlSession sqlSession = sqlSessionFactory.openSession();
    // 执行sql语句
    int count = sqlSession.insert("insertUser"); // 配置sql xml 内语句的 id
    sqlSession.commit(); // 默认不是自动提交
   ```

2. [XxxMapper].xml，这个文件专门用来编写 sql 语句，一个表对应一个 xml

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312181356370.png)

> PS： resources 文件夹是类根目录。

---

##### insert

回顾一下 jdbc 的做法：

1. 获取 connection 对象，DriverManager.getConnection()
2. 获取 ps 对象 connection.prepareStatement(sql)
3. ps 执行操作

```java
// PreparedStatement
String sql = "insert into tb_name (columns...) values(null, ?,?,?,...)"; // 通过 ？占位
PreparedStatement ps = connection.prepareStatement(sql);
ps.setString("hello"); // 设置值
// ...
int count = preparedStatement.executeUpdate();
```

硬伤：sql 在代码中硬编码，而且很烦琐。

---

在 Mybatis 中通过 `#{}`来占位，括号内填入需要调用的 bean 的属性，底层还是要去调用 bean 对应属性的 getter 方法。

```xml
<!-- UserMapper.xml -->
<mapper namespace="">
  <!-- crud -->
  <insert id="insertUser">
    insert into tb_name(columns...) values(null, #{id}, #{name},...);
  </insert>
</mapper>
```

```java
// sqlSession可以封装一个工具类来简化操作

SqlSession sqlSession = SqlSessionUtil.openSession();

// sqlSession.insert(id, Map);
// 第一个参数为 xml 中 sql 的id，第二个参数最原始的做法是创建个 Map， map put的key与表字段一一对应。
/* ---------- 在平时开发中，一般创建实体类来与表一一对应 ---------- */

User user = new User(007, "Tom");

sqlSession.insert("insertUser", user);

sqlSession.commit();
sqlSession.close();

// UserDo 实体类
class UserDao {
  private Long id;
  private String name;

  getter
  setter

  constructor
  toString
}
```

### B 站课程

- [MyBatis 教学](https://www.bilibili.com/video/BV1JP4y1Z73S)
- [MyBatisPlus 教学](https://www.bilibili.com/video/BV1Xu411A7tL)
