# 老生常谈 -- 隐式转换


背景: js 中使用 ==、+ 会进行隐式转换
重点: `Symbol.toPrimitive(input,preferedType?)`，针对的是对象转为基本类型，preferedType 默认为 number，也可以是字符串。

### 装箱拆箱

- 装箱 : `1 .toString()`(注意前面的有个空格哦)  
  实际上是个装箱过程 `Number(1).toString()` --> '1';
- 拆箱 : `toPrimitive(input,preferedType?)`

### toPrimitive 规则:

1. 原始值直接返回
2. 否则，调用 `input.valueOf()`，如果结果是原始值,返回结果
3. 否则，调用 `input.toString()`，如果是原始值,返回结果
4. 否则，抛出错误

> 如果 preferedType 为 string，那么 2,3 执行顺序对调

### 一般符号的规则:

1. 如果`{}`既可以被认为是代码块，又可以被认为是对象字面量，那么 js 会把他当做代码块来看待
2. '+' 符定义: 如果其中一个是字符串，另一个也会被转换为字符串（preferedType 为 string），否则两个运算数都被转换为数字（preferedType 为 number）
3. 关系运算符`>、<、==`数据转为 number 后再比较（preferedType 为 number），注意,如果两边都是字符串调用的是 `number.charCodeAt()`这个方法来转换

### 经典面试题

1.

```js
[] + []   // ->  '' + ''     ->  ''
[] + {}   // ->  '' + "[object Object]"
{} + []   // ->  代码块 + ''  -> 0
![] == [] // ->  false == '' -> 0 == 0 -> true
```

> 空数组/空对象 调用 valueOf() 返回的是自身  
> 空数组/空对象 调用 toString() 返回的分别是 '' / "[object Object]"

2.

```js
let a = {
  i: 1,
  valueOf() {
    return a.i++
  }
}
if (a == 1 && a == 2 && a == 3) {
  console.log('make it come true')
}
```

