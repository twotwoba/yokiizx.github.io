---
title: 'Mysql_1'
date: 2023-11-30T15:42:23+08:00
lastmod:
tags: []
series: [mysql]
categories: [study notes]
weight: 1
---

## 安装

本人 m1 的 mac，[下载地址](https://downloads.mysql.com/archives/community/)，选择合适自己的版本下载安装。

> 据说 mysql5.x 的版本比较稳定，比如 5.7，很多公司在用；那我现在的公司使用的是 8.x 的版本，而且有 arm 版。

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202311301709918.png)

```shell
# 基本命令
sudo /usr/local/mysql/support-files/mysql.server start
sudo /usr/local/mysql/support-files/mysql.server restart
sudo /usr/local/mysql/support-files/mysql.server stop
```

环境配置，我本地使用的 `.zshrc`:

```shell
export MYSQL_HOME=/usr/local/mysql
export PATH=${PATH}:${MYSQL_HOME}/support-files # 之前配置了很多，拼进去${MYSQL_HOME}/support-files即可
```
