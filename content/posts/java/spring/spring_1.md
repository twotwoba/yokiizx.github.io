---
title: 'spring_1'
date: 2023-12-15T09:34:51+08:00
lastmod:
tags: []
categories: [study notes]
draft: true
---

### 核心

spring 是一个轻量级的开源框架
spring 是为了解决企业级应用开发业务逻辑层和其他各层耦合的问题
spring 是一个 IOC 和 AOP 的容器框架。容器：包含并管理应用对象的生命周期。

---

spring 的两大核心是：

- **控制反转（Inversion of Control，IOC）**
- **面向切面编程（aspect- oriented programming，AOP）**

---

#### IOC

> IOC 与大家熟知的**依赖注入**同理，指的是对象仅通过构造函数参数、工厂方法的参数或在对象实例构造以后或从工厂方法返回以后，在对象实例上设置的属性来定义它们的依赖关系（即它们使用的其他对象). 然后容器在创建 bean 时注入这些需要的依赖。 这个过程基本上是 bean 本身的逆过程（因此称为 IOC），通过使用类的直接构造或服务定位器模式等机制来控制其依赖项的实例化或位置。

简单讲，IOC 是一种思想，把设计好的对象交给容器控制，而不是显式地用代码创建对象。

把创建和查找依赖对象的控制权交给 IOC 容器，由 IoC 容器进行注入、组合对象之间的关系。这样对象与对象之间是松耦合、功能可复用（减少对象的创建和内存消耗），使得程序的整个体系结构可维护性、灵活性、扩展性变高。所谓 IOC，就简短一句话：**对象由 spring 来创建、管理，装配！**

##### 设计五大原则 (solid)

1. 单一职责原则（Single Responsibility Principle，SRP）：一个类应该只有一个引起它变化的原因。换句话说，一个类应该只负责一种功能。
2. 开放封闭原则（Open-Closed Principle，OCP）：软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。这意味着当需要添加新的功能时，不应该修改现有的代码，而是通过扩展来实现。
3. 里氏替换原则（Liskov Substitution Principle，LSP）：子类应该能够替换其父类并出现在父类能够出现的任何地方，而不引起任何错误或异常。
4. 接口隔离原则（Interface Segregation Principle，ISP）：客户端不应该被迫依赖它们不使用的接口。这意味着应该创建多个特定于客户端的接口，而不是一个大而全的接口。
   - 人话 1：这个原则的目的是把大接口替换为多个小接口，更加专一。
   - 人话 2：这个原则的前提是模块间不要使用类强耦合，而是使用接口进行分离
5. 依赖倒置原则（Dependency Inversion Principle，DIP）：高层模块不应该依赖于低层模块，二者都应该依赖于抽象。抽象不应该依赖于细节，细节应该依赖于抽象。

> IOC 就是接口隔离原则和依赖倒置原则的最佳实践。

举例：电脑，鼠标。

- 如果类与类之间强耦合，那就等于是把鼠标和电脑焊死了～
- 如果用的是那种 ps/2 的接口，电脑鼠标是分离了，但是不能热插拔～
- 所以最佳使用 usb 接口。电脑为上层，鼠标为下层，下层依赖上层，而不是上层依赖下层，控制反转

##### IOC 引入方式

- 入门学习：导入 jar 包 + `xml`
- 一般配置：maven + `注解 + xml`
- 高阶方式：springboot + `javaconfig`

> 关于 Maven 配置参考：[1. Maven 之配置文件](https://www.jianshu.com/p/06f73e8cbf78)，[2. Maven 配置多仓库的方法](https://www.jianshu.com/p/06f73e8cbf78)

##### 未使用 IOC 的分层

按照 实体类 --> (controller 层 --> service 层 --> dao 层)(括号部分反过来也 ok) 的顺序编写代码，看个人习惯。

- 实体类

```java
public class UserDO {
    private Integer id;
    private String Username;

    public Integer getId() {
        return id;
    }

    public String getUsername() {
        System.out.println("查询 mysql 数据库");
        return Username;
    }

    @Override
    public String toString() {
        return "UserDO{" +
                "id=" + id +
                ", Username='" + Username + '\'' +
                '}';
    }
}
```

- dao 持久层，查询数据库

```java
// 接口
public interface IUserDao {
    String getUser();
}
// 实现
public class UserDaoImpl implements IUserDao {
    @Override
    public String getUser() {
        // Dao层 模拟查询数据库
        System.out.println("查询数据库～");
        return "mysql";
    }
}
```

- service 层调用 dao 层

```java
public class UserServiceImpl implements IUserService {

    IUserDao userDao = new UserDaoImpl();

    @Override
    public String getUser() {
        return userDao.getUser();
    }
}
```

- controller 层调用 service 层，这里就简单测试一下代码

```java
public class Test {
    public static void main(String[] args) {
        UserServiceImpl userService = new UserServiceImpl();
        String user = userService.getUser();
        System.out.println("user" + user);
    }
}
```

> controller 调用 service，service 调用 dao，实现了分层，但是，上述代码调用过程中，是把对象实例化到上层中的，造成代码强耦合！一旦代码逻辑变动，需要修改到实例对象，那么有多少个地方引用，就得改多少个地方，非常繁琐。

举例：

```java
// 假如换了数据库查询，那么重新写个实体类
public class UserDaoOracleImpl implements IUserDao {
    @Override
    public String getUser() {
        System.out.println("查询数据库");
        return "oracle";
    }
}
// 之前的  service 层对 dao 的调用就得调整
// IUserDao userDao = new UserDaoImpl();  // new UserDaoImpl() --> new UserDaoOracleImpl()
```

---

##### 使用 IOC 后

- 在 resource 目录下创建 spring.xml 配置文件

```xml
<!-- default 文件 -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
      <!-- TODO -->
</beans>
```

- 把 UserDaoImpl、UserServiceImpl (再 spring 中称为 bean) 进行分离

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean class="Dao.impl.UserDaoImpl" id="userDao"></bean>
    <bean class="service.impl.UserServiceImpl" id="userService"></bean>

</beans>
```

- 实例化对象的方式 --> 改为注入的方式，xml 配置的 bean 需要同步设置 getter/setter

```java
// IUserDao userDao = new UserDaoImpl(); // 替换为：
public IUserDao getDao() {
    return dao;
}

public void setDao(IUserDao dao) {
    this.dao = dao;
}

IUserDao dao; // 与 property name 对应
```

- spring.xml 通过配置 bean 实现 IOC，还需要设置 property 依赖注入：

```xml
<bean class="Dao.impl.UserDaoImpl" id="userDao"></bean>
<bean class="service.impl.UserServiceImpl" id="userService">
    <property name="dao" ref="userDao"></property>
</bean>
```

- 最后需要再 controller 中加载 spring 上下文，加载 ioc 容器

```java
// 加载spring上下文，加载ioc容器
ApplicationContext ioc = new ClassPathXmlApplicationContext("spring.xml");
IUserService service = ioc.getBean(IUserService.class);
String user = service.getUser();
System.out.println("user" + user);
```

完成。

这样的好处是，当需要修改 UserDaoImpl 时，直接修改 bean 即可，比如 `<bean class="Dao.impl.UserDaoOracleImpl" id="userDao"></bean>`，就很灵活。
