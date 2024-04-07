# React hooks--useMemo&useCallback


在之前的笔记中，讲了很多次的心智模型 -- 组件在每次渲染中都是它全新的自己。所以当对象或函数参与到数据流之中时，就需要进行优化处理，来避免不必要的渲染。

## useMemo

`const cachedValue = useMemo(calculateValue, dependencies)`

### memo

`const MemoizedComponent = memo(SomeComponent, arePropsEqual?)`

`useMemo` 是加在数据上的缓存，而 `memo` api 是加在组件上的，只有当 `props` 发生变化时，才会再次渲染。

没有`arePropsEqual`，默认比较规则就是 `Object.is`

## useCallback

`const cachedFn = useCallback(fn, dependencies)`

## reference

- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)

