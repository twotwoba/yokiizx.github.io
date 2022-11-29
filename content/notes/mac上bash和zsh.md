---
title: 'Mac上bash/zsh及常用的shell命令'
date: 2022-11-25T10:27:55+08:00
tags: [mac, shell]
---

## 基本概念

- shell，就是人机交互的接口
- bash/zsh 是执行 shell 程序，输入 shell 命令，输出结果

在 mac 上，我们常用的就是 bash 和 zsh 了。其它还有 sh，csh 等。

##### 查看本机上所有 shell 程序

```sh
cat /etc/shells
```

##### 查看目前使用的 shell 程序

```sh
echo $SHELL
```

##### 设置默认 shell 程序

```sh
chsh -s /bin/[bash/zsh...]
```

##### bash 和 zsh 的区别

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

##### oh-my-zsh

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

## 那么不如记录下常用的 shell 命令

##### 基本知识

1. 脚本执行

shell 脚本 xxx.sh 以.sh 结尾，此类文件执行方式有两种：

- 文件头使用 `#!` 指定 shell 程序，比如 `#! /bin/zsh`，然后带上目录执行 `./demo.sh`
- 直接命令行中指定 shell 程序，比如 `/bin/zsh demo.sh`

> 注意第一种方式，不能直接 `dmeo.sh`，得使用 `./demo.sh`，是因为这样系统会直接去 PATH 里寻找有没有叫 demo.sh 的，而 PATH 里一般只有 `/bin`,`/sbin`,`/usr/bin`,`/usr/sbin`。

另外 .sh 脚本文件执行时如果出现 `permission denied` 是因为没有权限，`chmod +x [文件路径]` 即可。

```sh
# 比如 demo.sh 文件内容如下
# ------------------------
#! /bin/zsh
echo "hello world"

# 执行两步走
chmod +x demo.sh
./demo.sh

# 如果是如下执行，内文件内的 第一行#！xxx 是无效的，写了也没用
/bin/zsh demo.sh
```

2. 变量

```sh
# 声明
variable_name='demo'
readonly variable_name # 只读变量
# 使用
$variable_name # 可以加上{}来确认边界 ${variable_name}
# 删除变量
unset variable_name # 不能删除只读变量
```

3. 字符串

```sh
# 单引号
str='hello world' # 单引号中变量是无效的
# 双引号
str="hello $world" # 可以识别变量

# 字符串长度
${#str}
# 字符串查找
$str[(I)ll] # 小i 从左往右 找不到返回 长度+1
$str[(i)ll] # 大i 从右往左 找不到返回 0
# 提取字符串
${str:1:4} # 与js的subStr类似 1为索引,4为长度
$str[1,4]  # 这个都是索引(注意是从第一位开始) 推荐这个吧

# 遍历
for i ({1..$#str}) {
  # ...eg. echo $str[i]
}
```

4. 数组

```sh
# 定义
array_name=(value0 value1 value2 value3)
# 读取
${array_name[下标]} # 下标从 1 开始 @ 为获取所有
# 获取长度
${#array_name[@]}

#  我个人习惯可能不带 {} 舒服点... 需要区分边界再加上吧
```

TODO
## 参考

- [](https://kennethfan.github.io/2017/09/20/zsh-%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%B8%B8%E7%94%A8%E6%93%8D%E4%BD%9C/)
