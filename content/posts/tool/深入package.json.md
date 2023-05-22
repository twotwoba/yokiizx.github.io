---
title: '深入package.json'
date: 2023-03-24T14:16:10+08:00
tags: [npm, module]
---

## introduction

之前一深入学习了 npm script，`package.json`的内容一笔带过了，想了想还是总结一下 pkg 内常见的字段。

首先，起码我个人刚入行时是对 `package.json` 这个东西不在意的，它什么档次还需要我研究？不就是记录了装了啥嘛，老夫 `npm run dev/build` 一把梭，上来就是淦！但是当俺想要自己开发一个包并且发布时 -- oh my god，my head wengwengweng~

所以先有一个基本的认识，发布的包发布的是什么？

- `package.json` 文件
- 其他文件，协议，文档，构建物等

其中构建物就是我们打包完的东西，当引用发布的包时，引用的是什么？怎么做到的？请看下文。

<!-- > 本文全局假设有一个发布的包名为 `pkg-show` -->

## 一个 npm 包，你引用的撒？

脱口而出： package.json 中的入口配置 `main` 字段指向的文件！小 case 的啦。

没错，但还不够。

### main & browser & module & exports

- `main`：这个是众所周知的，就是指定主入口文件，默认为 `index.js`
- `browser`：这个顾名思义，作用就是指定浏览器环境下加载的文件，比如：`"axios": "node_modules/axios/dist/axios.min.js"`
- `module`：该字段也是指定主文件入口，只不过是指定 ES6 模块环境下的入口文件路径，优先级高于 `main`
- `exports`：这个字段作用是指定导出内容，可以为多个，遵循 node 模块解析算法。

  ```JSON
  {
    "name": "example",
    "version": "1.0.0",
    "main": "./lib/example.js",
    "exports": {
      ".": "./lib/example.js", // main显示 这里必须再指定一次
      "./module1": "./lib/module1.js",
      "./module2": "./lib/module2.js",
    }
  }
  ```

  举例：`import { module1 } from 'example/module1'`

  注意点：

  1. 如果没有显示指定 `main`，`main` 默认为 `./index.js`; 如果指定了 `main`，则必须在 `exports` 中再显示的指定
  2. 如果 `key` 为 `import` 和 `require`，则是针对不同的模块系统导出。

现在，我们知道了引入一个 npm 包的多种方式，接下来继续了解下其他字段吧。

---

## other props

### scripts

指定脚本，详细的在 `npm scripts` 中已经讲过，`npm run <script-name>` 实际上调用的是 `run-script` 命令，`run` 是它的别名。

原理就是执行命令时会把 `node_modules/.bin` 加到环境变量 `PATH` 中，以便在执行命令时能够正确找到本地安装的可执行文件

### bin

上面说到了命令文件都在 `.bin` 目录下，而 `pacakge.json` 中的 `bin` 字段是指定可执行文件的路径。

```JSON
{
  "name": "my-project",
  "version": "1.0.0",
  "bin": {
    "my-cli": "./bin/my-cli.js",
  }
}
```

全局安装后就可以通过 `my-cli` 命令来执行脚本。

### type

`type: "module"||"commonjs"`

指定该 npm 包内文件都遵循 type 的模块化规范。

### typs 和 typings

`types` 属性指定了该包所提供的 TypeScript 类型的入口文件（.d.ts 文件）。

`typings` 属性是 `types` 属性的旧版别名，如果需要向后兼容，都写上即可。

### files

包发布时，需要将哪些文件上传。

```JSON
{
  "name": "my-package",
  "version": "1.0.0",
  "main": "dist/main.js",
  "files": [
    "dist/",
    "README.md"
  ]
}
```

注意：`dist/` 写法是上传 `dist` 文件夹下的所有文件，如果整个 dist 需要加入发包，改为 `dist` 即可。

### peerDependencies

解决 npm 包被下载多次，以及统一包版本的问题。

```JS
{
    // ...
    "peerDependencies": {
        "PackageOther": "1.0.0"
    }
}
```

上方配置：如果某个 `package` 把我列为依赖的话，那么那个 `package` 也必需应该有对 PackageOther 的依赖。

### workspaces

`monorepo` 绕不开 `workspaces`.

```JSON
{
  "name": "my-project",
  "workspaces": [
    "packages/a"
  ]
}
```

作用：当 `npm install` 的时候，就会去检查 `workspaces` 中的配置，然后创建软链到顶层 `node_modules`中。

### repository

描述包源代码的位置，指定包代码的存储库类型（如 git，svn 等）和其位置（URL）。

`repository` 字段的格式通常为一个对象，其中包含了 `type` 和 `url` 字段。`type` 指定代码仓库的类型，通常为 `git`。`url` 指定代码仓库的 `Web` 地址。

```JSON
"repository": {
  "type": "git",
  "url": "https://github.com/example/my-project.git"
}
```

如果一个项目没有在 `package.json` 文件中指定 `repository` 字段，则无法通过 `npm` 安装该项目。

## Reference

[npm - package.json](https://docs.npmjs.com/cli/v7/configuring-npm/package-json)
