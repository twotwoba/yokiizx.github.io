---
title: 'Lerna'
date: 2022-09-21T17:16:09+08:00
tags: [tool]
---

> Lerna is a fast, modern build system for managing and publishing multiple JavaScript/TypeScript packages from the same repository.

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202303171022701.png)

## lerna 解决了哪些问题

1. <details>
   <summary>调试问题</summary>
    以往多个包之间需要通过 npm link 进行调试，lerna 可以通过动态创建软链直接进行模块的引入和调试。

   ```JS
   function createSymbolicLink(src, dest, type) {
      return fs
        .lstat(dest)
        .then(() => fs.unlink(dest))
        .catch(() => {
          /* nothing exists at destination */
        })
        .then(() => fs.symlink(src, dest, type));
   }
   ```

   > PS: linux 创建软链 `ln -s source target`，注意 source 的路径如果为相对路径相对的是目标文件的路径

   </details>

2. 资源包升级。  
   一个项目依赖了多个 npm 包，当某一个子 npm 包代码修改升级时，都要对主干项目包进行升级修改。

## 常用命令

```sh
# 仓库初始化
lerna init
# 创建子包
lerna create <subpackage>
# 将本地包交叉链接在一起并安装剩余的包依赖项
lerna bootstrap
# 增加依赖 package 到最外层的公共 node_modules
lerna add <package>
# 增加依赖 package 到指定子包 subpackage
lerna add <package> --scope=<subpackage>
# lerna 执行传递的 shell 命令，与 npm 类似
lerna exec -- <shell>
leran exec --scope <subpackage> <shell> # 只对某个包执行 shell
# 执行 npm 脚本
lerna run <script>
# 显示所有子包
lerna ls
lerna ls --json
# 从所有包中删除 node_modules 目录(最外层公共的除外)
lerna clean
# 在当前项目中发布包
lerna publish
```

## 注意点

`lerna` 不会发布 `package.json` 中 `private` 属性为 true 的包。

`lerna` 默认使用**集中版本**，所有的包共用一个 version，如果需要 packages 下的子包使用不同的版本号，需要在 `lerna.json` 中配置 `"version": "independent"`。

`lerna publish` 发布的是 `packages/` 下面的各个子项目。

## 参考

- [lerna 官网](https://lerna.js.org/)
- [现代前端工程化-彻底搞懂基于 Monorepo 的 lerna 模块(从原理到实战)](https://mp.weixin.qq.com/s/uBxa24nbg9PXyTfO0TmzVg)
