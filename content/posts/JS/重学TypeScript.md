---
title: 'TypeScript自用手册'
date: 2023-03-07T11:39:43+08:00
tags: [TypeScript]
---

编程语言，用进废退 🤦🏻‍♀️ 好久没用感觉都忘了，还是整理一下常用的东西吧，太基础的就看文档好了，记录一下必要的以及平时踩的坑。

> 基于 TypeScript v4.9.5

---

## 基础

<details>
<summary>点击查看详细内容</summary>

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

`as const` 类似的断言也出现在 rest arguments

```TS
// Inferred as 2-length tuple
const args = [8, 5] as const;
const angle = Math.atan2(...args);
```

---

##### 函数类型

- 函数表达式
  ```TS
  type Fn = (p: string) => void
  ```
- 调用签名
  ```TS
  type DescribableFunction = {
    description: string;
    (someArg: number): boolean;
  };
  interface CallOrConstruct {
    new (s: string): Date; // 构造函数类型
    (n?: number): number;
  }
  ```

##### 函数的泛型

当函数的『输入、输出有关联』或者『输入的参数之间』有关联，那么就可以考虑到使用泛型了。

```TS
// 这样函数调用后的返回数据的类型会被 「自动推断」 出来
function firstEl<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 「泛型约束」 也使用 extends 关键字, 下方T必须具有一个length属性
function first<T extends {length: number}>(p: T[]): T | undefined {
  return p[0];
}

// 有时候泛型不确定可能有不同值，那么在--调用的时候--需要 「手动指明」
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2);
}
const demo = combine<string | number>([1,2,3], ['hello'])
```

##### 函数重载

```TS
function fn(x: boolean): void;
function fn(x: string): void;
// Note, implementation signature needs to cover all overloads
function fn(x: boolean | string) {
  console.log(x)
}
```

##### unknown | void | never

- unknown，相比 any 更加安全，比如：
  ```TS
  function demo(a: unknown) {
    a.b() // ts 会提示 'a' is of type 'unknown'
  }
  ```
- void， 不是表示不返回值，而是会忽略返回值

  ```TS
  type voidFunc = () => void;
  const fn: voidFunc = () => true; // is ok
  const a = fn() // a is void type

  // but! 如果直接字面量function声明的话 机会报错
  function f2(): void {
    // @ts-expect-error
    return true; // 没有上方注释就会报错了
  }
  ```

- never，表示不存在的类型

---

##### 索引签名

预先不清楚具体属性名，但是知道数据结构就可以使用这个了。

能做索引签名的有这几种：

- string
- number
- symbol
- 模板字符串
- 以上四种的组合的联合类型

需要注意的是，如果对象中同时存在两个索引，那么其他索引的返回类型必须是 string 索引的子集：

```TS
interface Animal {
  name: string;
}
interface Dog extends Animal {
  age: string;
}
// Animal 和 Dog 交换一下才对
interface Demo {
  [x: number]: Animal;
  [x: string]: Dog;
}
```

##### 对象的泛型

更优雅的处理对象类型，这可以帮助我们避免写函数重载。

```TS
interface Demo<T> {
  type: T;
}
const a: Demo<string> = {
  type: 'hello'
}
```

`type` 别名表示范围比 `interface` 接口更大，所以对于泛型的使用范围更广：

```TS
type OrNull<Type> = Type | null;

type OneOrMany<Type> = Type | Type[];

type OneOrManyOrNull<Type> = OrNull<OneOrMany<Type>>; // 等价于 OneOrMany<Type> | null

type OneOrManyOrNullStrings = OneOrManyOrNull<string>; // 等价于 string | string[] | null
```

---

##### class 相关

`strictPropertyInitialization` 控制 class 中的属性必须初始化。

[classes 基础](https://www.typescriptlang.org/docs/handbook/2/classes.html)

<details>
<summary>一个高阶知识：1. 父类构造器总是会使用它自己字段的值，而不是被重写的那一个，2. 但是它会使用被重写的方法。这是类字段和类方法一大区别，另一大区别就是this的指向问题了，类字段赋值的方法可以保证this不丢失。</summary>

```JavaScript
class Animal {
  showName = () => {
    console.log('animal');
  };

  constructor() {
    this.showName();
  }
}

class Rabbit extends Animal {
  showName = () => {
    console.log('rabbit');
  };
}

new Animal(); // animal
new Rabbit(); // animal
/* ---------- 因为上方都是类字段，父构造器只使用自己的字段值而不是重写的---------- */
class Animal {
  showName() {
    console.log('animal');
  }
  constructor() {
    this.showName();
  }
}

class Rabbit extends Animal {
  showName() {
    console.log('rabbit');
  }
}

new Animal(); // animal
new Rabbit(); // rabbit
```

另一个知识点就是为什么子类构造器中想要使用 this 必须先调用 `super()`？

在 JavaScript 中，继承类（所谓的“派生构造器”，英文为 “derived constructor”）的构造函数与其他函数之间是有区别的。派生构造器具有特殊的内部属性 [[ConstructorKind]]:"derived"。这是一个特殊的内部标签。该标签会影响它的 new 行为：

- 当通过 new 执行一个常规函数时，它将创建一个空对象，并将这个空对象赋值给 this。
- 但是当继承的 constructor 执行时，它不会执行此操作。它期望父类的 constructor 来完成这项工作

因此，派生的 constructor 必须调用 super 才能执行其父类（base）的 constructor，否则 this 指向的那个对象将不会被创建。并且我们会收到一个报错。

</details>

</details>

- public，默认值
- protected，父类自身和子类可以访问，实例不行
- private，只有父类自身访问，实例不行

抽象类，(abstract) 不能被实例化，可以被继承，抽象属性和方法在子类中必须被实现。

##### enum 枚举类型

枚举比较特别，它不是一个 type-level 的 JS 拓展。

```TS
enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right'
}
/* ---------- 编译后 ---------- */
var Direction;
(function (Direction) {
    Direction["Up"] = "up";
    Direction["Down"] = "down";
    Direction["Left"] = "left";
    Direction["Right"] = "right";
})(Direction || (Direction = {}));
```

可以看见，枚举类型编译后实际上是创建了一个完完整整的对象的。

如果枚举类型未被初始化，默认从 0 开始。值为数字的枚举会被编译成如下模式：

```TS
enum Type {
  key
}
Type[Type["key"] = 0] = "key";
// 这样 Type[0] == key || Type[key] == 0

// 如果想要只能通过 key 访问，可以设置为常量枚举:
const enum Type {
  key
}
```

## 类型操控

##### keyof

获取其他类型的 「键」 收集起来 组合成联合类型。

```TS
type Point = { x: number; 1: number };
type P = keyof Point;

const d: P = 'x'
const d: P = 1

// 对于索引签名 keyof 获取到其类型，特殊的：索引签名为字符串时，keyof拿到的类型是 string|number
type Mapish = { [k: string]: boolean };
type M = keyof Mapish;

const a: M = '1234';
const b: M = 1234;
```

##### typeof

对应基本类型，typeof 和 js 没什么区别。主要应用在引用类型。

```TS
type fn = () => boolean;
type x = ReturnType<fn>; // x: boolean

/* ---------- 如果想直接对一个函数进行返回类型的获取就得用到typeof了 ---------- */
const demo = () => true;
type y = ReturnType<typeof demo>; // y: boolean
```

##### 索引访问类型

```TS
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];
// 注意: 不能通过设置变量 x 为 'age'，然后通过 Person[x] 来获取
// 但是，可以通过设置type x = ‘age'，再通过 Person[x] 来获取
```

特殊的，针对数组，可以通过 `number` 和 `typeof` 来获取到数组每个元素类型组成的联合类型：

```TS
const Arr = [
  'hello',
  18,
  {
    man: true
  }
];

type demo = typeof Arr[number];

// type demo = string | number | {
//     name: boolean;
// }
```

##### 映射类型

如果当两种类型 key 一样，只是改变了其对应的类型，那么就可以考虑基于索引类型的类型转换了。

```TS
type FeatureFlags = {
  darkMode: () => void;
  newUserProfile: () => void;
};
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};

type FeatureOptions = OptionsFlags<FeatureFlags>;

// type FeatureOptions = {
//     darkMode: boolean;
//     newUserProfile: boolean;
// }

// 可以通过 -readonly -? 来去除原来的描述符
```

TS4.1 版本之后，可以通过 `as` 关键字来重命名获取到的 key。

```TS
type MappedTypeWithNewProperties<Type> = {
    [Properties in keyof Type as NewKeyType]: Type[Properties]
}

// NewKeyType 往往是使用 模板字符串
type Getters<Type> = {
    [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property]
};

interface Person {
    name: string;
    age: number;
    location: string;
}

type LazyPerson = Getters<Person>;

// type LazyPerson = {
//     getName: () => string;
//     getAge: () => number;
//     getLocation: () => string;
// }
```

## 有用内置类型操作

参见 [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

记几个常用的吧：

- Awaited<Type>
- Partial<Type>
- Required<Type>
- Readonly<Type>
- Record<Keys, Type>

  ```TS
  // keyof any  === string | number | symbol
  type Record<K extends keyof any, T> = {
    [P in K]: T;
  };
  ```

- Pick<Type, keys>
  ```TS
  type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };
  ```
- Omit<Type, keys>
  ```TS
  // omit 忽略
  type Omit<T , K extends keyof any> = Pick<T, Exclude<keyof T, K>>
  ```
- Exclude<UnionType，ExcludedMembers>
  ```TS
  // 注意：这个是针对联合类型的，当 T 为联合类型时，会触发自动分发
  // 1 | 2 extends 3 === 1 extends 3 | 2 extends 3
  type Exclude<T, U> = T extends U ? never : T;
  ```
- Extract<Type, Union>
  ```TS
  // 提取
  type Extract<T, U> = T extends U ? T : never;
  ```
- NonNullable<Type>
- ReturnType<Type>

##### 常见报错

- `Cannot redeclare block-scoped variable 'xxx'` || `Duplicate function implementation` 这种错误除了在自身文件中有重复声明，也有可能是因为在上下文中被声明了，比如你 tsc 一个 ts 文件后，ts 文件内的代码就会飘出此类报错~

## 参考

- [TypeScript 官网](https://www.typescriptlang.org/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
