# Mysql_1_基础


## 安装

本人 m1 的 mac，[下载地址](https://downloads.mysql.com/archives/community/)，选择合适自己的版本下载安装。

> 据说 mysql5.x 的版本比较稳定，比如 5.7，很多公司在用；那我现在的公司使用的是 8.x 的版本，而且有 arm 版。

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202311301709918.png)

## 起停

```shell
# 基本命令
sudo /usr/local/mysql/support-files/mysql.server start
sudo /usr/local/mysql/support-files/mysql.server restart
sudo /usr/local/mysql/support-files/mysql.server stop
sudo /usr/local/mysql/support-files/mysql.server status # 查看状态
```

环境配置，简化命令:

```shell
# .zshrc
export MYSQL_HOME=/usr/local/mysql
export PATH=$MYSQL_HOME/support-files:$MYSQL_HOME/bin:$PATH # 按需配置

sudo mysql.server start
sudo mysql.server restart
sudo mysql.server stop
```

## 登录

```shell
# 登录
mysql [-h 主机] [-P 端口] -u 用户 -p 密码 # mysql 端口默认 3306
# 退出
exit
```

也可使用图形化软件进行连接，我选择了 `DataGrip`，当然也可以使用 `navicat`。

### Access denied for user 'root'@'localhost'

解决办法：

```shell
# 1. 先停止服务
sudo mysql.server stop
# 2. 进入 mysql 二进制执行文件目录
cd /usr/local/mysql/
# 3. 获取管理员权限
sudo su
# 4. 输入 ./mysqld_safe --skip-grant-tables &  然后回车，禁止mysql验证功能，mysql会自动重启
# 5. cmd + T 新开 tab，并登录
mysql -u root -p
```

## mysql 的三层结构

- DBMS（database manage system）
- db，dbms 下可以用有个 db
- table，db 下可以有多个 table

> 普通的表本质是真真实实的文件。

## sql 语句分类

- DDL，data definition language，数据定义语句，[create，alter 表，库...]
- DML，data manipulation language，数据操纵语句，[insert, update, delete]
- DQL，data query language，数据查询语句 [select]
- DCL，data control language，数据控制语句 [管理数据库，grant，revoke]

> 注意，在 mysql 的控制台环境下语句要以分号 `;` 结尾

### 数据库

```sql
# 创建
CREATE DATABASE [IF NOT EXISTS] db_name [CHARACTER SET charset_name] [COLLATE collation_name]
# 使用
use db_name
# 删除
DROP DATABASE [IF EXISTS] db_name
# 查看所有数据库
SHOW DATABASES

# 查看数据库创建时的语句
SHOW CREATE DATABASE db_name
```

1. 为了规避关键字，可以使用反引号包裹 `db_name`
2. IF NOT EXISTS，如果加上了，当创建 db 的时候如果已经存在，就不会创建也不报错，如果没有加上则会报错
3. 字符集 charset_name 默认为 utf8
4. 校对规则 collation_name 默认为 utf8_general_ci(不区分大小写)；还有 utf8_bin(区分大小写)等
5. 当创建表时没有指定字符集和校对规则，就会默认使用数据库上的配置

#### 备份数据库

```sql
# 备份
mysqldump -u root -p -B <db_1> [db_2] ... > <target_path/xxx.sql>
mysqldump -u root -p <db_1> [table_1] ... > <target_path/xxx.sql> # 不用 -B 可以指定数据库下的表
# 还原, 进入 mysql 命令行
source target_path/xxx.sql
```

### 表

```sql
# 创建 字符集和校对规则不指定就默认使用数据库的
CREATE TABLE tb_name (filed dataType, ...)  [CHARACTER SET charset_name] [COLLATE collation_name] ENGINE 存储引擎
# 复制表结构
CREATE TABLE tb_name LIKE source_tb_name

# 删除
DROP TABLE tab_name

# 修改
## 修改表名
RENAME TABLE old_tb_name TO new_tb_name
## 修改字符集
ALTER TABLE tb_name Character set 字符集
## 新增列
ALTER TABLE tb_name ADD (col_name col_type [DEFAULT expr], ...) [AFTER col_name]
## 修改列
ALTER TABLE tb_name MODIFY (col_name col_type [DEFAULT expr], ...)
## 修改列名
ALTER TABLE tb_name CHANGE [column] old_col_name new_col_name new_col_type
## 删除列
ALTER TABLE tb_name DROP (col_name, ...)

# 查看表结构
DESC tb_name [-- 指定列]
```

修改列属性可以用 modify，但是修改列名只能用 change。

#### 常用数据类型

| 分类       | 数据类型                          | 说明                                                                           |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------ |
| 数值类型   | BIT(M)                            | 位类型，M 指定位数，默认为 1，范围 1 ～ 64。                                   |
|            | TINYINT 1 个字节 (boolean)        | 无符号：[0,2 ** 8-1]，有符号：[-2 ** 7，2 ** 7-1]，默认有符号                  |
|            | SMALLINT 2 个字节                 | 无符号：[0,2 ** 16-1]，有符号：[-2 ** 15，2 ** 15-1]                           |
|            | MEDIUMINT 3 个字节                | 无符号：[0,2 ** 24-1]，有符号：[-2 ** 23，2 ** 23-1]                           |
|            | INT 4 个字节                      | 无符号：[0,2 ** 32-1]，有符号：[-2 ** 31，2 ** 31-1]                           |
|            | BIGINT 8 个字节                   | 无符号：[0,2 ** 64-1]，有符号：[-2 ** 63，2 ** 63-1]                           |
|            |                                   |                                                                                |
|            | FLOAT 4 个字节                    |                                                                                |
|            | DOUBLE 8 个字节                   |                                                                                |
|            | DECIMAL(M,D)，m 默认 10，d 默认 0 | M 指定长度，D 指定小数点后面的位数 ，M 最大 65，D 最大 30                      |
| ---------- | ----------                        | ----------                                                                     |
| 文本类型   | CHAR(size)                        | 固定长度字符串，最大为 255 个`字符`                                            |
|            | VARCHAR(size)                     | 可变长度字符串，最大 65535 （2\*\*16-1） 个`字节`，使用 1-3 个字节记录内容长度 |
|            | TEXT                              | 2\*\*16-1 个字节                                                               |
|            | LONGTEXT                          | 2\*\*32-1 个字节                                                               |
| ---------- | ----------                        | ----------                                                                     |
| 时间日期   | DATE                              | 日期                                                                           |
|            | TIME                              | 时间                                                                           |
|            | DATETIME                          | 日期+时间                                                                      |
|            | TIMESTAMP                         | 可以自动记录 UPDATE，INSERT 的时间                                             |
| ---------- | ----------                        | ----------                                                                     |
| 二进制类型 | BLOB                              | 2\*\*16-1 个字节                                                               |
|            | LONGBLOB                          | 2\*\*32-1 个字节                                                               |

##### 数值类型设置无符号

创建时在类型后添加 `unsigned` 关键字。

##### char 和 varchar

首先，char(size) 和 varchar(size)里的 size，都是指 `字符的长度`，最大的区别是一个固定字符长度就确定了空间大小，一个是根据实际使用大小来确定的。

    - char的size最大字符数为255，定长的使用场景，比如手机号，身份证号码等
    - varchar的size最大字符数不一定，需要根据字符集来确定。比如utf8下最大字符数为 21844，
    因为一个汉字3个字节，最大字节为 2**16-1 = 65535，再减去用于记录大小的 3 个字节，（65535-3）/3 = 21844.

查询速度 char > varchar

##### varchar 和 text

两种数据类型共享的最大长度为 65,535 个字符，但仍然存在一些差异：

1. VARCHAR 中的 VAR 表示您可以将最大大小设置为 1 到 65,535 之间的任何值。 TEXT 字段的最大固定大小为 65,535 个字符。
2. VARCHAR 可以是索引的一部分，而 TEXT 字段要求您指定前缀长度，该长度可以是索引的一部分。
3. VARCHAR 与表内联存储（至少对于 MyISAM 存储引擎而言），因此在大小合理时可能会更快。当然，快得多少取决于您的数据和硬件。同时，TEXT 存储在表外，该表具有指向实际存储位置的指针。
4. 排序使用 TEXT 列将需要使用基于磁盘的临时表作为 MEMORY（HEAP）存储引擎。

##### datetime 和 timestamp

创建 timestamp 时添加 `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`，会自动初始化和更新，比如当行发生改变的时候就会自动更新

> 从 MySQL 5.6.5 开始，Automatic Initialization and Updating 同时适用于 TIMESTAMP 和 DATETIME，且不限制数量。

timestamp 客户端插入的时间从当前时区转化为 UTC（世界标准时间）进行存储。查询时，将其又转化为客户端当前时区进行返回，所以更适合跨时区业务。
DATETIME，不做任何改变，基本上是原样输入和输出。

timestamp 所能存储的时间范围为：'1970-01-01 00:00:01.000000' 到 '2038-01-19 03:14:07.999999'。
datetime 所能存储的时间范围为：'1000-01-01 00:00:00.000000' 到 '9999-12-31 23:59:59.999999'。

---

### 插入语句

```sql
INSERT INTO tb_name [col_1,col_2,...] values (val1, val2,...) [,(...),(...)] # 中括号内为可选插入多条数据
```

> 1. 当插入一整条数据时，列名可以省略。无论什么时候，value 值都得和列名一一对应。
> 2. 字符和日期型数据应包含在单引号中。

### 更新语句

```sql
UPDATE tb_name SET col_name=expr[,col_name2=expr2,...] [WHERE condition]
```

> 没有指定 WHERE 子句，则更新对应列的所有行

### delete 语句

```sql
DELETE FROM tb_name [WHERE condition]
```

> 没有指定 WHERE 子句，MySQL 表中的所有记录将被删除

### 【核心】select 语句

```sql
# 基础
SELECT [DISTINCT] *｜col_name,col_name... FROM tb_name [alias_tb_name]  [WHERE condition] [order by col_name]
```

- `DISTINCT`，加上后对查询结果 去重
- 查询的列也可以为表达式并且可以赋予别名，比如 `select (col1 + col2 + col3) as score from tb_name`，这里的 score 可以在后面的 where 等子句中使用
- `ORDER BY`，默认为 ASC，可选 DESC
- `WHERE` 子句常用
  - 模糊查询使用百分号：比如 LIKE 'key%' 就是查开头为 key 的字符  
    `%` 匹配 0~n 个字符；`_` 匹配单个字符
  - 比较运算符：<,>,<=,=>,=,!=, BETWEEN...AND...,IN(a,b,c...), LIKE, NOT LIKE, IS NULL; 逻辑运算符： AND，OR，NOT
- 分组统计，`GROUP BY ... HAVING ...`，having 可以看成是 group by 的专属过滤语句

> [MySQL 的表达式计算、运算符（算术/比较/逻辑/位）、类型转换、MySQL 如何处理无效数据值](https://blog.csdn.net/qq_41453285/article/details/88055683)

#### 分页查询

```sql
SELECT * FROM tb_name LIMIT start,rows # 从 start + 1 行处开始，取 rows 行;
```

几个关键字顺序

`group by, having, order by, limit`

---

> 下面学习一些常用的系统函数，**只记录部分**，完整的还得去查手册～

#### 统计函数

```sql
# 返回行总数
SELECT count(*) | count(col_name) FROM tb_name [WHERE condition]
# 其他常用统计函数
SELECT SUM(col)|AVG(col)|MAX(col)|MIN(col) FROM tb_name
```

> count(列) 会排除值为 null 的行

#### 字符串相关函数

```sql
SELECT CHARSET(col) FROM tb_name # 返回字符集
SELECT CONCAT(col|str, ...) FROM tb_name # 字符串拼接
SELECT UCASE/LCASE(col|str) FROM tb_name # 大小写
SELECT LENGTH(col|str) FROM tb_name # 返回字符的 **字节** 长度
SELECT SUBSTRING(col|str, position, [length]) FROM tb_name # 从 str 的 position 位置开始取 length 个字符
SELECT TRIM(col|str, position, [length]) FROM tb_name # 去除首尾空格
```

#### 数值函数

```sql
ABS(num)
CEILING(num)
FLOOR(num)
FORMAT(num, decimal_places) # decimal_places 保留小数位数
MOD(num1,num2)
RAND([seed]) # 随机一个浮点值 [0, 1.0]，seed种子，用来产生一样的随机值
```

#### 日期函数

```sql
current_date()
current_time()
current_timestamp()

NOW() # 当前时间

YEAR|MONTH|DAY|DATE(datetime) # 返回对应的日期部分
DATE_ADD(date, INTERVAL val UNIT) # date 上添加日期
DATE_SUB(date, INTERVAL val UNIT) # date 上减去日期

DATEDIFF(date1, date2) # 两个日期差多少天 date1-date2
TIMEDIFF(datetime1, datetime2) # 比较到秒
UNIX_TIMESTAMP() # 1970-1-1到现在的时间戳
FROM_UNIXTIME(timestamp [,format]) # 格式化时间戳
```

formatter 说明：

```text
%M 月名字(January～December)
%W 星期名字(Sunday～Saturday)
%D 有英语前缀的月份的日期(1st, 2nd, 3rd, 等等。）
%Y 年, 数字, 4 位
%y 年, 数字, 2 位
%a 缩写的星期名字(Sun～Sat)
%d 月份中的天数, 数字(00～31)
%e 月份中的天数, 数字(0～31)
%m 月, 数字(01～12)
%c 月, 数字(1～12)
%b 缩写的月份名字(Jan～Dec)
%j 一年中的天数(001～366)
%H 小时(00～23)
%k 小时(0～23)
%h 小时(01～12)
%I 小时(01～12)
%l 小时(1～12)
%i 分钟, 数字(00～59)
%r 时间,12 小时(hh:mm:ss [AP]M)
%T 时间,24 小时(hh:mm:ss)
%S 秒(00～59)
%s 秒(00～59)
%p AM或PM
%w 一个星期中的天数(0=Sunday ～6=Saturday ）
%U 星期(0～52), 这里星期天是星期的第一天
%u 星期(0～52), 这里星期一是星期的第一天
%% 一个文字%
```

> 实际上，`NOW` 和 `CURRENT_TIMESTAMP` 没有任何区别，他们都表示的是 SQL 开始执行时的系统时间；而 `SYSDATE` 则表示执行此函数时的系统时间。

#### 流程控制函数

```sql
IF(expr1, expr2, expr3) # 等价于js的 expr1 ？ expr2 ： expr3
IFNULL(expr1, expr2) # expr1 === null ? expr2 : expr1
# sql 的 if...else...
SELECT CASE
          WHEN expr1 then expr2
          WHEN expr3 then expr4
          ELSE expr5 END
```

#### 加密和系统函数

```sql
USER() # 查询用户
DATABASE() # 查询数据库
PASSWORD(str) # 从原文密码str 计算并返回密码字符串，通常用于对mysql，数据库的用户密码加密
```

### 多表查询

#### 笛卡尔集

当查询多表时，默认返回结果是 `表1的行 * 表2的行 * ...` 的乘积的集合，称为 `笛卡尔集`。

```sql
# 举例，查询emp和dept两张表，根据deptno相等来过滤笛卡尔集
select * from emp, dept where emp.deptno = dept.deptno;
# 当指定查询过滤条件列deptno的时候，必须指定出是哪张表的列
select id, emp.deptno from emp, dept where emp.deptno = dept.deptno;
```

> 过滤笛卡尔集的 where 筛选条件，`不能少于表的数量-1`，否则会出现笛卡尔集

#### 自连接

当需要查询的两列数据在一张表中，比如员工和自己的领导，那么就需要自连接来实现多表查询的功能了。

```sql
select worker.name as '打工人', boss.name as '领导'
from emp worker, emp boss where worker.mgr = boss.id;
```

> 自连接需要给 表取别名，为了明确，最好给列也取上别名

#### 子查询

子查询是指嵌入在其他 sql 语句中的 select 语句，也叫嵌套查询。

- 单行子查询，只返回一行数据的子查询语句
- 多行子查询，返回多行数据的子查询，使用关键字 `in`

> 子查询可以当作临时表使用，这点很有用

##### all 操作符 和 any 操作符

注意： 这里 返回的都是单个列

```sql
# all 和 js中的every很像
select emp.name, emp.sal
from emp where sal > all(select sal from emp where emp.deptno = 30);
# any 和 js中的some很像
select emp.name, emp.sal
from emp where sal > any(select sal from emp where emp.deptno = 30);
```

##### 多列子查询

多列匹配查询

```sql
# 查询出部门和岗位与某人相同的其他员工
select id, name
from emp where (deptno, job) = (select deptno, job from emp where name = 'SMITH') and name <> 'SMITH';
```

#### 表复制

表自我复制场景：有时为了对 sql 语句进行效率测试，就需要海量数据，就需要 `蠕虫复制`。

```sql
# 迁移表的操作
INSERT INTO target_tb
            (col1s...)
            SELECT (col2s...) from source_tb; # col1s和col2s要一一对应
# 自我复制
INSERT INTO tb_name SELECT * FROM tb_name # 执行多次，指数级复制
```

#### 合并查询

- union，简单的把查询出来的结果合并，并去重
- union all，相比 union 不会去重

> 合并查询的列的数量要一致

#### 外连接

上方过滤笛卡尔集的多表查询，查出来的都是匹配上的数据。  
假如说需要一张表上没有匹配上的数据也显示出来（只不过为 null 嘛），就需要外连接来完成了。

- 左外连接，左侧的表完全显示 `tb1 LEFT JOIN tb2 on condition`
- 右外连接，右侧的表完全显示 `tb1 RIGHT JOIN tb2 on condition`

举例：

```sql
select * from emp left join dept on emp.deptno = dept.deptno;
```

### mysql 约束 (constraint)

约束，用于确保数据库的数据满足特定的商业规则。mysql 中有 5 种约束：

- not null
- unique
- primary key
- foreign key
- check

#### 主键 (primary key)

```sql
# 创建表设置主键
create table tb_name (col1 col1_type primary key, ...);
# 第二种方式，通过这种方式创建多个列为主键就是 联合主键。
create table tb_name (col1 col1_type, col2 col2type, ..., primary key(col1 [, col2]));

# 修改表某列为主键
alter table tb_name add primary key (col_name);
```

> 主键默认不能为 null，且不能重复，一个表最多只能有一个主键，但是可以使用复合组件

#### not null

```sql
# 修改表某列为非空
alter table tb_name modify col_name col_type not null
```

#### unique

列不可以重复，但是如果没有指定 not null，那么可以有多个 null

```sql
alter table tb_name modify col_name col_type unique
```

#### foreign key 外键

外键用来定义主表和从表的关系：`外键约束要定义在从表上，主表则必须具有主键约束或 unique  约束`。

```sql
# 在从表上设置外键
create table tb_name (col_name col_type,
                      ....,
                      FOREIGN KEY (从表col_name) REFERENCES 主表名(主表主键名或unique字段名));
```

注意：

- 从表中指定外键的值必须在主表上关联的列存在；主表上被外键关联的列在从表有对应关联时，不能删除。
- 表的类型是 `innodb` 才支持外键。
- 外键字段类型要和主键字段类型一致（长度可以不同）
- 外键字段的值必须在主键字段中出现过，或者为 null（可以为 null 时）

#### check

> mysql8.0.16 之后 真正的实现了 check 约束。在此之前只做语法校验，但不会生效。

```sql
create table check_demo (id int, gender boolean check ( gender in (0, 1)));

# gender 值 只能为 0 或 1， 插入其他会报错
insert into check_demo values (1, 0),(2,1);
```

### 自增长

一般来说 自增长 和 主键 配合使用(单独使用需要配合 unique)：

```sql
create table tb_name (col1 col1_type primary key auto_increment, ...);

# 插入数据的时候，自增长的字段填null即可
insert into tb_name values(null, col2, ....);

# 修改开始值 (默认从1开始)
alter table tb_name auto_increment = num;
```

