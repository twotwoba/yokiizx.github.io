---
title: 'Git自用手册'
date: 2022-09-18T20:36:01+08:00
tags: [engineer, git]
---

本文基于 git version 2.32.0

## 个人常用配置

1. 用户名和邮箱

```sh
# 全局配置
git config --global user.name 'yourname'
git config --global user.email 'yourmail@163.com'
# 单个项目配置 (cd到根目录)
git config user.name 'name'
git config user.email 'mail'
# 查看配置
git config --list
```

2. 别名和美化

```sh
git config --global alias.ad 'add -A'
git config --global alias.cm 'commit -m'
git config --global alias.pl pull
git config --global alias.ps push

git config --global alias.ck checkout
git config --global alias.cb 'checkout -b'
git config --global alias.ci commit
git config --global alias.cam 'commit --amend -m'
git config --global alias.br branch
git config --global alias.st status
git config --global alias.re restore
git config --global alias.rs 'restore --staged'
git config --global alias.find 'log --grep'
git config --global alias.cp cherry-pick


git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global alias.find "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --grep"
git config --global alias.findby "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --author"
```

## git 基本命令

##### 仓库

##### 分支

##### 版本

##### 提交规范

## 参考

- [Pro Git 2nd Edition](https://git-scm.com)
