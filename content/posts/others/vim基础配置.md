---
title: 'Vim基础配置'
date: 2022-11-27T01:03:28+08:00
tags: [tool]
---

##### 痛点

使用 macos 或者 linux 时，难免会使用 vim 去修改一些配置文件，比如 `.zshrc`、`hosts`等。我个人在使用过程中发现操作还是有些不顺手的（vim 不熟），尤其是我在 mac 上常用的 `ctrl + f/b/a/e/n/p` 的方向组合快捷键在插入模式下不能使用。于是查了下，果然还是有办法解决的，记录一下，以后换电脑直接 COPY~

##### 配置文件

个人配置文件需要手动创建：

```sh
touch ~/.vimrc
```

##### 基础配置

```sh
"语法高亮"
syntax on

"回车缩进跟随上一行"
set autoindent

"显示行号"
set number

"高亮光标所在行"
set cursorline

"高亮显示匹配的括号([{和}])"
set showmatch

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

若有其他需求，自行百度 👻
