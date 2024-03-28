---
title: 'Java_12_IO流'
date: 2023-11-13T11:50:11+08:00
lastmod:
series: [java]
categories: [study notes]
weight: 12
draft: true
---

## IO 流

### 文件

图片、视频、文档等文件在程序中是以流的形式操作的。

在 java 中，输入、输出是以 java 内存为视角来命名的。

```java
// 内存中创建 file
new File(String pathname);
new File(File parent, String child);
new File(String parent, String child);

// 输出 file 到固态存储
file.createNewFile();

file.delete(); // 删除文件
file.mkdir();
file.mkdirs(); // 创建多级目录(不存在的)
```

其他常用方法：exists, isFile, isDirectory, length, getName, getParent, getAbsolutePath 等等

### IO 流原理及流分类

以下四个抽象类

|        | 输入流      | 输出流       | 场景                                           |
| ------ | ----------- | ------------ | ---------------------------------------------- |
| 字节流 | InputStream | OutputStream | 二进制文件，无损，一次读取一个字节，中文会乱码 |
| 字符流 | Reader      | Writer       | 处理文本文件，效率更高                         |

### 输入流

- FileInputStream，`fileInputStream.read()` 默认单个字节读取，效率比较低，读取完毕返回 -1；可以传入 byte[] buff = new Byte[8]，来表示一次读取多少个字节，提高效率
- BufferInputStream，带缓冲
- ObjectInputStream，对象字节输入流，能够将数据进行序列化和反序列化，简而言之就是数据和数据类型一起保存着，相应的需要使用对应的方法。注意：读取与输入的顺序必须一致。
  > 需要让某个对象支持序列化，必须实现：`Serializable`(推荐，标记接口，内部没有方法) 或 `Externalizable` 接口之一。注意点：1.序列化类中建议添加 SerialVersionUID，为了提高版本兼容性；2.序列化对象中，static 和 transient 修饰成员不会被序列化；3. 序列化对象，要求里面属性的类型也要实现序列化接口；4. 序列化具备可继承性，一个类实现了序列化，则它的所有子类也默认实现了序列化。

> 注意每个流最后一定要 close()。

---

- FileReader
- BufferedReader，带缓冲，按行读取 br.readLine()，读取完毕返回 null

### 输出流

- FileOutputStream，new FileOutputStream(path, boolean); ,boolean 为 true 时，file.write(something) 是追加，否则为覆盖。与 FileInputStream 配合可以实现文件拷贝的功能，一边读，一边写，需要注意的是写的过程中，注意写的大小要与 FileInputStream 读到的大小一致：fileOutputStream.write(buff, 0, readLen)
- 其他子类...

---

- Writer

### 节点流和处理流

- 节点流就是从数据源读写数据，比如 FileReader、FileWriter 等。
- 处理流（包装流）是“连接”在已存在流之上，为程序提供更强大的读写功能，比如 BufferedReader、BufferedWriter 等，内部有属性包装节点流/其他处理流（使用装饰器模式实现，简单说就是大盒子把小盒子装进去，大盒子可以使用小盒子的方法，同时大盒子还能用自己的方法，看上去就是对小盒子进行了拓展）。

### 标准输入输出流

```java
// 标准输入 -- 键盘
System.in // 编译类型 InputStream 运行类型 BufferedInputStream
new Scanner(System.in);

// 标准输出 -- 显示器
System.out // 编译类型 PrintStream 运行类型 PrintStream
System.out.println("dd");
```

### 转换流

用来处理乱码

- InputStreamReader，可以指定 charset，将字节流包装成字符流
  ```java
  // demo
  BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(filepath), "gbk"));
  br.readLine();
  ```
- OutputStreamWriter

### Properties 类

一般用来读取配置文件，比如：xxx.properties，配置文件的格式 `key=value`，主要不需要空格。value 默认为 String 类型，不需要双引号。

Properties 类常用方法

```java
Properties p = new Properties();
// load 加载配置文件
p.load(Reader||InputStream);
// list k-v x显示
p.list(System.out);

// get
p.getProperty("user");
// set
p.setProperty("user", "Eric");

// store 存储到配置文件
p.store(Writer||OutputStream);
```
