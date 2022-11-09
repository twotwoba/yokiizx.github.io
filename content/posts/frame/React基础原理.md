---
title: 'React基础原理'
date: 2022-11-07T16:29:27+08:00
tags: [React]
---

PS：阅读源码前，推荐一个 VsCode 插件，`bookmarks`，比较方便，谁用谁知道。

以下代码基于 React v18.2.0

##### React 大事件

- React 16 引入 fiber 架构
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

注意： React17 后添加了全新的 JSX 转换，不过 React.createElement 任然保留，所以了解一下也是挺好的。

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
// react/jsx/ReactJSXElement  与以前一样
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    key,
    ref,
    props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  return element;
};

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

  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
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
    undefined,
    undefined,
    ReactCurrentOwner.current,
    props,
  );
}
```

最大的差别就是 children 变成了 maybeKey，官网上说这个主要就是为了做一些:[性能优化和简化](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#motivation)

##### ReactDom.render(el, container, cb)

这个 api 在 React18 之前使用，学习一下。

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

> react-reconciler 有 xx.old.js 和 xx.new.js 之分，两个都在维护，由 ReactFeatureFlags 中的 enableNewReconciler 控制使用哪种。主要目的是为了向前兼容、并且不影响之前和之后代码的稳定性。

##### ReactDom.createRoot()

TODO

## 参考

- [十五分钟读懂 React 17](https://juejin.cn/post/6894204813970997256)
- [React18 新特性解读 & 完整版升级指南](https://juejin.cn/post/7094037148088664078)
