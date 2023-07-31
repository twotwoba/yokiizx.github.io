---
title: 'React hooks--useState&useReducer'
date: 2023-07-25T11:47:25+08:00
tags: []
series: [hooks]
categories: [React hooks]
weight: 1
---

## useState

React hooks 的出现一大作用就是让函数具有了 state，进而才能全面的拥抱函数式编程。

函数式编程的好处就是两个字：`干净`，进而可以很好的实现逻辑复用。

```tsx
const [state, setState] = useState(initialState)
```

### 心智模型(重要)

在函数组件中所有的状态在一次渲染中实际上都是`不变的，是静态的`，你所能看到的 `setState` 引起的渲染其实已经是下一次渲染了。理解这一点尤为重要。

```tsx
const [number, setNumber] = useState(0)

const plus = () => {
  setNumber(number + 1)
  setNumber(number + 1)
  setNumber(number + 1)
  console.log('plus ---', number) //  输出仍然为 0
}

useEffect(() => {
  console.log('effect ---', number) // 输出为 1，因为setNumber(number + 1) 的number在这次渲染流程中始终都是 0 !!!
}, [number])

/* ---------- 如果依赖于前一次的状态那么应该使用函数式写法 ---------- */
const plus = () => {
  setNumber((prev) => prev + 1) // 更新函数 prev 准确的说是pending state
  setNumber((prev) => prev + 1)
  setNumber((prev) => prev + 1)
  console.log('plus ---', number) //  输出为 0
}

useEffect(() => {
  //因为更新函数会被保存到一个队列,在下一次渲染的时候每个函数会根据前一个状态来动态计算
  console.log('effect ---', number) // 输出为 3
}, [number])
```

两个小点：

- 如果 setState 的值与前一次渲染一样（依据 Object.is），则不会触发重新渲染
- setState 的动作是批量更新的，想要立马更新使用 flushSync api

### 初始化值为函数类型注意点

另一点是 `initialState`，可以是`任何类型`，当为函数类型时需要注意：

- useState(initFn())，这是传了函数执行后的结果，每次渲染都会执行，效率较低
- useState(initFn)，这是把函数自身传过去

---

## useReducer

const [state, dispatch] = useReducer(reducer, initialArg, init?)

## reference

- [useState](https://react.dev/reference/react/useState)
