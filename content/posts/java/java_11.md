---
title: 'Java_11_java 绘图基础&线程'
date: 2023-10-31T14:41:26+08:00
lasmod:
tags: []
series: [java]
categories: [study notes]
weight: 11
---

## JFrame & JPanel

基础 demo，打开窗口，绘制一个小圆：

```java
import javax.swing.*;
import java.awt.*;

// 继承 JFrame，用于创建窗口
public class Demo1 extends JFrame {

    public MyPanel mp = null;

    public static void main(String[] args) {
        new Demo1();
    }

    // 构造器
    public Demo1() {
        mp = new MyPanel(); // 创建画板
        this.add(mp);       // 画板加入窗口
        this.setSize(400, 300);
        this.setVisible(true);
        // 关闭窗口的时候退出程序
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    }
}


// 继承 JPanel，用于创建画板
class MyPanel extends JPanel {
    @Override
    public void paint(Graphics g) {
        super.paint(g); // 调用父类方法，完成初始化
        System.out.println("执行了~~~~");
        // Graphics 画笔，对应绘制不同图形
        g.drawOval(10, 10, 100, 100);
    }
}
```

## java 事件

对于前端来说挺好理解的，各种 event 很多，直接查文档。

```java
// 以监听键盘事件为例
// 1. 面板 需要继承 JPanel 并实现 KeyListener：同时实现接口的方法
class MyPanel extends JPanel implements KeyListener
// 2. 窗口 内需要把 面板加上事件监听： this.addKeyListener(mp);
this.addKeyListener(mp);
// 3. 需要重绘图形时，调用 repaint 方法
 @Override
public void keyPressed(KeyEvent e) {
    System.out.println((char)e.getKeyCode());
    // this.repaint();
}
```

## 线程与进程基础

- 进程，是对运行时程序的封装，是系统进行资源调度和分配的的基本单位，实现了操作系统的并发
- 线程，是进程的子任务，是 CPU 调度和分派的基本单位，用于保证程序的实时性，实现进程内部的并发

> [进程和线程的概念、区别及进程线程间通信](https://cloud.tencent.com/developer/article/1688297)

- 并发：同一时刻，单核 CPU 让多个任务交替执行，“貌似同时”
- 并行：同一时刻，多核 CPU 让多个任务同时执行

---

#### 开辟线程

- 继承 `Thread` 类，重写 run 方法
- 实现 `Runnable` 接口，Thread 也是实现了这个接口的，重写 run 方法

##### 为什么是 start

如下代码：

```java
public class ThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        int i = 0;

        Dog dog = new Dog();
        dog.start();
        // dog.run();
        while (i++ < 10) {
            System.out.println("hello world~~~");
            Thread.sleep(500);
        }
    }
}

class Dog extends Thread {
    int i = 0;

    @Override
    public void run() {
        super.run();
        while (i++ < 10) {
            try {
                System.out.println("wang wang wang~~~");
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
```

`dog.start()` 会发现 main 方法和 run 方法交替输出，如果是 `dog.run()` 则会先输出 run 的。

这是因为 `Thread` 内部的 `start` 方法最终调用的是 `start0`

```java
public synchronized void start() {
    start0();
}

// 这是jvm调用，底层是c/c++实现。
// 它的作用也只是将线程变为可执行状态，具体什么时候执行，取决于cpu
public native void start0();
```

##### 为什么有了 Thread 还需要 Runnable

java 中有很多这种情况，主要是由于 java 的 `单继承机制`。假如一个类已经继承了某个父类，那就不能继承 Thread 了，但是，Runnable 是接口呀，接口是可以多继承的～

需要注意的是：Runnable 上没有 start 方法。需要通过 Thread 代理一下，这里是典型的静态代理模式。

```java
public class ThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        int i = 0;

        Dog dog = new Dog();
        Thread thread = new Thread(dog); // 代理一下
        thread.start();
        while (i++ < 10) {
            System.out.println("hello world~~~");
            Thread.sleep(500);
        }
    }
}

class Dog extends Animal implements Runnable {
    int i = 0;

    @Override
    public void run() {
        while (i++ < 10) {
            try {
                System.out.println("wang wang wang~~~");
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
```

> 另外，通过实现 Runnable 的方式创建线程，可以实现多个线程共享一个资源的情况。 比如上例可以把 Dog 实例放到多个 new Thread(dog)；中，`把Dog中需要共享的资源使用 **static** 修饰`。共享资源就会产生线程竞争的问题，就需要 `synchronized` 关键字来处理，后续学到再做记录～

#### 终止线程

- 执行完毕，自动终止
- 通过变量控制 run 方法退出，来终止线程

#### 其他方法

- `interrupt`，中断线程，往往在线程休眠的时候，可以帮助提前结束休眠～
- `yield`(static)，线程礼让，但是不一定礼让成功，看系统资源情况
- `join`，线程插队，t1 线程执行中一旦调用了 t2.join()，则一定是 t2 全部执行完之后才接着执行 t1 线程

#### 用户线程和守护线程

- 用户线程：也叫工作线程，当线程执行完或被通知结束
- 守护线程：当所有用户线程结束，自动结束，如：垃圾回收机制

把线程设置成守护线程的方式：在 start 之前，`t.setDaemon(true)` 即可。
