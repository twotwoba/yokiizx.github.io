---
title: 'Vite自用手册'
date: 2024-05-08
lastmod:
series: []
categories: [tool]
weight:
---

**本文基于 Vite 5.2.11，node18/20+，按照[官方文档](https://vitejs.dev/)做一个个人的小总结，涵盖主要理念、注意点和主要功能配置。**

---

## 开始

### 开发 & 生产

-   Vite 开发基于 ES module & esbuild
    -   esm 依赖模块地图，静态分析，便于动态加载，能让 vite 能做到最小范围的 HMR 的基础
    -   esbuild 进行**依赖预构建**提升性能
-   Vite 打包基于 Rollup，不使用 esbuild 是因为与插件 API 不兼容，后续有 rust 版本的 Rollup -- Rolldown

> Vite 以 原生 ESM 方式提供源码，只需要在浏览器请求源码时进行转换并按需提供源码

> 为什么生产环境仍然需要打包？
>
> 1. 如果不打包，浏览器端处理 ESM 嵌套导入会导致额外的网络往返，浪费性能
> 2. 生产打包可以进行 tree shaking，懒加载和代码分割（可以获得更好的缓存）

<!-- 在 Vite 中，HMR 是在原生 ESM 上执行的。当编辑一个文件时，Vite 只需要精确地使已编辑的模块与其最近的 HMR 边界之间的链失活[1]（大多数时候只是模块本身），使得无论应用大小如何，HMR 始终能保持快速更新。 -->
<!-- Vite 需要浏览器原生兼容 ESM，否则需要使用插件 [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) 做兼容。 -->

#### ESM 必知必会

ESM 自动采用严格模式

-   浏览器端创建 ESM：`<script type='module' src='xxx'></script>`，会延迟执行脚本，通过 CORS 请求外部 JS
-   Node 环境创建 ESM：文件名后缀 `.mjs` 或者 package.json 添加 `"type":"module"`

在 ESM 中可以动态导入模块，由此也产生了 top-level await 提案: 将整个文件模块视为一个巨大的 async 函数，打破了 await 必须跟随在 async 内的定律：`const moduleA = await import('path/module.mjs')`

<!-- Object.getPrototypeOf(import.meta) === null // true -->

> ESM 中的 `import.meta` 是特殊的对象，它的原型对象是 null，原生包含了：
>
> -   `url`，类似于 node 环境中的 `__filename`，不同的是 `import.meta.url` 可以分别应用在浏览器端和 node 端，浏览器端返回带协议域名的完整的访问路径, node 端返回 `file://absolutePath`；而 `__filename` 没有 `file://` 前缀。一般可以配合 `new URL()` 使用，如 `new URL('./worker.js', import.meta.url)`，但 SSR 中无法使用
> -   `resolve(file)`，用于解析 file 路径，第二个参数还在实验性阶段，可以看 [node 官方文档](https://nodejs.cn/api-v14/esm.html#importmetaresolvespecifier-parent)

<!-- #### Rollup 必知必会

Rollup官网，主要了解插件系统 -->

### 核心：依赖 & 源码

Vite 把模块区分为 **依赖** 和 **源码** 两类。

-   依赖：开发时基本不会变动的 JS。对此，Vite 使用 esbuild 进行预构建。
-   源码：会进行编辑的文件，包括很多类型，如 JSX、css、Vue 等，但并不会加载所有源码，只是加载用到的部分，如根据路由进行拆分了的代码模块。

> Vite 利用 HTTP 头来加速整个页面的重新加载：
>
> -   **依赖**模块的请求则会通过 Cache-Control: max-age=31536000,immutable 进行**强缓存**，因此一旦被缓存它们将不需要再次请求。
> -   **源码**模块的请求会根据 304 Not Modified 进行**协商缓存**

### 依赖预构建

> 依赖预构建仅适用于开发模式；在生产构建中，将使用 @rollup/plugin-commonjs。

[详细见 vite 文档](https://cn.vitejs.dev/guide/dep-pre-bundling.html)，需要了解的是：

1. `import { debounce } from 'lodash'` 原生 ESM 中这样引入依赖包是会报错的，其他的打包器是利用了 npm 的依赖查找算法。因此，Vite 使用 `esbuild` 进行了依赖预构建，主要**把一些 CJS/UMD 规范的依赖转为 ESM 模块**，同时**重写依赖路径为绝对路径**如 `/node_modules/.vite/deps/my-dep.js?v=f3sf2ebd`
2. 在预构建过程中，把包预构建成单个模块，就可以减少 http 请求，提升性能，比如 `lodash-es` 这个库

-   系统缓存  
    Vite 将预构建的依赖项缓存到 `node_modules/.vite` 中，当 `NODE_ENV`，`vite.config.js`，`xxx-lock.json` 或`补丁文件夹的修改时间`的某一项发生变动，触发重新预构建。
-   浏览器缓存  
    依赖强缓存，源码协商缓存

    一个小点：vite 的 `index.html` 在项目最外层而不是在 public 文件夹内，`index.html` 所在位置被 Vite 设定为 root 根目录。`vite build` 构建生产版本时 。默认情况下，它使用 `<root>/index.html` 作为其构建入口点。

### HMR

[Vite 提供了原生 ESM HMR api](https://cn.vitejs.dev/guide/api-hmr.html)，对于前端同学来说，vite 对常用的 react 和 vue 都做了集成。对应的插件是：

-   [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)
-   [@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue)

### TS 支持

Vite **仅支持 ts 转译**(依赖 esbuild)，并不会进行类型检查。[tsconfig 注意配置](https://cn.vitejs.dev/guide/features#typescript-compiler-options)

TS 默认也不会识别引入的静态资源类型，在 Vite 中需要特殊处理（二选一）：

-   src 下添加 `d.ts` 文件
-   或者在 tsconfig.json 中添加 `"types": ["vite/client"]`

```ts
// 1. d.ts
/// <reference types="vite/client" />

// 2. tsconfig
{
    "compilerOptions": {
        "types": ["vite/client"]
    }
}
```

然后就可以拿到导入资源的类型以及`import.meta.ev`、`import.meta.hot`两个重要的类型。

<!-- Vite 使用 esbuild 将 TypeScript 转译到 JavaScript，约是 tsc 速度的 20~30 倍，同时 HMR 更新反映到浏览器的时间小于 50ms。 -->

### 构建优化

[Vite 默认自动应用一部分构建优化](https://cn.vitejs.dev/guide/features#build-optimizations)

-   css 代码分割，`build.cssCodeSplit` 默认为 true，将会对异步的 chunk 的 css 文件提取，在文件加载时通过 link 引入；设为 false ，所有的 css 将生成一个文件。
-   预加载指令生成
-   异步 chunk 加载优化，就是预构建处理原生 ESM 嵌套导入消耗过多网络性能的问题

> Vite 有很多精简优化，比如使用了 `@vitejs/plugin-react`，应该避免配置 Babel 选项，这样就可以构建期间只使用 esbuild。[使用更少或更原生化的工具链](https://cn.vitejs.dev/guide/performance.html#use-lesser-or-native-tooling)

### CLI

[直接看文档](https://cn.vitejs.dev/guide/cli.html)

-   vite
-   vite build
-   vite preview --port 8888 # 这个挺好，可以预览打包后的产物

### 插件

[直接看文档](https://cn.vitejs.dev/guide/api-plugin.html)

Vite 插件基于 Rollup 的插件系统，[Vite 的社区插件列表](https://github.com/vitejs/awesome-vite#plugins)。与大多数打包工具的插件一样，在 `devDependencies` 安装，在配置文件中引入执行。值的注意的是：有可能存在为了与 Rollup 插件兼容的情况，需要强制设定插件的执行顺序：[看这里](https://cn.vitejs.dev/guide/using-plugins.html#enforcing-plugin-ordering)

插件配置中可以利用 `apply: 'serve' | 'build'` 来判断插件是在开发阶段还是生产阶段使用，不设置则默认都会使用到。

```js {open=true, lineNos=false, wrap=false, header=true, title="配置插件"}
export default defineConfig({
    plugins: [
        {
            ...pluginXxx(),
            apply: 'build' // 只在生产模式使用
        }
    ]
})
```

### 静态资源

1. [publicDir，编译不用 hash 处理(保持原文件名)，不会被源码引用的资源，应当放在该文件夹下，默认为 public](https://cn.vitejs.dev/config/shared-options.html#publicdir)，注意：public 中的资源不应该被 JavaScript 文件引用，其次引用路径应该为根路径，如 `public/a.text` 应该被引用为 `/a.txt`。与之对应的 `build.assetsDir` 是配置生产静态资源的存放路径，默认为 assets
2. [base，这个配置类似于 webpack 的 publicPath，指定静态资源访问路径的，比如生产环境的访问路径一般都不会直接把包放在服务器根目录下，此时就需要单独配置了](https://cn.vitejs.dev/config/shared-options.html#base)
3. [assetsinclude，可以配置不识别类型的拓展](https://cn.vitejs.dev/config/shared-options.html#assetsinclude)
4. [build.assetsInlineLimit，可以配置类似 webpack 中 url-loader 的效果，把资源内联为 base64 编码，默认为 4096，4KB](https://cn.vitejs.dev/config/build-options.html#build-assetsinlinelimit)

### 基本配置

[Vite 的所有基础配置、环境配置等见官网，都挺简单的，好上手](https://cn.vitejs.dev/config)

### 生产构建

`build.rollupOptions` 自定义生产构建过程，详细参考 [Rollup 官网配置](https://rollupjs.org/configuration-options/)

`build.rollupOptions.output.manualChunks` 自定义分块策略，在 vite 中必须使用函数形式，具体参考 [Rollup 配置](https://cn.rollupjs.org/configuration-options/#output-manualchunks)，返回的字符串将作为 `output.chunkFileNames` 的 `[name]` 值

---

## 一个最简单的 vite react ts 配置

实际上官网有给出 vite react-ts 的模板。那我这里搞了一个自己常用的技术栈模板，方便使用。
TODO

<!-- SSR 相关的暂时没有用到，用到时再学也没啥的~~~ -->
