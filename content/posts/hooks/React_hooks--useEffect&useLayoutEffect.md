---
title: 'React hooks--useEffect&useLayoutEffect'
date: 2023-07-25T21:47:25+08:00
tags: []
series: [hooks]
categories: [React hooks]
weight: 2
# draft: true
---

## useEffect

`useEffect(() => { setup, dependencies?)`

### 执行时机

useEffect 是异步的：  
`setup` 函数在 DOM 被渲染后执行。如果 setup 返回了 `cleanup` 函数，会`先执行 cleanup，再执行 setup`。  
当组件挂载时都会先调用一次 `setup`，当组件被卸载时，也会调用一次 `cleanup`。

> 值得注意，`cleanup` 里的状态是上一次的状态，即它被 return 那一刻的状态，因为它是函数嘛，类似快照。

关于 dependencies：

- 无，每次都会执行 setup
- []，只会执行一次 setup
- [dep1,dep2,...]，当有依赖项改变时（依据 Object.is），才会执行 setup

### 心智模型--每一次渲染的 everything 都是独立的

一个看上去反常的例子：

```tsx
// Note： 假设 count 为 0
useEffect(
  () => {
    const id = setInterval(() => {
      setCount(count + 1) // 只会触发一次 因为实际上这次渲染的count永远为 0，永远是0+1
    }, 1000)
    return () => clearInterval(id)
  },
  [] // Never re-runs
)
```

因此需要把 count 正确的设为依赖，才会触发再次渲染，但是这么做又会导致每次渲染都先 cleanup 再 setup，这显然不是高效的。可以使用类似于 setState 的函数式写法：`setCount(c => c + 1)` 即可。这么做是既告诉 React 依赖了哪个值，又不会再次触发 effect 。

> 并不是 dependencies 的值在“不变”的 effect 中发生了改变，而是 effect 函数本身在每一次渲染中都不相同。

然而，如果 setCount(c => c + 1) 变成了 `setCount(c => c + anotherPropOrState)`，还是得把 anotherPropOrState 加入依赖，这么做还是需要不停的 cleanup/setup。一个推荐的做法是使用 `useReducer`：

```tsx
useEffect(
  () => {
    const id = setInterval(() => {
      dispatch({ type: 'add_one_step' })
    }, 1000)
    return () => clearInterval(id)
  },
  [dispatch] // React会保证dispatch在组件的声明周期内保持不变。所以不再需要重新订阅定时器。
)
```

### 使用场景

`useEffect` 在与`浏览器操作/网络请求/第三方库`状态协同中发挥着极其重要的作用。

着重讲一下在 useEffect 中请求数据的注意点：

```tsx
// 借用Dan博客的例子
function SearchResults() {
  // 🔴 Re-triggers all effects on every render
  function getFetchUrl(query) {
    return 'https://hn.algolia.com/api/v1/search?query=' + query
  }

  useEffect(() => {
    const url = getFetchUrl('react')
    // ... Fetch data and do something ...
  }, [getFetchUrl]) // 🚧 Deps are correct but they change too often

  useEffect(() => {
    const url = getFetchUrl('redux')
    // ... Fetch data and do something ...
  }, [getFetchUrl]) // 🚧 Deps are correct but they change too often
}
```

因为函数组件中的方法每次都是不一样的, 所以会造成 effect 每次都被触发, 这不是想要的。有两种办法解决：

1. 如果一个函数没有使用组件内的任何值，你应该把它提到组件外面去定义，然后就可以自由地在 effects 中使用

   ```tsx
   // ✅ Not affected by the data flow
   function getFetchUrl(query) {
     return 'https://hn.algolia.com/api/v1/search?query=' + query
   }

   function SearchResults() {
     useEffect(() => {
       const url = getFetchUrl('react')
       // ... Fetch data and do something ...
     }, []) // ✅ Deps are OK

     useEffect(() => {
       const url = getFetchUrl('redux')
       // ... Fetch data and do something ...
     }, []) // ✅ Deps are OK

     // ...
   }
   ```

2. 使用 useCallback 包裹

   ```tsx
   function SearchResults() {
     // ✅ Preserves identity when its own deps are the same
     const getFetchUrl = useCallback((query) => {
       return 'https://hn.algolia.com/api/v1/search?query=' + query
     }, []) // ✅ Callback deps are OK

     useEffect(() => {
       const url = getFetchUrl('react')
       // ... Fetch data and do something ...
     }, [getFetchUrl]) // ✅ Effect deps are OK

     useEffect(() => {
       const url = getFetchUrl('redux')
       // ... Fetch data and do something ...
     }, [getFetchUrl]) // ✅ Effect deps are OK
   }
   ```

> 到处使用 `useCallback` 是件挺笨拙的事。当我们需要将函数传递下去并且函数会在子组件的 `effect` 中被调用(简而言之：参与数据流)的时候，`useCallback` 是很好的技巧且非常有用。

另一个注意点是：`因为要返回 cleanup，所以 setup 是不能用 async 来修饰的`。

## useLayoutEffect

useLayoutEffect 和 useEffect 不同的地方在于 执行时机，`在屏幕渲染之前执行`。同时 setup 函数的执行会阻塞浏览器渲染。

## reference

- [useEffect](https://react.dev/reference/react/useEffect)
- [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
- [How to fetch data with React Hooks](https://www.robinwieruch.de/react-hooks-fetch-data/)
