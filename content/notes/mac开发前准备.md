---
title: 'Mac开发前准备'
date: 2022-09-19T11:24:00+08:00
tags: [mac, nvm, nrm]
---

拿到一台新 mac 或者重新装了系统，必然是要做一些开发前准备的。

##### [homebrew](https://brew.sh/)

如果翻墙了直接使用官网的命令安装，否则可以使用下面国内大神的脚本：

```sh
# 按照提示操作下去即可
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

##### [oh-my-zsh](https://ohmyz.sh/)

使用官网命令安装：

```sh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

如果出现错误找不到 brew 命令，在 `~/.zshrc` 中添加以下内容：

```sh
export PATH=/opt/homebrew/bin:$PATH
```

##### github.com/github.global.ssl.fastlu.net 域名代理

去 [DNS 网站](https://tool.chinaz.com/dns/)输入这两个域名，然后找到 TTL 值最小的配置到 hosts 文件

```sh
sudo vim /etc/hosts
# like this
31.13.94.37     github.global.ssl.fastly.net
20.205.243.166  github.com
```

##### nvm & nrm

- nvm 与 node

```sh
brew install nvm
# 安装所需 node 版本
nvm install x.x.x
# 其他nvm 的常用命令
nvm ls
nvm use x.x.x
nvm alias default x.x.x
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

##### m1 芯片的 mac

安装低版本的 node 时，会发现报错，因为 m1 不支持。  
那么就需要我们修改终端的显示简介，勾选上 `rosetta2`

```sh
# 查看是在什么平台
node -p process.arch
# 使用x86_64
arch -x86_64 zsh
# 使用arm
arch --arm64e zsh
```
