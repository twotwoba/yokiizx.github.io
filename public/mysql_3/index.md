# Mysql_3_视图和管理


## 视图

### 基本概念

MySQL 中的视图是虚拟的表，是基于 SELECT 查询结果的表。视图包含行和列，就像一个真实的表一样，但实际上并不存储任何数据。视图的数据是从基本表中检索出来的，每当使用视图时，都会动态地检索基本表中的数据。

视图的使用可以简化复杂的查询操作，隐藏基本表的复杂性，提供安全性和简化权限管理。视图还可以用于重用 SQL 查询，减少重复编写相同的查询语句。

基本语法如下：

```sql
# 创建
CREATE VIEW view_name AS
SELECT 语句

# 删除
DROP VIEW view_name;

# 改
alter vie view_name as
select 语句

# 查
show create view view_name
```

创建视图后，可以像操作普通表一样使用视图。

注意：修改基表和视图，会互相影响。

### 最佳实践

- 安全：一些数据表的重要信息，有些字段保密，不能让用户直接看到，就可以创建视图只保留部分字段。
- 性能：关系数据库的数据通常会分表存储，使用外键建立这些表之间的关系。这样做不但麻烦，而且效率相对较低，如果建立一个视图，将相关的表和字段组合在一起，就可以避免使用 join 查询数据。
- 灵活：如果有一张旧表，由于设计问题，需要废弃，然而很多应用基于这张表，不易修改。就可以建立一张视图，视图中的数据直接映射新建的表。这样既轻改动，又升级了数据表。

## 管理

当做项目开发时，需要根据不同的开发人员，赋予相应的 mysql 权限。

### 用户管理

一个 DBMS 的用户都存储在系统数据库 mysql 的 user 表中。

user 表中重要的三个字段：

- `host`, 允许登陆的位置，localhost -- 本机登陆；可以指定 ip
- `user`, 用户名
- `authentication_string`，密码，通过 PASSWORD() 机密过的

```sql
# 创建用户
create user 'user_name'@'host' identified by 'password_str'
# 删除用户
drop user 'user_name'@'host'
# 修改自己密码
set password = PASSWORD('ps_str')
# 修改别人密码
set password for 'user_name'@'host'  = PASSWORD('ps_str')
```

### 权限管理

#### 常用权限

| 权限字段   | 意义                                 |
| ---------- | ------------------------------------ |
| SELECT     | 允许用户读取数据库中的数据           |
| INSERT     | 允许用户向数据库中的表中插入新的行   |
| UPDATE     | 允许用户修改数据库中表中已有的行     |
| DELETE     | 允许用户删除数据库中表中的行         |
| CREATE     | 允许用户创建新的数据库或表           |
| DROP       | 允许用户删除数据库或表               |
| ALTER      | 允许用户修改数据库或表的结构         |
| GRANT      | 允许用户授予或撤销权限给其他用户     |
| REFERENCES | 允许用户定义外键                     |
| INDEX      | 允许用户创建或删除索引               |
| ALL        | 允许用户执行所有权限操作             |
| USAGE      | 允许用户登录到服务器，但没有其他权限 |

#### 基本操作

```sql
# 赋予权限
grant 权限1[,权限2,...] on 库.对象名 to 'user_name'@'host' [identified by 'ps_str']
# 如果 没有指定host则为 %，表示所有ip都有连接权限

# 赋予该用户所有权限
grant all on 库.对象名 to 'user_name'@'host'
# 回收用户权限
revoke 权限1[,权限2,...] on 库.对象名 from 'user_name'@'host'

# 刷新
flush privileges
```

- 对象名：表，视图，存储过程
- 这里的 identified by，如果用户存在，则修改了用户的密码，如果用户不存在则创建了该用户
- 特别的：
  - `*.*` 代表本系统中的所有数据库的所有对象
  - `库.*` 代表某个数据库中的所有数据对象

