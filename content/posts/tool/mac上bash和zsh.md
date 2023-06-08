---
title: 'Mac上bash/zsh'
date: 2022-11-25T10:27:55+08:00
tags: [mac, shell]
---

## 基本概念

- shell，就是人机交互的接口
- bash/zsh 是执行 shell 的程序，输入 shell 命令，输出结果

在 mac 上，我们常用的就是 bash 和 zsh 了。其它还有 sh，csh 等。

### 查看本机上所有 shell 程序

```sh
cat /etc/shells
```

### 查看目前使用的 shell 程序

```sh
echo $SHELL
```

### 设置默认 shell 程序

```sh
# change shell 缩写 chsh
chsh -s /bin/[bash/zsh...]
```

### bash 和 zsh 的区别

都是 shell 程序，但是 zsh 基本完美兼容 bash，并且安装 oh-my-zsh 有自动列出目录/自动目录名简写补全/自动大小写更正/自动命令补全/自动补全命令参数的内置功能，还可以配置插件。

- bash 读取 `~/.bash_profile`
- zsh 读取 `~/.zshrc`

> 在 `.zshrc` 中添加 `source ~/.bash_profile` 就可以直接使用 `.bash_profile` 中的配置，无需再配置一遍。

---

小技巧：  
对于常用的命令，一定要配置别名，git 可以，所有 shell 命令都可以

```sh
# ~/.zshrc
alias cra="npx create-react-app"
alias nlg="npm list -g"
```

### oh-my-zsh

都知道 zsh 推荐安装 [oh-my-zsh](https://ohmyz.sh/)，很强大。

插件也有很多[插件仓库](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)。这里推荐两个：

- 语法高亮插件 `zsh-syntax-highlighting`
  ```sh
  # 安装
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
  ```
- 语法提示增强 `zsh-autosuggestions` (对输入过的命令进行提示,->选择)
  ```sh
  # 安装
  git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
  # .zshrc 配置
  plugins=(
    git
    zsh-syntax-highlighting
    zsh-autosuggestions
  )
  ```

> 基于 zsh-autosuggestions，说一个 shell 命令 ---> history，可以查看输入过的所有命令，想要清空可以使用 shell ---> history -c
