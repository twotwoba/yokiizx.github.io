---
title: 'Java_11_java 绘图基础'
date: 2023-10-31T14:41:26+08:00
lasmod:
tags: []
series: []
categories: []
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
