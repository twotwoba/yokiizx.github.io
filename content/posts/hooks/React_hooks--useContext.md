---
title: 'React hooks--useContext'
date: 2023-07-27T11:47:25+08:00
tags: []
series: [hooks]
categories: [React hooks]
weight: 4
---

## useContext

`const value = useContext(SomeContext)`

简单理解就是使用传递下来的 context 上下文，这个 hook 不是独立使用的，需要先创建上下文。

### createContext

`const SomeContext = createContext(defaultValue)`

创建的上下文有 `Provider` 和 Consumer(过时)：

```tsx
<SomeContext.Provider value={name: 'hello world'}>
  <YourComponent />
</SomeContext.Provider>

// useContext 替代 Consumer
const value = useContext(SomeContext)
```

`useContext` 获取的是离它**最近**的 `Provider` 提供的 `value` 属性，如果没有 Provider 就去读取对应 `context` 的 `defaultValue`。

### 性能优化

当 `context` 发生变化时，会自动触发使用了它的组件重新渲染。因此，当 Provider 的 value 传递的值为**对象或函数**时，应该使用 `useMemo` 或 `useCallback` 将传递的值包裹一下避免整个子树组件的无效渲染(比如在 useEffect 中讲过的：函数在每次渲染中都是新的函数)。

## reference

- [createContext](https://react.dev/reference/react/createContext)
- [useContext](https://react.dev/reference/react/useContext)
