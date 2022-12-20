---
title: 'Git自用手册'
date: 2022-09-18T20:36:01+08:00
tags: [engineer, git]
---

**本文基于 git version 2.32.0**

---

我知道有很多人在使用 SourceTree 之类的图形界面进行版本管理，但是从入行就习惯使用命令行和喜欢简约风的我还是喜欢在 terminal 内敲命令行来进行 git 的相关操作，本文把这几年来常用的命令和经验分享一下。

##### 初始化必配

换电脑或者重做系统后，需要重新配置 git 命令别名，这是帮助简化的方法。

```sh
# 常规工作流
git config --global alias.g git
git config --global alias.ad 'add -A'
git config --global alias.cm 'commit -m'
git config --global alias.cam 'commit --amend -m'
git config --global alias.can 'commit --amend --no-edit'
git config --global alias.ps push
git config --global alias.pl pull

git config --global alias.ck checkout
git config --global alias.cb 'checkout -b'
git config --global alias.ci commit
git config --global alias.br branch
git config --global alias.st status
git config --global alias.ss 'status -s'
git config --global alias.re restore
git config --global alias.rs 'restore --staged'
git config --global alias.find 'log --grep'
git config --global alias.cp cherry-pick
```

## 个人常用配置

1. 用户名和邮箱
   ceshi

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



git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global alias.find "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --grep"
git config --global alias.findby "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --author"
```

> 虽然 vscode 帮助我们很大程度上减少了使用 git 的负担，但是爱折腾的程序员怎么能允许自己不会敲命令行呢 👻

## git 基本命令

为了便捷，以下命令我将基于上方的别名使用。

##### 分支

有一个很重要的概念是，分支是快照，创建的分支名只不过是指针而已，每一次提交就是指针往前移动。  
分支还有一个特殊的 HEAD 指针，指向当前分支。

```sh
# 查看分支
git br
# 创建分支
git br [branchname]
# 切换分支
git ck [branchname]
# 创建并切换
git ck -b [branchname]
# 快捷返回上一个分支
git ck -

# 2.23 后的新命令
git switch [branchname]
git switch -c [branchname] # -c 表示创建


# 删除分支
git br -d [branchname] # 会组织包含未合并更改的分支
git br -D [branchname] # 强制删除
# 删除远程分支
git push origin --delete [branchname]
git push origin :[branchname] # 利用推送一个空分支删除远程分支

# 修改分支名
git br --move [oldname] [newname]

# 临时将工作区文件的修改保存至堆栈中 (常用于开发到一半要去改个bug)
git stash
# 将之前保存至堆栈中的文件取出来
git stash pop

# 合并分支 (重要)
git merge [brname]

# 变基 保证线性
git ck [brnameA]
git rebase [mainbrname] # 变基到主分支
git ck [mainbrname]     # 切回主分支
git merge [brnameA]     # 主分支指针前进
```

> 不要 rebase 存在于您的存储库之外并且人们可能已经基于工作的提交。

更常用的可能是 `git reabse -i HEAD`：

```shell
# 执行下面的命令就能对 commit 进行一系列操作了
# 常用的如 编辑，合并, 删除commit等
git rebase -i [HEAD~3]
```

##### 撤销相关

注意，如果文件是 untracked 那么使用下面命令是无效的，使用`git add`让文件被追踪。

```sh
# 撤销 modified 文件
git checkout [filename] # 暂存区恢复到工作区
# 撤销 staged 文件
git reset HEAD [filename]

# 2.23 版本引入了新命令对以上两个命令做了统一
git restore [filename]
git restore --staged [filename]


# 指针回退到某个版本
git checkout [commit] # HEAD 将处于 detached (游离) 状态
git checkout [branchName] # 当希望HEAD回到分支最初状态，这样即可
# 一般可以用 checkout 回退版本，查看历史代码，测试 bug 在哪，
# 如果checkout的commit下修改了bug，提交了commit，签回分支末端时，会提示要不要建一个新分支
# 这时候可以新建一个临时分支，然后你本地自己的开发主分支去合并它，合并完后删除临时分支


# 把分支指针指向对应的commit，移除之后的提交
git reset --hard [commit] # 还原暂存区和工作区
git reset --soft [commit] # 保持暂存区和工作区不变
git reset --mixed [commit] # 重置暂存区,工作区不变 等价于没有--mixed
# 中止合并
git merge --abort

# 对某次 commit 做反向操作, 生成新的 commit, 常用来撤销中间的某一次提交
git revert [commit]

# 删除不小心上传的文件
git rm --cached [filename] # 接触追踪后,再push一下,或者直接删除
```

##### commit 相关

```sh
# 查看
git log # 其后面可以有很多配置命令，我直接用上方的别名去美化了，使用起来更好
# 关键字模糊查询
git log --grep 'msg'

# 查看HEAD指针的行走轨迹,包括因为reset被移出的commit
# (时光机就是利用reflog和cherry-pick实现的)
git reflog

# 查看某次commit改动的问价名list
git show --name-only [commit id]
```

> 时光机：`git reset` 到指定` <commit id>`，却发现被回滚掉的未来的 commit 仍然需要，我后悔了，怎么办？使用 `git reflog` 找到想要挽回的未来的那个 commit，再使用 `git cherry-pick` 把它合并进来即可。

> 注意：reflog 查看的是本地历史，在别的电脑上是看不见的，同理如果电脑坏了，那么也回不到未来了...
> git reflog 不会永远保持，Git 会定期清理那些 “用不到的” 对象，不要指望几个月前的提交还一直在那里。

##### 标签

```sh
# 最简单的打标签 如需要注释使用 -a version -m 'desc'
git tag [version]
# 两种方式i推送到远程 单个/全部
git push origin [version]
git push origin --tags
# 删除标签
git tag -d [version] # 这只是本地删除了
# 两种方式删除远程标签
git push origin :refs/tags/[version]
git push origin --delete [version]
# 查看标签信息
git show [version]
```

##### HAED^n 与 HEAD~n

- HEAD^ 看这个尖尖的就可以联想到是顶尖的 commit，也就是最近的父提交  
  HEAD^3 表示父提交的第三个提交，也就是从其他分支 merge 进来的

- HEAD~2 表示父提交的父提交，等价于 HEAD^^

##### 提交规范

```sh
# 全局安装
yarn global add commitizen cz-conventional-changelog
# 项目内安装
yarn add @commitlint/config-conventional @commitlint/cli -D

# 进入项目内初始化cz; 之后所有的git commit 变为 git cz
commitizen init cz-conventional-changelog --save-dev --save-exact

# 在package.json同级目录下 新建 commitlint.config.js文件, 写入
module.exports = { extends: ["@commitlint/config-conventional"] };
# 项目内安装husky  防止不规范代码被提交
yarn add husky -D
# package.json中配置
"husky": {
 "hooks": {
   "commit-msg": "commitlint -e $GIT_PARAMS"
 }
}
```

##### 解决 vscode git log 中文字符乱码

```yml
#.gitconfig
[gui]
    encoding = utf-8
    # 代码库统一使用utf-8
[i18n]
    commitencoding = utf-8
    # log编码
[svn]
    pathnameencoding = utf-8
    # 支持中文路径
[core]
    quotepath = false
    # status引用路径不再是八进制（反过来说就是允许显示中文了）

#.zshrc文件末尾
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
```

##### 最后介绍下 git 的基本概念

本地四个 file 的状态：

- untracked (就是新增但是未 add 的文件)
- unmodified
- modified
- staged

本地三个 git 分区：

- 工作区：存放着`untracked`,`unmodified`, `modified`的文件
- 暂存区：当工作区文件被`git ad` 后加入 (极其重要)
- 版本库：当暂存区文件被`commit` 后加入

绝大多数的操作是针对这三个区的，和远程的操作基本就是 pull、push 之类。
相应三个区的比较命令：

| 命令              | 作用             |
| ----------------- | ---------------- |
| git diff          | 工作区 vs 暂存区 |
| git diff head     | 工作区 vs 版本库 |
| git diff --cached | 暂存区 vs 版本库 |

掌握上述内容，足以在工作中应对绝大部分的使用场景，如果有特殊的情景，还是要记得去 google。

## 参考

- [Pro Git 2nd Edition](https://git-scm.com)
- [git 中 HEAD^和 HEAD~的区别](https://blog.csdn.net/sayoko06/article/details/79471173)
- [“纸上谈兵”之 Git 原理](https://mp.weixin.qq.com/s/FSBEM2GqhpVJ6yw9FkxnGA)
