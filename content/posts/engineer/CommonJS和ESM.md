---
title: 'CommonJS和ESM'
date: 2022-09-20T17:09:03+08:00
tags: [engineer, module]
---

## CommonJS

一个文件，一个模块，一个作用域，文件内的变量都是私有的。
module 就是当前模块，通过它的属性 exports 对外暴露变量和方法，通过 require 来引入。
在服务器端，模块的加载是运行时同步加载的；在浏览器端，模块需要提前编译打包处理。

```JavaScript
// node 对 js 文件编译后添加了呃顶层变量
(function(exports,require,module,__filename,__dirname) {
	// 文件模块
})
// module.exports最终返给了调用方
```

特点：导出的是值的拷贝，模块加载一次就会被缓存，后续再加载就是加载的缓存

> 也就是说，一旦输出一个值，模块内部的变化就影响不到这个值

```JavaScript
// main.js
const {a, aPlusOne} = require('./b') // b 中 a = 100

console.log(a);  // 100
aPlusOne();
console.log(a); // 100
```

##### 为什么有了 exports 还要 module.exports

这两默认实际上是指向同一块内存的，exports 是 module.exports 的引用。注意上方，编译后,exports 是以形参的方式传入的，形参被赋值后会改变形参的引用，但并不能改变作用域外的值。这也是为什么`exports = {...}` 无效的原因。

## ES module

先看看这个[ES modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)

三大阶段

- 构建：建立模块之间的连接，生成模块记录
- 实例化：完成模块内变量的声明与模块记录之间的绑定
- 执行：按照深度优先的顺序，逐行执行代码，每个模块只会被执行一次，往内存中填入实际的值

## 两者不同点

1. CommonJS ESM 是在编译时输出接口(处理各模块的关系)
2. CommonJS 输出的是值的拷贝，ESM 输出的是值的引用
3. 循环加载的处理不同
   - CommonJS `只输出已经执行的部分`，加载时也只能加载到执行了的部分。因为加载时`Module`会对导入 `module` 进行缓存(注意 module 和 Module 是两个不同的概念)，然后把 `module 上的 loaded 属性`从 false 变为 true，再次被 require 时就不会去加载而是直接从缓存中获取了，数据的修改变动也会修改缓存中的数据。
   - ESM 遇到 import 时不会去执行模块，只是生成一个指向被加载模块的引用，只要这个引用保证真正取值时能够取到值存在就行。使用 module map 来标记进入过的模块为‘获取中（fetching）’。

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

## 参考

- [为什么模块循环依赖不会死循环？](https://mp.weixin.qq.com/s/t-TUAzL0q0oK7HsDVQRNMw)
- [CommonJS 循环加载案例](https://nodejs.org/api/modules.html#modules_cycles)
- [JavaScript 模块的循环加载](http://www.ruanyifeng.com/blog/2015/11/circular-dependency.html)
