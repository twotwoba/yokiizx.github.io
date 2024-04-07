# Git自用手册


**本文基于 git version 2.32.0**

---

我知道有很多人在使用 SourceTree 之类的图形界面进行版本管理，但是从入行就习惯使用命令行和喜欢简约风的我还是喜欢在 terminal 内敲命令行来进行 git 的相关操作，本文把这几年来常用的命令和经验分享一下。

鉴于是老生常谈的东西了，分为老手和新手两块。

## 老手命令

换电脑或者重做系统后，需要重新配置 git 命令别名，帮助简化命令（复制进 terminal 执行一下即可）。

```sh
# 普通流程
git config --global alias.g git
# 只 clone 对应分支, git cloneb [br] [url], 对于 react 之类的大仓库，就很舒服~
git config --global alias.cloneb 'clone --single-branch --branch'
git config --global alias.ad 'add -A'
git config --global alias.cm 'commit -m'
git config --global alias.ps push
git config --global alias.pl pull
# 修改最后一次commit（会变更commitId）
git config --global alias.cam 'commit --amend -m'
# 追加修改，不加新commit
git config --global alias.can 'commit --amend --no-edit'
# 任意commit删/改 git ri cmid
git config --global alias.ri 'rebase -i'

# 分支相关
git config --global alias.br branch
git config --global alias.rename 'branch --move' # g rename oldname newname
git config --global alias.ck checkout # 常用命令 g ck -, 快速返回上一个分支
git config --global alias.cb 'checkout -b'
git config --global alias.cp cherry-pick # g cp [commit/brname] 如果是brname则是把该分支最新commit合并
# cherry-pick 可以与 reflog (查看HEAD指针的行走轨迹,包括因为reset被移出的commit) 配合，来找回被删除的 commit
git config --global alias.db 'branch -d'
git config --global alias.fdb 'branch -D' # 强制删除
# 删除远程 g drb brname; 也可以推送一个空本地分支: g ps origin :brname
git config --global alias.drb 'push origin --delete'

# tag 相关 g tag [tname]
git config --global alias.pt 'push origin' # g pt [tag]
git config --global alias.pat 'push origin --tags'
git config --global alias.dt 'tag -d'
git config --global alias.drt 'push origin --delete' # 也可以推送空tag g ps origin :refs/tags/[version]

git config --global alias.st status
git config --global alias.ss 'status -s'
git config --global alias.res restore
git config --global alias.rss 'restore --staged'

# 查看配置
git config --global alias.cl 'config --list'
git config --global alias.cgl 'config --global --list'
git config --global alias.cll 'config --local  --list'

# log 美化
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
# 根据 commit 内容查找 commit
git config --global alias.find "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --grep"
# 根据 commit 用户查找 commit
git config --global alias.findby "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --author"
```

命令简化完后，需要配置下个人信息，我个人习惯是公司的项目都单独配置，全局给自己用。

```sh
# 全局配置
git config --global user.name 'yourname'
git config --global user.email 'yourmail@163.com'

# 单个项目配置 (cd到根目录)
git config user.name 'name'
git config user.email 'mail'
```

其它的一些实用命令：

```sh
# 临时将工作区文件的修改保存至堆栈中 (常用于开发到一半要去改个bug)
git stash
# 将之前保存至堆栈中的文件取出来
git stash pop


# HEAD 指针回退某个版本并基于那个版本修改bug
git checkout [commit] # HEAD 将处于 detached (游离) 状态 g st 可查看
git checkout [current brname] # 当希望HEAD回到分支最初状态，这样即可
# 一般可以用 checkout 回退版本，查看历史代码，测试 bug 在哪，
# 如果checkout的commit下修改了bug，提交了commit，签回分支末端时，会提示要不要建一个新分支
# 这时候可以新建一个临时分支，然后你本地自己的开发主分支去合并它，合并完后删除临时分支

# 对某次 commit 做反向操作, 生成新的 commit, 常用来撤销中间的某一次提交
git revert [commit]

# rebase 用来变基合并的作用可能没有 rebase -i 使用的频繁
# 执行下面的命令就能对 commit 进行一系列操作了
# 常用的如 编辑，合并, 删除commit等
git rebase -i [HEAD~3]

# 把分支指针指向对应的commit，移除之后的提交
git reset --hard [commit] # 重置暂存区和工作区
git reset --soft [commit] # 保持暂存区和工作区不变
git reset --mixed [commit] # 重置暂存区,工作区不变，是reset的默认方式
```

上面的命令基本是够用了，不过 git 2.23 后有一些新命令：

```sh
# switch 和 restore 都是来帮 checkout 分担压力的
git switch [branchname]
git switch -c [branchname] # -c 表示创建

git restore [filename]
git restore --staged [filename]
```

> 注意：reflog 查看的是本地历史，在别的电脑上是看不见的，同理如果电脑坏了，那么也回不到未来了...另外，git reflog 不会永远保持，Git 会定期清理那些 “用不到的” 对象，不要指望几个月前的提交还一直在那里。

### 处理 fatal: refusing to merge unrelated histories

```sh
g pl origin develop --allow-unrelated-histories
```
---

## 新手概念

### 四态三区

git 目录下的所有文件一共有四种状态：

- untracked (就是新增但是未 add 的文件)
- unmodified
- unstaged
- staged

本地三个 git 分区：

- 工作区：存放着`untracked`、`unmodified`、`unstaged`的文件
- 暂存区：当工作区文件被`git add` 后加入，文件状态为 `unstaged`
- 仓库区：当暂存区文件被`commit` 后加入

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/017fb508b89d45a88c33383cdc4681eb~tplv-k3u1fbpfcp-zoom-1.image)

### 分支

分支是很重要的一个概念，其实就是一个快照，创建的分支名只不过是指针而已，每一次提交就是指针往前移动。

HEAD 是特殊的分支指针，指向的是当前所在分支。这里得说一下 HEAD^n 与 HEAD~n：

长话短说：

- HEAD^^^ 等价于 HEAD~3 表示父父父提交
- HEAD^3 表示的是父提交的第三个提交，即合并进来的其他提交

## 提交规范

通过 `husky` + `lint-staged` 配合来进行约束，详细配置根据项目来设定。

### 解决 vscode git log 中文字符乱码

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

# 解决 vscode terminal git log 中文乱码
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LESSHARESET=utf-8
```

### 补充

- [Git Tools - Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Git submodule 子模块的管理和使用](https://www.jianshu.com/p/9000cd49822c)

## 参考

- [Pro Git 2nd Edition](https://git-scm.com)
- [“纸上谈兵”之 Git 原理](https://mp.weixin.qq.com/s/FSBEM2GqhpVJ6yw9FkxnGA)

