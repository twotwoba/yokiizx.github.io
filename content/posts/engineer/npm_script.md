---
title: 'npm script'
date: 2022-12-02T20:40:32+08:00
tags: [engineer]
---

**npm script 是一个前端人必须得掌握的技能之一。本文基于 npm v7 版本**

---

下文是我认为前端人至少需要掌握的知识点。

> [关于 package.json](https://docs.npmjs.com/cli/v7/configuring-npm/package-json)

## npm init

创建项目的第一步，一般都是使用 `npm init` 来初始化或修改一个 `package.json` 文件，后续的工程都将基于 `package.json` 这个文件来完成。

```sh
# -y 可以跳过询问直接生成 pkg 文件(description默认会使用README.md或README文件的第一行)
npm init [-y | --scope=<scope>] # 作用域包是需要付费的
# 初始化预使用 npm 包
npm init [initializer]
```

`initializer` 会被解析成 `create-<initializer>` 的 npm 包，并通过 `npmx exec` 安装(临时)并执行安装包的二进制执行文件。

`initializer` 匹配规则：`[<@scope/>]<name>`，比如：

- npm init react-app demo ---> npm exec create-react-app demo
- npm init @usr/foo ---> npm exec @usr/create-foo

## npm exec 与 npx

这两个命令都是从 npm 包（本地安装或远程获取）中运行任意命令。

```sh
# pkg 为 npm 包名,可以带上版本号
# [args...] 这个在文档中被称为 "位置参数"...奶奶的看了我好久才理解
# --package=xxx 等价于 -p xxx, 可以多次指定包
# --call=xxx 等价于 -c xxx, 指定自定义指令
npm exec -- <pkg> [args...]
npm exec --package=<pkg> -- <cmd> [args...]
npm exec -c '<cmd> [args...]'
npm exec --package=foo -c '<cmd> [args...]'

# 旧版 npx
npx -- <pkg> [args...]
npx --package=<pkg> -- <cmd> [args...]
npx -c '<cmd> [args...]'
npx --package=foo -c '<cmd> [args...]'
```

拓展：

1. `-p` 可以指定多个需要安装的包，如果本地没有指定的包会去远程下载并临时安装。
2. `-c` 自定义指令运行的是已经安装过的包，也就是说要么已经本地安装过 shell 中可以直接执行，要么`-p`指定包。另外，可以带入 npm 的环境变量

   ```sh
    # 查询npm环境变量
    npm run env | grep npm_
    # 把某个环境变量带入shell命令
    npm exec -c 'echo "$npm_package_name"'
   ```

辨析：

- npx：
  ```sh
  # 这里是把 foo 当指令, 后面的全部是参数
  npx foo bar --package=@npm/foo # ==> foo bar --package=@npm/foo
  ```
- npm exec：

  ```sh
  # 这里会优先去解析 -p 指定的包
  npm exec foo bar --package=@npm/foo # ==> foo bar
  # 想要让 exec 与 npx 实现一样的效果使用 -- 符号, 抑制 npm 对 -p 的解析
  npm exec -- foo bar --package=@npm/foo # ==> foo bar --package=@npm/foo
  ```

  ps 一句：官网(英文真的很重要)和一些中文文档读的是真 tm 累~或许这就是菜狗吧...

## npm run

> npm 环境变量中有一个是：`npm_command=run-script`，它的别名就是 `run`

`npm run [key]`，实际上调用的是 `npm run-script [key]`，根据 `key` 从 `package.json` 中 `scripts` 对象找到对应的要交给 shell 程序执行的命令。（mac 默认是 bash，个人设为 zsh）

`test`、`start`、`restart`、`stop`这四个是内置可以直接执行的命令。

再次遇见 `--`，作用一样也是抑制 npm 对形如 `--flag="options"` 的解析，最终把 `--flag="options"` 整体传给命令脚本。eg：

```sh
npm run test -- --grep="pattern"
#> npm_test@1.0.0 test
#> echo "Error: no test specified" && exit 1 "--grep=pattern"
```

正如 shell 脚本执行需要指定 shell 程序一样，`run-script` 从 `package.json`的 script 对象中解析出的 shell 命令在执行之前会有一步 “装箱” 的操作：**把 `node_modules/.bin` 加在环境变量 `$PATH` 的前面**，这意味着，我们就不需要每次都输入可执行文件的完整路径了。

`node_modules/.bin` 目录下存着所有安装包的脚本文件，文件开头都有 `#!/usr/bin/env node`。

```sh
# 指定 /bin/zsh 来执行 demo.sh
/bin/zsh demo.sh

# "scripts": {
#   "eslint": "eslint **.js"
# }
npm run eslint # ==> ./node_modules/.bin eslint **.js
```

`node_modules/.bin` 中的文件，实际上是在 `npm i` 安装时根据安装库的源代码中的 `package.json` 创建软链指向 bin 中的地址。

```JSON
"node_modules/eslint": {
  "version": "8.30.0",
  "bin": {
    "eslint": "bin/eslint.js"
  },
  "engines": {
    "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
  }
}
```

如果 `node_modules/.bin` 中没有对应的执行脚本，那么会去全局目录下查找，如果还没有再从环境变量 $PATH 下查找是否有同名的可执行程序，否则就报错啦。

## todo

TODO

## 脚本执行顺序符号

这里与 shell 的符号是一样的：

- &：如果命令后加上了 &，表示命令在后台执行，往往可用于并行执行
  - 想要看执行过程可以最后添加 `wait` 命令，等待所有子进程结束，不然类似 watch 监听的命令在后台执行的时候没法 `ctrl + c` 退出了
- &&： 前一条命令执行成功后才执行后面的命令
- |：前一条命令的输出作为后一条命令的输入
- ||：前一条命令执行失败后才执行后面的命令
- ; 多个命令按照顺序执行，但不管前面的命令是否执行成功

> npm-run-all 这个库也实现了以上的执行逻辑，不过我是不建议使用，写命令就老老实实写不好嘛，越写越熟练哈哈~

## 参考

- [npm 官方文档](https://docs.npmjs.com/)
- [w3c npm 教程](https://www.w3cschool.cn/npmjs/npmjs-ykuj3kmb.html)
