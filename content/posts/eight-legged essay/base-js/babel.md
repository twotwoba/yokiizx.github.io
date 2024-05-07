---
title: 'Babel'
date: 2022-09-20T17:16:16+08:00
tags: [babel]
---

**本文基于 babel 7**

众所周知，babel 是 JavaScript 编译器，今天从头到尾学习一遍，构建知识体系。

> [Can I use](https://caniuse.com/)

## babel 原理

不仅 babel，大多数编译器的原理都会经历三个步骤：`Parsing`, `Transformation`, `Code Generation`，简单说也就是把源代码解析成抽象模板，再转成目标的抽象模板，最后根据转换好的抽象模板生成目标代码。

1. `parsing` 有两个阶段，词法分析和语法分析，最终得到 AST（抽象语法树）：

   - 词法分析：把源代码转换成 tokens 数组(令牌流)，形式如下：  
     PS： 旧的`babylon`中解析完是有 tokens 的，新的`@babel/parser`中没了这个字段，如有大佬知道原因，请留言告知，感谢~

     ```js
      [
        { type: { ... }, value: "n", start: 0, end: 1, loc: { ... } },
        { type: { ... }, value: "*", start: 2, end: 3, loc: { ... } },
        { type: { ... }, value: "n", start: 4, end: 5, loc: { ... } },
        ...
      ]
     ```

     每一个 type 有一组属性来描述该令牌：

     ```js
      {
        type: {
          label: 'name',
          keyword: undefined,
          beforeExpr: false,
          startsExpr: true,
          rightAssociative: false,
          isLoop: false,
          isAssign: false,
          prefix: false,
          postfix: false,
          binop: null,
          updateContext: null
        },
        ...
      }
     ```

     词法转换的基本原理就是：tokenizer 函数内部使用指针去循环遍历源码字符串，根据正则等去匹配生成对应的一个个 token 对象。

   - 语法分析：把词法分析后的 tokens 数组(令牌流)转换成 AST(抽象语法树)，形式如下：

     ```js
      {
        type: "FunctionDeclaration",
        id: {
          type: "Identifier",
          name: "square"
        },
        params: [{
          type: "Identifier",
          name: "n"
        }],
        body: {
          type: "BlockStatement",
          body: [{
            type: "ReturnStatement",
            argument: {
              type: "BinaryExpression",
              operator: "*",
              left: {
                type: "Identifier",
                name: "n"
              },
              right: {
                type: "Identifier",
                name: "n"
              }
            }
          }]
        }
      }
     ```

     与 tokenlizer 不同， parser 内部使用的是递归+循环而不仅仅是循环。

2. `Transformation`，该阶段将抽象语法树转换成我们想要的目标抽象语法树，这是最复杂的地方，会使用到 **访问者模式**。  
   这一步重点是需要一个自定义遍历器 `traverser(ast, visitor)`，`visitor` 作用是访问旧 `ast` 每个 `node 节点` 时根据 type 字段配置相应的处理方法，进行添加、更新、移除等操作，最终生成新的 AST。
3. `code generotion` 阶段比较简单就是深度遍历(dfs) AST，构建转换后代码的字符串。  
   同时还会创建代码映射(source maps)

#### 重点

访问者模式遍历器的 `visitor` 是一个对象，其对应的是设定标识的应使用各种方法，由于我们是 dfs，所以每个节点都会经历 `进入` 和 `退出` 两个动作。

```diff
- const MyVisitor = {
-   Identifier() {
-     console.log("Called!");
-   }
- };
+ const MyVisitor = {
+   Identifier: {
+     enter(path) {
+       console.log("Entered!");
+     },
+     exit(path) {
+       console.log("Exited!");
+     }
+   }
+ };
```

visitor 内方法访问的实际上是 `path` ---> `path` 是表示两个节点之间连接的对象，这个对象还有很多其他的元数据，如：

```js
/* ------ 节点 ------ */
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  ...
}
/* ------ path ------ */
{
  "parent": {
    "type": "FunctionDeclaration",
    "id": {...},
    ...
  },
  "node": {
    "type": "Identifier",
    "name": "square"
  },
  "hub": {...},
  "contexts": [],
  "data": {},
  "shouldSkip": false,
  "shouldStop": false,
  "removed": false,
  "state": null,
  "opts": null,
  "skipKeys": null,
  "parentPath": null,
  "context": null,
  "container": null,
  "listKey": null,
  "inList": false,
  "parentKey": null,
  "key": null,
  "scope": null,
  "type": null,
  "typeAnnotation": null,
  // 添加,更新,移动和删除节点有关的其他方法
}
```

某种意义上，`path` 是一个节点在树中的位置以及关于该节点各种信息的 `响应式 Reactive` 表示

---

## babel 配置

知道了基础原理之后，来看看在前端项目中，究竟是怎么使用 babel 的。

### 基础

首先一个项目使用 babel 的基础条件至少有以下三包：

- 一个 `babel runnner`。（如：`@babel/cli`,`babel-loader`,`@rollup/plugin-babel` 等）
- @babel/core
- @babel/preset-env

### babel runner

- `@babel/cli`，从命令行使用 babel 编译文件
  ```sh
  # 全局安装，也可随项目安装
  npm i @babel/cli -g
  # 基本使用，可选是否导出到文件 --out-file或-o
  babel [file] -o [file]
  ```
- `babel-loader`，前端项目中 `webpack` 更常用的是 `babel-loader`  
   在 webpack 中，loader 本质上就是一个函数：
  ```js
  // loader 自身实际上只是识别文件，然后注入参数，真正的编译依赖 @babel/core
  const core = require('@babel/core')
  /**
   * @desc    babel-loader
   * @param   sourceCode 源代码
   * @param   options    babel配置参数
   */
  function babelLoader (sourceCode,options) {
    // ..
    // 通过transform方法编译传入的源代码
    core.transform(sourceCode, {
      presets: ['@babel/preset-env'],
      plugins: [...]
    });
    return targetCode
  }
  ```
  > babel-loader 的配置既可以通过 options 参数注入，也可以在 loader 函数内部读取 `.babelrc`/`babel.config.js`/`babel.config.json` 等文件中读取后注入。

### @babel/core

通过 `babel runner` 识别到了文件和注入参数后，`@babel/core` 闪亮登场，这是 babel 最核心的一环 --- 对代码进行转译。

### @babel/preset-env

现在识别了文件，注入了参数（babel runner），也有了转换器（@babel/core），但是还不知道按照什么样的规则转换，好在 babel 预置了一些配置：`@babel/preset-env`、`@babel/preset-react`、`@babel/preset-typescript`等。

`@babel/preset-env` 内部集成了绝大多数 plugin（State > 3）的转译插件，它会根据对应的参数进行代码转译。[具体配置见官网](https://babeljs.io/docs/en/babel-preset-env)

#### 创建自己的 `preset`

如果我们的项目频繁使用某一个 babel 配置，就好比一个配方，那么固定下来作为一个自定义的 `preset` 以后直接安装这个预设是比较好的方案。 比如 `.babelrc` 如下：

```js
{
  "presets": [
    "es2015",
    "react"
  ],
  "plugins": [
    "transform-flow-strip-types"
  ]
}

/* ------- 1. npm init 创建package.json 把上方用到的preset和插件安装 ------- */
{
  "name": "babel-preset-my-awesome-preset",
  "version": "1.0.0",
  "author": "James Kyle <me@thejameskyle.com>",
  "dependencies": {
    "babel-preset-es2015": "^6.3.13",
    "babel-preset-react": "^6.3.13",
    "babel-plugin-transform-flow-strip-types": "^6.3.15"
  }
}
/* ------- 2. 创建 index.js ------- */
module.exports = function () {
  presets: [
    require("babel-preset-es2015"),
    require("babel-preset-react")
  ],
  plugins: [
    require("babel-plugin-transform-flow-strip-types")
  ]
};
// 与 webpack loader 一样，多个 preset 执行顺序也是从右到左，
// 而babel插件则是正序的且在preset前运行。
```

之后发布到 npm 仓库即可。

### polyfill

以上三个是 babel 有意义运行的最基本的条件，一般项目中需要的更多，先看以下三个概念：

- 最新 ES 语法：比如 `箭头函数`，`let/const`
- 最新 ES API：比如 `Promise`
- 最新 ES 实例/静态方法：比如 `String.prototype.include`

`@babel/preset-env` 只能转换最新 ES 语法，并不能转换所有最新的语法，所以需要 `polyfill` 来协助完成。

> 实现 `polyfil` 方式也被分为了两种：
>
> 1. `@bable/polyfill`：通过往全局对象上添加属性以及直接修改内置对象的 Prototype 上添加方法实现 polyfill。
> 2. `@babel/runtime` 和 `@babel/plugin-transform-runtime`，类似按需加载，但不是修改全局对象

先看 `@bable/polyfill` 一个极简的例子：

```js
// 前置操作 npm init -y && npm i @babel/cli @babel/core @babel/preset-env -D
// test.js
const arrowFun = (word) => {
  const str = 'hello babel';
};
const p = new Promise()

// 配置 .babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": false
      }
    ]
  ]
}

// cmd 中执行 babel test.js，会得到如下代码：
"use strict";

var arrowFun = function arrowFun(word) {
  var str = 'hello babel';
};
const p = new Promise()
```

这个例子中，箭头函数和 const 都被转换了，但是 Promise 没什么变化，因为 `useBuiltIns` 被设置为了 false。`useBuiltIns` 一共有三个值：

- `false`，说简单点就是不使用 polyfill
- `entry`，全量引入 polyfill，同时需要项目入口文件的头部引入:
  ```js
  import "@babel/polyfill"
  // babel 7.4 后被拆成了 core-js/stable 和 regenerator-runtime/runtime
  ```
- `usage`，按需添加 polyfill，根据配置的浏览器兼容，以及代码中 使用到的 Api 添加，不需要去项目入口文件引入：

  ```js
  {
    "presets": [
      [
        "@babel/preset-env",
        {
          "useBuiltIns": "usage",
          "corejs": 2 // entry和usage都需要这个配置， 默认为 2, 可选 3
          // 2 - 只支持全局变量Promise和静态属性Array.from(); 3 - 还支持实例属性 [].includes
        }
      ]
    ]
  }

  // 这套配置的输出会在头部添加如下引用, 这样就支持了 Promise 了
  require("core-js/modules/es6.object.to-string.js");
  require("core-js/modules/es6.promise.js");
  ```

  > entry 全量引入会产生污染全局和的问题，而 usage 按需引入，如果有多个模块，那么也会产生代码冗余，重复引入的问题。

---

`@babel/runtime` 是另一种实现 polyfill 的方式。相比 `@babel/polyfill` 直接在全局作用域上修改，`@babel/runtime` 是一种模块化的方式，它将开发者依赖的全局内置对象等单独抽离成独立的模块，并通过模块导入的方式引入，避免了对全局作用域的修改（污染）。

```sh
npm i @babel/runtime -s # 注意这里是 生产依赖
npm i @babel/plugin-transform-runtime -D
```

`@babel/plugin-transform-runtime` 的作用是，将 `helper` 函数，都转换成为对` @babel/runtime` 内模块的引用。

```js
// @babel/runtime 配置
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": false
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "absoluteRuntime": false,
        "corejs": false, // false|2|3 是否对core-js进行polyfill，以及用哪个版本的core-js进行polyfill
        "helpers": true, // 是否对 helper 函数进行提取
        "regenerator": true, // 是否对regenerator-runtime进行polyfill
        "useESModules": false
      }
    ]
  ]
}

// 测试代码 test.js
class Demo {
  constructor() {
    this.word = 'hello babel';
  }
  say() {
    console.log(this.word);
  }
}

// 转译后
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var Demo = /*#__PURE__*/function () {
  function Demo() {
    (0, _classCallCheck2["default"])(this, Demo);
    this.word = 'hello babel';
  }
  (0, _createClass2["default"])(Demo, [{
    key: "say",
    value: function say() {
      console.log(this.word);
    }
  }]);
  return Demo;
}();
/* ---- 对比没有配置 @babel/plugin-transform-runtime ---- */
'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var Foo =
  /*#__PURE__*/
  (function () {
    function Foo() {
      _classCallCheck(this, Foo);
    }
    _createClass(Foo, [
      {
        key: 'saySth',
        value: function saySth() {}
      }
    ]);
    return Foo;
  })();
```

> 总结：单独一个 `@babel/runtime` 在编译时往文件上插入的代码(helper 函数)可能会产生冗余问题，一般都是配合 `@babel/plugin-transform-runtime` 来优化，把用到的 `helper` 函数改为对 `@babel/runtime` 内部的引用。这种方式相比较 `@babel/polyfill` 不会污染全局作用域，所以更适合用作类库，后者更适合做业务开发。

## babel plugin

插件是我们进行 DIY 的一个好方式，一起来学学。[babel handlebook - plugin](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)

上方已经介绍过 babel 的基本原理就不赘述了，也可以点击上方链接进去细看，下面介绍一下 Babel 内部模块的 API。

### @babel/parser(babylon)

`Babylon` 是 babel 的解释器，是 `@babel/parser` 的前生，关于 babylon 可以看[这里](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-babylon)。

```sh
npm i @babel/parser -s
```

```js
/* ------- test.js -------*/
import * as babelParser from '@babel/parser';

const code = `function sum(a, b){
  return a + b
}`;

const AST = babelParser.parse(code);
console.log(AST);
/* ------- 执行 -------*/
// 小tip，执行js脚本此类错误 SyntaxError: Cannot use import statement outside a module
// 需要去 package.json 中添加 "type": "module" (ESM) 或者改用 require().default 引入
node test.js
/* ------- babylon 转换后的结果 -------*/
Node {
  type: 'File',
  start: 0,
  end: 36,
  loc: SourceLocation {
    start: Position { line: 1, column: 0, index: 0 },
    end: Position { line: 3, column: 1, index: 36 },
    filename: undefined,
    identifierName: undefined
  },
  errors: [],
  program: Node {
    type: 'Program',
    start: 0,
    end: 36,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: undefined,
      identifierName: undefined
    },
    sourceType: 'script',
    interpreter: null,
    body: [ [Node] ],
    directives: []
  },
  comments: []
  /*  tokens 是babylon解析后的产物，放这里是为了做个对比，why？ */
  // tokens: [
  //   Token {
  //     type: [KeywordTokenType],
  //     value: 'function',
  //     start: 0,
  //     end: 8,
  //     loc: [SourceLocation]
  //   },
  //   // ... other tokens
  // ]
}
```

> @babel/parser 也可以传参，见[参数配置](https://babeljs.io/docs/en/babel-parser#options)

### @babel/traverse

`@babel/traverse` 即上方原理部分 `transformation` 中最重要那一环，通过 `访问者模式` 去修改 node 节点。

```sh
npm i @babel/traverse -D
```

```js
import * as babelParser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

const code = `function sum(a, b){
  return a + b
}`;

const AST = babelParser.parse(code);

traverse(AST, {
  enter(path) {
    if (path.isIdentifier({ name: 'a' })) {
      path.node.name = 'c';
    }
  }
});
```

> 注意：官网示例实际上有个 bug：`import traverse from '@babel/traverse';`，ESM 下这样子直接用 `traverse` 会报错，将会在 babel8 修复。

### @babel/types

Babel Types 模块是一个用于 AST 节点的 Lodash 式工具库，它包含了构造、验证以及变换 AST 节点的方法。 该工具库包含考虑周到的工具方法，对编写处理 AST 逻辑非常有用。详细 API 见[@babel/types doc](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#babel-types)

```sh
npm i @babel/types -s
```

```js
// ...
import * as t from "babel-types";

// ...
traverse(AST, {
  enter(path) {
    if (t.isIdentifier(path.node, { name: 'a' })) {
      path.node.name = 'c';
    }
  }
});
```

> API 很多，具体见[@babel/types](https://babeljs.io/docs/en/babel-types)

### @babel/generator

最后将 AST 还原成我们想要的代码。

```sh
npm install @babel/generator -D
```

一个完整的例子：

```js
import generate from "@babel/generator";
import * as babelParser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = _traverse.default;
const generate = _generate.default;

const code = `function sum(a, b){
  return a + b
}`;

const AST = babelParser.parse(code);

traverse(AST, {
  enter(path) {
    if (path.isIdentifier({ name: 'a' })) {
      path.node.name = 'c';
    }
  }
});

const output = generate(
  AST,
  {
    /*options*/
  },
  code
);
console.log('📌📌📌 ~ output', output);
/* ----------- output ---------- */
📌📌📌 ~ output {
  code: 'function sum(c, b) {\n  return c + b;\n}',
  decodedMap: undefined,
  map: [Getter/Setter],
  rawMappings: [Getter/Setter]
}
```

## [编写你的第一个 Babel 插件](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#%E7%BC%96%E5%86%99%E4%BD%A0%E7%9A%84%E7%AC%AC%E4%B8%80%E4%B8%AA-babel-%E6%8F%92%E4%BB%B6)

实践第一步先小试牛刀把一个 `hello` 方法，改名为 `world` 方法：

```js
const hello = () => {}
```

> 前期不熟悉 AST 各种标识的情况下，可以去[AST 在线平台转换(基于 acorn)](https://astexplorer.net/)查看对应的 AST。

```js
/**
 * 从上方的网站找到了 hello 的节点位置：
 * "id": {
 *  "type": "Identifier",
 *  "start": 6,
 *  "end": 11,
 *  "name": "hello"
 * },
 */
// plugin-hello.js，在本地这么写是ok的
// 但是想要发布为一个包并应用配置则得按照官方插件的样式去写
export default function ({ types: t }) {
  return {
    visitor: {
      Identifier(path, state) {
        if (path.node.name === 'hello') {
          path.replaceWith(t.Identifier('world'));
        }
      }
    }
  };
}

// 在插件中配置 "plugins": [["./plugin-hello.js"]]，编译后结果:
/**
 * "use strict";
 *
 *  var world = function world() {};
 */
```

解释一下：

1. `export default function(api, options, dirname){}`的三个参数：
   - `api`：就是 babel 对象，可以从中获取 `types(@babel/types)`、`traverse(@babel/traverse)` 等很多实用的方法
   - `options`：插件入参，即在配置文件中跟随在插件名后面的配置
   - `dirname`：文件路径
2. 这个函数必须返回一个对象，对象内有一些内置方法和属性：
   - `name`，babel 插件名字，遵循一定的[命名规则](https://babeljs.io/docs/en/options#name-normalization)
   - `pre(state)`，在遍历节点之前调用
   - `visitor`对象，前面说的访问者模式，真正对 AST 动手术的部分，其内部根据各种标识符比如 `"type": "Identifier"`，决定对 AST 使用哪种手术刀 `Identifier(path, state)`，也可以写成带`enter(path,state)`和`exit(path, state)` 方法的对象。`path` 之前讲过是两个节点之间连接的对象，这是一个可操作和访问的巨大可变对象，是动手术的原材料；`state` 则是告知手术进行到了哪一步，因为每个 `visitor` 属性之间互不关联，`state` 可以帮助传递状态
   - `post(state)`，在遍历节点之后调用
   - `inherits`，指定继承某个插件，通过 Object.assign 的方式，和当前插件的 options 合并。
   - `manipulateOptions`：用于修改 options，是在插件里面修改配置的方式，[参考此插件](https://github.com/babel/babel/blob/main/packages/babel-plugin-syntax-explicit-resource-management/src/index.ts)

### babel-plugin-log-shiny

来个实践，平时我们 `console.log()` 打印信息总是会淹没在各种打印里，因此简单开发一个插件，让我们能及时找到我们需要的打印信息，这是我的插件地址 [babel-plugin-log-shiny](https://github.com/yokiizx/babel-plugin-log-shiny.git)，欢迎试用和提问题~

安装：

```sh
npm i babel-plugin-log-shiny -D
```

配置：

```json
{
  "plugins": [
    [
      "log-shiny",
      {
        "prefix": "whatever you want~ like 🔥"
      }
    ]
  ]
}
```

## 参考

- [babel 官网](https://babeljs.io/)
- [the super tiny compiler](https://github.com/jamiebuilds/the-super-tiny-compiler/blob/master/the-super-tiny-compiler.js)
- [babel book(有些已过时)](https://github.com/jamiebuilds/babel-handbook)
- [带你在 Babel 的世界中畅游](https://mp.weixin.qq.com/s/4thcIAZ4CYwQRB265vjd6w)
- [Babel 插件入门](https://blog.csdn.net/ByteDanceTech/article/details/126900235)
- [@babel/types 深度应用](https://juejin.cn/post/6984945589859385358#heading-6)
- [generator-babel-plugin](https://github.com/babel/generator-babel-plugin)
- [AST 在线平台转换(基于 acorn)](https://astexplorer.net/)
