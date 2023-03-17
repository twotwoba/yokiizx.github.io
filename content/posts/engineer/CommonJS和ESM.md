---
title: 'CommonJS和ESM'
date: 2022-09-20T17:09:03+08:00
tags: [engineer, module, node]
---

## CommonJS

一个文件，一个模块，一个作用域，文件内的变量都是私有的。

`module` 就是当前模块，通过它的属性 `exports` 对外暴露变量和方法，通过 `require(path/模块名)` 来引入。

CJS 输出的是值的拷贝。

`module.exports`：

```JavaScript
// node 对 js 文件编译后添加了呃顶层变量
(function(exports,require,module,__filename,__dirname) {
	// 文件模块
})
// module.exports最终返给了调用方
```

`require` 模块加载一次就会被缓存，后续再加载就是加载的缓存。也就是说，一旦输出一个值，模块内部的变化就影响不到这个值

```JavaScript
// main.js
const {a, aPlusOne} = require('./b') // b 中 a = 100

console.log(a);  // 100
aPlusOne();
console.log(a); // 100
```

`require`：

```JavaScript
 // id 为路径标识符
function require(id) {
   /* 查找  Module 上有没有已经加载的 js  对象*/
   const  cachedModule = Module._cache[id]

   /* 如果已经加载了那么直接取走缓存的 exports 对象  */
  if(cachedModule){
    return cachedModule.exports
  }

  /* 创建当前模块的 module  */
  const module = { exports: {} ,loaded: false , ...}

  /* 将 module 缓存到  Module 的缓存属性中，路径标识符作为 id */
  Module._cache[id] = module
  /* 加载文件 */
  runInThisContext(wrapper('module.exports = "123"'))(module.exports, require, module, __filename, __dirname)
  /* 加载完成 *//
  module.loaded = true
  /* 返回值 */
  return module.exports
}
```

##### module.exports 和 exports

这两默认实际上是指向同一块内存的，exports 是 `module.exports` 的引用。注意上方，编译后 exports 是以形参的方式传入的，形参被赋值后会改变形参的引用，但并不能改变作用域外的值，也就是说 `module.exports` 此时实际上是没有挂载上值的。这也是为什么`exports = {...}` 无效的原因。

## ES module

先看看这个[ES modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)

三大阶段

- 构建：建立模块之间的连接，生成模块记录
- 实例化：完成模块内变量的声明与模块记录之间的绑定
- 执行：按照深度优先的顺序，逐行执行代码，每个模块只会被执行一次，往内存中填入实际的值

## 总结 CJS 和 ESM 不同点

- CJS 是动态的，运行时决定各模块的关系，可以动态加载。本质上导出的 `module.exports` 属性，是值的拷贝。CJS 会对进行缓存，`require` 时会检查是否存在缓存，借助「模块缓存」来解决循环依赖的问题，每次加载到已经执行了的部分，再次加载时读取的是缓存，如果此时数据被改动，缓存中的数据也会改动。
- ESM 是静态的，编译时处理好各模块关系，不能动态加载。本质上输出的值的引用，可以混合导出。可以进行 tree-shaking。借助「模块地图」来解决循环依赖的问题，已经进入过的模块标注为获取中(pending)，遇到 import 语句会去检查这个地图，已经标注为获取中的则不会进入，地图中的每一个节点是一个模块记录，上面有导出变量的内存地址，导入时会做一个连接——即指向同一块内存。

## node 中使用 ESM

node v12 之前借助 babel：

```JSON
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "node": "8.9.0",
        "esmodules": true
      }
    }]
  ]
}
```

node v12 之后原生支持 ESM：

- `.mjs` 拓展名
- `package.json` 文件设置：`"type": "module"`

## 参考

- [Commonjs 和 Es Module 到底有什么区别？](https://mp.weixin.qq.com/s/6VncXyYo_UKxymvsUJyY5w)
- [为什么模块循环依赖不会死循环？](https://mp.weixin.qq.com/s/t-TUAzL0q0oK7HsDVQRNMw)
- [CommonJS 循环加载案例](https://nodejs.org/api/modules.html#modules_cycles)
- [JavaScript 模块的循环加载](http://www.ruanyifeng.com/blog/2015/11/circular-dependency.html)
