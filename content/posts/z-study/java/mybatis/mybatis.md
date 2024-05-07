---
title: 'mybatis'
date: 2023-12-12T19:30:05+08:00
lastmod:
tags: []
categories: [study notes]
draft: true
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
    InputStream is = Resources.getResourceAsStream("mybatis.xml"); // 第二个参数可以指定环境，详细看下面的配置文件教学
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

#### insert

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

#### select

update 和 delete 省略了，比较简单，着重看看 select 查询语句。

在 jdbc 时，查询出的结果集需要通过 while(rs.next()) 遍历出每一行，然后塞到一个 list 内。

mybatis 提供了两个 api，`selectOne` 和 `selectList`，

> 需要注意的是：mysql 中，字段默认是下划线命名，而 java 中一般是小驼峰，因此，sql 语句查询的时候需要 as 别名与实体类一一对应，并且在 `<bean id='id' resultType="全路径类名">`

```xml
<mapper namespace="xxx">
  <select id="queryUser" resultType="com.demo.mybatis">
    select
      id, user_face as userFace, ...
    from
      tb_user
  </select>
</mapper>
```

```java
// sqlSession.selectOne(beanId, params);
sqlSession.selectOne("queryUser", 007);
List<User> users = sqlSession.selectList("queryUsers"); // 很简单 不需要手动遍历了
```

##### namespace

mapper 上的 namespace 猜也能猜到是为了防止多个 bean 具有相同的 id 的问题了。

在 java 中就需要写全了：`namespace.beanId`

### mybatis 配置文件

- environments
  ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312181356370.png)
- transactionManager
  ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312201340544.png)
- dataSource
  ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312201339872.png)

  - 关于连接池配置参数，详细看文档，常用的就那几个，最大连接数量，超时时间，最大空闲数量等

- properties
  ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202312210923360.png)
  不过一般不会这么写，而是通过 `<property resource="">` 来加载类路径下的配置文件，或者通过 url 加载绝对路径下的配置文件。

- [mybatis 核心配置文件](https://www.bilibili.com/video/BV1JP4y1Z73S?p=24&spm_id_from=pageDriver&vd_source=fbca740e2a57caf4d6e7c18d1010346e)

---

### B 站课程

- [MyBatis 教学](https://www.bilibili.com/video/BV1JP4y1Z73S)
- [MyBatisPlus 教学](https://www.bilibili.com/video/BV1Xu411A7tL)
