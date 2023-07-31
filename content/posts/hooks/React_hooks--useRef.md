---
title: 'React hooks--useRef'
date: 2023-07-26T11:47:25+08:00
tags: []
series: [hooks]
categories: [React hooks]
weight: 3
# draft: true
---

## useRef

<!-- `useRef(initialValue)` 在源码中的形式为 `{current: initialValue}`，保存在 `hook.memoizedState` 上。 -->

`const ref = useRef(initialValue)`

`ref` 就是引用，vue 中也有类似的概念，在 react 中 ref 是一个形如 `{current: initialValue}` 的对象，不仅可以用来**操作 DOM**，也可以**承载数据**。

### 与 useState 的区别

既然能承载数据，那么和 `useState` 有什么渊源呢？让我们看看官网的一句话：`useRef is a React Hook that lets you reference a value that’s not needed for rendering.`，重点在后半句，大概意思就是**引用了一个与渲染无关的值**。

在承载数据方面，这就是与 `useState` 最大的区别：

- `useRef` 引用的数据在改变后不会影响组件渲染，类似于函数组件的一个实例属性
- `useState` 的值改变后会引发重新渲染

### TS 环境下的使用

在 TS 环境下，往往你可能会遇到此类报错：  
`Type '{ ref: RefObject<never>; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'ref' does not exist on type 'IntrinsicAttributes'.ts(2322)`

这就需要做一定的类型处理了。

前置先介绍两个 api：

1. 因为函数不能直接接收 ref，所以在子组件中使用 `forwardRef` 这个 api 来传递进子组件。在类组件时代也常用来跨祖孙组件传递 ref, 比如 HOC。
2. 父组件想要访问子组件的数据，需要使用 `useImperativeHandle` 这个 api 对外暴露。

```tsx
// 父组件
const Demo: FC = () => {
  // 给自定义组件添加 ref，需要使用 ElementRef<typeof 组件> 来获取 ref 的类型
  const SonRef = useRef<ElementRef<typeof Son>>(null)

  const handleClick = () => {
    SonRef.current?.test()
  }

  return (
    <>
      <Son ref={SonRef}></Son>
      <button onClick={() => handleClick()}>click</button>
    </>
  )
}

// 子组件 两种方式设置 ref 类型
// 1. 用泛型，注意与参数的位置是相反的
const Son = forwardRef<typeRef, {}>((props, ref) => {
  useImperativeHandle(ref, () => {
    return {
      test: () => console.log('hello world')
    }
  })
  return (
    <>
      <div> hello world</div>
    </>
  )
})

// 2. 在参数中使用 Ref
// const Son = forwardRef((props, ref: Ref<typeRef>) => {})
```

## reference

- [useRef](https://react.dev/reference/react/useRef)
- [forwardRef](https://react.dev/reference/react/forwardRef)
