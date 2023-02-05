---
title: 'Shell 基础'
date: 2022-12-01T11:31:39+08:00
tags: [mac, linux, engineer]
---

## 前言

补齐一下计算机的短板，抽时间学习一下 shell 的基础知识。

## 笔记

1. 脚本执行

shell 脚本 xxx.sh 以.sh 结尾，此类文件执行方式有两种：

- 文件头使用 `#!` 指定 shell 程序，比如 `#! /bin/zsh`，然后带上目录执行 `./demo.sh`
- 直接命令行中指定 shell 程序，比如 `/bin/zsh demo.sh`

> 注意第一种方式，不能直接 `dmeo.sh`，得使用 `./demo.sh`，是因为这样系统会直接去 PATH 里寻找有没有叫 demo.sh 的，而 PATH 里一般只有 `/bin`,`/sbin`,`/usr/bin`,`/usr/sbin`。

另外 .sh 脚本文件执行时如果出现 `permission denied` 是因为没有权限，`chmod +x [文件路径]` 即可。

```sh
# 比如 demo.sh 文件内容如下
# ------------------------
#! /bin/zsh
echo "hello world"

# 执行两步走
chmod +x demo.sh
./demo.sh

# 如果是如下执行，内文件内的 第一行#！xxx 是无效的，写了也没用
/bin/zsh demo.sh
```

2. 变量

```sh
# 声明
variable_name='demo'
readonly variable_name # 只读变量
# 使用
$variable_name # 可以加上{}来确认边界 ${variable_name}
# 删除变量
unset variable_name # 不能删除只读变量
```

3. 字符串

```sh
# 单引号
str='hello world' # 单引号中变量是无效的
# 双引号
str="hello $world" # 可以识别变量

# 字符串长度
${#str}
# 字符串查找
$str[(I)ll] # 小i 从左往右 找不到返回 长度+1
$str[(i)ll] # 大i 从右往左 找不到返回 0
# 提取字符串
${str:1:4} # 与js的subStr类似 1为索引,4为长度
$str[1,4]  # 这个都是索引(注意是从第一位开始) 推荐这个吧

# 遍历
for i ({1..$#str}) {
  #...eg. echo $str[i]
}
```

4. 数组

```sh
# 定义
array_name=(value0 value1 value2 value3)
# 读取
${array_name[下标]} # 下标从 1 开始 @ 为获取所有
# 获取长度
${#array_name[@]}

#  我个人习惯可能不带 {} 舒服点... 需要区分边界再加上吧
```

5. 关联数组

```sh
declare -A site
site["google"]="www.google.com"
site["runoob"]="www.runoob.com"
site["taobao"]="www.taobao.com"
```

6. 给脚本传递参数

```sh
# 入参 用空格隔开
./demo.sh [param1 param2 param3 ...]

# 文件内用参，使用 $ 符号，数字表示第几个
# 常用的几个特殊的
# $0 表示 执行的文件名
# $* 用一个字符串表示所有参数
# $@ 每个参数都转成字符串来输出所有参数
# $$ 查看当前进程号
# $* 和 $@ 在双引号使用时的表现不同
for i in "$*"; do
echo $i
done
# 1 2 3
for i in "$@"; do
echo $i
done
# 1
# 2
# 3
```

7. shell 基本运算符

```sh
# 算数运算符 +,-,*,/,%, ==, !=, = (赋值,不需要括号)
# 注意点，1.使用单引号 2.使用 expr 来实现 2. 表达式和运算符之间要用空格
sum=`expr 1 + 1`
#  注意点, 1. 条件表达式放在[] 中 2. 与括号也要有空格
[$a == $b]

# 关系运算符 只支持数字,除非字符串的值是数字
# -eq, -ne, -gt, -lt, -ge, -lt

# 布尔运算符
# !, -o, -a,

# 逻辑运算符
# &&, ||

# 字符串运算符 (都需要用中括号)
# = ,!=, -z 长度是否为0, -n 长度是否不为0, $ 是否不为空

# 文件测试运算符
# [ -d $file ]  是否为目录
# [ -f $file ]  是否为普通文件
# [ -r $file ]  是否为可读文件
# [ -w $file ]  是否为可写文件
# [ -x $file ]  是否为可执行文件
# [ -e $file ]  是否存在
# [ -s $file ]  是否为空(大小)
```

8. echo

```sh
# 显示换行 \n (next)
echo -e "hello \n world"  # -e 开启转义，不开启转义直接使用单引号
# 显示不换行 -c (continue)
echo -e "let's \c" # -e 开启转义 \c 不换行
echo "continue"
# 显示结果定向至文件
echo "hello world" > demo.sh
# 显示命令执行结果 使用单引号
echo `date`
```

9. printf 更全的打印输出
   `printf format-string [arguments]`，使用引用文本或空格分割参数，不像 echo 有默认的换行符，可以手动添加。

```sh
printf "%-10s %-8s %-4s\n" 姓名 性别 体重kg
printf "%-10s %-8s %-4.2f\n" 郭靖 男 66.1234
printf "%-10s %-8s %-4.2f\n" 杨过 男 48.6543
printf "%-10s %-8s %-4.2f\n" 郭芙 女 47.9876
# %s %c %d %f 都是格式替代符，％s 输出一个字符串，％d 整型输出，％c 输出一个字符，％f 输出实数，以小数形式输出。
# %-10s   - 表示左对齐,没有表示右对齐； 10 表示长度，不足用空格补齐；.2表示保留2位小数
```

10. 流程控制

```sh
# if
if condition1
then
    command1
elif condition2
then
    command2
else
    commandN
fi
# fi 就是 if 反过来

# 判断条件可以 [ "$a" -gt "$b" ] 也可以直接用 ((..)) 作为判断就可以直接使用><号了
if (( a > b )); then
  ...
fi

# for
for var in item1 item2 ... itemN
do
  command1
  command2
  ...
  commandN
done
# while 省略  case ... esca 省略 until 省略
# break,continue与其他语言一样
```

11. 函数

```sh
demo(){
  # ...
}
# 调用只需函数名
demo
# 与 js 不同的是, 如果没有return, 则会把最后一条命令运行的结果作为返回值

# 函数执行后的返回值 通过 $? 来获取

# 函数参数通过 $1,$2..${10} .. 来获取
```

12. 输入/输出 重定向

```sh
# 将命令的输出结果 重定向到 文件中
cmd > file
# 如果是在文件后追加内容 使用>>
cmd >> file

# 从文件中获取输入
cmd < file
```

13. 文件包含

```sh
# 一个脚本文件中包含另一个脚本
# 方式1
. ./demo.sh
# 方式2
source ./demo.sh
```

14. 测压命令 ab

比如我们可以用 node 启动一个服务，然后用 ab 去测试性能：

```sh
ab -n 1000 -c 200 -t 60 url
```

- -n，用于指定压力测试总共的执行次数。
- -c，用于指定的并发数。
- -t，等待响应的最大时间(单位：秒)。
- ...更多的件下文总结

## 参考

- [zsh-字符串常用操作](https://kennethfan.github.io/2017/09/20/zsh-%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%B8%B8%E7%94%A8%E6%93%8D%E4%BD%9C/)
- [构建高效工作环境 | Shell 命令篇：curl & ab 命令使用](https://blog.csdn.net/mickjoust/article/details/101049899)