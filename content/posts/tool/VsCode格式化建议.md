---
title: 'VsCode格式化建议'
date: 2022-09-18T20:37:14+08:00
tags: [tool, vscode]
---

## 前言

做项目时，独木难支，难免会有多人合作的场景，甚至是跨地区协调来的小伙伴进行配合。如果两个人有着不同的编码风格，再不幸两人同时修改了同一份文件，就极有可能会产生不必要的代码冲突，因此，一个项目的代码格式化一定要统一。这对于上线前的代码 codereview 也是极好的，能有效避免产生大片红大片绿的情况。。。废话不多说，上菜！

## 插件

进行配置前，确保安装了以下两个插件：

- ESLint
- Prettier - Code formatter

## 配置

1.  项目根目录下创建`.vscode/settings.json`，用以覆盖本地的保存配置

    ```json
    {
      "editor.formatOnSave": true, // 保存时自动格式化
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true // 保存时自动修复
      }
    }
    ```

2.  项目根目录下创建`.prettierrc`，配置如下（按需配置）：

    ```json
    {
      "printWidth": 80,
      "tabWidth": 2,
      "useTabs": false,
      "semi": false,
      "singleQuote": true,
      "trailingComma": "none",
      "bracketSpacing": true,
      "arrowParens": "always",
      "htmlWhitespaceSensitivity": "ignore",
      "endOfLine": "auto"
    }
    ```

    > 当然了，如果你乐意也可以在本地 vscode 的 settings.json 中做一份配置，只是需要注意如果本地项目中有`.editorconfig` 文件，settings.json 中关于 prettier 的配置会失效。

3.  解决冲突  
    prettier 是专门做代码格式化的，eslint 是用来控制代码质量的，但是 eslint 同时也做了一些代码格式化的工作，而 vscode 中，prettier 是在 eslint --fix 之后进行格式化的，这导致把 eslint 对格式化的一些操作改变为 prettier 的格式化，从而产生了冲突。

    好在社区有了比较好的解决方案：

    - `eslint-config-prettier` 让 eslint 忽略与 prettier 产生的冲突
    - `eslint-plugin-prettier` 让 eslint 具有 prettier 格式化的能力

    ```sh
    npm i eslint-config-prettier eslint-plugin-prettier -D
    ```

    接着修改 `.eslintrc`

    ```JavaScript
    "extends": ["some others...",  "plugin:prettier/recommended"]
    ```

    看看 `plugin:prettier/recommended` 干了什么

    ```JavaScript
    // node_modules/eslint-plugin-prettier/eslint-plugin-prettier.js
    module.exports = {
      configs: {
        recommended: {
          extends: ['prettier'],
          plugins: ['prettier'],
          rules: {
            // 让代码文件中不符合prettier格式化规则的都标记为错误，
            // 结合vscode-eslint插件便可以看到这些错误被标记为红色，
            // 当运行eslint --fix 命令时，将自动修复这些错误。
            'prettier/prettier': 'error',
            'arrow-body-style': 'off',
            'prefer-arrow-callback': 'off'
          }
        }
      }
      // ...
    }
    ```

    > `arrow-body-style` 和 `prefer-arrow-callback`: 这两个规则在 eslint 和 prettier 中存在不可解决的冲突，所以关闭掉。

    > 另外建议某些特殊的影响到代码格式化的 eslint 配置全部关闭，比如`vue/max-attributes-per-line`，否则就会产生下面这种尴尬 (如果你看不见图，用个梯子试试~) ：
    > ![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20220919000042.png)

    大功告成！妈妈再也不用担心我的代码一团乱麻 🌶

    ps: `Error while loading rule 'prettier/prettier': context.getPhysicalFilename is not a function`，  
    遇到这种错误，一开始是有点懵逼的，去 github 上看了下，[解决方案](https://github.com/prettier/eslint-plugin-prettier/issues/434)还挺多的。常见的是降级`eslint-plugin-prettier@3.1.4`，或者升级`eslint`，当然是与时俱进了。
