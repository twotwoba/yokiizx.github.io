---
title: '重学TypeScript'
date: 2023-03-07T11:39:43+08:00
tags: [TypeScript]
---

编程语言，用进废退 🤦🏻‍♀️ 好久没用感觉都忘了，还是整理一下常用的东西吧，太基础的就看文档好了，记录一下必要的以及平时踩的坑。

> 基于 TypeScript v4.9.5

---

## 基础

##### 两个基础配置

- noImplicitAny，开启后，类型被推断为 any 将会报错
- strictNullChecks，开启后，null 和 undefined 只能被赋值给对应的自身类型了

##### 联合类型

注意点是：在调用联合类型的方法前，除非这个方法在联合类型的所有类型上都有，否则必须明确指定是哪个类型，才能调用。

```TS
function test(type: string | string[]) {
  type.toString();    // no problem, both have methods toString()
  type.toLowerCase(); // error 👇🏻
  // it should be： typeof type === 'string' && type.toLowerCase()
  // 在 TS 中，这叫做 收紧 Narrow，typeof/instanceof/in/boolean/equal/assert
}
```

对于下方类似对象中某个值使用联合类型且「作为函数入参」的处理：

```TS
// bad
interface Shape {
  kind: "circle" | "square";  // 即使确定了是circle, 但是使用radius还得做一次非空断言
  radius?: number;
  sideLength?: number;
}
function getArea(shape: Shape) {
  if (shape.kind === 'circle') {
    return Math.PI * shape.radius! ** 2; // 需要非空断言 (在变量后添加!,用以排除null和undefined)
  }
}

// good
interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  sideLength: number;
}
type Shape = Circle | Square; // 这样确定为某一个类型后,使用对应的属性不再用作非空断言了

function getArea(shape: Shape) {
  if (shape.kind === 'circle') {
    return Math.PI * shape.radius ** 2;
  }
}
```

##### type 和 interface

- type
  - 其他类型的别名，可以是任何类型。
  - 不能重复声明
  - 对象类型通过 `&` 实现拓展
- interface
  - 只能表示对象。
  - 重复声明会合并
  - 对象类型通过 `extends` 实现拓展

##### 类型断言

有 `as` 和 `<T>var` 两种方式。在 `tsx`中只能使用`as`的方式。遇到复杂类型断言，可以先断言为`any`或`unknown`：

```TS
const demo = (variable as any) as T
```

##### 对象中的字面量类型

```TS
// 此处的method会被推断为 string
const req = { url: "https://example.com", method: "GET"}
// 想要让 「整个」 对象的所有字符串都变成字面量类型，可以使用 as const
const req = { url: "https://example.com", method: "GET"} as const
// 如果只想让对象中的某个属性变为字面量类型，单独使用断言即可
const req = { url: "https://example.com", method: "GET" as "GET"}
```

##### 常见报错

- `Cannot redeclare block-scoped variable 'xxx'` || `Duplicate function implementation` 这种错误除了在自身文件中有重复声明，也有可能是因为在上下文中被声明了，比如你 tsc 一个 ts 文件后，ts 文件内的代码就会飘出此类报错~

## 参考

- [TypeScript 官网](https://www.typescriptlang.org/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
