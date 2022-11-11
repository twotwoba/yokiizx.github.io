---
title: 'React基础原理1'
date: 2022-11-07T16:29:27+08:00
tags: [React]
---

PS：阅读源码前，推荐一个 VsCode 插件，`bookmarks`，比较方便，谁用谁知道。

##### React 大事件

- React 16 引入 fiber 架构
  - 引入 Fiber
  - 可以中途中断更新，Reconciler 和 Renderer 的交替工作在 v16 之前是递归不可中断的
  - 生命周期变化
- React 16.8 引入 hooks
- React 17
  - 全新的 JSX 转换（源代码中无需引入 React 了)
  - 事件委托的变更（之前是委托在 document 上，现在是渲染树的根容器）
  - 事件系统相关更改（onFocus 和 onBlur 事件已在底层切换为原生的 focusin 和 focusout 事件）
- React 18
  - 不再兼容 ie11
  - 并发特性
  - ReactDome.render(<App />, root) 改为使用 ReactDom.createRoot(root).render(<App/>)
  - setState 自动批处理

> 详细的见参考文章

##### JSX 怎么生成 Element

点击查看[Facebook 关于 JSX 的介绍](https://facebook.github.io/jsx/#sec-intro)。

```JSX
// React 17 以前
const demo = (
  <div>
    <span className='1'>hello</span>
    <span className='2'>world</span>
  </div>
)

// @babel/plugin-transform-react-jsx 会把上方jsx会被转化为：
const demo = React.createElement(
  'div',
  null,
  React.createElement(
    'span',
    {className: '1'},
    'hello'
  ),
  React.createElement(
    'span',
    {className: '2'},
    'world'
  )
)
```

朴实无华的 API `createElement`，如名字一样，就是用来创建 element 的。 `React.createElement(type, config, children)`，这也是为什么 React17 之前每个文件需要手动引入 React，React17 之后则不需要了。

```JavaScript
export function createElement(type, config, children) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    // Remaining properties are added to a new props object
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated(被分配) props object.
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current, // null || fiber
    props,
  );
}
```

上面的代码比较简单，认认真真看，还好很好理解的，其实就是对 JSX 进行了解析，将参数整合后传给 `ReactElement` 使用，简单总结一下：

- 把 `config` 中除了 `key`,`ref`,`__self`,`__source` 的值赋值给了 `props`，（`__self`,`__source`是开发环境使用的）
- `children` 也被加入到 `props`，然后这个 `props` 被传递给 `ReactElement` 使用

再来看看 `ReactElement`：

```JavaScript
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE, // react元素标识，源码中使用了一个十六进制表示，如果原生支持Symbol，会使用Symbol来标识

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  return element;
};

// 辨识一个 React 元素
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```

也很简单，就是返回了一个对象。

---

注意： React17 后添加了全新的 JSX 转换，不过 React.createElement 仍然保留，所以了解一下也是挺好的。

全新的 JSX 转换方法使得无需每个组件都引入 React 就能解析 JSX，但是要使用 React 导出的其他方法或 hook 还是需要引入的。

- [介绍全新的 JSX 转换](https://zh-hans.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
- [@babel/plugin-transform-react-jsx](https://www.babeljs.cn/docs/babel-plugin-transform-react-jsx#react-automatic-runtime)

```JavaScript
function App() {
  return <h1>Hello World</h1>;
}
// ↓ ↓ ↓ ↓ ↓
// 由编译器引入（禁止自己引入！） 见上方的babel插件
// 这些入口只会被 Babel 和 TypeScript 等编译器使用
import {jsx as _jsx} from 'react/jsx-runtime';

function App() {
  return _jsx('h1', { children: 'Hello world' });
}
```

看看源码：

```JavaScript
// 1.react/jsx/ReactJSXElement  ReactElement与上方的基本一样
// 2.替代 React.createElement()的jsx()
export function jsx(type, config, maybeKey) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;

  // Currently, key can be spread in as a prop. This causes a potential
  // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
  // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
  // but as an intermediary step, we will use jsxDEV for everything except
  // <div {...props} key="Hi" />, because we aren't currently able to tell if
  // key is explicitly declared to be undefined or not.
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }
  if (hasValidKey(config)) {
    key = '' + config.key;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // 提取除key,ref的其他props和默认属性defaultProps到 props 中
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    undefined,
    undefined,
    ReactCurrentOwner.current,
    props,
  );
}
```

最大的差别就是 children 变成了 maybeKey，官网上说这个主要就是为了做一些:[性能优化和简化](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#motivation)。  
so, children 去哪了??? // TODO

##### ReactDom.render(el, container, cb)

这个 api 在 React18 之前使用，也是有必要学习一下的。

```JavaScript
// render 就是调用了 legacyRenderSubtreeIntoContainer 个方法
export function render(
  element: React$Element<any>,
  container: Container,
  callback: ?Function,
): React$Component<any, any> | PublicInstance | null {
  // ...
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback,
  );
}

/**
 * @desc    渲染子树到容器中
 * @param   parentComponent - 父组件，ReactDom.render的时候传 null
 * @param   children        - 待渲染 dom (经过解析后的 ReactElement)
 * @param   container       - 容器 dom
 * @param   forceHydrate    - true-服务端渲染; false-客户端渲染
 * @param   callback        - 渲染完成后回调函数
 */
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: Container,
  forceHydrate: boolean,
  callback: ?Function,
): React$Component<any, any> | PublicInstance | null {

  // 在 legacyCreateRootFromDOMContainer 后续调用了几个api返回了 FiberRoot
  // 这个  FiberRoot 被挂载在 container._reactRootContainer
  const maybeRoot = container._reactRootContainer;

  let root: FiberRoot;
  if (!maybeRoot) {
    // Initial mount
    root = legacyCreateRootFromDOMContainer( // 创建 FiberRoot
      container,
      children,
      parentComponent,
      callback,
      forceHydrate,
    );
  } else {
    root = maybeRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(root);
        originalCallback.call(instance);
      };
    }
    // Update
    updateContainer(children, root, parentComponent, callback);
  }
  return getPublicRootInstance(root);
}
```

大致流程：`ReactDom.render` 返回 `legacyRenderSubtreeIntoContainer` 函数执行的结果。这个函数会先调用 `legacyCreateRootFromDOMContainer` 来创建 `FiberRoot`，在初始化过程中，调用 `createContainer` 方法，在更新过程中调用 `updateContainer`，最后返回 `getPublicRootInstance(root)` 的结果。

`createContainer`,`updateContainer`,`getPublicRootInstance` 这三个方法都引自 `ReactFiberReconciler.old.js`。从源码中能看见最终调用的是 `createFiberRoot` 这个方法，接着调用 `new FiberRootNode()` 最终创建了这个 FiberRoot。

> react-reconciler 有 xx.old.js 和 xx.new.js 之分，两个都在维护，由 ReactFeatureFlags 中的 enableNewReconciler 变量来控制使用哪种(默认为 false 使用从 old 中导出的)。主要目的是为了向前兼容、并且不影响之前和之后代码的稳定性。

###### ReactDom.createRoot()

React18 引入的方法，取代了 `ReactDom.render`，在 `packages/react-dom/src/client/ReactDOMRoot.js` 文件中。

---

##### React.Element 和 React.Component 的关系

1. ClassComponent 和 pureComponent，都导出自 ReactBaseClasses.js

```JavaScript
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}
Component.prototype.isReactComponent = {};

/* ---------- pureComponent ---------- */
// 这里就是用来做寄生组合基础的
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;
/**
 * Convenience component with default shallow equality check for sCU.
 */
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
// Avoid an extra prototype jump for these methods.
assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;
```

> 注意，无法通过引用类型来判断一个组件是 class 组件还是 function 组件，因为他两都是 Funciton，所以源码中才添加了这个 `Component.prototype.isReactComponent = {};` 这个。

##### ReactElement 如何转为真实 DOM

上面知道了 react 是如何把我们写的 jsx 变成 ReactElement，那么究竟是怎么变成真实 DOM 的呢？这是一个比较精密的过程。

JSX 转为的 ReactElement 只是一个简单的数据结构，携带着 key，ref 和其他的 dom 上的 attr，v17 以前还携带者 children。但是 ReactElement 始终不包含以下信息：

- 组件在更新中的 `优先级`
- 组件的 `state`
- 组件被打上的用于 `Renderer 的标记`

这些内容都包含在 Fiber 节点中。

所以：

- 在组件 mount 时，Reconciler 根据 JSX 描述的组件内容生成组件对应的 Fiber 节点。
- 在组件 update 时，Reconciler 将 JSX 与 Fiber 节点保存的数据对比，生成组件对应的 Fiber 节点，并根据对比结果为 Fiber 节点打上标记。然后再进入 render 阶段。

##### 三大件

从上方清楚了 JSX 转为 ReactElement 的过程，剩下的就交给三大件吧：

- <mark>Scheduler（调度器）</mark>—— 调度任务的优先级，高优任务优先进入 Reconciler
  - 是独立于 React 单独的包，react16 后加入
  - 功能类似于 `requestIdleCallback` 这个 api，但是兼容性更好，并且触发频率稳定
  - 除了在空闲时触发回调的功能外，Scheduler 还提供了多种调度优先级供任务设置
- <mark>Reconciler（协调器）</mark>—— 负责找出变化的组件
  - React 15， 协调器是递归处理处理虚拟 DOM，16 后可以中断了，看代码：
    ```JavaScript
    function workLoopConcurrent() {
      // Perform work until Scheduler asks us to yield
      while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
      }
    }
    ```
  - React 16 解决中断更新时 DOM 渲染不完全的方法是，Reconciler 与 Renderer 不再是交替工作。当 Scheduler 将任务交给 Reconciler 后，Reconciler 会为变化的虚拟 DOM 打上代表增/删/更新的标记。
    ```JavaScript
    // ReactFiberFlags.js 中
    export const Placement = /*             */ 0b0000000000010;
    export const Update = /*                */ 0b0000000000100;
    export const PlacementAndUpdate = /*    */ 0b0000000000110;
    export const Deletion = /*              */ 0b0000000001000;
    ```
    整个 Scheduler 与 Reconciler 的工作都在内存中进行。只有当所有组件都完成 Reconciler 的工作，才会统一交给 Renderer。
- <mark>Renderer（渲染器）</mark>—— 负责将变化的组件渲染到页面上
  - 根据 Reconciler 打的标记对 DOM 进行操作

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202211111612280.png)
其中红框中的步骤随时可能由于以下原因被中断：

- 有其他更高优任务需要先更新
- 当前帧没有剩余时间

由于红框中的工作都在内存中进行，不会更新页面上的 DOM，所以即使反复中断，用户也不会看见更新不完全的 DOM。

## 参考

- [十五分钟读懂 React 17](https://juejin.cn/post/6894204813970997256)
- [React18 新特性解读 & 完整版升级指南](https://juejin.cn/post/7094037148088664078)
- [深入理解 JSX](https://react.iamkasong.com/preparation/jsx.html)
- [卡颂大佬的 React 技术揭秘](https://react.iamkasong.com/)
