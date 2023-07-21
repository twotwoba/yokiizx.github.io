---
title: 'Java_1_安装与IDEA配置'
date: 2023-06-14T17:52:02+08:00
tags: []
series: [java]
categories: [study notes]
weight: 1
---

如今只会前端让我感到处处受制于人，很多自己的想法难以实现，严重依赖于后端，为了改变现状，我决定今年另一个小目标就是掌握 java，以及它的相关技术栈，不折腾一下，做什么程序员？Let's go!

---

## 三个基础概念：

- JVM: Java 虚拟机，实现 JAVA 跨平台
- JRE: Java 程序运行时环境，包含 JVM 和各种核心类库
- JDK: 包含各种工具，包含 JRE 和开发人员使用工具

## 安装 JDK

点击 [Oracle 官网](https://www.oracle.com/java/technologies/downloads/archive/) 下载，默认都会安装到 `/Library/Java/JavaVirtualMachines` 这个目录下。

由于我一开始不懂，下载的 JAVA20，结果现在主力开发用的都是 JAVA8(Oracle 无 ARM 版) 或 JAVA11(支持 ARM)，于是乎我就都下载了，这就面临了和切换 node 一样的问题，查了下，配置变量和命令别名来切换即可，如下：

```sh
# .zshrc 配置java环境
# JAVA config
export JAVA_8_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_361.jdk/Contents/Home
export JAVA_8_HOME_zulu=/Library/Java/JavaVirtualMachines/zulu-8.jdk/Contents/Home
export JAVA_11_HOME=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home

# default jdk
export JAVA_HOME=$JAVA_8_HOME_zulu

# alias command for exchange jdk
alias jdk8="export JAVA_HOME=$JAVA_8_HOME"
alias jdkz="export JAVA_HOME=$JAVA_8_HOME_zulu"
alias jdk11="export JAVA_HOME=$JAVA_11_HOME"

# add $JAVA_HOME/bin
export PATH=$HOME/bin:/usr/local/bin:$JAVA_HOME/bin:$PATH
```

补充：另外一个下载地址 [zulu](https://www.azul.com/downloads/?os=macos#zulu)，可以下载 ARM 版本的 JAVA8~

试一试：

```sh
javac xxx.java  # 编译为 xxx.class 文件(JVM可识别的字节码文件)
java xxx        # 执行 xxx.class 文件(本质是把.class文件装载到JVM机执行)
```

---

## 绕不开的 HelloWorld

```java
// HelloWorld.java
public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}
```

> 其他的都还行，作为前端开发需要注意的是：
>
> 1. 字符串用**双引号**！
> 2. 语句结束必须加上**分号**
> 3. 一个文件只能有一个 public 类，其他类不限（每一个类编译后对应一个 .class 文件）
> 4. 如果有 public 类，则源文件必须和该类同名
> 5. main(psvm)方法可以写在非 public 的类中，指定编译后的 class 文件执行即可

## IDEA

YYDS，注意：断点调试时，是运行状态，是按照对象的 `运行类型` (见多态)来执行的。

### 常用快捷键

只记录一下常用的快捷键，改了一点：

- `⌃ + space`，代码补全
- `⌃ + J`，模板提示
- `⌃ + R`，运行
- `⌃ + C`, debugger
- `⌃ + D`，从 debugger 改成 Del，为了匹配 mac 上键盘自身组合键
- `⌃ + H`，查看类的继承层级关系
- `⌃ + G`，选中相同的文本
- `⌃ + M`，在对应括号之间切换，配合`⌃ + A/E/F/B` 更顺滑
- `⌘ + B`，跳转方法定义，更喜欢 `⌘ + click`
- `⌘ + D`，向下复制
- `⌘ + N`，Generate，也可以用 `⌃ + ↩︎`，根据累生成对应的代码片段
- `⇧ + ↩︎`，光标无障碍行至下行，加 ctrl 至上行
- `⌥ + ↩︎`，一些操作建议和提示，如自动引入等
- `F19 + L`，格式化

智能补全比较 6 了，VsCode 里没怎么用过...

- `.field`，快速定义成员变量
- `.var`，快速定义局部变量
- `.notnull/.null`，判空
- `.not`，取反
- `.if`，判断语句
- `.lambda`，箭头函数[旺柴]
- `.opt`，Optional 语句

另外还有一些模板语法：

- `psvm/m`
- `sout`
- ...等等

### Debugger 设置

在设置里 `build->stepping->Do not step into the classes` 中把 `java.* `和 `javax.*` 去掉

快捷键添加:

- `ctrl + [`，断点前进
- `ctrl + ]`，行前进
- `ctrl + ↩︎`，进入方法
- `ctrl + del`，跳出方法

---
