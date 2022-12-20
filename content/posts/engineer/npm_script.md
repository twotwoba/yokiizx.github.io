---
title: 'npm script'
date: 2022-09-18T20:40:32+08:00
tags: [engineer]
---

**npm script 是一个前端人必须得掌握的技能之一。本文基于 npm v7 版本**

---

以下是我认为前端人至少需要掌握的知识点。

## npm init

创建项目的第一步，一般都是使用 `npm init` 来初始化或修改一个 `package.json` 文件，后续的工程都将基于 `package.json` 这个文件来完成。

```sh
# -y 可以跳过询问直接生成 pkg 文件(description默认会使用README.md或README文件的第一行)
npm init [-y | --scope=<scope>] # 作用域包是需要付费的
# 初始化预使用 npm 包
npm init [initializer]
```

`initializer` 会被解析成 `create-<initializer>` 的 npm 包，并通过 `npmx exec` 安装并执行安装包的二进制执行文件。

`initializer` 匹配规则：`[<@scope/>]<name>`，比如：

- npm init react-app demo ---> npm exec create-react-app demo
- npm init @usr/foo ---> npm exec @usr/create-foo

## npm exec

TODO

## 参考

- [npm 官方文档](https://docs.npmjs.com/)
- [w3c npm 教程](https://www.w3cschool.cn/npmjs/npmjs-ykuj3kmb.html)
