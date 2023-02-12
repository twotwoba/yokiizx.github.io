---
title: 'Mac基础设施和效率'
date: 2022-09-19T11:24:00+08:00
tags: [mac, engineer]
---

工欲善其事，必先利其器

_文章取自本人日常使用习惯，不一定适合每个人，如您有更好的提效工具或技巧，欢迎留言 👏🏻_

## 基础设施

##### [Homebrew](https://brew.sh/)

懂得都懂，mac 的包管理器，可以直接去官网按照提示安装即可。安装完成后记得替换一下镜像源，推荐腾讯[镜像源](https://mirrors.cloud.tencent.com/)。

```sh
# 替换brew.git
cd "$(brew --repo)"
git remote set-url origin https://mirrors.cloud.tencent.com/homebrew/brew.git

# 替换homebrew-core.git
cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
git remote set-url origin https://mirrors.cloud.tencent.com/homebrew/homebrew-core.git
```

<details> 
<summary>如果没有 🪜，可以使用国内大神的脚本傻瓜式安装：</summary>

```sh
# 按照提示操作下去即可
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

</details>

##### [oh-my-zsh](https://ohmyz.sh/)

直接点击官网进入首页安装即可。

`~/.zshrc` 配置文件的部分配置：

```sh
# zsh theme；default robbyrussell，prefer miloshadzic
ZSH_THEME="miloshadzic"
# plugins
plugins=(
  # 默认的,配置了很多别名 ~/.oh-my-zsh/plugins/git/git.plugin.zsh
  git
  # 语法高亮
  # https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md#oh-my-zsh
  zsh-syntax-highlighting
  # 输入命令的时候给出提示
  # https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#oh-my-zsh
  zsh-autosuggestions
)

# 让terminal标题干净
DISABLE_AUTO_TITLE="true"
```

<details> 
<summary>当VsCode终端出现git乱码问题，添加以下代码进 `~/.zshrc`：</summary>

```sh
# solve git messy code in vscode terminal
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LESSHARESET=utf-8
```

</details>

##### [alfred](https://www.alfredapp.com/)

懂得都懂，这个是 mac 上的效率神器了，剪贴板、搜索引擎、自动化工作流等等就不多说了，网上教程很多。

分享一下平时使用的脚本吧：

- [VsCode 快速打开项目](https://github.com/alexchantastic/alfred-open-with-vscode-workflow)，别再用手拖了，直接`code 文件夹名` 不香嘛 🍚
- [CodeVar](https://github.com/xudaolong/CodeVar)，作为程序员起名字是个头疼事，交给它 👈🏻
- [markdown table](https://github.com/crispgm/alfred-markdown-table)，用 vscode 写 markdown 我想只有 table 最让人厌烦了吧哈哈
- [alfred-github-repos](https://github.com/edgarjs/alfred-github-repos)，github 快捷搜索
- [alfred-emoji](https://github.com/jsumners/alfred-emoji) emoji 表情

欢迎留言补充 👏🏻

##### 其他软件

- `clashX`，🪜 工具，[github 地址](https://github.com/yichengchen/clashX)，选择它是因为好用，而且支持了 apple chip  
  [clasX 科学上网教程](https://merlinblog.xyz/wiki/ClashX.html)，很简单，但是需要提前购买 🪜 哦。
- `iShot Pro`，截图、贴图软件，功能较全，目前为止很好用，AppStore 下载
- `PicGo`，图床工具，写博客必备，[github 地址](https://github.com/Molunerfinn/PicGo)
- `keka`，目前用过的 mac 上最好用的解压缩软件，[下载地址](https://www.keka.io/en/)，AppStore 也有，不过是收费的，有条件建议支持一下
- `IINA`，干净好用的播放器，[下载地址](https://iina.io/)
- `AppCleaner`，干净卸载软件，这个更较小，支持 M1（推荐），[下载地址](https://freemacsoft.net/appcleaner/)。AppDelete 是另一款，但是不支持 M1
- `Downie 4`，下载视频神器，[下载地址](https://software.charliemonroe.net/downie/)，这个我支持了正版~
- `Dash`，汇集了计算机的各种文档，配合 Alfred 查起来特别方便，[下载地址](https://kapeli.com/dash)，这个我也支持了正版~

##### 字体设置选择使用 Fira Code

如果使用下方命令安装不上，建议去 [github 地址](https://github.com/tonsky/FiraCode) 下载下来后手动安装。

```sh
brew tap homebrew/cask-fonts
brew install --cask font-fira-code
```

## 配置 .vimrc

对于习惯了 mac 快捷键`ctrl + f/b/a/e/n/p` 的我来说，vim 在插入模式下，鼠标光标的控制太难用了，好在可以修改配置解决：

1. 先创建配置文件

```sh
# 如果没有，先创建 .vimrc
touch ~/.vimrc
```

2. 写入配置（更多配置请自查）

```sh
syntax on      "语法高亮"
set number     "显示行号"
set cursorline "高亮光标所在行"
set autoindent "回车缩进跟随上一行"
set showmatch  "高亮显示匹配的括号([{和}])"

"配置插入模式快捷键"
inoremap <C-f> <Right>
inoremap <C-b> <Left>
inoremap <C-a> <Home>
inoremap <C-e> <End>
inoremap <C-k> <Up>
inoremap <C-l> <Down>
inoremap <C-q> <PageUp>
inoremap <C-z> <PageDown>
```

## 前端开发环境配置

##### fnm & nrm

之前有用过一段时间 `nvm`，咋说呢，慢。。。后来发现了 `fnm` 这个好东西，Rust 打造，相信前端一听到这个大名就一个反应，快！

- [fnm github](https://github.com/Schniz/fnm)

```sh
brew install fnm
# 根据官网提示，把下方代码贴进对应shell配置文件 .zshrc
eval "$(fnm env --use-on-cd)"

# 安装不同版本node
fnm install version
# 设置默认node
fnm default version
# 临时使用node
fnm use version

# 查看本地已安装 node
fnm ls
# 查看远程可安装版本
fnm ls-remote
```

- nrm

```sh
npm i nrm -g
# nrm 常用命令
nrm ls
nrm use
nrm add [name] [url] # 添加新的镜像源(比如公司的私有源)
nrm del [name]
```
