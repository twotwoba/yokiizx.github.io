---
title: 'curry 和 compose'
date: 2022-09-25T19:28:38+08:00
tags: [JavaScript]
---

## 函数式编程

面向对象编程是我们平时所熟悉的，函数式编程比较抽象，它的目标是：  
使用函数来**抽象作用在数据之上的控制流及操作**，从而在系统中**消除副作用**，**减少对状态的改变**。

特点：

1. 声明式编程  
   比如 map 只关注输入和结果，用表达式来描述程序逻辑， 而 常规的 for 循环命令式控制过程还关注具体控制和状态变化
2. 纯函数
   1. 仅取决于提供的输入
   2. 不会造成或超出其作用域的变化。 比如修改全局对象或引用传递的参数，打印日志，时间等
3. 引用透明  
   一个函数对于相同的输入始终产生相同的结果，那就是引用透明的
4. 不可变性  
   存储不可变数据，不可变数据就是创建后不能更改，但是对于对象、数组有可能改变其内容来产生副作用，如 sort 函数，会改变原数组的引用

柯里化与合成函数是函数式编程的典范，必须牢牢掌握。

### curry

柯里化，其实就是针对函数多个参数的处理，把多个参数变为可以分步接收计算的方式。形如`f(a,b,c) -> f(a)(b)(c)`

实现也比较简单：

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function (...args2) {
        return curried.apply(this, args.concat(args2)); // 借助curried累加参数
      };
    }
  };
}

// test
const sum = (a, b, c) => a + b + c;
const currySum = curry(sum);
console.log(currySum(1, 2, 3)); // 6
console.log(currySum(1)(2, 3)); // 6
console.log(currySum(1, 2)(3)); // 6
```

柯里化的孪生兄弟 -- 偏函数，个人见解：  
就是在 curry 之上，初始化时固定了部分的参数，注意两者累加参数的方式不太一样哦。

```js
/**
 * args 为固定的参数
 */
function partial(fn, ...args) {
  return function (...args2) {
    const _args = args.concat(args2);
    if (_args.length >= fn.length) {
      return fn.apply(this, _args);
    } else {
      return partial.call(this, fn, ..._args); // 借助 partial 累加参数
    }
  };
}

// test
const partialSum = partial(sum, 100)
console.log(partialSum(1, 1)) // 102
console.log(partialSum(1)(2)) // 103
```

### compose

compose 合成函数是把多层函数嵌套调用扁平化，内部函数执行的结果作为外部面函数的参数。

```js
function compose() {
  // 可以加个判断参数是否合格, 此处省略
  const fns = [...arguments]
  return function () {
    let lastIndex = fns.length - 1
    let res = fns[lastIndex].call(this, ...arguments)
    while (lastIndex--) {
      res = fns[lastIndex].call(this, res)
    }
    return res
  }
}

// test
const fn1 = x => x + 10
const fn2 = (x, y) => x + y

const test = compose(fn1, fn2)
console.log(test(10, 20)) // 40
```

也可以使用 reduceRight 来实现 compose

与之对应的是 pipe 函数，只不过是从左往右执行。这里就用 reduce 来实现一下吧：

```js
function pipe(...fns) {
  return function (args) {
    return fns.reduce((t, cb) => cb(t), args);
  };
}
```

## 参考

- [函数式编程入门教程](http://www.ruanyifeng.com/blog/2017/02/fp-tutorial.html)
