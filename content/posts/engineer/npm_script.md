---
title: 'npm script'
date: 2022-12-02T20:40:32+08:00
tags: [engineer]
---

**npm script 是一个前端人必须得掌握的技能之一。本文基于 npm v7 版本**

---

下文是我认为前端人至少需要掌握的知识点。

> [关于 package.json](https://docs.npmjs.com/cli/v7/configuring-npm/package-json)，  
> 开发一个包时，[需要注意的字段](https://es6.ruanyifeng.com/#docs/module-loader#Node-js-%E7%9A%84%E6%A8%A1%E5%9D%97%E5%8A%A0%E8%BD%BD%E6%96%B9%E6%B3%95)

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

正如 shell 脚本执行需要指定 shell 程序一样，`run-script` 从 `package.json`的 script 对象中解析出的 shell 命令在执行之前会有一步 “装箱” 的操作：**把 `node_modules/.bin` 加在环境变量 `$PATH` 的中**，这意味着，我们就不需要每次都输入可执行文件的完整路径了。

`node_modules/.bin` 目录下存着所有安装包的脚本文件，文件开头都有 `#!/usr/bin/env node`，这个东西叫 [Shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>)。

```sh
# "scripts": {
#   "eslint": "eslint ./src/**/*.js"
# }
npm run eslint # ==>node ./node_modules/.bin/eslint *.js
```

`node_modules/.bin` 中的文件，实际上是在 `npm i` 安装时根据安装库的源代码中`package.json` 的 `bin` 指向的路径创建软链。

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

如果 `node_modules/.bin` 中没有对应的执行脚本，那么会去全局目录下查找，如果还没有再从环境变量 `$PATH` 下查找是否有同名的可执行程序，否则就报错啦。

PS: `npm run` 后不带参数直接执行，可以查看 `package.json` 中所有可执行的命令，就没必要再去点开文件看了。

## npm script 传参

直接举个常用的打印日志例子：

```sh
# 日志输出 精简日志和较全日志
npm run [key] -s # 全称是 --loglevel silent 也可简写为 --silent
npm run [key] -d # 全称是 --loglevel verbose 也可简写为 --verbose
```

两个常用的内置变量 `npm_config_xxx` 和 `npm_package_xxx`，eg：

```JSON
"view": "echo $npm_config_host && echo $npm_package_name"
```

当执行命令 `npm run view --host=123`，就会输出 123 和 package.json 的 name 属性值。

如果上方 [key] 指向的是另一个 `npm run` 命令，想传参给真正指向的命令该怎么做呢？又得依靠 `--`的能力了。下面两条命令对比，就是可以把 `--fix` 传递到 `eslint ./src/**/*.js` 之后。

```diff
"eslint": "eslint ./src/**/*.js",
- "eslint:fix": "npm run eslint --fix",
+ "eslint:fix": "npm run eslint -- --fix"
```

在脚本文件中，也可以获取命令的传参：

```JSON
"go": "node test.js --key=val --host=123"
```

```js
// test.js
const args = process.argv;
console.log('📌📌📌 ~ args', args);

const env = process.env.NODE_ENV;
console.log('📌📌📌 ~ env', env);
```

此外，`process.env` 可以获取到本机的环境变量配置，常用的如：

- NODE_ENV
- npm_lifecycle_event，正在运行的脚本名称
- npm_package\_[xxx]
- npm_config\_[xxx]
- ...等等

其中 `process.env.NODE_ENV` 也可以通过命令来设置，在 \*NIX 系统下可以这么使用：

```sh
"go": "export NODE_ENV=123 && node test.js --key=val --host=123"
```

为了抹除平台的差异，常常使用的是 `cross-env` 这个库。

## npm script 钩子

npm 提供 `pre`和`post`两种钩子机制，分别在对应的脚本前后执行。

## npm script 命令自动补全

官网提供了集成方法：

```sh
npm completion >> ~/.zshrc # 本地 shell 设置的是哪个就是哪个
```

把 `npm completion` 的输出注入 `.zshrc` 之后就可以通过 tab 来自动补全命令了。

## npm 配置

```sh
npm config set <key> <value>
npm config get <key>
npm config delete <key>
```

## node_modules 的扁平结构

npm 3 之前：

```txt
+-------------------------------------------+
|                   app/                    |
+----------+------------------------+-------+
           |                        |
           |                        |
+----------v------+       +---------v-------+
|                 |       |                 |
|  webpack@1.15.0 |       |  nconf@0.8.5    |
|                 |       |                 |
+--------+--------+       +--------+--------+
         |                         |
   +-----v-----+             +-----v-----+
   |async@1.5.2|             |async@1.5.2|
   +-----------+             +-----------+
```

npm 3 之后：

```txt
         +-------------------------------------------+
         |                   app/                    |
         +-+---------------------------------------+-+
           |                                       |
           |                                       |
+----------v------+    +-------------+   +---------v-------+
|                 |    |             |   |                 |
|  webpack@1.15.0 |    | async@1.5.2 |   |  nconf@0.8.5    |
|                 |    |             |   |                 |
+-----------------+    +-------------+   +-----------------+
```

优势很明显，相同的包不会再被重复安装，同时也防止树过深，导致触发 windows 文件系统中的文件路径长度限制错误。

能这么做的原因：得益于 node 的模块加载机制，[node 之 require 加载顺序及规则](https://www.jianshu.com/p/7cf8fdd3d2bf)。

## npm link

当我们开发一个 npm 模块或者调试某个开源库时，`npm link` 就发挥本事了，主要分为两步：

1. 作为包的目标文件下执行 `npm link`。它会在创建一个全局软链 `{prefix}/lib/node_modules/<package>` 指向该命令执行时所处的文件夹。  
   这里的 `prefix` 可以通过 `npm prefix -g` 来查看
2. `npm link <pkgName>` 然后把刚刚创建的全局链接目标链接到项目的 `node_modules` 文件夹中。  
   注意 这里的 <pkgName> 是 `package.json` 的 `name` 属性而不是文件夹名

举个例子吧，对 `react v17.0.2` 源码打包，然后在自己项目中链接打包的代码进行调试：

```sh
# 安装完依赖后对核心打包
yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE

# 分别进入react react-dom scheduler 创建软链
cd ./build/react
npm link
cd ./build/react-dom
npm link
cd ./build/scheduler
npm link

# 在创建项目中
npm link raect react-dom scheduler # 此优先级是高于本地安装的依赖的
```

## npm 发布

首先得有 npm 账号，直接去官网注册就好，其次有一个可以发布的包，然后：

```sh
# ------ terminal ------
# 1. 登录 npm 账号
npm adduser 或者 npm login
# npm whoami 可以查看登录的账号
# 2. 发布
npm publish
# 3. 带有 @scope 的发布需要跟上如下参数
npm publish --access=public
# 4. 更新版本 直接手动指定版本，也可以 npm version [major | minor | patch],自动升对应版本
npm version [semver]
```

> [sermver 版本规范](https://semver.org/lang/zh-CN/)

## 脚本执行顺序符号

这里与 shell 的符号是一样的：

- &：如果命令后加上了 &，表示命令在后台执行，往往可用于并行执行
  - 想要看执行过程可以最后添加 `wait` 命令，等待所有子进程结束，不然类似 watch 监听的命令在后台执行的时候没法 `ctrl + c` 退出了
- &&： 前一条命令执行成功后才执行后面的命令
- |：前一条命令的输出作为后一条命令的输入
- ||：前一条命令执行失败后才执行后面的命令
- ; 多个命令按照顺序执行，但不管前面的命令是否执行成功 d

> npm-run-all 这个库也实现了以上的执行逻辑，不过我是不建议使用，写命令就老老实实写不好嘛，越写越熟练哈哈~

## 参考

- [npm 官方文档](https://docs.npmjs.com/)
- [Node.js process 模块解读](https://juejin.cn/post/6844903614784225287)
- [node_modules 扁平结构](https://juejin.cn/post/6844903582337237006#heading-8)
- [模块加载官网伪代码](https://nodejs.org/dist/latest-v12.x/docs/api/modules.html#modules_all_together)
- [npm 发包流程](https://segmentfault.com/a/1190000023075167)
