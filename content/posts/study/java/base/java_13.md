---
title: 'Java_13_网络编程'
date: 2023-11-15T17:50:14+08:00
lastmod:
series: [java]
categories: [study notes]
weight: 13
draft: true
---

作为前端开发，对网络这块大体还是比较熟悉的，如需要深度学习网络，可以后续深度学习～

---

java.net 包下提供了一系列的类和接口，来完成网络通讯。

### InetAddress

```java
/* ---------- InetAddress ---------- */
// 获取本机主机名和 ip 地址
InetAddress localHost = InetAddress.getLocalHost();

// 通过域名获取远程 ip
InetAddress baidu = InetAddress.getByName("www.baidu.com");
System.out.println(baidu);
```

### socket

通信的两端都要有 socket（套接字）。

TCP 编程简单 demo：

```java
// 客户端
public class SocketClient {
    public static void main(String[] args) throws IOException {
        // 请求连接 proxy， port
        Socket socket = new Socket(InetAddress.getLocalHost(), 9999);

        OutputStream outputStream = socket.getOutputStream();
        outputStream.write("hello server ~".getBytes());
        socket.shutdownOutput();  // 设置本轮发送结束标记
        // 当使用 字符流 时，也可以使用 writer.readLine() 设置结束标记，对应的读取需要使用 readLine()

        // 字符流接收服务端的消息
        InputStream inputStream = socket.getInputStream();
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
        System.out.println(bufferedReader.readLine());

        bufferedReader.close();
        outputStream.close();
        socket.close();
    }
}

// 服务端
public class SocketServer {
    public static void main(String[] args) throws IOException {
        // ServerSocket 通过 accept 可以返回多个 socket【多个客户端连接服务器的并发】
        ServerSocket serverSocket = new ServerSocket(9999);
        System.out.println("正在监听 9999 端口服务。。。");
        Socket socket = serverSocket.accept();
        InputStream inputStream = socket.getInputStream();
        byte[] buff = new byte[1024];
        int readLen = 0;
        while ((readLen = inputStream.read(buff)) != -1) {
            System.out.println(new String(buff, 0, readLen));
        }

        // 字符流发送给客户端消息
        OutputStream outputStream = socket.getOutputStream();
        BufferedWriter bufferedWriter = new BufferedWriter(new OutputStreamWriter(outputStream));
        bufferedWriter.write("I got you, client~");
        bufferedWriter.newLine();
        bufferedWriter.flush(); // 必须刷新一下，否则进入不到通道

        bufferedWriter.close(); // 关闭外层流
        inputStream.close();
        socket.close();
    }
}
```

> 注意：使用 字符流，需要使用转换流 `OutputStreamWriter(outputStream)` 和 `InputOutputStreamReader(inputStream)`，写入后需要 `flush()` 一下，最后必须关闭外层流。

### netstat

这个指令可以查看当前主机网络情况包括端口情况和网络情况。

```shell
netstat -an
netstat -an | more # 分页
```

#### UDP

众所周知，tcp 需要连接，UDP 不需要，UDP 的每个包中都有完整的信息。

在 java 中核心的两个类：`DatagramSocket`和`DatagramPacket`，DS 对象有 send 和 receive 两个方法，发送端发送时将数据装包成 DP 对象，接受端接收到 DP 对象后，进行拆包。 DS 可以指定在哪个端口接收数据。一个数据包最大 64k。
