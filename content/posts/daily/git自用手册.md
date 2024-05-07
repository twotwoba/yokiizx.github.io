---
title: 'Git 自用手册'
date: 2022-09-19
lastmod: 2024-05-07
series: []
categories: [tool]
weight:
---

**本文基于 git version 2.32.0**

---

当然，许多人选择使用 SourceTree 这样的图形界面来管理版本，但我作为一个习惯使用命令行和喜欢简约风格的人，更喜欢在终端中输入命令来进行 Git 相关操作。在这篇文章中，我将分享我这几年来常用的命令和经验。（一些基础的知识就不在本文中赘述了，可以自行网上搜索资料。）

## 基础配置

### 配置别名

别名可以极大简化命令号的操作复杂度~~~，是我换电脑或者重做系统后的必做的待办项之一。

```sh {open=true, lineNos=false, wrap=false, header=true, title="常用别名"}
# 请直接复制进 terminal 执行一下即可。提高幸福度的别名使用⭐️标记。
# --------------------------------------------------------------------------------------
# 常规
git config --global alias.g git
git config --global alias.c 'config' # g c user.name eric
git config --global alias.cg 'config --global' # g cg user.email eric@gmail.com

# 对于大型仓库只 clone 对应分支, g cloneb [bracnchName | tagName] [url] ⭐️
g cg alias.cloneb 'clone --single-branch --branch'

g cg alias.st status # 常用，提交前看一眼大致变化
g cg alias.ad 'add -A'
g cg alias.cm 'commit -m'
g cg alias.ps push
g cg alias.pso 'push origin'
g cg alias.pl pull
g cg alias.plo 'pull origin'

g cg alias.cam 'commit --amend -m'        # 修改最后一次 commit（⭐️会变更commitId）
g cg alias.can 'commit --amend --no-edit' # 追加修改，不加新 commit（g can ⭐️ 经常使用了属于是）

# 查看配置
g cg alias.cl 'config --list'
g cg alias.cgl 'config --global --list'
g cg alias.cll 'config --local  --list'  # 查看当前仓库下的 git 配置

# --------------------------------------------------------------------------------------
# 分支相关 (对于很多新手都不清楚的是：branchName 也只是一个指针!!!s)
g cg alias.br branch
g cg alias.rename 'branch --move'     # g rename oldname newname
g cg alias.ck checkout                # 带着 HEAD 到处跑~（⭐️ g ck - 快速返回上一个分支，同理 g merge -）
g cg alias.cb 'checkout -b'
g cg alias.db 'branch -d'             # 删除分支
g cg alias.fdb 'branch -D'            # 强制删除
g cg alias.drb 'push origin --delete' # 删除远程 g drb brname ⭐️; 也可以推送一个空本地分支: g pso :brname

# --------------------------------------------------------------------------------------
# tag 相关
# 打 tag： g tag [tagName]
# 推 tag： tag: g pso [tagName]
g cg alias.psot 'push origin --tags'  # 推多个 tag
g cg alias.dt 'tag -d'                # 删除 tag
g cg alias.drt 'push origin --delete' # 删除远程 tag 也可以推送空tag g pso :refs/tags/[version]

# --------------------------------------------------------------------------------------
# 进阶操作
# 常用 ⭐️，开发到一半要去改 bug 🙅🏻‍♀️
g cg alias.sta stash
g cg alias.stap 'stash pop'

g cg alias.rv 'revert'         # 反向操作，产生新的 commit
# 下面的 reset 是移动分支指针，并移出之后的 commit，同时还带有一点副作用
g cg alias.rh 'reset --hard'    # 副作用：会重置暂存区和工作区
g cg alias.rs 'reset --soft'    # 副作用：不会重置暂存区和工作区
# g reset --mixed commitId      # 副作用：重置暂存区,工作区不变，是 reset 的默认方式
g cg alias.cp cherry-pick       # g cp [commit/brname] 如果是 brname 则是把该分支最新commit合并(再次验证 brname 也就是一个指针~)
# cp 区间 g cp  commitA..commitB  把区间 (A, B] 的 commit 都合进来，A 早于 B 的
# cp 区间 g cp  commitA^..commitB 把区间 [A, B] 的 commit 都合进来
# git reflog  时光机神器~~~~~~~~~~~~~~能查看HEAD指针行走的所有轨迹,包括因为reset而被移出的commit
# 有了 reflog：cherry-pick 轻松找回被删除的 commit，reset 后悔了也可以轻松地回到未来

# 变基开启交互模式 g ri cmid
g cg alias.ri 'rebase -i'

# --------------------------------------------------------------------------------------
# log 美化
g cg alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
# 根据 commit 内容查找 commit
g cg alias.find "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --grep"
# 根据 commit 用户查找 commit
g cg alias.findby "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --author"

# --------------------------------------------------------------------------------------
# 不常用命令(2.23 新增)
# git restore / restore --staged [filename]
# get switch / switch -c [brname]
```

> 注意：reflog 查看的是本地历史，在别的电脑上是看不见的，同理如果电脑坏了，那么再也回不到未来了...另外，git reflog 不会永远保持，Git 会定期清理那些 “用不到的” 对象，不要指望几个月前的提交还一直在那里。

### 配置用户信息

命令简化完后，需要配置下个人信息，我个人习惯是公司的项目都单独配置，全局给自己用。

```sh {open=true, lineNos=false, wrap=false, header=true, title=""}
# 全局配置
g cg user.name 'yourname'
g cg user.email 'yourmail@xx.com'

# 独立配置
g c user.name 'yourname'
g c user.email 'yourmail@xx.com'
```

### HEAD 知多少

说一下个人的认知：

-   git 整个 commit 就是一个多叉树
-   每一个 branch 就是一条新的分支，它的 branchName 也是一个指针，指向的这条分支上最新的 commit
-   每一个 tag 也都可以看成是对应 commit 的别名

而 HEAD 是特殊的指针，指向的是当前所在 commit。平时 checkout 操作的就是 HEAD，而 reset 一般操作的是 branchName(HEAD 被迫跟着一起回退)

常用的 HEAD 简写 `HEAD^n` 与 `HEAD~n`：

-   HEAD^^^ 等价于 HEAD~3 表示父父父提交
-   HEAD^3 表示的是父提交的第三个提交，即合并进来的其他提交

---

<!--
## 新手概念

### 四态三区

git 目录下的所有文件一共有四种状态：

-   untracked (就是新增但是未 add 的文件)
-   unmodified
-   unstaged
-   staged

本地三个 git 分区：

-   工作区：存放着`untracked`、`unmodified`、`unstaged`的文件
-   暂存区：当工作区文件被`git add` 后加入，文件状态为 `unstaged`
-   仓库区：当暂存区文件被`commit` 后加入

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/017fb508b89d45a88c33383cdc4681eb~tplv-k3u1fbpfcp-zoom-1.image) -->

## 提交规范

通过 `husky` + `lint-staged` 配合来进行约束，详细配置根据项目来设定。

## 常见问题

### git log 中文字符乱码

当 vscode terminal 内使用 `g lg` 出现中文字符乱码问题， 可以去这么配置

```yml {c=false}
# ~/.gitconfig
export LC_ALL=zh_CN.UTF-8
export LANG=zh_CN.UTF-8
export LESSHARESET=utf-8
```

### 处理拒绝合并不相关历史

`fatal: refusing to merge unrelated histories`

```sh {lineNos=false}
g plo develop --allow-unrelated-histories
```

## 参考

-   [Pro Git 2nd Edition](https://git-scm.com)
-   [“纸上谈兵”之 Git 原理](https://mp.weixin.qq.com/s/FSBEM2GqhpVJ6yw9FkxnGA)
-   [Git Tools - Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
-   [Git submodule 子模块的管理和使用](https://www.jianshu.com/p/9000cd49822c)
