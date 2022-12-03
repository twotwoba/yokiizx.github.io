---
title: 'Linux基础'
date: 2022-12-03T16:08:31+08:00
tags: [mac, linux, shell]
---

## 前言

使用 mac 很多地方和 linux 是很像的，配置环境的时候总是去各种百度，让我很不爽，虽然本人只是个小前端，但是谁规定我只能学前端呢？计算机是个广阔的天地，只要我感兴趣，必拿下~

## linux 系统目录

记录一下"常识"目录：

- /bin， Binaries (二进制文件) 的缩写, 存放着最经常使用的基本命令
- /sbin，s 为 super，管理员权限，存放的是最基本系统命令
- /etc， Etcetera（等等）的缩写，存放所有系统管理所需要的配置文件和子目录
- /lib， Library（库）的缩写，存放着系统最基本的动态连接共享库，与 windows 的 DLL 文件作用类似。
- /usr， Unix Shared resources（共享资源） 的缩写，存放用户的应用程序和文件
- /opt， Optional（可选）的缩写，安装额外软件的目录
- /var， Variable（变量）的缩写，一般存放经常修改的东西，比如各种日志文件
- /home，用户的主目录，在 mac 上是`~`，等价于`Users/主机名`
- /usr/bin，系统用户使用的应用程序(后续安装的程序)
- /usr/sbin，管理员使用的应用程序(但不是必须的)

## linux 文件属性

查看完整属性命令

```sh
ls -l
# 或者
ll
```

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202212032127217.jpeg)

```sh
total 0
drwx------  5 yokiizx  staff   160B Mar 15  2022 Applications
drwx------ 42 yokiizx  staff   1.3K Dec  3 21:27 Desktop
drwxr-xr-x  4 yokiizx  staff   128B Aug  7  2021 Public
```

`drwxr-xr-x`：文件属性就是由这十个字符来表示的，r-可读，w-可写，x-可执行。

- 0：确定文件类型，`d`-目录,`-`-文件，其它还有 l,b,c
- 1-3：属主权限
- 4-6：属组权限
- 7-9：其它用户权限

两个基本修改用户与权限的命令：

- chown，change owner，修改所属用户与组
  ```sh
  chown [–R] 属主名 文件名
  chown [-R] 属主名：属组名 文件名
  ```
- chmod，change mode，修改用户的权限
  ```sh
  # r: 4, w: 2, x: 1  rwx == 7,
  chmod [-R] xyz 文件或目录
  ```

##### linux 目录与文件常用命令

TODO