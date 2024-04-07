# Linux基础


## 前言

使用 mac 很多地方和 linux 是很像的，配置环境的时候总是去各种百度，让我很不爽，虽然本人只是个小前端，但是谁规定我只能学前端呢？计算机是个广阔的天地，只要我感兴趣，必拿下~

## linux 系统目录

记录一下"常识"目录：

- /bin， Binaries (二进制文件) 的缩写, 存放着最经常使用的基本命令
- /sbin，s 为 super，管理员权限，存放的是最基本系统命令
- /etc， Etcetera（等等）的缩写，存放所有系统管理所需要的配置文件和子目录
- /lib， Library（库）的缩写，存放着系统最基本的动态连接共享库，与 windows 的 DLL 文件作用类似。
- /usr， Unix Shared resources（共享资源） 的缩写，存放用户的应用程序和文件
- /opt， Optional（可选）的缩写，安装额外软件的目录
- /var， Variable（变量）的缩写，一般存放经常修改的东西，比如各种日志文件
- /home，用户的主目录，在 mac 上是`~`，等价于`Users/主机名`
- /usr/bin，系统用户使用的应用程序(后续安装的程序)
- /usr/sbin，管理员使用的应用程序(但不是必须的)

## linux 文件属性

查看文件完整属性命令

```sh
ls -l
# 或者
ll
```

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202212032127217.jpeg)

```sh
total 0
drwx------  5 yokiizx  staff   160B Mar 15  2022 Applications
drwx------ 42 yokiizx  staff   1.3K Dec  3 21:27 Desktop
drwxr-xr-x  4 yokiizx  staff   128B Aug  7  2021 Public
```

`drwxr-xr-x`：文件属性就是由这十个字符来表示的，r-可读，w-可写，x-可执行。

- 0：确定文件类型，`d`-目录,`-`-文件，其它还有 l,b,c
- 1-3：属主权限
- 4-6：属组权限
- 7-9：其它用户权限

两个基本修改用户与权限的命令：

- chown，change owner，修改所属用户与组
  ```sh
  chown [–R] 属主名 文件名
  chown [-R] 属主名：属组名 文件名
  ```
- chmod，change mode，修改用户的权限
  ```sh
  # r: 4, w: 2, x: 1  rwx == 7,
  chmod [-R] xyz 文件或目录
  ```

### linux 常用命令

- ls（英文全拼：list files）: 列出目录及文件名
- cd（英文全拼：change directory）：切换目录
- pwd（英文全拼：print work directory）：显示目前的目录
- mkdir（英文全拼：make directory）：创建一个新的目录
- rmdir（英文全拼：remove directory）：删除一个空的目录
- cp（英文全拼：copy file）: 复制文件或目录
- scp 是 secure copy 的缩写, scp 是 linux 系统下基于 ssh 登陆进行安全的远程文件拷贝命令。
- rm（英文全拼：remove）: 删除文件或目录
- mv（英文全拼：move file）: 移动文件与目录，或修改文件与目录的名称
- cat 由第一行开始显示文件内容
- touch 创建文件
- which 指令会在环境变量$PATH 设置的目录里查找符合条件的文件
- ping 检测远端主机的网络功能
- exit [状态值]：0 - 成功；1 - 失败，退出终端

一个目录常用的命令：`mkdir xxx && cd $_`

> 全是常用的就不赘述，真要是忘了，查看具体使用方式使用命令`man`，如： `man cp`

---

系统控制相关的：

- ps （英文全拼：process status）命令用于显示当前进程的状态
  - `ps au` 显示当前使用者的进程
  - `ps aux` 显示所有包含其他使用者的进程
  - `ps -ef | grep 关键字` 查找指定进程格式，可以添加 `grep -v grep` 来屏蔽 grep 这个进程本身（`ps -ef | grep hugo | grep -v grep`）
- kill [信号] PID 本质是向进程发送信号
  - HUP 1 终端挂断
  - INT 2 中断（同 Ctrl + C）
  - QUIT 3 退出（同 Ctrl + \）
  - KILL 9 强制终止
  - TERM 15 终止
  - CONT 18 继续（与 STOP 相反，fg/bg 命令）
  - STOP 19 暂停（同 Ctrl + Z）

### linux 常见符号

- &：如果命令后加上了 &，表示命令在后台执行
  - 想要看执行过程可以最后添加 `wait` 命令，等待所有子进程结束，不然类似 watch 监听的命令在后台执行的时候没法 `ctrl + c` 退出了
- &&： 前一条命令执行成功后才执行后面的命令
- |：前一条命令的输出作为后一条命令的输入
- ||：前一条命令执行失败后才执行后面的命令
- ; 多个命令按照顺序执行，但不管前面的命令是否执行成功

### 创建软链

`ln -s source target`，创建软链时路径问题需要注意，「原始文件路径」如果为相对路径，那么相对的是目标文件的相对路径，或者直接使用绝对路径。

## 参考

- [linux 命令 which,whereis,locate,find 的区别](https://zhuanlan.zhihu.com/p/35727707)
- [ps -ef 和 ps aux 的区别及格式详解](https://www.cnblogs.com/5201351/p/4206461.html)
- [linux 中的分号&&和&，|和||说明与用法](https://cloud.tencent.com/developer/article/1722164)

