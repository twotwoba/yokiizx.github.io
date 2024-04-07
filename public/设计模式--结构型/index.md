# 重学设计模式 -- 结构型


设计模式其实并不是多么高大尚的东西，都是码农届前辈积累下来的一些编程经验，在工作中可以说随处可见，作为前端开发者，学习这些"套路"很有必要，跟着 [desing-patterns](https://refactoringguru.cn/design-patterns) 再来回顾一下吧。

## 结构型

### 适配器模式

顾名思义，最简单的例子就是苹果笔记本 `type-c` 接口转 `HDMI`，这就是一种适配器模式，让不兼容的对象都够相互合作，这里的对象就是 `mac` 笔记本和外接显示器。

往往我们会对接口使用这种模式。

```TS
class Old {
  public request(): string {
    return 'old: the default behavior';
  }
}

class New {
  public request(): string {
    return '.eetpadA eht fo roivaheb laicepS :wen';
  }
}

class Adapter extends Old {
  private adaptee: New;
  constructor(adaptee: New) {
    super();
    this.adaptee = adaptee;
  }
  request(): string {
    const result = this.adaptee.request().split('').reverse().join('');
    return `Adapter: (TRANSLATED) ${result}`;
  }
}

// test
const new1 = new New();
const adaptee = new Adapter(new1);
console.log(adaptee.request()); // Adapter: (TRANSLATED) new: Special behavior of the Adaptee.
```

其实也很简单，适配器需要继承旧接口，同时把新接口的实例作为入参传递给适配器，在适配器内对接口内的方法使用新接口的东西进行重写，完事。

### 桥接模式

核心：可将「业务逻辑」或一个「大类」**拆分为不同的层次结构**， 从而能独立地进行开发。

层次结构中的第一层 （通常称为抽象部分） 将包含对第二层 （实现部分） 对象的引用。 抽象部分将能将一些 （有时是绝大部分） 对自己的调用委派给实现部分的对象。 所有的实现部分都有一个通用接口， 因此它们能在抽象部分内部相互替换。

注意：这里的抽象与实现与编程语言的概念不是一回事。抽象指的是用户界面，实现指的是底层操作代码。

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202303141146609.png)
假设我们正在设计一个图形化编辑器，其中包括不同种类的形状，例如圆形、矩形、三角形等。同时，每个形状可以具有不同的颜色，例如红色、绿色、蓝色等。

```TS
/**
 * 颜色接口
 */
interface Color {
  fill(): void;
}

/**
 * 红色实现类
 */
class Red implements Color {
  fill(): void {
    console.log('红色');
  }
}

/**
 * 绿色实现类
 */
class Green implements Color {
  fill(): void {
    console.log('绿色');
  }
}

/**
 * 形状抽象类
 */
abstract class Shape {
  protected color: Color;

  constructor(color: Color) {
    this.color = color;
  }

  abstract draw(): void;
}

/**
 * 圆形实现类
 */
class Circle extends Shape {
  constructor(color: Color) {
    super(color);
  }

  draw(): void {
    console.log('画一个圆形，填充颜色为：');
    this.color.fill();
  }
}

/**
 * 矩形实现类
 */
class Rectangle extends Shape {
  constructor(color: Color) {
    super(color);
  }

  draw(): void {
    console.log('画一个矩形，填充颜色为：');
    this.color.fill();
  }
}

/**
 * 运行示例代码
 */
const red = new Red();
const green = new Green();

const circle = new Circle(red);
circle.draw();

const rectangle = new Rectangle(green);
rectangle.draw();
```

> 桥接模式在处理跨平台应用、 支持多种类型的数据库服务器或与多个特定种类 （例如云平台和社交网络等） 的 API 供应商协作时会特别有用。

### 组合模式

核心：允许将对象组合成树形结构来表示“部分-整体”的层次结构，使得客户端可以统一对待单个对象和组合对象。
在 TypeScript 中实现组合模式需要以下几个关键元素：

1. 抽象构件（Component）：定义组合中对象的通用行为和属性。可以是一个抽象类或者接口。
2. 叶子构件（Leaf）：表示组合中的叶子节点对象，它没有子节点。
3. 容器构件（Composite）：表示组合中的容器节点对象，它有子节点。容器构件可以包含叶子节点和其他容器节点。

使用组合模式，可以通过递归的方式遍历整个树形结构，从而对整个树形结构进行统一的操作。

```TS
abstract class Component {
  protected parent: Component | null = null;

  public setParent(parent: Component | null) {
    this.parent = parent;
  }

  public getParent(): Component | null {
    return this.parent;
  }

  public addChild(child: Component): void {}

  public removeChild(child: Component): void {}

  public isComposite(): boolean {
    return false;
  }

  public abstract operation(): string;
}

class Leaf extends Component {
  public operation(): string {
    return 'Leaf';
  }
}

class Composite extends Component {
  protected children: Component[] = [];

  public addChild(child: Component): void {
    this.children.push(child);
    child.setParent(this);
  }

  public removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    this.children.splice(index, 1);
    child.setParent(null);
  }

  public isComposite(): boolean {
    return true;
  }

  public operation(): string {
    const results: string[] = [];
    for (const child of this.children) {
      results.push(child.operation());
    }
    return `Branch(${results.join('+')})`;
  }
}

// test
const simple = new Leaf();
const tree = new Composite();
const branch1 = new Composite();
branch1.addChild(new Leaf());
branch1.addChild(new Leaf());
const branch2 = new Composite();
branch2.addChild(new Leaf());
tree.addChild(branch1);
tree.addChild(branch2);
console.log(tree.operation()) // Branch(Branch(Leaf+Leaf)+Branch(Leaf))
```

### 装饰模式

核心：允许在不改变一个对象的基础结构和功能的情况下，动态地为该对象添加一些额外的行为。

<details>
<summary>TS 开启装饰器需要配置一下 `tsconfig.json`：</summary>

```JSON
{
  "compilerOptions": {
    "target": "ES6",
    "experimentalDecorators": true
  }
}
```

</details>

```TS
function logger(constructor: Function) {
  console.log(`${constructor?.name} has been invoked.`);
}

function enumerable(value: boolean) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    descriptor.enumerable = value;
  };
}

function readonly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false
  });
}

@logger
class Point {
  constructor(private x: number, private y: number) {}

  @readonly
  @enumerable(false)
  getDistanceFromOrigin() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

const point = new Point(3, 4);
console.log(point.getDistanceFromOrigin()); // 输出 5

point.x = 5; // Cannot assign to 'x' because it is a read-only property.
```

### 外观模式

这种模式其实核心就是封装~~~

```TS
// 子系统 A
class SystemA {
  public operationA(): string {
    return "System A is doing operation A.";
  }
}

// 子系统 B
class SystemB {
  public operationB(): string {
    return "System B is doing operation B.";
  }
}

// 子系统 C
class SystemC {
  public operationC(): string {
    return "System C is doing operation C.";
  }
}

// 外观类
class Facade {
  private systemA: SystemA;
  private systemB: SystemB;
  private systemC: SystemC;

  constructor() {
    this.systemA = new SystemA();
    this.systemB = new SystemB();
    this.systemC = new SystemC();
  }

  // 统一的接口方法，通过调用多个子系统的方法来完成任务
  public executeAllOperations(): string {
    let result = "";

    result += this.systemA.operationA() + "\n";
    result += this.systemB.operationB() + "\n";
    result += this.systemC.operationC() + "\n";

    return result;
  }
}

// 客户端代码
function clientCode() {
  const facade = new Facade();
  console.log(facade.executeAllOperations());
}

clientCode();
```

很简单，就是封装 -- 通过提供一个统一的接口，封装了整个子系统的复杂性，使客户端代码更加简洁和易于维护。

### 享元模式

享元模式在消耗少量内存的情况下支持大量对象，它只有一个目的： 将内存消耗最小化。

<details>
<summary>对于前端应用较少（点击查看详细内容）</summary>

在享元模式中，创建一个共享对象工厂，它负责创建和管理共享对象。该工厂接收来自客户端的请求，并确定是否具有相应的共享对象。如果共享对象不存在，它将创建一个新的并将其添加到共享池中。否则，它将返回池中已有的对象。

通过将相同数据封装在享元池中，我们可以减少内存使用并提高程序性能。但是，享元模式需要额外的开销来维护享元池，因此在决定是否使用它时需要权衡其优缺点。

```TS
class Flyweight {
  private readonly sharedState: string;

  constructor(sharedState: string) {
    this.sharedState = sharedState;
  }

  public operation(uniqueState: string): void {
    console.log(`Flyweight says: shared state (${this.sharedState}) and unique state (${uniqueState})`);
  }
}

class FlyweightFactory {
  private flyweights: {[key: string]: Flyweight} = <any>{};

  constructor(sharedStates: string[]) {
    sharedStates.forEach((state) => {
      this.flyweights[state] = new Flyweight(state);
    });
  }

  public getFlyweight(sharedState: string): Flyweight {
    if (!this.flyweights[sharedState]) {
      this.flyweights[sharedState] = new Flyweight(sharedState);
    }
    return this.flyweights[sharedState];
  }
}

const flyweightFactory = new FlyweightFactory(['A', 'B', 'C']);

const flyweight1 = flyweightFactory.getFlyweight('A');
flyweight1.operation('X');

const flyweight2 = flyweightFactory.getFlyweight('B');
flyweight2.operation('Y');

const flyweight3 = flyweightFactory.getFlyweight('A');
flyweight3.operation('Z');
```

在这个示例中，Flyweight 类表示享元对象，它包含了内部状态 sharedState，该状态初始化时被设置为不变的值。FlyweightFactory 类是享元工厂，它负责创建和管理所有的享元对象。

我们通过调用 flyweightFactory.getFlyweight() 方法来获取 Flyweight 对象，如果池中不存在相应的对象，则创建一个新对象。当我们使用 Flyweight 对象时，我们将外部状态 uniqueState 传递给它，这些状态可以随时更改。注意到我们获取到的相同内部状态的 Flyweight 对象是同一个对象，因此我们可以重复使用它而不会产生额外的内存负担。

</details>

### 代理模式

这个对于前端来说再熟悉不过了吧。比如为什么 Vue 中 可以通过 this.xxx 拿到实例的数据，实际上一开始是加载到 `vm._data` 上的，通过内部实现的 proxy 方法结合 `Object.defineProperty`

```TS
interface ISubject {
    request(): void;
}
class RealSubject implements ISubject {
    public request(): void {
        console.log("Real Subject Request");
    }
}

class ProxySubject implements ISubject {
    private subject: RealSubject;
    constructor() {
        this.subject = new RealSubject();
    }

    public request(): void {
        console.log("Proxy Request");
        this.subject.request();
    }
}

// test
const subject: ProxySubject = new ProxySubject();
subject.request();
```

有利于解耦，但是会增大开销，有可能降低性能。

