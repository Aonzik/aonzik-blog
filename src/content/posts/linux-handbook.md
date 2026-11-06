---
title: Linux 系统命令行与运维手册
description: 系统学习 Linux 命令行与服务器维护基础。
date: 2026-11-01
category: 技术
tags:
  - AIGC
  - 技术
  - 笔记
readingTime: 145
---

面向"会写代码，但没系统学过 Linux"的人：从 shell 的脾气讲到一台 VPS 的完整上线与长期维护。

基线：2026 年 10 月的发行版（Ubuntu 24.04/26.04 LTS、Debian 13、RHEL 10 系、Fedora 43+），命令在 bash 5.2 + GNU coreutils 上实测。

## 0. 先建立正确的预期

### 0.1 这本书解决什么问题

你已经会写代码。你可能是这样的状态：

- 在 Windows 或 macOS 上写代码，部署时别人给你一台 Linux 服务器，你只会照着教程粘贴命令；
- 会用 `cd`、`ls`、`cat`，但一遇到 `Permission denied`、`No space left on device`、`command not found` 就卡住；
- 知道 `systemctl restart nginx` 能生效，但不知道它到底做了什么、失败了该看哪里；
- 会用 Docker，但容器一跑起来就"黑盒"了，出问题只能重启。

这本书要解决的就是这些：**让你能自己判断一台 Linux 机器现在是什么状态、为什么出问题、下一步该看哪个文件。**

### 0.2 这本书不解决什么

- 不讲内核开发、驱动、eBPF 内核编程（只在排障时提到 `bpftrace` 的用法）。
- 不讲桌面环境（GNOME/KDE）、输入法、显卡驱动。服务器上不需要这些。
- 不是命令大全。`man` 才是命令大全，这本书讲的是**判断与组合**。
- 不覆盖所有发行版。主线是 Debian/Ubuntu 系与 RHEL 系（Rocky/Alma/Fedora），差异会单独标出。

### 0.3 三种练习环境（选一个就够）

| 方式 | 适合 | 代价 | 注意 |
| --- | --- | --- | --- |
| **一台便宜的 VPS**（1 核 1G） | 最接近真实，能练 SSH、防火墙、公网暴露 | 每月几美元 | 必须做安全加固，否则几小时内就会被扫 |
| **本机虚拟机**（VirtualBox / VMware / Hyper-V） | 免费、可快照、可随便折腾 | 占内存 | 网络选 NAT，练习端口转发 |
| **WSL2**（Windows） | 最快上手，文件和 Windows 互通 | 没有 systemd 的开机流程、没有真实网卡 | 新版 WSL2 支持 systemd，但仍不是生产环境 |

本书的命令在三种环境里都能跑，凡是只在真机上才能验证的（systemd、防火墙、磁盘）会明确标注。

如果你在 Windows 上跟着练，请装一个 **Git Bash 或 WSL**，不要用 CMD/PowerShell 去对照 bash 语法——两者只是"看起来像"。

### 0.4 怎么读

1. **边读边敲**。这本书的每个命令块都可以直接复制执行，但请先看懂再执行，尤其是带 `rm`、`dd`、`>` 的。
2. **第 1～5 章不要跳**。后面所有"为什么"都建立在这几章上（尤其是权限和进程）。
3. **第 17 章是总复习**：从裸机到上线，走一遍完整流程。可以先把 17 章当目标，回头补前面的细节。
4. 每章末尾有练习，答案折叠在 `<details>` 里。**先自己写 10 分钟再看答案。**
5. 遇到报错不要立刻搜。先读报错本身——Linux 的报错质量比大多数框架高得多。

### 0.5 本书的章结构

```text
第一部分 建立模型
  1  心智模型：内核、进程、文件、权限
  2  登录与 shell
  3  文件、目录与权限
  4  文本处理：grep / sed / awk
  5  进程、信号与作业控制

第二部分 系统管理
  6  用户与 sudo
  7  软件包管理
  8  systemd 与服务
  9  日志与时间
  10 存储、磁盘与文件系统

第三部分 网络与自动化
  11 网络配置与排障
  12 shell 脚本
  13 定时任务与自动化
  14 备份与恢复

第四部分 运维实战
  15 性能与排障方法论
  16 安全加固清单
  17 实战一：一台 VPS 的完整上线
  18 实战二：备份 + 巡检 + 告警脚本包
  19 陷阱与反模式
  20 练习总集
  21 速查表与学习路径
```

### 0.6 约定

- `$` 开头是普通用户执行的命令，`#` 开头是 root 执行的命令。**能不用 root 就不用 root。**
- `<...>` 是你要替换的占位符，例如 `ssh <user>@<host>`。
- 输出示例会省略无关行，用 `...` 表示。
- 提到"发行版系"时：**Debian 系** = Debian / Ubuntu / Mint；**RHEL 系** = RHEL / Rocky / Alma / Fedora / CentOS Stream。

---

## 1. 心智模型：内核、进程、文件、权限

这一章是全书的支点。**Linux 的所有"怪行为"都能从这四件事推出来**：内核管资源，进程是运行中的程序，文件是统一接口，权限决定谁能碰什么。

### 1.1 Linux 是什么

严格说，Linux 只是**内核**（kernel）。你日常说的"Linux 系统"其实是：

```text
用户程序（bash、nginx、python、你写的程序）
        ↓ 系统调用（open/read/write/fork/execve...）
C 库（glibc / musl）
        ↓
内核（进程调度、内存管理、文件系统、网络协议栈、驱动）
        ↓
硬件
```

发行版 = 内核 + GNU 工具（bash、coreutils、grep…）+ 包管理器 + 默认配置 + 服务。

**为什么这个区分重要？** 因为排障时要先判断"是内核在拒绝我，还是某个用户态程序在拒绝我"：

```bash
$ cat /etc/os-release          # 你用的是哪个发行版
$ uname -r                     # 内核版本
$ uname -a                     # 内核 + 架构 + 编译信息
```

```text
PRETTY_NAME="Ubuntu 24.04.3 LTS"
ID=ubuntu
VERSION_ID="24.04"
```

```text
6.8.0-45-generic
```

`6.8.0-45-generic` 的读法：内核 6.8.0，第 45 次发行版补丁，`generic` 是变体（服务器上常见 `generic`、云上常见 `aws`/`azure`、实时内核叫 `-rt`）。

### 1.2 一切皆文件（以及这条规则的边界）

Linux 把大量资源暴露成文件，于是你可以用同一套工具（`cat`、`ls`、`echo`、`>`）去操作它们：

| 路径 | 里面是什么 | 能读吗 | 能写吗 |
| --- | --- | --- | --- |
| `/proc/cpuinfo` | CPU 信息 | 能 | 不能 |
| `/proc/<pid>/status` | 某个进程的状态 | 能 | 不能 |
| `/proc/sys/vm/swappiness` | 内核参数 | 能 | 能（就是 `sysctl` 在改的东西） |
| `/sys/class/net/eth0/mtu` | 网卡 MTU | 能 | 能（部分） |
| `/dev/sda` | 块设备 | 能（危险） | 能（更危险） |
| `/dev/null` | 黑洞 | 读到 EOF | 写进去就丢弃 |
| `/dev/urandom` | 随机数 | 能 | 不能 |

```bash
$ cat /proc/loadavg          # 系统负载（就是 uptime 的第三部分）
$ cat /proc/meminfo | head -3
$ ls /proc/$$/fd             # 当前 shell 打开的文件描述符（$$ 是当前 shell 的 PID）
```

**边界**：网络连接、进程调度、信号、ioctl 这些不是"文件内容"，得用专门的工具（`ss`、`kill`、`ip`）。"一切皆文件"是简化，不是教条。

### 1.3 进程：运行中的程序

进程 = 程序（磁盘上的文件）+ 运行时状态（内存、寄存器、打开的文件、工作目录、环境变量、权限身份）。

```bash
$ ps -ef | head -5
```

```text
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 09:12 ?        00:00:03 /sbin/init
root         412       1  0 09:12 ?        00:00:01 /usr/lib/systemd/systemd-journald
root         655       1  0 09:12 ?        00:00:00 /usr/sbin/sshd -D
root         812       1  0 09:12 ?        00:00:00 nginx: master process /usr/sbin/nginx
www-data     813     812  0 09:12 ?        00:00:00 nginx: worker process
```

关键的几列：

- **PID 1**：第一个用户态进程，几乎所有发行版上都是 systemd（Alpine 是 busybox init，容器里可能是你的程序）。**PID 1 有特殊职责**：收养孤儿进程、转发信号。这也是"容器里我的程序收不到 SIGTERM"的根源（见 Node 手册第 21 章）。
- **PPID**：父进程。进程由父进程 `fork()` 出来，父进程死了，子进程被 PID 1 收养（这就是"孤儿进程"）。
- **TTY**：关联的终端。`?` 表示没有终端（后台服务）。
- **TIME**：累计 CPU 时间，不是运行时长。

进程的完整信息在 `/proc/<pid>/` 下：

```bash
$ ls /proc/1/ | head -20
$ cat /proc/1/cmdline | tr '\0' ' '; echo
$ readlink /proc/1/cwd          # 工作目录
$ readlink /proc/1/exe          # 可执行文件
$ cat /proc/1/environ | tr '\0' '\n'   # 环境变量（可能含密钥，注意权限）
```

**三个必须建立的直觉**：

1. **进程有身份**。它带着启动它的用户 ID 运行，这个身份决定了它能读写哪些文件、能绑定哪些端口（1024 以下端口在 Linux 上默认只有 root 能绑，除非设置 `CAP_NET_BIND_SERVICE`）。
2. **进程有工作目录**。相对路径是相对工作目录解析的，不是相对脚本位置。这就是"手动跑没问题，systemd 跑就找不到文件"的头号原因。
3. **进程有环境变量**。`systemd` 启动的服务**不会**继承你 shell 里的 `PATH`、`JAVA_HOME`、`.env` 里的东西。这是"命令行能跑、服务起不来"的头号原因。

### 1.4 文件、inode 与硬链接

文件名不是文件本身，只是指向 inode 的一条记录：

```text
目录项（文件名 → inode 号）
        ↓
inode（权限、属主、大小、时间戳、数据块位置；不包含文件名）
        ↓
数据块（真正的字节）
```

```bash
$ stat /etc/hostname
```

```text
  File: /etc/hostname
  Size: 12        	Blocks: 8          IO Block: 4096   regular file
Device: 803h/2051d	Inode: 1048633     Links: 1
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2026-10-20 09:12:33.912345678 +0800
Modify: 2026-10-20 09:12:31.000000000 +0800
Change: 2026-10-20 09:12:31.000000000 +0800
 Birth: 2026-10-20 09:12:31.000000000 +0800
```

**三个时间要分清**（排障时天天用）：

| 字段 | 含义 | 什么会改它 |
| --- | --- | --- |
| `Access`（atime） | 最后一次读取 | `cat`、`grep`（常被 `noatime` 挂载关掉） |
| `Modify`（mtime） | 最后一次内容修改 | 写入文件 |
| `Change`（ctime） | 最后一次 inode 变更 | 改权限、改属主、改内容、重命名 |

**硬链接 vs 软链接**：

```bash
$ echo hello > a.txt
$ ln a.txt b.txt          # 硬链接：两个文件名指向同一个 inode
$ ln -s a.txt c.txt       # 软链接：c.txt 是"路径字符串"的快捷方式
$ ls -li a.txt b.txt c.txt
```

```text
1048634 -rw-r--r-- 2 user user 6 Oct 20 10:01 a.txt
1048634 -rw-r--r-- 2 user user 6 Oct 20 10:01 b.txt
1048635 lrwxrwxrwx 1 user user 5 Oct 20 10:01 c.txt -> a.txt
```

读法：`a.txt` 与 `b.txt` 的 inode 号相同、`Links: 2`——删掉其中一个，数据还在；两个都删才真正释放。`c.txt` 有独立的 inode，内容是 `a.txt` 这个路径。

| | 硬链接 | 软链接 |
| --- | --- | --- |
| 跨文件系统 | 不行 | 可以 |
| 指向目录 | 不允许（普通用户） | 可以 |
| 原文件删除后 | 仍可访问 | 变成断链（dangling） |
| 常见用途 | 省空间、备份快照 | 版本切换、路径稳定（`/usr/bin/python3`） |

**"删除文件但磁盘没释放"**就是这两个概念的组合：进程还开着某个已删除文件的 fd，inode 引用计数不为 0，空间就不回收。第 10 章会给完整排查流程。

### 1.5 权限：三个身份 × 三种操作

```text
-rwxr-xr--  1 alice devs  4096 Oct 20 10:00 run.sh
 │└┬┘└┬┘└┬┘
 │ │  │  └── other（其他人）：r--
 │ │  └───── group（devs 组）：r-x
 │ └──────── owner（alice）：rwx
 └────────── 类型：- 普通文件，d 目录，l 软链接，b/c 设备，s socket，p 管道
```

| 位 | 对文件 | 对目录 |
| --- | --- | --- |
| `r` | 读内容 | 列出里面有哪些名字（`ls`） |
| `w` | 改内容 | 在里面创建/删除/重命名条目 |
| `x` | 执行 | 进入（`cd`）与访问里面的条目 |

**最容易错的组合**：目录有 `r` 没 `x`，你能 `ls` 看到文件名但打不开；有 `x` 没 `r`，你知道路径就能访问，但列不出目录内容。

```text
数字法：r=4 w=2 x=1
 755 = rwxr-xr-x   目录、可执行文件
 644 = rw-r--r--   普通文件（默认）
 600 = rw-------   私钥、含密码的配置
 777 = 所有人都能改 —— 几乎总是错
```

```bash
$ umask                 # 新建文件/目录时"屏蔽"掉的权限位
0022
$ touch x.txt && mkdir y && ls -ld x.txt y
```

```text
-rw-r--r-- 1 user user 0 Oct 20 10:02 x.txt
drwxr-xr-x 2 user user 4096 Oct 20 10:02 y
```

`umask 022` 的意思是"去掉 group 和 other 的写位"：目录默认 `777 & ~022 = 755`，文件默认 `666 & ~022 = 644`。

**特殊位**（知道存在、能看懂 `ls` 输出就够了）：

| 位 | 显示为 | 含义 | 典型用途 |
| --- | --- | --- | --- |
| SUID | `-rwsr-xr-x` | 执行时以文件属主身份运行 | `passwd`、`sudo` |
| SGID | `-rwxr-sr-x` | 以文件属组身份运行；目录上表示新建文件继承组 | 共享目录 |
| sticky | `drwxrwxrwt` | 目录里只有属主能删自己的文件 | `/tmp` |

```bash
$ ls -ld /tmp
drwxrwxrwt 14 root root 4096 Oct 20 10:03 /tmp
```

**为什么 `/tmp` 要有 sticky 位**：`/tmp` 是所有人可写的，没有 sticky 位的话，任何用户都能删别人的临时文件。

### 1.6 服务：被 systemd 拉起来的进程

这是运维视角最重要的一次视角切换：

```text
你手动跑：  bash → 你的程序（父进程是 bash，终端一关就收到 SIGHUP 死掉）
systemd 跑：systemd(PID 1) → 你的程序（父进程是 1，脱离终端，开机自启、崩溃重启、日志进 journal）
```

所以"服务"不是一种特殊的程序，**只是一个被 systemd 管理的普通进程**。这解释了：

- 为什么服务里 `~/xxx` 找不到文件（服务的家目录可能不是你的家目录）；
- 为什么服务里 `PATH` 很短（systemd 的默认 `PATH` 是固定的，不含 `/usr/local/bin` 之外的第三方目录）；
- 为什么 `systemctl restart` 之后 `ps` 里 PID 变了（重启 = 旧进程退出 + 新进程启动）。

第 8 章会把这件事讲到底。

### 1.7 与 Windows 的心智对照

| Windows | Linux | 说明 |
| --- | --- | --- |
| `C:\Users\me` | `/home/me`（root 是 `/root`） | 没有盘符，所有东西挂在一棵树上 |
| 注册表 | `/etc` 下的文本文件 | 配置就是文本，改完要"让程序重读" |
| 服务管理器 | systemd | `systemctl` 相当于 `services.msc` |
| 任务管理器 | `ps` / `top` / `htop` | |
| `netstat -ano` | `ss -tulpn` | |
| 事件查看器 | `journalctl` / `/var/log` | |
| `.exe` / 双击 | `./file` / `x` 权限位 | 能不能执行看权限位，不看扩展名 |
| 反斜杠路径 | 正斜杠路径 | `C:\a\b` → `/a/b` |
| 大小写不敏感 | **大小写敏感** | `File.txt` 与 `file.txt` 是两个文件 |
| 文件被占用不能删 | 可以删，空间延迟释放 | 见第 10 章 |

### 1.8 练习

1. 用 `cat /etc/os-release` 和 `uname -r` 说出你机器的发行版与内核版本。
2. 用 `stat` 看一个文件，说出它的 inode 号、三个时间戳、权限。
3. 创建 `a.txt`，用 `ln` 做硬链接和软链接各一个，然后 `ls -li` 解释三个文件的 inode 与链接数。删掉 `a.txt`，看两个链接分别变成什么。
4. 用 `umask 077` 后新建文件，看权限变成什么；再 `umask 022` 恢复。
5. 找出当前机器上 PID 为 1 的进程，用 `/proc` 说出它是什么、用什么命令启动、工作目录在哪。

<details>
<summary>参考答案要点</summary>

1. `PRETTY_NAME="Ubuntu 24.04.3 LTS"`，`6.8.0-45-generic`。
2. 例如 `Inode: 1048633`、`Access/Modify/Change` 三个时间、`Access: (0644/-rw-r--r--)`。
3. `a.txt` 与硬链接 inode 相同且 `Links: 2`；软链接 inode 不同、类型为 `l`、内容为路径。删掉 `a.txt` 后：硬链接仍能读（数据未释放），软链接变成断链（`cat` 报 `No such file or directory`）。
4. `umask 077` 后：文件 `600`、目录 `700`。因为 `666 & ~077 = 600`、`777 & ~077 = 700`。
5. `readlink /proc/1/exe` 通常是 `/usr/lib/systemd/systemd` 或 `/sbin/init`；`tr '\0' ' ' < /proc/1/cmdline` 看启动参数；`readlink /proc/1/cwd` 通常是 `/`。

</details>

---

## 2. 登录与 shell

### 2.1 你登录的到底是什么

```text
物理机/虚拟机 → 内核启动 → init/systemd → getty（本地终端）或 sshd（远程）→ 登录 → 启动你的 shell
```

你看到的"命令行"是 shell 打印的提示符，默认长这样：

```text
alice@web01:~$
│     │     │ └── 普通用户（root 是 #）
│     │     └──── 当前目录（~ 表示家目录）
│     └────────── 主机名
└──────────────── 用户名
```

`ssh` 做的事很简单：在远端启动一个 shell，把你键盘的输入转发过去（这就是 pty）。

```bash
$ ssh alice@203.0.113.10            # 用密码或密钥登录
$ ssh -p 2222 alice@203.0.113.10    # 非默认端口
$ ssh alice@host 'uptime'           # 不进入交互 shell，只执行一条命令
$ who                                 # 现在谁登录着
$ w                                   # 同上 + 他们在干什么
$ last | head                         # 登录历史
```

**第一次登录远程机器，先做这四件事**（后面第 6、16 章会展开）：

```bash
$ ssh-keygen -t ed25519 -C "alice@laptop"   # 本地生成密钥（在你自己电脑上）
$ ssh-copy-id alice@203.0.113.10            # 把公钥装到远端
$ ssh alice@203.0.113.10                    # 免密登录成功
$ sudo -l                                    # 看看你有多少权限
```

### 2.2 shell 启动时读了哪些文件

这是"我明明配了 `PATH`，为什么别的终端里没有"的标准答案。

| 场景 | 读取顺序（bash） |
| --- | --- |
| 登录 shell（`ssh` 登录、`su -`、tty 登录） | `/etc/profile` → `~/.bash_profile` → `~/.bash_login` → `~/.profile`（三者只读第一个存在的） |
| 交互式非登录 shell（终端里再开一个 `bash`） | `/etc/bash.bashrc` → `~/.bashrc` |
| 非交互 shell（脚本、`bash -c`） | 只读 `$BASH_ENV` 指向的文件（默认没有） |

实际影响：

- **`~/.bashrc` 里配的环境变量，在脚本里不存在。** 所以脚本要自己 `export`，或者用绝对路径。
- Ubuntu 默认在 `~/.profile` 里 source `~/.bashrc`，所以新手在 `.bashrc` 里写 `export` 也能"看起来生效"。
- `systemd` 服务**不读任何 shell 配置文件**。这是最常见的配置错位。

```bash
$ echo $SHELL                # 登录 shell 是哪个（/bin/bash）
$ bash --version | head -1
$ sh -c 'echo $BASH_VERSION' # sh 里没有 BASH_VERSION，说明 sh 不是 bash 行为
```

### 2.3 命令是怎么被找到的

```bash
$ echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$ type -a python3
python3 is /usr/bin/python3
python3 is /bin/python3
$ command -v nginx || echo "没装"
$ hash -r                  # 清掉"命令路径缓存"（换了软链接后常用）
```

`PATH` 从左到右查找，**找到第一个就用**。这带来三个经典问题：

1. **`/usr/local/bin` 在 `/usr/bin` 前面**：所以自己编译装的东西会覆盖包管理器装的同名命令。
2. **当前目录不在 `PATH` 里**：所以跑自己写的脚本要 `./script.sh`，不是 `script.sh`。这是**故意的安全设计**（防止在别人目录里执行恶意 `ls`）。
3. **改了 `PATH` 要重新登录或 `source`**：已经打开的终端不会自动更新。

```bash
$ export PATH="$HOME/.local/bin:$PATH"   # 临时生效
$ echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc   # 永久生效
$ source ~/.bashrc
```

### 2.4 引号：三态与它们的区别

| 写法 | 变量展开 | 通配符展开 | 空格保护 | 典型用途 |
| --- | --- | --- | --- | --- |
| `"双引号"` | 会 | 不会 | 会 | 默认选择 |
| `'单引号'` | 不会 | 不会 | 会 | 正则、JSON、含 `$` 的文本 |
| 不加引号 | 会 | 会 | **不会**（按空格分词） | 明确要做分词时 |

```bash
$ name="a b"
$ echo $name        # 分词：输出 a b（看起来一样，但传参是两个）
$ echo "$name"      # 一个参数：a b
$ printf '[%s]\n' $name    # [a] [b]
$ printf '[%s]\n' "$name"  # [a b]
$ echo 'cost: $100' # cost: $100（单引号不展开）
$ echo "cost: $100" # cost: 00（$1 被当成位置参数，空）
```

**文件名里有空格**是这条规则最常见的受害者：

```bash
$ for f in $(ls); do echo "$f"; done      # 错：文件名被按空格拆开
$ find . -maxdepth 1 -type f -print0 | xargs -0 ls -l   # 对：用 NUL 分隔
```

### 2.5 通配符与正则不是一回事

| 通配符（glob，shell 展开） | 含义 | 正则（grep/sed 用） | 含义 |
| --- | --- | --- | --- |
| `*` | 任意长度任意字符 | `*` | 前一个字符重复 0 次或多次 |
| `?` | 恰好一个字符 | `.` | 任意一个字符 |
| `[abc]` | a/b/c 之一 | `[abc]` | 同左 |
| `[0-9]` | 数字 | `[0-9]` | 同左 |
| `{a,b}` | a 或 b（bash 扩展） | `\|` 或 `-E` 下的 `\|` | 或 |

```bash
$ ls *.log                 # glob
$ grep -E 'ERROR|WARN' app.log   # 正则
$ grep 'err.*' app.log     # 正则里的 .* 是"任意字符重复"
```

**同一个 `*` 在两边含义完全不同**，这是新手最常见的混淆。

### 2.6 历史、快捷键与补全

| 按键 | 作用 |
| --- | --- |
| `Tab` | 补全文件名/命令（连按两次列出候选） |
| `Ctrl-R` | 反向搜索历史（再按 `Ctrl-R` 继续往前找） |
| `Ctrl-A` / `Ctrl-E` | 跳到行首 / 行尾 |
| `Ctrl-U` / `Ctrl-K` | 删到行首 / 删到行尾 |
| `Ctrl-W` | 删掉前一个单词 |
| `Ctrl-L` | 清屏（等于 `clear`） |
| `Ctrl-C` | 中断当前前台进程（发 SIGINT） |
| `Ctrl-Z` | 挂起到后台（发 SIGTSTP），用 `fg` 回来 |
| `Ctrl-D` | 发送 EOF（空行时退出 shell） |
| `!!` / `!$` / `!123` | 上一条命令 / 上一条命令的最后一个参数 / 历史第 123 条 |

```bash
$ sudo !!          # 常用的"刚才那条命令加 sudo 再来一次"
$ history | tail -20
$ history -c       # 清空当前会话历史
```

⚠️ `history` 里会留下明文密码（如果命令里带了 `-p`），见第 19 章的坑。

### 2.7 查文档的正确姿势

```bash
$ man ls                 # 手册页：/ 搜索，n 下一个，q 退出
$ man 5 crontab          # 指定章节：1 命令、5 文件格式、8 系统管理
$ ls --help | head -20   # 快速看选项
$ apropos "copy file"    # 按描述搜命令
$ tldr tar               # 社区版示例（要装 tldr，比 man 快）
```

**读 man 的技巧**：先看 `SYNOPSIS`（语法），再看 `OPTIONS` 里你要的那几个，最后看 `EXAMPLES`（如果 man 写了的话）。`man 5 xxx` 看的是配置文件格式，这比看博客准确得多。

### 2.8 环境变量与"为什么服务读不到"

```bash
$ env | sort | head -20          # 全部环境变量
$ echo "$HOME $USER $SHELL $PWD"
$ export APP_ENV=prod            # 导出给子进程
$ APP_ENV=dev ./script.sh        # 只给这一条命令
$ unset APP_ENV
```

**传播规则**：`export` 的变量会传给子进程，但**不会传给兄弟进程，也不会传回父进程**。所以：

```bash
$ bash -c 'export X=1; echo $X'   # 1
$ echo $X                          # 空：子 shell 的 export 不影响父 shell
```

服务读不到环境变量时，正确做法是在 unit 里写 `Environment=`/`EnvironmentFile=`（第 8 章），而不是去改 `.bashrc`。

### 2.9 练习

1. 用 `type -a` 找出 `python3`、`curl` 分别有几个来源，解释哪个会先被执行。
2. 写一条命令，把 `PATH` 里的 `/usr/local/bin` 临时去掉，再验证 `python3` 是否还能找到。
3. 用 `printf '[%s]\n'` 演示 `$name` 加引号与不加引号的区别（`name="a b"`）。
4. 用 `Ctrl-R` 找出三天前跑过的一条 `ssh` 命令并重新执行。
5. 解释：为什么 `bash ./deploy.sh` 能跑，`./deploy.sh` 报 `Permission denied` 或 `command not found`。

<details>
<summary>参考答案要点</summary>

1. `type -a python3` 会列出多个路径，**按 `PATH` 顺序第一个生效**；`/usr/local/bin` 通常在最前。
2. `export PATH=$(echo "$PATH" | sed 's#/usr/local/bin:##')`，然后 `type python3`。
3. 不加引号时 `printf` 收到两个参数 `a`、`b`，输出两行 `[a]`、`[b]`；加引号输出一行 `[a b]`。
4. `Ctrl-R` 输入 `ssh`，反复按找目标那条，回车执行。
5. `bash ./deploy.sh` 是让 bash 去读文件（**不需要 x 权限**，只需要 r 权限）；`./deploy.sh` 是让内核执行文件，**需要 x 权限**且 shebang 要正确；`command not found` 通常是当前目录不在 `PATH` 里（应写 `./deploy.sh`）或 shebang 路径不存在（如 `#!/bin/sh` 被删）。

</details>

---

## 3. 文件、目录与权限

### 3.1 目录树：东西都在哪

| 路径 | 放什么 | 你会碰到的场景 |
| --- | --- | --- |
| `/` | 根 | 不要在这里放自己的文件 |
| `/bin` `/sbin` | 基础命令（新版发行版已合并到 `/usr/bin` `/usr/sbin`，`/bin` 是软链接） | `ls -ld /bin` 看是不是链接 |
| `/usr/bin` | 发行版包安装的命令 | `which nginx` |
| `/usr/local/bin` | 自己编译/手工安装的命令 | `which caddy` |
| `/etc` | **系统配置**（全是文本） | 改 nginx、sshd、mysql 配置 |
| `/var/log` | 日志 | `tail -f /var/log/syslog` |
| `/var/lib` | 服务运行时的数据（数据库、容器） | `/var/lib/mysql`、`/var/lib/docker` |
| `/var/www` | 网站根目录（约定，非强制） | 静态站点 |
| `/home/<user>` | 用户家目录 | 你的代码、`.ssh`、`.bashrc` |
| `/root` | root 的家目录 | `sudo -i` 之后在这 |
| `/tmp` | 临时文件，**重启可能被清空** | 别在这里存数据 |
| `/opt` | 第三方软件（整体安装的） | `/opt/appname` |
| `/srv` | 服务数据（约定） | 可选 |
| `/proc` `/sys` `/dev` | 内核与设备的虚拟文件系统 | 排障 |
| `/run` | 运行时状态（PID 文件、socket） | `nginx.pid` 在这 |
| `/boot` | 内核与引导 | 谨慎操作 |

```bash
$ ls -ld /bin /lib /sbin /lib64
$ df -h /                 # 根分区还有多少空间
$ mount | head             # 当前挂载了什么
```

**三个常见误解**：

- `/` 满了会导致**所有服务一起出问题**（日志写不进去、临时文件建不了）。所以要给 `/var` 或 `/var/log` 单独分区，或者至少监控 `/`。
- `/tmp` 被 `systemd-tmpfiles` 定期清理（默认 10 天，Ubuntu 上还有 tmpfs 的可能）。
- 程序的"配置文件放哪"由程序决定，不是系统决定的。`/etc/app/`、`/opt/app/conf/`、`./config.yaml` 都可能有。

### 3.2 查看与导航

```bash
$ pwd                       # 我在哪
$ cd /var/log && cd ..      # 进入 + 上一级
$ cd -                      # 回到上一个目录（很实用）
$ cd                        # 回家目录
$ ls -la                    # -l 长格式 -a 含隐藏文件 -h 人类可读大小 -t 按时间 -r 反序
$ ls -lt | head             # 最近修改的文件
$ tree -L 2 /etc/nginx      # 目录树（可能要装 tree）
```

**`ls -l` 第一列的读法**：`drwxr-xr-x` → 类型 + 三组权限，见 1.5。

### 3.3 查找文件：`find` 是主力

```bash
$ find /var/log -name "*.log" -mtime -7          # 7 天内改过的 .log
$ find /etc -type f -name "*.conf" | head
$ find . -maxdepth 1 -type d                     # 只看当前层目录
$ find / -xdev -type f -size +500M 2>/dev/null   # 找大于 500M 的文件（-xdev 不跨文件系统）
$ find . -name "*.tmp" -delete                   # 删除（先不带 -delete 看结果！）
$ find . -type f -newer package.json             # 比 package.json 新的文件
$ find . -type f -print0 | xargs -0 grep -l TODO # 文件名带空格也安全
```

| 选项 | 作用 |
| --- | --- |
| `-name` / `-iname` | 按名字（`-iname` 忽略大小写） |
| `-type f/d/l` | 文件/目录/软链接 |
| `-size +10M` | 大小（`+` 大于、`-` 小于） |
| `-mtime -7` / `+30` | 修改时间，天 |
| `-mmin -60` | 修改时间，分钟 |
| `-user alice` | 属主 |
| `-perm 644` / `-perm -u+s` | 权限（`-` 表示"至少包含"） |
| `-exec cmd {} \;` | 对每个结果执行命令 |
| `-delete` | 删除（**先不加它跑一遍**） |

`-exec` 与 `xargs` 的区别：`-exec ... \;` 每条结果执行一次（慢）；`-exec ... +` 批量传参（快）；`xargs` 也批量，但要注意空格问题（用 `-print0 | xargs -0`）。

### 3.4 复制、移动、删除

```bash
$ cp -a src/ dst/            # -a = -dR --preserve=all，备份首选
$ cp -i a b                  # 覆盖前问（很多发行版默认给 cp 起了 alias）
$ mv a b                     # 同分区是改名，跨分区是复制+删除
$ rm -i file                 # 问一下
$ rm -rf dir/                # 危险：不给任何提示
$ rmdir emptydir             # 只能删空目录
```

**`rm -rf` 的四个保护习惯**：

1. 先用 `ls` 或 `find` 确认要删的东西。
2. 变量拼路径时加 `--`：`rm -rf -- "$dir"`（防止目录名以 `-` 开头被当成选项）。
3. 路径末尾**不要**留空格、变量要加引号：`rm -rf "$dir"/` 与 `rm -rf "$dir" /` 是两个世界。
4. 重要目录先 `touch` 一个标记文件，删之前检查它存在：

```bash
[ -f "$dir/.keep" ] || { echo "拒绝删除：缺少标记文件"; exit 1; }
rm -rf -- "$dir"
```

### 3.5 权限的日常操作

```bash
$ chmod 644 file             # 数字法
$ chmod u+x script.sh        # 符号法：u 属主、g 属组、o 其他、a 全部；+ - = 加/减/设为
$ chmod -R g+rX dir/         # X：只给目录和"已经有 x 的文件"加执行位（安全地递归加 r）
$ chown alice:devs file      # 改属主与属组
$ chgrp devs file            # 只改属组
$ chown -R alice:devs dir/
```

**`chmod -R 777` 永远不是解法**。它只是把"权限不对"变成"谁都能改"，真正的问题通常是：

- 服务以 `www-data` 运行，但文件属主是 `root`（→ 改属主，或用 `chown -R www-data`）；
- 目录缺少 `x` 位导致进不去（→ `chmod o+x` 而不是 `777`）；
- SELinux/AppArmor 阻止（→ 看 `ausearch`/`dmesg`，不是改权限）。

**ACL**（需要精细授权时）：

```bash
$ setfacl -m u:bob:rw report.txt      # 单独给 bob rw
$ getfacl report.txt                   # 看 ACL（权限列末尾出现 + 号就是有 ACL）
$ setfacl -x u:bob report.txt          # 删掉 bob 的 ACL
```

### 3.6 磁盘用量与"空间去哪了"

```bash
$ df -h                    # 每个挂载点的总/已用/可用
$ df -i                    # inode 用量（**小文件太多会把 inode 用光，df -h 看不出来**）
$ du -sh /var/log          # 某目录总大小
$ du -h --max-depth=1 /var | sort -h | tail -5   # 找出大户
```

**`df` 说满了但 `du` 加起来对不上**，三个原因（第 10 章详述）：

1. 有进程打开着已删除的文件（`lsof +L1` 能找到）；
2. 挂载点被别的目录"盖住"了（`mount --bind` 或忘记卸载）；
3. 保留块（root 预留 5%，`df` 的 `Size` 与 `Avail` 差值）。

### 3.7 文件名里的坑

```bash
$ ls -- -weirdname           # 以 - 开头的文件名要用 --
$ touch "a b.txt" && cat "a b.txt"
$ ls a\ b.txt                # 转义空格
$ find . -name "*.txt" -print0 | xargs -0 rm   # 空格/换行安全
$ printf '%s\n' * | cat -A    # 看文件名里有没有隐藏字符
```

- **大小写敏感**：`Readme.md` 与 `README.md` 可以共存。
- **不要用中文文件名**做部署产物（某些工具链、压缩包、Windows 传输会出问题）。
- **不要用空格**命名，用 `-` 或 `_`。
- 文件名里的 `:`、`*`、`?`、`|` 合法但会让你写脚本时痛不欲生。

### 3.8 练习

1. 在 `/tmp` 下建三级目录，用 `find` 找出所有空目录。
2. 创建一个只有属主可读写的文件（`600`），验证同组用户读不了（用 `sudo -u` 模拟）。
3. 用 `du` 找出 `/var` 下最大的三个目录，再用 `df -i` 看 inode 用了多少。
4. 写一条 `find`，找出 `/etc` 下所有 7 天内修改过的配置文件。
5. 解释：为什么 `chmod 644 dir/` 会让目录打不开。

<details>
<summary>参考答案要点</summary>

1. `find /tmp/x -type d -empty`。
2. `chmod 600 f`，`sudo -u other cat f` → `Permission denied`。
3. `du -h --max-depth=1 /var | sort -h | tail -3`；`df -i /var`。
4. `find /etc -type f -name "*.conf" -mtime -7`。
5. 因为 `644` 去掉了目录的 `x` 位，而进入目录（`cd`、访问里面的文件）需要 `x`。目录至少要 `755`（或对特定用户给 `x`）。

</details>

---

## 4. 文本处理：grep / sed / awk

Linux 上的"数据分析"往往就是这三件套 + 管道。学会组合，比记 100 个选项有用。

### 4.1 管道的规则

```bash
$ cmd1 | cmd2 | cmd3
```

- 管道把前一个命令的 **stdout** 接到后一个命令的 **stdin**。
- **stderr 不走管道**（除非 `2>&1`）。
- **退出码是最后一个命令的**，前面失败了你也看不到（除非 `set -o pipefail`，见第 12 章）。

```bash
$ grep -c ERROR app.log || echo "没有 ERROR"     # grep 没匹配到时退出码是 1
$ ls /nope 2>&1 | head                            # 把错误也送进管道
$ set -o pipefail; cmd1 | cmd2                    # 中间失败也能被发现
```

### 4.2 `grep`：找

```bash
$ grep ERROR app.log                    # 基本
$ grep -i error app.log                 # 忽略大小写
$ grep -v DEBUG app.log                 # 反向：不含 DEBUG 的行
$ grep -c ERROR app.log                 # 计数
$ grep -n ERROR app.log                 # 带行号
$ grep -r TODO src/                     # 递归（也可以用 rg）
$ grep -E 'ERROR|WARN' app.log          # 扩展正则
$ grep -A3 -B1 'NullPointer' app.log    # 后 3 行、前 1 行上下文
$ grep -o '"user":"[^"]*"' data.json    # 只输出匹配部分
$ grep -F 'a.b' file                    # 固定字符串（不解释正则）
$ grep -l pattern *.log                 # 只列文件名
$ grep -w word file                     # 全词匹配
```

| 正则（`-E` 下） | 含义 |
| --- | --- |
| `.` | 任意一个字符 |
| `*` `+` `?` | 重复 0+、1+、0 或 1 |
| `{2,5}` | 重复 2～5 次 |
| `^` `$` | 行首 / 行尾 |
| `[^abc]` | 非 a/b/c |
| `\b` | 词边界 |
| `(...)` `\|` | 分组 / 或 |
| `(?i)` | 大小写不敏感（GNU grep 支持） |

### 4.3 `sed`：改（流编辑）

```bash
$ sed 's/foo/bar/' file          # 每行第一个 foo 换成 bar
$ sed 's/foo/bar/g' file         # 全部
$ sed -i 's/foo/bar/g' file      # 直接改文件（建议先 -i.bak 备份）
$ sed -n '10,20p' file           # 只打印 10～20 行（-n 关闭默认输出）
$ sed '/^#/d' file               # 删掉注释行
$ sed '/^$/d' file               # 删空行
$ sed 's#/old/path#/new/path#g' file   # 换分隔符，避免转义斜杠
$ sed -E 's/([0-9]+)ms/\1 毫秒/' file  # -E 用扩展正则 + 反向引用
```

**最常见的三个坑**：

1. `sed -i` 在 macOS 上要写 `sed -i ''`，GNU sed 不需要。脚本里想跨平台就别用 `-i`，改用输出重定向。
2. `sed` 是按行处理的，**不能跨行匹配**（那是 `awk` 或 `perl -0` 的活）。
3. 特殊字符（`&` 表示"整个匹配"）要转义：`sed 's/a/\&/'`。

### 4.4 `awk`：算（按列处理）

`awk` 的模型是"对每一行，按字段做事"：

```text
awk 'BEGIN{...} 模式{动作} END{...}' 文件
                         ↑ $1 $2 ... 是字段，$0 是整行，NF 是字段数，NR 是行号
```

```bash
$ awk '{print $1, $3}' access.log                 # 打印第 1、3 列
$ awk -F: '{print $1}' /etc/passwd                # 指定分隔符
$ awk '$9 == 500 {print}' access.log              # 过滤：状态码 500
$ awk '{sum += $10} END {print sum}' access.log   # 求和（假设第 10 列是字节数）
$ awk '{count[$1]++} END {for (k in count) print count[k], k}' access.log | sort -rn | head
$ awk 'NR>1 && $3 > 100 {print NR": "$0}' data.txt  # 行号 + 条件
$ awk 'BEGIN{printf "%-10s %s\n", "NAME", "SIZE"} {printf "%-10s %s\n", $1, $5}' list.txt
```

最实用的两个模式：

```bash
# 1) 统计每个 IP 的请求数（access.log 第 1 列是 IP）
$ awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# 2) 求某一列的总和/平均
$ awk '{s+=$1; n++} END {printf "总数 %.2f 平均 %.2f\n", s, s/n}' nums.txt
```

### 4.5 其他小工具的组合

```bash
$ cut -d: -f1,3 /etc/passwd          # 按分隔符取列
$ sort -k2 -n file                   # 按第 2 列数字排序
$ sort -u file                       # 去重排序
$ uniq -c | sort -rn                 # 计数并按次数排序（必须先 sort）
$ tr 'a-z' 'A-Z' < file               # 字符替换
$ tr -d '\r' < win.txt > unix.txt     # 删掉 Windows 换行里的 CR（经典）
$ wc -l file                          # 行数（-c 字节、-w 词）
$ head -20 / tail -f -n 100           # 前 20 行 / 跟踪最后 100 行
$ tee out.log                         # 同时输出到屏幕和文件
$ paste a.txt b.txt                   # 按行并排
$ jq '.items[] | {id, name}' data.json   # 处理 JSON（要装 jq）
```

### 4.6 一个真实的日志分析流程

假设 `access.log` 是 nginx 的默认格式：

```text
203.0.113.5 - - [20/Oct/2026:10:01:02 +0800] "GET /api/items HTTP/1.1" 200 512 "-" "curl/8.5.0"
```

```bash
# 1) 总请求数
$ wc -l < access.log

# 2) 状态码分布
$ awk '{print $9}' access.log | sort | uniq -c | sort -rn

# 3) 5xx 最多的 10 个 URL
$ awk '$9 ~ /^5/ {print $7}' access.log | sort | uniq -c | sort -rn | head -10

# 4) 请求量最大的 10 个 IP
$ awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# 5) 过去一小时每分钟的请求数（需要日志里有时间，或用时间戳格式）
$ grep "$(date +%d/%b/%Y:%H)" access.log | awk -F: '{print $2}' | uniq -c

# 6) 响应时间 P95（如果日志里加了 $request_time）
$ awk '{print $NF}' access.log | sort -n | awk '{a[NR]=$1} END {print a[int(NR*0.95)]}'
```

这套流程在 100MB 以内的日志上足够快；再大就上 `rg`（ripgrep）、`lnav`、或者导入数据库。

### 4.7 练习

1. 用 `awk` 统计 `/etc/passwd` 里每种 shell（最后一列）出现的次数。
2. 用 `grep` + `sed` 把日志里所有 `id=123` 替换成 `id=***`（只输出到屏幕，不改文件）。
3. 用 `find` + `xargs` + `grep` 在 `src/` 下找出所有引用 `TODO` 的 JavaScript 文件。
4. 统计一个 CSV 的第 3 列总和（第 1 行是表头）。
5. 解释 `sort | uniq -c` 里为什么必须先 `sort`。

<details>
<summary>参考答案要点</summary>

1. `awk -F: '{print $NF}' /etc/passwd | sort | uniq -c | sort -rn`
2. `sed 's/id=[0-9]*/id=***/g' app.log`
3. `grep -rl TODO src/ --include='*.js'`（或 `find src -name '*.js' -print0 | xargs -0 grep -l TODO`）
4. `awk -F, 'NR>1 {s+=$3} END {print s}' data.csv`
5. `uniq` 只合并**相邻**的重复行，所以必须先排序让相同行相邻。

</details>

---

<!-- NEXT -->

---

## 5. 进程、信号与作业控制

你在服务器上做的最多的三件事：看进程、杀进程、让进程在后台活着。这三件事做错，就是"服务莫名停止"和"数据莫名损坏"的主要来源。

### 5.1 `ps` 的三种看家角度

```bash
$ ps aux | head -5              # BSD 风格：所有用户 + 含无终端进程
$ ps -ef | head -5              # System V 风格：多了 PPID
$ ps -eo pid,ppid,user,%cpu,%mem,etime,stat,cmd --sort=-%cpu | head -10  # 自定义列
```

| 列 | 含义 |
| --- | --- |
| `STAT` / `S` | 进程状态（见下表） |
| `%CPU` `%MEM` | 占 CPU/内存百分比（`%CPU` 是**自启动以来的平均**，不是瞬时） |
| `ETIME` / `TIME` | 已运行时长 / 累计 CPU 时间 |
| `VSZ` / `RSS` | 虚拟内存 / 常驻物理内存（KB） |
| `NI` | nice 值（-20 最高优先级，19 最低） |

进程状态（`ps` 的 `STAT` 列第一位）：

| 状态 | 含义 | 说明 |
| --- | --- | --- |
| `R` | Running/Runnable | 正在跑或在等 CPU |
| `S` | Sleeping | 可中断睡眠（等事件，最常见） |
| `D` | Uninterruptible sleep | **不可中断**，通常在等磁盘 IO；杀不掉，只能等或重启 |
| `Z` | Zombie | 已退出但父进程没 `wait()`，占一个 PID |
| `T` | Stopped | 被 `Ctrl-Z` 或 `SIGSTOP` 停住 |
| `I` | Idle | 内核线程 |

**`D` 状态是排障里的红灯**：说明磁盘/NFS/块设备卡住了。`kill -9` 也杀不掉，因为它不响应任何信号。

**僵尸进程（`Z`）**：它已经被回收了内存，只剩一个 PID 条目。**杀僵尸没用**，要解决的是"父进程为什么不 `wait()`"。父进程退出后它会被 PID 1 收养并清理。

### 5.2 找工作进程

```bash
$ pgrep -a nginx                 # 按名字找，带命令行
$ pgrep -u www-data             # 某用户的进程
$ pidof nginx                    # 只要 PID
$ ps -ef | grep '[n]ginx'        # 经典写法：方括号防止 grep 匹配到自己
$ pstree -p 812                  # 看进程树
$ ss -tulpn | grep :80           # 谁占着 80 端口（PID 也在里面）
$ lsof -i :80                    # 同上，另一种写法
$ lsof /var/log/nginx/access.log # 谁打开着这个文件
```

### 5.3 信号：终止进程的正确顺序

```bash
$ kill <pid>            # 默认发 SIGTERM(15)：请进程自己退出（可被捕获、能清理）
$ kill -TERM <pid>      # 同上，显式写
$ kill -HUP <pid>       # 重读配置（nginx、sshd 都用它）
$ kill -9 <pid>         # SIGKILL：内核直接杀，进程没有任何机会清理
$ kill -l               # 列出全部信号
$ pkill -f 'node server.js'   # 按命令行匹配（危险，可能误杀）
$ killall nginx               # 按名字（危险）
```

| 信号 | 编号 | 默认行为 | 你该什么时候用 |
| --- | --- | --- | --- |
| `SIGTERM` | 15 | 终止（可捕获） | **默认选择**，给自己写的服务留时间关连接、刷盘 |
| `SIGINT` | 2 | 终止 | `Ctrl-C`，交互式中断 |
| `SIGKILL` | 9 | 立即杀（不可捕获） | 只在 `TERM` 无效时；会造成半写文件、锁不释放 |
| `SIGHUP` | 1 | 终止（多数守护进程捕获为"重载配置"） | `systemctl reload` 底层就是它 |
| `SIGQUIT` | 3 | 终止 + core dump | 排查崩溃 |
| `SIGUSR1` | 10 | 自定义 | 例如 nginx 重开日志文件 |
| `SIGSTOP`/`SIGCONT` | 19/18 | 暂停/继续（不可捕获） | 调试 |
| `SIGTSTP` | 20 | 暂停 | `Ctrl-Z` |

**为什么不能一上来 `kill -9`**：

- 应用收不到信号 → 没有机会关闭数据库连接、写完日志、删临时文件；
- 数据库、消息队列可能因此留下不一致状态；
- 如果进程在写文件，可能留下半截文件。

正确的顺序永远是：`systemctl stop` → 等 → `kill -TERM` → 等 → `kill -9`（最后手段）。

### 5.4 前台、后台与"关掉终端就死"

```bash
$ sleep 300 &            # 放到后台，输出 [1] 12345
$ jobs                   # 当前 shell 的作业列表
$ fg %1                  # 调回前台
$ bg %1                  # 让停住的作业继续在后台跑
$ Ctrl-Z                 # 挂起前台进程
$ Ctrl-C                 # 中断前台进程
```

**关键事实**：`&` 只是让进程在后台跑，它**仍然是这个终端的子进程**。你退出登录（关闭 SSH），终端会向它发 `SIGHUP`，进程就死了。

三种"活下去"的办法，从差到好：

```bash
$ nohup ./job.sh > job.log 2>&1 &    # 忽略 SIGHUP，输出重定向到文件（能用，但不推荐）
$ tmux new -s work                    # 会话保持（交互式工作用它）
$ systemctl start myjob               # 正式服务用这个（第 8 章）
```

`nohup` 的坑：PID 你不知道、崩了不会重启、开机不会自启、日志不会轮转。**长期跑的东西一律做成 systemd 服务。**

`tmux` 最小用法：

```bash
$ tmux new -s work          # 新建会话
$ Ctrl-B d                  # 脱离（detach）
$ tmux ls                   # 列出会话
$ tmux attach -t work       # 回去
```

### 5.5 优先级与资源观察

```bash
$ nice -n 10 ./batch.sh          # 以低优先级启动
$ renice -n 5 -p 1234            # 改已有进程
$ top                            # 交互：P 按 CPU 排、M 按内存排、1 看每核、k 杀进程
$ htop                           # 更好看的版本（要装）
$ uptime                         # 负载：1/5/15 分钟平均可运行进程数
$ vmstat 1 5                     # 每秒一次，看 5 次：r(运行队列) b(阻塞) si/so(swap) us/sy/id/wa
$ pidstat -p 1234 1 5            # 单进程每秒 CPU/内存
$ iostat -xz 1 5                 # 磁盘：%util、await、r/s、w/s
$ free -h                        # 内存：total/used/free/buff-cache/available
```

**负载（load average）怎么读**：它是"可运行 + 不可中断（`D`）"的进程数平均值，**不是百分比**。1 分钟负载 8 在一台 4 核机器上意味着明显过载；但如果是 IO 卡住导致的 `D` 状态堆积，CPU 可能还很闲。所以负载要和 `vmstat` 的 `r`/`b`、`iostat` 的 `%util` 一起看。

**`free` 的 `available` 才是"还能用多少"**：`buff/cache` 是缓存，内核会在需要时回收，别看到 `free` 很小就慌。

### 5.6 `/proc` 快速排障

```bash
$ cat /proc/<pid>/status | head -12     # 名称、状态、内存、线程数
$ ls -l /proc/<pid>/fd                 # 打开的文件与 socket
$ cat /proc/<pid>/io                   # 读写字节数
$ cat /proc/<pid>/limits               # 这个进程的 ulimit
$ cat /proc/<pid>/environ | tr '\0' '\n' | sort
$ cat /proc/<pid>/maps | head            # 内存映射（看加载了哪些库）
$ cat /proc/<pid>/stack                  # 内核栈（需要权限，D 状态时有用）
```

### 5.7 卡住了怎么办：`strace` 与 `timeout`

```bash
$ timeout 10 ./long-task.sh        # 10 秒后强制结束（返回码 124）
$ strace -p <pid>                   # 挂在一个进程上看它在做什么系统调用（Ctrl-C 退出）
$ strace -f -e trace=network curl https://example.com   # 只看网络相关调用
$ ltrace -p <pid>                   # 看库函数调用（要装）
```

`strace` 的输出很吵，但它能回答一个关键问题：**进程到底卡在哪个系统调用上**（`read`、`connect`、`futex`、`wait4`…）。

### 5.8 练习

1. 用 `ps` 找出 CPU 占用最高的三个进程，说出它们的用户和启动命令。
2. 起一个 `sleep 600` 放到后台，用 `jobs` 看它，然后用正确的方式结束它（不要用 `-9`）。
3. 起一个 `sleep 600`，`Ctrl-Z` 挂起，再 `bg` 放后台，最后杀掉。
4. 用 `ss` 找出监听 22 端口的进程 PID，再用 `/proc` 说出它的完整命令行。
5. 解释：为什么 `nohup` 之后进程还是可能死？什么情况下一定要用 systemd？

<details>
<summary>参考答案要点</summary>

1. `ps -eo pid,user,%cpu,cmd --sort=-%cpu | head -4`。
2. `sleep 600 &` → `kill %1`（等于 `kill -TERM`）。
3. `Ctrl-Z` → `bg %1` → `kill %1`。
4. `ss -tulpn | grep :22` 拿到 PID → `tr '\0' ' ' < /proc/<pid>/cmdline`。
5. `nohup` 只忽略 `SIGHUP`，进程崩了不会重启、机器重启不会自启、日志不轮转、没人管它的资源限制。要"长期、可重启、开机自启、日志统一"就必须 systemd。

</details>

---

## 6. 用户与 sudo

### 6.1 账号、组与身份文件

```bash
$ id                        # 当前用户的 uid/gid/组
$ whoami
$ cat /etc/passwd | head -3
$ sudo cat /etc/shadow | head -3
$ getent passwd alice       # 比 cat /etc/passwd 更准确（也查 LDAP/SSSD）
$ groups alice
```

`/etc/passwd` 七个字段：

```text
alice:x:1000:1000:Alice:/home/alice:/bin/bash
 │    │  │    │    │      │            └── 登录 shell
 │    │  │    │    │      └── 家目录
 │    │  │    │    └── 备注（GECOS）
 │    │  │    └── 主组 GID
 │    │  └── UID（0 = root，1000+ 普通用户，1–999 系统用户）
 │    └── 密码占位符（真实哈希在 /etc/shadow）
 └── 用户名
```

`/etc/shadow` 里是密码哈希与老化策略：`alice:$6$...:19500:0:99999:7:::`（`$6$` 是 SHA-512 crypt；`y` 或 `!` 开头表示禁用登录）。

### 6.2 创建用户：三件事别忘

```bash
$ sudo adduser alice                 # Debian 系：交互式，自动建家目录、问密码
$ sudo useradd -m -s /bin/bash alice  # 通用：-m 建家目录，-s 指定 shell
$ sudo passwd alice                   # 设密码
$ sudo usermod -aG sudo alice         # 加入 sudo 组（Debian 系；RHEL 系是 wheel）
$ sudo usermod -aG docker alice       # 加入其他组（-a 必须写，否则会覆盖原有组！）
$ sudo userdel -r alice               # 删用户 + 家目录
```

**只有 `adduser` 会顺手做好四件事**：建家目录、复制 `/etc/skel`、设密码、建同名组。`useradd` 什么都不做，所以更常用在脚本里。

**`-aG` 的 `-a` 千万别漏**：`usermod -G sudo alice` 会把 alice 的附加组**替换**成只有 sudo，她的 docker 组就没了。

### 6.3 sudo：不是"切换到 root"，而是"按规则执行"

```bash
$ sudo -l                 # 我能执行哪些命令（最该常看的命令）
$ sudo -i                 # 变成 root 的登录 shell（会读 root 的 profile）
$ sudo -s                 # 变成 root 的 shell（保留当前环境变量）
$ sudo -u www-data ls /var/www    # 以别的用户身份执行（模拟服务权限问题）
$ sudo -k                 # 清掉 sudo 的时间戳（下次要重新输密码）
```

`/etc/sudoers` 用 `visudo` 编辑（它会在保存时检查语法，**直接 `vim` 改坏了会导致所有人失去 sudo**）：

```text
# 用户 主机=(可切换到的用户:组) 可执行的命令
alice  ALL=(ALL:ALL) ALL              # 全部权限（最常见，等于管理员）
bob    ALL=(root) /usr/bin/systemctl restart nginx   # 只能重启 nginx
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp
%devs  ALL=(ALL) ALL                   # % 开头是组
```

**`NOPASSWD` 的风险**：任何能写该用户文件的人，都能借此提权。自动化脚本需要它时，把命令限定到**具体路径**，不要写 `ALL`。

**`sudo` 与"用 root 直接登录"的区别**：`sudo` 会记录谁执行了什么（在 `/var/log/auth.log` 或 journal 里），可以撤销、可以限权；直接 root 登录则无法追溯。**服务器上应禁止 root 登录 + 禁止密码登录**（第 16 章）。

### 6.4 SSH 密钥认证与 sshd 加固

```bash
# 本地（你的电脑）
$ ssh-keygen -t ed25519 -a 100 -C "alice@laptop"    # ed25519 是目前首选；-a 增加 KDF 轮数
$ ls ~/.ssh                                          # id_ed25519（私钥，600） id_ed25519.pub（公钥）
$ ssh-copy-id alice@203.0.113.10                     # 把公钥追加到远端 ~/.ssh/authorized_keys

# 远端
$ chmod 700 ~/.ssh
$ chmod 600 ~/.ssh/authorized_keys
$ chmod 600 ~/.ssh/id_ed25519
```

**权限不对是最常见的"密钥登录失败"原因**：`sshd` 在 `StrictModes` 默认开启时，会拒绝组/其他人可写的 `.ssh` 与 `authorized_keys`。

`~/.ssh/config` 让日常登录不痛苦：

```text
Host web
    HostName 203.0.113.10
    User alice
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 30
```

```bash
$ ssh web          # 之后只需这一个词
```

`/etc/ssh/sshd_config` 的加固六项：

```text
Port 2222                              # 改端口减少扫描噪音（不是安全措施）
PermitRootLogin prohibit-password      # 禁止 root 用密码登录（理想是 no）
PasswordAuthentication no              # 只用密钥
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers alice deploy                # 白名单（可选，很强）
```

```bash
$ sudo sshd -t                          # 改完先测语法！sshd_config 写错会把人锁在外面
$ sudo systemctl reload ssh             # 用 reload，不要 restart（不中断现有连接）
```

⚠️ **改 sshd 前先开第二个终端验证新配置能登录**，再关掉旧会话。这是运维里"把自己锁在门外"的头号事故。

### 6.5 密码策略与老化（什么时候真的需要）

```bash
$ sudo chage -l alice                   # 看密码策略
$ sudo chage -M 90 -W 14 alice          # 最长 90 天，提前 14 天警告
$ sudo passwd -l alice                  # 锁定账号
$ sudo passwd -u alice                  # 解锁
```

现代建议（NIST SP 800-63B-4）与"90 天强制改密"相冲突：**强制轮换会让人用 `Password1!` → `Password2!`**。更有效的做法是：长密码/密码短语 + MFA + 泄露检测 + 只在怀疑泄露时改。合规要求的场景按合规来（这是两件事）。

### 6.6 练习

1. 建一个用户 `deploy`，加入 `sudo` 组，验证 `sudo -l` 的输出。
2. 生成一把 ed25519 密钥，装到远端，改成只用密钥登录，验证密码登录被拒绝。
3. 用 `visudo` 给某个用户只允许 `systemctl restart nginx`，测试越权命令被拒。
4. 解释：`usermod -G docker alice` 与 `usermod -aG docker alice` 的区别，以及前者的后果。
5. 说明为什么"改完 sshd 先 `sshd -t` 再 `reload`"能救命。

<details>
<summary>参考答案要点</summary>

1. `sudo adduser deploy` → `sudo usermod -aG sudo deploy` → `sudo -l -U deploy`。
2. `ssh-keygen -t ed25519` → `ssh-copy-id` → 改 `sshd_config` 的 `PasswordAuthentication no` → `sshd -t` → `systemctl reload ssh` → 新开终端验证。
3. `visudo` 加 `alice ALL=(root) /usr/bin/systemctl restart nginx`，然后 `sudo systemctl restart nginx` 成功、`sudo systemctl stop nginx` 被拒。
4. `-G` 会**替换**全部附加组，alice 可能因此失去 sudo 组；`-aG` 是追加。
5. `sshd -t` 检查语法与密钥文件问题，`reload` 不中断已有连接，而语法错 + `restart` 会导致 sshd 起不来、所有人无法登录。

</details>

---

## 7. 软件包管理

### 7.1 两个世界

| 任务 | Debian 系（apt） | RHEL 系（dnf） |
| --- | --- | --- |
| 更新索引 | `apt update` | `dnf makecache`（`check-update` 会顺带刷新） |
| 安装 | `apt install nginx` | `dnf install nginx` |
| 卸载（保留配置） | `apt remove nginx` | `dnf remove nginx` |
| 彻底卸载 | `apt purge nginx` | `dnf remove nginx` + 手工删 `/etc/nginx` |
| 升级全部 | `apt upgrade`（`full-upgrade` 处理依赖变化） | `dnf upgrade` |
| 搜索 | `apt search <kw>` | `dnf search <kw>` |
| 看包信息 | `apt show nginx` | `dnf info nginx` |
| 谁提供某文件 | `apt-file search bin/nginx`（要装 apt-file） | `dnf provides '*/bin/nginx'` |
| 已装列表 | `dpkg -l` | `dnf list installed` |
| 某包的文件 | `dpkg -L nginx` | `dnf repoquery -l nginx` |
| 某文件属于哪个包 | `dpkg -S /usr/sbin/nginx` | `rpm -qf /usr/sbin/nginx` |
| 清理缓存 | `apt clean` | `dnf clean all` |
| 历史/回滚 | `/var/log/apt/history.log` | `dnf history` / `dnf history undo <id>` |

### 7.2 apt 的正确用法

```bash
$ sudo apt update                 # 只更新"有哪些包、什么版本"
$ apt list --upgradable           # 看看能升什么
$ sudo apt install nginx          # 装（会自动装依赖）
$ sudo apt upgrade                # 升级已装的包（**不**删包、**不**装新依赖）
$ sudo apt full-upgrade           # 允许为升级删包（发行版升级时用）
$ sudo apt autoremove --purge     # 清理不再需要的依赖
$ sudo apt-mark hold nginx        # 锁定版本，不让它被自动升级
```

**四个高频误区**：

1. **`apt update` 不是升级**，它只是刷新索引。绝大多数"我明明 update 了还是旧版本"都是这个。
2. **`upgrade` 与 `full-upgrade` 不同**：前者保守，后者可能删除包。
3. **不要在有生产服务的机器上天天 `apt full-upgrade`**：内核、glibc、openssl 升级可能需要重启；要按变更窗口来。
4. **PPA 与第三方源是风险**：它们不是 Canonical 审核的，可能覆盖系统包。生产环境用发行版官方源 + 明确的第三方源（如 nginx 官方源、Docker 官方源）。

**deb822 源格式**（Ubuntu 24.04+ 推荐，替代 `sources.list` 的一行式）：

```text
# /etc/apt/sources.list.d/nginx.sources
Types: deb
URIs: https://nginx.org/packages/ubuntu/
Suites: noble
Components: nginx
Signed-By: /usr/share/keyrings/nginx-archive-keyring.gpg
```

### 7.3 dnf 的用法（RHEL 系）

```bash
$ sudo dnf install nginx
$ sudo dnf upgrade --refresh
$ sudo dnf list --installed | head
$ sudo dnf provides '*/semanage'
$ sudo dnf history                     # 每次事务一个 id
$ sudo dnf history undo 42             # 回滚那次事务（救命功能）
$ sudo dnf module list nginx           # 模块流（AppStream）
$ sudo dnf install epel-release        # 启用 EPEL
$ sudo dnf config-manager --set-enabled crb   # RHEL 9+ 的 CodeReady Builder
```

Fedora 41+/RHEL 10 默认是 **dnf5**，命令基本兼容，输出格式变了。老教程里的 `yum` 是 `dnf` 的软链接。

### 7.4 源码编译与"手工安装放哪"

```bash
$ ./configure --prefix=/usr/local --with-http_ssl_module
$ make -j"$(nproc)"
$ sudo make install
```

**约定**：手工装的放 `/usr/local`（`/usr/local/bin`、`/usr/local/etc`、`/usr/local/lib`），不要覆盖 `/usr/bin` 里的包管理产物，否则升级时会打架。

```bash
$ sudo apt install build-essential    # Debian 系编译工具链
$ sudo dnf groupinstall "Development Tools"
```

**能不编译就不编译**：优先用官方源/官方二进制/官方容器镜像。编译安装意味着你要自己管升级、依赖、安全补丁。

### 7.5 静态二进制与"绿色安装"

```bash
$ curl -fsSL -o /tmp/caddy.tgz https://.../caddy.tar.gz
$ tar -xzf /tmp/caddy.tgz -C /tmp
$ sudo install -m 0755 /tmp/caddy /usr/local/bin/caddy
$ caddy version
```

`install` 比 `cp` 好：能一次设定权限与属主。Go/Rust 写的工具通常这样发（单文件、无依赖），是目前最省心的方式之一。

### 7.6 版本共存：`update-alternatives`

```bash
$ sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 2
$ sudo update-alternatives --install /usr/bin/python3 python3 /usr/local/bin/python3.13 1
$ sudo update-alternatives --config python3
```

**不要用 `ln -sf` 手工改 `/usr/bin/python3`**：包管理器和系统脚本都依赖它，改错了系统工具会挂。

### 7.7 练习

1. 用 `apt` 查 `nginx` 的版本、大小、依赖，然后只下载不安装（`apt download`）。
2. 用 `dpkg -S` 找出 `/usr/sbin/sshd` 属于哪个包。
3. 装一个包后用 `apt-mark hold` 锁住，再 `apt upgrade` 验证它没被动。
4. 在 RHEL 系上（或查文档）说明 `dnf history undo` 能解决什么问题。
5. 解释为什么"编译安装到 `/usr/local`"比"覆盖 `/usr/bin`"安全。

<details>
<summary>参考答案要点</summary>

1. `apt show nginx`、`apt-cache depends nginx`、`apt download nginx`。
2. `dpkg -S /usr/sbin/sshd` → `openssh-server`。
3. `sudo apt-mark hold <pkg>`；`apt list --upgradable` 里它会被标成 held back。
4. 误装/误升级导致服务异常时，回滚整次事务（包括依赖），比手工降级安全。
5. 包管理器的文件清单不会与你的文件冲突；升级时不会覆盖你的版本；卸载时可预期。

</details>

---

## 8. systemd 与服务

这是本书最重要的一章。**"我的服务起不来"有 80% 的答案在 `journalctl -u <name>` 里。**

### 8.1 systemd 是什么

```text
systemd (PID 1)
 ├── 目标（target）：multi-user.target ≈ 运行级别 3（多用户命令行）
 ├── 服务（service）：nginx.service、sshd.service、myapp.service
 ├── 套接字（socket）：按需唤醒服务（socket activation）
 ├── 定时器（timer）：替代 cron
 ├── 挂载（mount）、设备（device）、路径（path）、切片（slice）
 └── 用户实例（--user）：每个用户自己的服务
```

它的核心思想是**声明式 + 依赖图**：你写"我要一个叫 myapp 的服务，它依赖网络、崩溃后重启"，systemd 负责按依赖顺序启动、记录日志、限制资源、重启。

### 8.2 日常命令表

```bash
$ systemctl status nginx            # 状态 + 最近日志（最常用）
$ systemctl start|stop|restart nginx
$ systemctl reload nginx            # 重读配置（不重启进程，需要服务支持）
$ systemctl reload-or-restart nginx # 能 reload 就 reload，否则 restart
$ systemctl enable nginx            # 开机自启（只影响下次开机）
$ systemctl disable nginx
$ systemctl enable --now nginx      # 开启自启 + 立刻启动（一条命令）
$ systemctl is-active nginx         # active/inactive（脚本里用）
$ systemctl is-enabled nginx
$ systemctl list-units --type=service --state=running
$ systemctl list-unit-files | grep enabled
$ systemctl cat nginx               # 看 unit 文件内容（含 drop-in）
$ systemctl edit nginx              # 生成 override（推荐改法）
$ systemctl daemon-reload           # **改完 unit 文件必须执行**
$ systemctl list-dependencies nginx
```

**`restart` 与 `reload` 的区别**：`reload` 发 `SIGHUP`，进程不退出（连接不断）；`restart` 杀进程再启动（连接全断）。nginx/sshd/postgres 都支持 reload。

**`daemon-reload` 是最容易忘的一步**：改了 unit 文件不 reload，`systemctl restart` 用的还是旧定义。

### 8.3 写一个 unit：从最小到可用

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Node API
Documentation=https://example.com/docs
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/srv/myapp
Environment=NODE_ENV=production
EnvironmentFile=/etc/myapp/env
ExecStart=/usr/bin/node /srv/myapp/dist/server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=2
TimeoutStopSec=20
KillSignal=SIGTERM

# 日志（默认进 journal，这两行是给 journal 打标签用的）
SyslogIdentifier=myapp
StandardOutput=journal
StandardError=journal

# 资源与安全限制（建议逐条加，见 9.5）
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/myapp/data
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now myapp
$ systemctl status myapp
$ journalctl -u myapp -f
```

**`Type=` 怎么选**：

| 值 | 语义 | 什么时候用 |
| --- | --- | --- |
| `simple` | `ExecStart` 一执行就算启动成功 | 前台不退出的程序（Node、Python、Go） |
| `exec` | 与 simple 类似，但等 `execve` 成功才算 | 更严谨的 simple |
| `forking` | 程序自己 daemonize，父进程退出 | 老式守护进程（nginx 默认 `forking` 模式） |
| `notify` | 程序通过 `sd_notify` 报告就绪 | 支持 systemd 通知的服务 |
| `oneshot` | 跑完就退出（不算常驻） | 初始化脚本、迁移任务 |
| `idle` | 等其他任务跑完再启动 | 极少用 |

**五个必须写的项**（新手最常漏）：`User=`（否则以 root 跑）、`WorkingDirectory=`（否则相对路径全错）、`EnvironmentFile=`（否则读不到配置）、`Restart=`（否则崩了就没了）、`After=network-online.target`（否则开机时网络还没起来）。

### 8.4 日志：`journalctl` 是第二重要的命令

```bash
$ journalctl -u nginx                    # 某个服务的日志
$ journalctl -u myapp -f                 # 跟踪
$ journalctl -u myapp --since "10 min ago"
$ journalctl -u myapp -p err             # 只看 error 及以上（-p 0..7）
$ journalctl -b                          # 本次开机以来
$ journalctl -b -1                       # 上次开机（**排查"为什么重启了"必用**）
$ journalctl -k                          # 只看内核消息（等于 dmesg）
$ journalctl --no-pager | tail -50
$ journalctl -o json-pretty -u myapp -n 1   # 结构化字段
$ journalctl --disk-usage                # 日志占多少空间
$ sudo journalctl --vacuum-time=7d       # 清理（保留 7 天）
```

| `-p` 级别 | 数字 | 含义 |
| --- | --- | --- |
| `emerg` | 0 | 系统不可用 |
| `alert` | 1 | 必须立刻处理 |
| `crit` | 2 | 严重 |
| `err` | 3 | 错误 |
| `warning` | 4 | 警告 |
| `notice` | 5 | 正常但重要 |
| `info` | 6 | 普通信息 |
| `debug` | 7 | 调试 |

**`journalctl -b -1` 是最被低估的命令**：机器 OOM 重启、被内核 panic、被云厂商重启，日志都在上一次开机的 journal 里。

### 8.5 drop-in：不改原文件地覆盖配置

```bash
$ sudo systemctl edit nginx
```

打开的是一个空文件 `/etc/systemd/system/nginx.service.d/override.conf`：

```ini
[Service]
LimitNOFILE=65535
Environment=EXTRA_FLAG=1
```

```bash
$ sudo systemctl daemon-reload && sudo systemctl restart nginx
$ systemctl cat nginx        # 能看到原始文件 + drop-in 合并结果
```

好处：包升级时你的改动不会被覆盖。**改包自带的 unit 文件是错的**（`/usr/lib/systemd/system/` 是包的地盘）。

### 8.6 定时器：`cron` 的现代替代

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Nightly backup

[Service]
Type=oneshot
User=deploy
ExecStart=/srv/scripts/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup every night

[Timer]
OnCalendar=daily
RandomizedDelaySec=10min
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now backup.timer
$ systemctl list-timers --all
$ journalctl -u backup.service
```

**比 cron 好的地方**：依赖管理、日志统一进 journal、`Persistent=true` 补跑错过的任务、失败可见、`RandomizedDelaySec` 避免整点雪崩。`OnCalendar` 语法用 `systemd-analyze calendar '*-*-* 03:00:00'` 验证。

### 8.7 用户级服务（不需要 root）

```bash
$ systemctl --user enable --now myapp.service   # unit 放 ~/.config/systemd/user/
$ loginctl enable-linger alice                  # 没登录也让它跑（关键）
$ systemctl --user status myapp
```

适合个人脚本；生产服务还是用系统级 + 专用用户。

### 8.8 排障固定顺序

服务起不来时，按这个顺序看，基本一轮就定位：

```bash
$ systemctl status myapp          # 1) 状态与最近几行日志（含退出码）
$ journalctl -u myapp -n 50 --no-pager   # 2) 完整日志
$ systemctl cat myapp             # 3) unit 定义对不对（含 drop-in）
$ sudo -u deploy /usr/bin/node /srv/myapp/dist/server.js   # 4) 用服务的身份和命令手工跑
$ ls -l /srv/myapp /etc/myapp/env  # 5) 权限、属主、文件是否存在
$ systemd-analyze verify /etc/systemd/system/myapp.service  # 6) 语法检查
```

**第 4 步是杀手锏**：用 `sudo -u <服务的用户>` + 完全相同的命令手工执行，90% 的问题当场复现（权限、路径、环境变量）。

常见退出码：

| 退出码 | 含义 | 常见原因 |
| --- | --- | --- |
| `1` | 通用错误 | 看日志 |
| `126` | 命令不可执行 | 缺 `x` 位、脚本 shebang 错 |
| `127` | 命令找不到 | `ExecStart` 路径写错、`PATH` 里没有 |
| `203` | `ExecStart` 不是绝对路径 / 找不到 | 必须写绝对路径 |
| `200` | `ExecStart` 不是可执行文件 | 权限或不是 ELF 脚本 |
| `143` | 被 SIGTERM 正常关闭 | 正常停止 |
| `137` | 被 SIGKILL | 超时、OOM（看 `dmesg`） |

### 8.9 练习

1. 给一个"每 5 分钟写一行时间到文件"的 shell 脚本写 unit + timer，并验证它真的跑了。
2. 用 `systemctl edit` 给 `nginx` 加一个环境变量，验证 `systemctl cat nginx` 能看到 drop-in，且 `systemctl show nginx -p Environment` 生效。
3. 故意把 `ExecStart` 写成相对路径，看 `systemctl status` 报什么错，再用 `systemd-analyze verify` 看提示。
4. 用 `journalctl -b -1` 找上一次开机的原因（如果日志存在）。
5. 解释 `Restart=on-failure` 与 `Restart=always` 的区别，以及 `StartLimitBurst` 为什么重要。

<details>
<summary>参考答案要点</summary>

1. 脚本 + `Type=oneshot` 的 service + `OnCalendar=*:0/5` 的 timer；`systemctl list-timers` 看下次触发时间。
2. `systemctl edit nginx` 写 `[Service]` + `Environment=TEST=1`，`daemon-reload` 后 `systemctl show nginx -p Environment`。
3. 报 `203/EXEC` 或 `Exec format error`；`systemd-analyze verify` 会提示 `Executable ... is not absolute`。
4. `journalctl -b -1 -p err --no-pager | tail`，结合 `last -x`、`dmesg` 判断是 OOM 还是硬件。
5. `on-failure` 只在非 0 退出/被信号杀死时重启；`always` 连正常退出也重启（适合"必须一直有"的进程）。`StartLimitBurst`/`StartLimitIntervalSec` 防止崩溃循环把系统拖死（默认 5 次/10 秒）。

</details>

---

## 9. 日志与时间

### 9.1 日志的四个来源

| 来源 | 位置 | 看什么 |
| --- | --- | --- |
| systemd journal | `journalctl` | 服务启停、崩溃、内核消息 |
| 传统文本日志 | `/var/log/`（`syslog`、`auth.log`、`nginx/`、`mysql/`） | 应用自己写的 |
| 内核环形缓冲 | `dmesg` | OOM、磁盘错误、网卡、USB |
| 应用自己的文件 | `/var/log/app/*.log` | 业务日志 |

```bash
$ ls /var/log/ | head -20
$ sudo tail -50 /var/log/auth.log        # Debian 系；RHEL 系是 /var/log/secure
$ sudo dmesg -T | tail -30               # -T 显示人类可读时间
$ sudo dmesg -T | grep -i -E 'oom|killed process'   # 排查 OOM
```

### 9.2 `logrotate`：别让日志吃满磁盘

```text
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        systemctl reload myapp >/dev/null 2>&1 || true
    endscript
}
```

```bash
$ sudo logrotate -d /etc/logrotate.d/myapp    # -d 只演练不执行
$ sudo logrotate -f /etc/logrotate.d/myapp    # 强制执行一次
$ cat /var/lib/logrotate/status | head
```

**`postrotate` 为什么需要**：进程还开着旧的文件描述符，写的是已经被重命名的文件。发 `SIGHUP`/`USR1` 让它重新打开日志文件（nginx 用 `USR1`）。

**用 journal 的服务不需要 logrotate**：journal 自己有容量上限。

```bash
$ sudo journalctl --vacuum-size=500M
$ sudo journalctl --vacuum-time=14d
# 永久设置：/etc/systemd/journald.conf
# SystemMaxUse=500M
```

### 9.3 时间：服务器上最容易错的东西

```bash
$ timedatectl                      # 时区、NTP 同步状态
$ date -u                          # UTC 时间（日志里常见）
$ timedatectl set-timezone Asia/Shanghai
$ timedatectl set-ntp true
$ chronyc tracking                 # 如果装了 chrony
$ chronyc sources -v
```

**为什么重要**：

- 日志时间错 → 排障时因果全乱（你以为 A 在 B 之后，其实反了）；
- TLS 证书校验依赖时间，时间偏差大会导致握手失败；
- 数据库主从、分布式锁、JWT 过期都依赖时间。

**建议**：服务器统一 `Asia/Shanghai` 或统一 UTC（团队约定），**应用日志统一用 ISO 8601 带时区**（`2026-10-27T13:22:33+08:00`）。别用 `10/27/2026 1:22 PM`。

### 9.4 结构化日志与集中化

个人服务的最小可用方案：

```bash
# 应用直接输出 JSON 到 stdout，由 journal 收集
$ journalctl -u myapp -o cat | jq -c 'select(.level=="error")'
```

多机场景再看 Loki / Vector / Promtail + Grafana。**单机不要上 ELK**，那套东西自身的资源消耗就超过你的应用。

### 9.5 一条给应用的日志纪律

- **stdout/stderr 就是日志接口**（12-Factor）。不要自己往 `/var/log` 里写文件，让 systemd/容器运行时去收集。
- 每条日志带：时间、级别、请求 id、关键字段。
- 不要打印密码、token、完整身份证/手机号。
- 错误日志要能回答"发生了什么、影响了谁、下一步看什么"。
- 日志级别默认 `info`，排障时临时调 `debug`，别长期开。

### 9.6 练习

1. 给一个自定义日志目录配 logrotate，`-d` 演练通过后强制执行一次，看文件是否被轮转。
2. 用 `journalctl --vacuum-size=200M` 限制日志体积，再 `--disk-usage` 验证。
3. 把机器时区改成 `UTC`，再改回来，用 `date` 与 `timedatectl` 验证。
4. 用 `dmesg -T | grep -i oom` 检查这台机器有没有被 OOM 杀过进程。
5. 解释为什么"应用自己写 `/var/log/app.log` 且不做轮转"是生产事故的定时炸弹。

<details>
<summary>参考答案要点</summary>

1. 写好配置后 `logrotate -d` 看"considering log ... log needs rotating"；`-f` 后目录里出现 `app.log.1`、`app.log-20261027.gz` 之类。
2. `journalctl --disk-usage` 前后对比。
3. `sudo timedatectl set-timezone UTC` → `date`；再 `set-timezone Asia/Shanghai`。
4. 有输出就说明发生过（看 `Killed process ... (java)` 这类行）。
5. 日志只增不减 → 磁盘满 → 所有服务写失败 → 连锁故障；且单个大文件 `tail`/`grep` 会变慢。

</details>

---

<!-- NEXT -->

---

## 10. 存储、磁盘与文件系统

"磁盘满了"和"IO 变慢了"是服务器最常见的两类问题。这一章给你一套**能自己定位**的流程。

### 10.1 先分清三层

```text
物理磁盘 / 云盘  →  分区表（GPT）  →  文件系统（ext4/xfs/btrfs）  →  挂载点（/data）
                                    ↘ 也可以不经分区，直接用 LVM
```

```bash
$ lsblk                       # 块设备树：磁盘、分区、LVM、挂载点（最直观）
$ lsblk -f                    # 带文件系统类型与 UUID
$ df -hT                      # 挂载点 + 文件系统类型 + 用量
$ sudo fdisk -l /dev/sdb      # 看分区表（只读查看）
$ sudo blkid                  # 各设备的 UUID 与类型
```

`lsblk` 的输出是你排查存储的起点：

```text
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   40G  0 disk
├─sda1   8:1    0   39G  0 part /
└─sda2   8:2    0    1G  0 part [SWAP]
sdb      8:16   0  100G  0 disk
└─sdb1   8:17   0  100G  0 part /data
```

### 10.2 新盘上手：分区、格式化、挂载

```bash
$ sudo parted /dev/sdb mklabel gpt                 # 建 GPT 分区表（会清空！）
$ sudo parted -a optimal /dev/sdb mkpart primary 0% 100%
$ sudo mkfs.ext4 -L data /dev/sdb1                  # 格式化（会清空！）
$ sudo mkdir -p /data
$ sudo mount /dev/sdb1 /data
$ sudo blkid /dev/sdb1                             # 拿 UUID
```

写进 `/etc/fstab`（**用 UUID，不要用 `/dev/sdb1`**，设备名可能变化）：

```text
UUID=8f3c1e2a-...  /data  ext4  defaults,noatime  0  2
```

```bash
$ sudo mount -a        # 验证 fstab 没写错（关键：写错会导致开机进不了系统）
$ findmnt --verify     # 更严格的检查
```

⚠️ **`fstab` 写错的后果是机器起不来**（进入 emergency mode）。两个保护：

1. 加 `nofail`（`defaults,nofail`）：设备不存在时也继续启动。
2. 改完一定 `sudo mount -a`，报错就立刻修。

**挂载选项的实用值**：

| 选项 | 作用 |
| --- | --- |
| `noatime` | 不更新访问时间，减少写（数据库/日志盘推荐） |
| `nodiratime` | 不更新目录访问时间 |
| `nofail` | 设备缺失不影响启动 |
| `discard` | SSD 实时 TRIM（也可用 `fstrim.timer` 定期做） |
| `ro` | 只读挂载 |
| `defaults` | `rw,suid,dev,exec,auto,nouser,async` |

### 10.3 swap：现代做法

```bash
$ free -h
$ swapon --show
$ cat /proc/sys/vm/swappiness     # 默认 60
```

**swap 大小不再是"内存两倍"**。经验值：

| 场景 | 建议 |
| --- | --- |
| 有 8G+ 内存的服务器 | 2～4G 应急即可（防止 OOM 直接杀进程） |
| 内存紧张/跑数据库 | 按实际峰值留余量，但 swap 不能替代内存 |
| 云主机 | 很多镜像默认没有 swap，需要自己加 |
| 容器 | 容器内的 swap 由 cgroup 控制，别指望宿主 swap |

加 swapfile：

```bash
$ sudo fallocate -l 2G /swapfile
$ sudo chmod 600 /swapfile
$ sudo mkswap /swapfile
$ sudo swapon /swapfile
$ echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
$ swapon --show
```

btrfs 上要先 `sudo chattr +C /swapfile`（禁用 COW）再 `fallocate`，否则 swap 不生效。

`vm.swappiness`：默认 60，服务器上常见调成 10（尽量少用 swap），但**不要设 0**（0 在多数内核上仍会在内存压力下使用 swap，且容易触发 OOM）。

### 10.4 LVM：能在线扩容的分区

```bash
# 建
$ sudo pvcreate /dev/sdb
$ sudo vgcreate vg_data /dev/sdb
$ sudo lvcreate -L 20G -n lv_app vg_data
$ sudo mkfs.ext4 /dev/vg_data/lv_app
$ sudo mount /dev/vg_data/lv_app /srv/app

# 扩容（云盘从 100G 扩到 200G 之后）
$ sudo pvresize /dev/sdb
$ sudo lvextend -l +100%FREE /dev/vg_data/lv_app
$ sudo resize2fs /dev/vg_data/lv_app       # ext4；xfs 用 sudo xfs_growfs /srv/app
$ df -h /srv/app
```

```bash
$ sudo pvs; sudo vgs; sudo lvs     # 三层视图
$ sudo lvdisplay
```

**为什么用它**：不用停机就能扩；可以把多块盘合成一个池；能做快照（`lvcreate -s`）。

### 10.5 磁盘满了：五步定位

```bash
# 1) 哪个挂载点满了，inode 有没有满
$ df -h; df -i

# 2) 哪个目录大
$ sudo du -h --max-depth=1 / 2>/dev/null | sort -h | tail -10
$ sudo du -sh /var/* | sort -h | tail

# 3) 哪个文件大
$ sudo find / -xdev -type f -size +500M -exec ls -lh {} \; 2>/dev/null

# 4) 已删除但仍被占用的文件（df 满而 du 对不上就是这个）
$ sudo lsof +L1 | head -20
$ sudo lsof | grep deleted | head

# 5) 日志是不是没轮转
$ sudo du -sh /var/log/*; ls -lh /var/log/*.log
```

**第 4 步的原理**：进程还开着 fd，inode 引用计数不为 0，空间不回收。**重启该进程**（而不是删文件）才能释放；如果是日志，先 `truncate -s 0` 再让它重开。

```bash
$ sudo truncate -s 0 /var/log/huge.log      # 立刻释放（不改变 inode）
$ sudo kill -USR1 $(cat /run/nginx.pid)     # 让 nginx 重开日志
```

### 10.6 IO 性能：先量再看

```bash
$ iostat -xz 1 5         # %util、r_await、w_await、aqu-sz
$ iotop -o               # 哪个进程在读写（要装）
$ pidstat -d 1 5         # 每进程 IO
$ fio --name=rw --rw=randrw --bs=4k --size=1G --numjobs=4 --runtime=30 --group_reporting   # 基准测试
$ sudo hdparm -t --direct /dev/sdb     # 顺序读粗测
```

**怎么读 `iostat`**：

- `%util` 接近 100%：设备饱和（但 SSD 上 `%util` 意义有限，要看 `aqu-sz` 与 `await`）。
- `r_await`/`w_await` 是**平均等待毫秒数**，机械盘 >20ms、SSD >2ms 就该查了。
- `aqu-sz` 队列长度持续 >1 说明排队。

### 10.7 文件系统选择与检查

| 文件系统 | 特点 | 适合 |
| --- | --- | --- |
| ext4 | 稳、成熟、工具全 | 通用首选 |
| xfs | 大文件/大目录性能好，不能缩容 | RHEL 默认、数据库盘 |
| btrfs | 快照、子卷、压缩、校验和 | 需要快照/回滚（openSUSE、Fedora 默认） |
| zfs | 最强（快照、去重、校验），吃内存 | 存储服务器、NAS |

```bash
$ sudo fsck -n /dev/sdb1        # 只检查不修（-n）
$ sudo btrfs filesystem usage /mnt
$ sudo btrfs subvolume snapshot /mnt/@ /mnt/@backup-20261027
$ sudo zpool status
```

**不要对挂载中的 ext4/xfs 跑 `fsck`**，必须在卸载或 rescue 模式下做。

### 10.8 练习

1. 用 `lsblk -f` 与 `df -hT` 说出你这台机器每块盘的用途。
2. 造一个 100MB 的文件，用 `du` 与 `df` 验证差异；删除它，看 `df` 是否立刻变化（不打开 fd 的情况下）。
3. 用 `lsof +L1` 复现"删了文件但空间不释放"：`dd` 一个大文件 → 用 `tail -f` 打开 → 删除 → 看 `df` 与 `lsof`。
4. 加一个 1G swapfile（虚拟机/云主机上做），`swapon --show` 验证。
5. 解释为什么 `fstab` 里要写 UUID 而不是 `/dev/sdb1`，以及 `nofail` 解决什么问题。

<details>
<summary>参考答案要点</summary>

1. 描述每个挂载点、文件系统、容量与用途（`/`、`/data`、swap）。
2. `du -sh` 与 `df` 的差值来自保留块与元数据；没有 fd 占用时删除后 `df` 立刻变化。
3. `tail -f` 持有 fd，删除后 `lsof +L1` 能看到 `(deleted)`，`df` 不变；`truncate -s 0` 或杀进程后释放。
4. `fallocate` → `chmod 600` → `mkswap` → `swapon` → 写 fstab → `swapon --show`。
5. 设备名（`sdb`）会因插拔/云盘挂载顺序变化，UUID 稳定；`nofail` 让设备缺失时仍能开机（云盘未挂上、移动硬盘没插）。

</details>

---

## 11. 网络配置与排障

### 11.1 排障的固定顺序

遇到"访问不了"，从上往下逐层验证，**不要跳步**：

```bash
# 1) 本机有没有地址、路由对不对
$ ip -br addr; ip route

# 2) 网关通不通
$ ping -c 3 <网关IP>

# 3) DNS 解析对不对
$ dig +short example.com; getent hosts example.com

# 4) 目标端口通不通
$ nc -zv example.com 443          # 或 timeout 3 bash -c 'cat < /dev/tcp/example.com/443'

# 5) 本机有没有在监听
$ ss -tulpn | grep :443

# 6) 应用层
$ curl -v https://example.com

# 7) 防火墙有没有拦截
$ sudo nft list ruleset | head -40      # 或 firewall-cmd --list-all / ufw status
```

### 11.2 地址、路由、DNS

```bash
$ ip -br addr                 # 接口与地址（-br 简洁模式）
$ ip route                    # 路由表，default via 是默认网关
$ ip link                     # 网卡状态（UP/DOWN、MTU）
$ ip neigh                    # ARP 邻居表

$ ip addr add 192.0.2.10/24 dev eth0     # 临时加地址（重启失效）
$ ip route add 10.0.0.0/8 via 192.0.2.1  # 临时加路由
```

**配置持久化要看发行版**：

| 发行版 | 工具 | 文件 |
| --- | --- | --- |
| Ubuntu Server 20.04+ | netplan | `/etc/netplan/*.yaml` |
| RHEL 系 / CentOS | NetworkManager（`nmcli`/`nmtui`） | `/etc/NetworkManager/system-connections/` |
| Debian 12 起 | 默认也是 NetworkManager（`/etc/network/interfaces` 仍可用） | `/etc/network/interfaces` |

```yaml
# /etc/netplan/50-cloud-init.yaml（注意缩进，YAML 对空格敏感）
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses: [192.0.2.10/24]
      routes:
        - to: default
          via: 192.0.2.1
      nameservers:
        addresses: [223.5.5.5, 1.1.1.1]
```

```bash
$ sudo netplan try      # 60 秒内不确认就回滚（改网络必备）
$ sudo netplan apply
```

```bash
$ sudo nmcli con show
$ sudo nmcli con mod "Wired connection 1" ipv4.addresses 192.0.2.10/24 ipv4.gateway 192.0.2.1 ipv4.method manual
$ sudo nmcli con up "Wired connection 1"
```

**DNS 的三层**：

```bash
$ cat /etc/resolv.conf           # 当前用的 DNS（systemd-resolved 存在时它是个软链接）
$ resolvectl status              # 各接口的 DNS 与搜索域
$ cat /etc/hosts                 # 本地覆盖（优先级最高）
$ cat /etc/nsswitch.conf | grep hosts   # 查询顺序：files → dns
```

**`/etc/hosts` 优先级高于 DNS**，这是"改了 DNS 还不生效"的常见原因。

### 11.3 常用网络工具对照

| 目的 | 现代命令 | 已过时（但仍常见） |
| --- | --- | --- |
| 地址 | `ip addr` | `ifconfig` |
| 路由 | `ip route` | `route` |
| 邻居/ARP | `ip neigh` | `arp` |
| 监听端口 | `ss -tulpn` | `netstat -tulpn` |
| 抓包 | `tcpdump` | — |
| 连通性 | `ping`、`mtr` | `traceroute`（仍好用） |
| DNS | `dig`、`kdig` | `nslookup`、`host` |
| HTTP | `curl` | `wget` |

```bash
$ ss -tulpn              # tcp/udp、监听、进程、不解析服务名
$ ss -tnp state established     # 已建立的连接
$ ss -s                          # 汇总统计
$ dig example.com +short
$ dig @8.8.8.8 example.com MX
$ dig +trace example.com          # 从根开始追（排查 DNS 到底哪一层错）
$ mtr -rw example.com             # 综合 ping + traceroute（定位丢包在哪一跳）
$ curl -vI https://example.com    # 看握手、证书、响应头
$ curl -w '@curl-format.txt' -o /dev/null -s https://example.com   # 分段计时
```

### 11.4 tcpdump：抓包的最小用法

```bash
$ sudo tcpdump -i any -nn port 443 -c 20
$ sudo tcpdump -i eth0 -nn -A port 80 | grep -E '^(GET|POST|HTTP)'
$ sudo tcpdump -i any -nn 'tcp[tcpflags] & (tcp-syn|tcp-rst) != 0'
$ sudo tcpdump -w /tmp/cap.pcap -i any port 3306      # 存文件，用 Wireshark 打开
```

**抓包能解决什么**：TLS 握手失败在哪一步、请求到底有没有到达服务器、有没有被 RST、MTU 与分片问题。

### 11.5 防火墙：三选一，别混用

**（1）nftables**（现代内核，RHEL 8+/Debian 10+/Ubuntu 20.04+ 的底层）

```bash
$ sudo nft list ruleset
$ sudo nft add table inet filter
$ sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'
$ sudo nft add rule inet filter input ct state established,related accept
$ sudo nft add rule inet filter input iif lo accept
$ sudo nft add rule inet filter input tcp dport '{ 22, 80, 443 }' accept
$ sudo nft add rule inet filter input icmp type echo-request accept
```

配置文件写法（`/etc/nftables.conf`，重启后生效）：

```text
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        ct state established,related accept
        iif lo accept
        tcp dport { 22, 80, 443 } accept
        icmp type echo-request accept
        icmpv6 type { nd-neighbor-solicit, nd-router-advert, nd-neighbor-advert, echo-request } accept
    }
    chain forward {
        type filter hook forward priority 0; policy drop;
    }
    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

**（2）firewalld**（RHEL 系默认，基于 nftables）

```bash
$ sudo firewall-cmd --state
$ sudo firewall-cmd --list-all
$ sudo firewall-cmd --permanent --add-service=http
$ sudo firewall-cmd --permanent --add-port=8080/tcp
$ sudo firewall-cmd --reload
$ sudo firewall-cmd --runtime-to-permanent    # 把当前运行时规则固化
```

**（3）ufw**（Ubuntu 的简化封装）

```bash
$ sudo ufw status verbose
$ sudo ufw default deny incoming
$ sudo ufw allow 22/tcp
$ sudo ufw allow 'Nginx Full'
$ sudo ufw enable
```

⚠️ **三条铁律**：

1. **先放行 SSH 端口，再开默认拒绝**，否则你会把自己锁在外面。
2. **不要同时启用两套**（ufw 与 firewalld 抢同一套 nftables 规则；`iptables` 与 `nft` 混用会互相看不见）。
3. 云服务器还有**安全组**这一层（在控制台配），本地防火墙全开也可能被安全组挡住。排查"端口不通"必须两层都看。

### 11.6 端口转发与 NAT

```bash
$ sudo sysctl -w net.ipv4.ip_forward=1                  # 临时开转发
$ echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-forward.conf
$ sudo sysctl --system

# nftables 做 DNAT（把 8080 转到内网 10.0.0.5:80）
$ sudo nft add table ip nat
$ sudo nft add chain ip nat prerouting '{ type nat hook prerouting priority -100; }'
$ sudo nft add rule ip nat prerouting tcp dport 8080 dnat to 10.0.0.5:80
```

个人服务器更常见的需求是"只让本机访问某个端口"，用 SSH 隧道更简单：

```bash
$ ssh -L 8080:127.0.0.1:80 web        # 本地 8080 → 远端 80
$ ssh -R 9000:127.0.0.1:3000 web      # 远端 9000 → 本地 3000（内网穿透）
```

### 11.7 IPv6 速览

```bash
$ ip -6 addr
$ ping -6 -c 3 ::1
$ ss -6 -tulpn
$ curl -6 -I https://example.com
$ cat /proc/sys/net/ipv6/conf/all/disable_ipv6
```

要点：地址写成 `2001:db8::1/64`；`::1` 是 localhost；**防火墙必须单独放行 ICMPv6**（邻居发现依赖它，否则 IPv6 会时通时不通）；`/etc/gai.conf` 可以调 IPv4/IPv6 优先级。

### 11.8 练习

1. 用 `ip -br addr`、`ip route` 说出本机的地址、网关、网卡名。
2. 用 `ss -tulpn` 列出所有监听端口，找出哪个进程在监听 22。
3. 用 `dig +trace` 追一个域名的解析过程，指出是在哪一步拿到最终 A 记录。
4. 用 `curl -vI` 看一次完整的 TLS 握手，指出证书链、协议版本、SNI。
5. 用 `tcpdump` 抓一次 `curl` 的 SYN/SYN-ACK/FIN，解释三次握手。

<details>
<summary>参考答案要点</summary>

1. `ip -br addr` 给接口与 CIDR；`ip route` 的 `default via` 是网关。
2. `ss -tulpn | grep :22` 拿到 pid/程序名，配合 `ps -p <pid>`。
3. `dig +trace` 会依次问根、TLD、权威服务器，最终 ANSWER SECTION 是 A 记录。
4. `curl -v` 输出里 `* TLSv1.3`、`* Server certificate:`、`* subject:`、`* ALPN: server accepted h2`。
5. `tcpdump -nn -i any port <port>`：`[S]` → `[S.]` → `[.]`（ACK）→ 数据传输 → `[F.]`。

</details>

---

## 12. shell 脚本

服务器上的自动化，90% 最终是一个 bash 脚本 + 一个 systemd timer（或 cron）。这一章给你一个**可以直接抄的模板**和最常见的坑。

### 12.1 骨架：每个脚本都该有的前 10 行

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "$0")"

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" >&2; }
die() { log "错误: $*"; exit 1; }

trap 'die "第 $LINENO 行失败，退出码 $?"' ERR
```

逐行解释：

| 写法 | 作用 | 不加会怎样 |
| --- | --- | --- |
| `set -e` | 命令失败立刻退出 | 中间失败继续跑，后面用坏数据 |
| `set -u` | 引用未定义变量报错 | `rm -rf "$DIR"/` 里 `DIR` 为空 → 删根 |
| `set -o pipefail` | 管道里任一命令失败算失败 | `grep xxx | head` 失败也返回 0 |
| `IFS=$'\n\t'` | 分词只按换行和 tab | 文件名带空格被拆开 |
| `trap ... ERR` | 出错时打印行号 | 不知道死在哪一行 |

`set -e` 有例外：命令在 `if`、`&&`、`||`、`!` 里时不触发退出，这是设计行为。

### 12.2 变量、引用与参数

```bash
name="world"
echo "hello, $name"           # 双引号：展开
echo 'hello, $name'           # 单引号：不展开
echo "hello, ${name}world"    # 花括号界定边界

# 默认值（很实用）
: "${PORT:=8080}"             # 未设置或为空时设成 8080
: "${ENV:?必须设置 ENV}"       # 未设置就报错退出

# 参数
echo "$# 个参数"
echo "$1 第一个；$@ 全部（各自独立）；$* 全部（合成一个）"
for arg in "$@"; do echo "arg=$arg"; done     # 正确写法
```

**`"$@"` 与 `$*` 的区别**：`"$@"` 保留参数边界（`a b` 仍是一个参数），`$*` 会按 `IFS` 拼成一个字符串。**永远用 `"$@"`。**

### 12.3 判断与循环

```bash
if [[ -f "$file" && -r "$file" ]]; then
    echo "可读文件"
elif [[ -d "$file" ]]; then
    echo "目录"
else
    echo "不存在"
fi

case "$1" in
    start)   do_start ;;
    stop)    do_stop ;;
    restart) do_stop; do_start ;;
    *)       echo "用法: $0 {start|stop|restart}"; exit 2 ;;
esac

for f in *.log; do
    [[ -e "$f" ]] || continue          # 没有匹配时 *.log 会原样保留
    gzip "$f"
done

while IFS= read -r line; do            # 按行读文件的正确写法
    echo "$line"
done < input.txt

mapfile -t lines < <(grep -v '^#' conf.txt)   # 读到数组
```

**测试运算符速查**：

| 文件 | 含义 | 字符串/数字 | 含义 |
| --- | --- | --- | --- |
| `-e` | 存在 | `-z` / `-n` | 空 / 非空 |
| `-f` | 普通文件 | `=` / `!=` | 相等 / 不等 |
| `-d` | 目录 | `-eq` `-ne` `-lt` `-gt` `-le` `-ge` | 数字比较 |
| `-r` `-w` `-x` | 可读/写/执行 | `=~` | 正则匹配（`[[ ]]` 内） |
| `-s` | 非空文件 | `<` `>` | 字符串比较（`[[ ]]` 内） |

### 12.4 函数、命令替换与 here-doc

```bash
usage() {
    cat <<EOF
用法: $SCRIPT_NAME [-e ENV] [-p PORT]
  -e ENV   环境（dev|prod），默认 dev
  -p PORT  端口，默认 8080
EOF
}

parse_args() {
    local env="dev" port="8080"
    local OPTIND=1                       # 每次进来都重置（原因见下方实测说明）
    while getopts ":e:p:h" opt; do
        case "$opt" in
            e) env="$OPTARG" ;;
            p) port="$OPTARG" ;;
            h) usage; exit 0 ;;
            \?) die "未知选项: -$OPTARG" ;;
            :)  die "选项 -$OPTARG 需要参数" ;;
        esac
    done
    printf '%s %s\n' "$env" "$port"
}

read -r ENV PORT < <(parse_args "$@")     # 命令替换 + 进程替换
```

**`local` 很重要**：函数内的变量默认是全局的，`local` 避免污染。

**`OPTIND` 也是全局的，必须每次重置**——这条是实测踩出来的。`getopts` 用它记"上次解析到第几个参数"，而它**不受 `local` 保护就会泄漏到父 shell**：

```text
$ parse_args -e prod -p 9000      # 第 1 次：直接调用（没套 $(...)）
prod 9000
$ echo $OPTIND
5                                 # 父 shell 的 OPTIND 被改成了 5
$ echo "[$(parse_args -e prod -p 9000)]"   # 第 2 次：这次在子 shell 里
[dev 8080]                        # ✗ 参数全被跳过，静默返回默认值
```

**没有报错、没有警告**，只是结果错了。加了 `local OPTIND=1`（上面代码块里的那行）之后：

```text
$ parse_args -e prod -p 9000
prod 9000
$ echo $OPTIND
1                                 # 函数内的 local 不往外泄漏
$ echo "[$(parse_args -e prod -p 9000)]"
[prod 9000]                       # ✓
```

一个脚本里只调用一次时看不出差别；但只要函数被复用（或被 `source` 后再次调用），这个 bug 就出现了，而且"只在第二次调用时才错"极难排查。

一个附带的好习惯：`getopts` 结束后用 `shift $((OPTIND - 1))` 把已解析的选项移出，剩下的 `"$@"` 就是位置参数（比如 `./deploy.sh -e prod restart`，`restart` 要靠这个拿到）。

### 12.5 文件与临时文件的安全写法

```bash
tmp="$(mktemp -d)"                 # 安全临时目录（不要用 /tmp/fixed-name）
trap 'rm -rf -- "$tmp"' EXIT       # 退出时清理（EXIT 也可换成 INT TERM）

# 原子写：先写临时文件，再 mv（同分区 mv 是原子的）
dst=/etc/app/config.yaml
tmpf="$(mktemp "${dst}.XXXXXX")"
printf 'port: %s\n' "$PORT" > "$tmpf"
chmod 0644 "$tmpf"
mv -- "$tmpf" "$dst"

# 加锁，防止定时任务重叠
exec 9>/var/lock/myjob.lock
flock -n 9 || die "已有实例在跑"
```

**`flock` 是定时任务必备**：任务跑得比周期长时，没有锁会并发执行，轻则重复劳动，重则损坏数据。

### 12.6 调试

```bash
$ bash -n script.sh          # 只检查语法
$ bash -x script.sh          # 打印每条执行的命令（最有效）
$ set -x / set +x            # 局部打开/关闭
$ shellcheck script.sh       # 静态检查（强烈建议装）
$ bash -c 'set -x; echo hi'
```

`shellcheck` 值是推荐的：它能抓出"未加引号导致分词""`[` 与 `[[` 混用""`cd` 失败仍继续"等真实 bug，而且给的是可操作的修法。

### 12.7 一个完整例子：备份脚本

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

readonly BACKUP_ROOT="/var/backups/app"
readonly SRC_DIR="/srv/app/data"
readonly KEEP_DAYS=14
readonly STAMP="$(date +%Y%m%d-%H%M%S)"

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" >&2; }
die() { log "错误: $*"; exit 1; }
trap 'die "第 $LINENO 行失败"' ERR

main() {
    [[ -d "$SRC_DIR" ]] || die "源目录不存在: $SRC_DIR"
    mkdir -p "$BACKUP_ROOT"

    local out="$BACKUP_ROOT/app-$STAMP.tar.gz"
    log "开始备份 $SRC_DIR → $out"
    tar -czf "$out" -C "$(dirname "$SRC_DIR")" "$(basename "$SRC_DIR")"

    # 校验
    tar -tzf "$out" >/dev/null || die "备份文件损坏"
    log "备份完成: $(du -h "$out" | cut -f1)"

    # 清理旧备份
    find "$BACKUP_ROOT" -name 'app-*.tar.gz' -mtime "+$KEEP_DAYS" -print -delete
}

main "$@"
```

这个脚本已经体现了：严格模式、日志、错误捕获、临时安全、校验、轮转。

### 12.8 练习

1. 写一个脚本，接受目录参数，统计其中 `.log` 文件数量与总大小。
2. 写一个脚本，读 CSV（`name,age`），输出年龄最大的三行。
3. 用 `mktemp` + `mv` 实现"原子更新一个配置文件"。
4. 给上面的备份脚本加 `flock`，并说明没有它会发生什么。
5. 用 `shellcheck` 检查你写的脚本，修掉所有 warning。

<details>
<summary>参考答案要点</summary>

1. `count=$(find "$dir" -name '*.log' | wc -l)`；`du -ch "$dir"/*.log | tail -1`。
2. `sort -t, -k2 -nr data.csv | head -3`（或 awk 数组）。
3. `tmpf=$(mktemp "${dst}.XXXXXX")` → 写入 → `chmod` → `mv -- "$tmpf" "$dst"`。
4. `exec 9>/var/lock/backup.lock; flock -n 9 || exit 0`；没有锁时定时任务重叠，两个 `tar` 同时写同一个目标会损坏备份。
5. `shellcheck script.sh`，常见修法：加引号、用 `[[ ]]`、检查 `cd` 返回值、`read -r`。

</details>

---

## 13. 定时任务与自动化

### 13.1 cron 的基本形态

```bash
$ crontab -e          # 编辑当前用户的
$ crontab -l          # 列出
$ sudo crontab -e -u deploy
$ ls /etc/cron.d/ /etc/cron.daily/
```

```text
分 时 日 月 周  命令
*  *  *  *  *  command
┬  ┬  ┬  ┬  ┬
│  │  │  │  └── 星期（0-7，0 和 7 都是周日）
│  │  │  └───── 月（1-12）
│  │  └──────── 日（1-31）
│  └─────────── 时（0-23）
└────────────── 分（0-59）
```

| 表达式 | 含义 |
| --- | --- |
| `*/5 * * * *` | 每 5 分钟 |
| `0 3 * * *` | 每天 03:00 |
| `0 3 * * 1` | 每周一 03:00 |
| `0 0 1 * *` | 每月 1 日 00:00 |
| `@daily` / `@reboot` | 宏（`@reboot` 只在开机时跑一次） |

**cron 的四个经典坑**：

1. **环境变量极简**：`PATH` 通常只有 `/usr/bin:/bin`，你在 `.bashrc` 里加的东西它看不到。**脚本里用绝对路径，或开头显式 `export PATH`**。
2. **工作目录是你的家目录**，不是脚本所在目录 → 用 `cd "$(dirname "$0")"` 或绝对路径。
3. **`%` 要被转义**：`date +\%F`。
4. **输出会发邮件**（多数机器没配 MTA，于是丢失）。**永远重定向**：`>> /var/log/job.log 2>&1`。

```text
*/5 * * * * /usr/local/bin/myjob.sh >> /var/log/myjob.log 2>&1
```

### 13.2 cron 还是 systemd timer

| | cron | systemd timer |
| --- | --- | --- |
| 语法 | 5 段，简单 | `OnCalendar`，可读性好 |
| 日志 | 要自己重定向 | 自动进 journal |
| 错过的任务 | 不补跑 | `Persistent=true` 补跑 |
| 依赖 | 无 | `After=`、`Requires=` |
| 随机延迟 | 要自己写 `sleep $RANDOM` | `RandomizedDelaySec=` |
| 失败通知 | 无 | `OnFailure=` 可挂 unit |
| 查看下次运行 | 靠算 | `systemctl list-timers` |

**新项目用 timer**；改老系统就继续 cron，别折腾。

### 13.3 幂等与"能重复执行"

定时任务脚本必须**能重复执行而不产生副作用**：

```bash
# 不好的写法（每跑一次追加一次）
echo "log line" >> /etc/app/conf.d/logging.conf

# 好的写法（存在就跳过）
grep -q '^log_level=info' /etc/app/conf.d/logging.conf || echo 'log_level=info' >> /etc/app/conf.d/logging.conf

# 或者整体重写（幂等）
cat > /etc/app/conf.d/logging.conf <<'EOF'
log_level=info
log_rotate=daily
EOF
```

### 13.4 Ansible：从脚本到声明式

单机用脚本够了。**多台机器**时，脚本会变成"每台都 ssh 上去跑一遍"，这时用 Ansible：

```bash
$ ansible all -i inventory.ini -m ping
$ ansible all -i inventory.ini -m apt -a "name=nginx state=present" --become
$ ansible-playbook -i inventory.ini site.yml --check --diff
```

```yaml
# site.yml
- hosts: web
  become: true
  tasks:
    - name: 安装 nginx
      apt:
        name: nginx
        state: present
        update_cache: true
    - name: 启动并开机自启
      service:
        name: nginx
        state: started
        enabled: true
    - name: 部署配置
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: reload nginx
  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded
```

**Ansible 的价值不是"少敲命令"，而是**：描述期望状态、幂等、`--check` 预演、变更可审计、多机一致。

### 13.5 练习

1. 写一个每 10 分钟检查磁盘使用率、超过 80% 就写日志的 cron 任务。
2. 把它改写成 systemd timer，并对比 `systemctl list-timers` 与 `crontab -l` 的可见性。
3. 解释为什么 cron 里 `date +%F` 要写成 `date +\%F`。
4. 把你的脚本改成幂等的（跑两次结果一致）。
5. 用 `ansible --check` 对一个 playbook 做预演，说明 `--diff` 帮你看什么。

<details>
<summary>参考答案要点</summary>

1. `*/10 * * * * df --output=pcent / | tail -1 | tr -dc '0-9' | awk '{if ($1>80) print "disk high: "$1"%"}' >> /var/log/disk-check.log 2>&1`
2. 同 8.6 的 service + timer 写法；`list-timers` 能看 NEXT/LAST/PASSED。
3. cron 把 `%` 当换行符，必须转义。
4. 用"存在则跳过"或"整体重写"代替追加。
5. `--check` 只报告会改什么，`--diff` 展示具体差异；用于变更前评审。

</details>

---

## 14. 备份与恢复

**没有恢复演练的备份等于没有备份。** 这一章的核心不是工具，是流程。

### 14.1 3-2-1 原则与 RPO/RTO

- **3** 份副本（1 份生产 + 2 份备份）；
- **2** 种介质（例如本地磁盘 + 对象存储）；
- **1** 份异地（云上另一个区域，或另一台机器）。

两个必须写下来的数字：

| 指标 | 含义 | 怎么定 |
| --- | --- | --- |
| **RPO**（恢复点目标） | 最多能丢多少数据 | 决定备份频率（每小时 → 最多丢 1 小时） |
| **RTO**（恢复时间目标） | 多久能恢复服务 | 决定备份方式（冷备慢、热备快） |

个人服务的最低标准：**每天一份全量 + 保留 7～14 天 + 每月做一次恢复演练**。

### 14.2 `rsync`：增量同步的主力

```bash
$ rsync -avh --progress src/ dst/                 # 本地同步（注意末尾斜杠！）
$ rsync -avh --delete src/ user@host:/srv/src/    # 删除目标端多余文件（危险）
$ rsync -avh --dry-run --delete src/ dst/         # **先演练**
$ rsync -avh --partial --append-verify big.iso dst/   # 大文件断点续传
$ rsync -avh -e 'ssh -p 2222' src/ web:/srv/src/
$ rsync -avh --exclude='.git' --exclude='node_modules' src/ dst/
```

**末尾斜杠的语义**：`src/` 表示"src 里面的内容"，`src` 表示"src 这个目录本身"。这是 rsync 最经典的坑。

### 14.3 `tar`：打包与增量

```bash
$ tar -czf backup-$(date +%F).tar.gz -C /srv app data
$ tar -tzf backup.tar.gz | head            # 列出内容（校验用）
$ tar -xzf backup.tar.gz -C /restore       # 解包
$ tar -czf diff.tar.gz -C /srv --newer=2026-10-01 app    # 增量（按时间）
$ tar --exclude='*.log' -czf b.tgz /srv/app
```

**`tar` 的坑**：绝对路径会把前导 `/` 去掉（解包时变成相对路径）；`-C` 比 `cd` 更安全；有人解包到 `/` 覆盖系统文件，所以解包前先 `-t` 看内容。

### 14.4 `restic` / `borg`：去重加密的备份

```bash
$ restic init --repo /backup/restic
$ export RESTIC_PASSWORD_FILE=/etc/restic/pass
$ restic -r /backup/restic backup /srv/app /etc/nginx
$ restic -r /backup/restic snapshots
$ restic -r /backup/restic restore latest --target /restore
$ restic -r /backup/restic forget --keep-daily 7 --keep-weekly 4 --prune
$ restic -r /backup/restic check
```

**为什么值得用**：块级去重（多个快照之间只存变化）、加密（备份盘丢了也不泄露）、快照式恢复、校验。

```bash
# borg 等价操作
$ borg init --encryption=repokey /backup/borg
$ borg create /backup/borg::'{now:%F}' /srv/app
$ borg list /backup/borg
$ borg extract /backup/borg::2026-10-27
```

### 14.5 数据库的一致性备份

`tar` 一个正在写的数据库目录 = 得到一个坏备份（可能缺页、redo 不一致）。正确做法：

```bash
# MySQL 逻辑备份
$ mysqldump --single-transaction --routines --triggers --events \
    --all-databases > /backup/all-$(date +%F).sql

# PostgreSQL
$ pg_dumpall -U postgres | gzip > /backup/pg-$(date +%F).sql.gz

# SQLite（在线安全备份）
$ sqlite3 app.db ".backup '/backup/app-$(date +%F).db'"
```

**`--single-transaction` 的原理**：在 REPEATABLE READ 隔离级别下开一个事务，保证备份期间数据一致，且不锁表（InnoDB）。

### 14.6 备份要演练

```bash
# 每月做一次：在另一台机器/临时目录恢复，然后核对
$ restic -r /backup/restic restore latest --target /tmp/verify
$ mysqldump 备份导入临时库并 SELECT COUNT(*)
$ diff -r /tmp/verify/srv/app /srv/app | head    # 有差异就要查
```

**恢复演练的检查清单**：能解压/解密吗？文件权限对吗？数据库能启动吗？应用能连上吗？花了多久（对照 RTO）？

### 14.7 备份的敌人

| 敌人 | 应对 |
| --- | --- |
| 勒索软件加密挂载的备份盘 | 备份离线/不可变（对象存储 WORM、`chattr +i`、拔盘） |
| 备份盘满导致静默失败 | 监控备份产物大小与时间，失败告警 |
| `rsync --delete` 把错误同步到备份 | 备份端只接收，不在生产端执行删除同步 |
| 只有一份备份在同一块盘 | 异地/异介质 |
| 从没恢复过 | 每月演练，记录 RTO |

### 14.8 练习

1. 用 `rsync` 把 `/srv/app` 同步到 `/backup/app`，先用 `--dry-run` 看会做什么。
2. 用 `tar` 打一个包，`-t` 验证，再解到临时目录对比。
3. 用 `restic` 建仓库、备份、恢复，`check` 通过。
4. 用 `mysqldump --single-transaction` 备份一个库，导入临时库并核对行数。
5. 写一个"备份 + 校验 + 保留 7 天"的脚本，并说明怎么监控它失败。

<details>
<summary>参考答案要点</summary>

1. `rsync -avhn --delete /srv/app/ /backup/app/`。
2. `tar -czf /tmp/b.tgz -C /srv app` → `tar -tzf /tmp/b.tgz` → `tar -xzf /tmp/b.tgz -C /tmp/verify` → `diff -r /srv/app /tmp/verify/app`。
3. `restic init` → `backup` → `snapshots` → `restore latest --target /tmp/r` → `check`。
4. `mysqldump --single-transaction db > d.sql`；`mysql -e "CREATE DATABASE t"`；`mysql t < d.sql`；`SELECT COUNT(*)` 对比。
5. 脚本里检查产物存在与大小、`tar -tzf` 校验、`find -mtime +7 -delete`；监控用 systemd `OnFailure=` 或 cron + 外部心跳（healthchecks.io）。

</details>

---

<!-- NEXT -->

---

## 15. 性能排障方法论

### 15.1 先分类，再量，再改

新手最常见的错误是"看到卡就加内存"。正确的顺序是：

```text
1) 现象是什么（谁慢、慢多少、什么时候开始的）
2) 是哪一个资源到了瓶颈（CPU / 内存 / 磁盘 IO / 网络 / 锁）
3) 是哪个进程、哪段代码
4) 改一处、再量一次
```

**不要同时改三样东西**，否则你不知道是哪一项起了作用。

### 15.2 三个"负载"数字

```bash
$ uptime
 06:12:03 up 12 days,  3:41,  2 users,  load average: 1.42, 0.98, 0.61
$ nproc        # CPU 核数
```

`load average` = 1/5/15 分钟的平均**可运行 + 不可中断睡眠**进程数（Linux 把等 IO 的也算进去）。

| 现象 | 判读 |
| --- | --- |
| load 高、CPU 低、`%wa` 高 | IO 瓶颈（等磁盘） |
| load 高、CPU 满 | 计算瓶颈 |
| load 低但响应慢 | 不是队列问题，可能是网络/数据库/锁 |
| load 持续 > 核数 × 2 | 明确过载 |

**关键**：`load average` 的绝对值和核数有关。4 核机器 load 4 = 满载，32 核机器 load 4 很闲。

### 15.3 CPU：谁在吃

```bash
$ top -b -n 1 -o %CPU | head -15
$ mpstat -P ALL 1 5          # 每核使用率、%iowait、%steal
$ pidstat -u 1 5             # 每进程 CPU
$ ps -eo pid,ppid,stat,%cpu,%mem,cmd --sort=-%cpu | head
```

`%steal` 高说明**宿主机在抢你的 CPU**（云主机虚标），你做什么优化都没用——该换规格或换商家。

**进一步定位到函数**：

```bash
$ sudo perf top -p <pid>
$ sudo perf record -F 99 -p <pid> -g -- sleep 30
$ sudo perf report --stdio | head -40
$ sudo perf stat -p <pid> sleep 10
```

`perf` 是排查 CPU 热点最强的工具，`-g` 拿到调用栈，`report` 里按 `+` 展开。

### 15.4 内存：谁在吃、是不是真的不够

```bash
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            15Gi       9.2Gi       1.1Gi       0.3Gi       5.0Gi       5.6Gi
Swap:           2.0Gi       0.2Gi       1.8Gi
```

**看 `available`，不要看 `free`**。`buff/cache` 是可回收的（Linux 用空闲内存做缓存，这是设计不是浪费）。

```bash
$ ps -eo pid,rss,vsz,comm --sort=-rss | head
$ smem -tk | tail -20                  # 更准的 PSS（要装）
$ cat /proc/meminfo | head -20
$ sudo slabtop -s c | head             # 内核 slab 占用（异常增长=内核泄漏）
```

**OOM 排查**：

```bash
$ dmesg -T | grep -i -E 'oom|killed process'
$ journalctl -k | grep -i oom
$ cat /proc/<pid>/oom_score
```

系统杀进程的日志会写明 `Killed process 1234 (java) total-vm:..., anon-rss:...`，这是"谁被杀了、吃了多少"的唯一证据。

### 15.5 磁盘 IO

```bash
$ iostat -xz 1 5           # 见 10.6
$ pidstat -d 1 5
$ iotop -oP
$ sudo cat /proc/pressure/io        # PSI：some/full，最直观的 IO 压力
$ sudo cat /proc/pressure/cpu /proc/pressure/memory
```

**PSI（Pressure Stall Information）**是新内核里最值得用的指标：

```text
some avg10=0.00 avg60=0.00 avg300=0.00 total=0
full avg10=0.00 avg60=0.00 avg300=0.00 total=0
```

`full` 大于 0 说明有进程**完全**因为等这个资源而停住，这比 `%util` 更能说明"用户感受到了卡"。

### 15.6 网络

```bash
$ ss -s                          # socket 汇总（TIME_WAIT 数量）
$ ss -tni | head -20             # 含拥塞窗口、重传（retrans）
$ nstat -az | grep -i -E 'retrans|drop|listenoverflow'
$ sar -n DEV 1 5                 # 网卡吞吐
$ curl -o /dev/null -s -w 'dns:%{time_namelookup} conn:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n' https://example.com
```

`curl -w` 的分段计时是定位"慢在哪一层"的利器：DNS 慢 → 解析问题；`time_connect` 慢 → 网络/防火墙；`time_appconnect` 慢 → TLS；`time_starttransfer` 慢 → 服务端处理。

### 15.7 系统调用与阻塞：`strace`

```bash
$ sudo strace -f -tt -T -p <pid>          # 跟住一个进程看它在干什么
$ sudo strace -c -f -p <pid>              # 统计各 syscall 耗时
$ sudo strace -e trace=network -f ./app   # 只看网络相关
$ sudo strace -e trace=openat ./app 2>&1 | grep ENOENT
```

`-T` 显示每次调用耗时，`-c` 汇总。看到大量 `read` 阻塞或 `futex` 等待，就找到了"卡在哪"。

### 15.8 "变慢"的十个常见原因

| 现象 | 常见原因 | 查法 |
| --- | --- | --- |
| 整机卡 | load 高、IO wait | `uptime`、`iostat`、PSI |
| 单个请求慢 | 下游依赖慢 | `curl -w`、APM 追踪 |
| 越跑越慢 | 内存泄漏 / 连接池耗尽 / fd 泄漏 | `ps rss` 趋势、`lsof \| wc -l`、`ss -s` |
| 间歇性慢 | GC 停顿、定时任务、备份 | 看日志时间点、`jstat`/`--trace-gc` |
| 磁盘满 | 日志、已删除文件占用 | 见 10.5 |
| CPU 100% | 死循环、正则回溯、加密 | `perf top` |
| DNS 慢 | resolver 配置、外网解析 | `dig` 计时、`/etc/resolv.conf` |
| 大量 TIME_WAIT | 短连接未复用 | `ss -s`、开启 keepalive |
| 文件句柄耗尽 | `ulimit -n` 太小 | `lsof -p`、`/proc/<pid>/limits` |
| 时间相关 | NTP 漂移、时区错 | `timedatectl`、`chronyc tracking` |

### 15.9 练习

1. 用 `uptime` + `nproc` 判断你的机器是否过载，并解释 load 数字与核数的关系。
2. 用 `free -h` 说明 `free` 与 `available` 的区别，为什么不必"清缓存"。
3. 用 PSI 的三个文件判断当前是否有 IO/CPU/内存压力。
4. 用 `curl -w` 测一次请求，判断慢在 DNS、连接、TLS 还是服务端。
5. 用 `strace -c -p` 跟一个进程 5 秒，找出耗时最多的 syscall。

<details>
<summary>参考答案要点</summary>

1. load ≈ 可运行+不可中断进程数；与核数比较，持续 > 核数即排队。
2. `buff/cache` 可回收，`available` 才是可用量；手动 `drop_caches` 反而降低性能。
3. `cat /proc/pressure/{io,cpu,memory}`，看 `full avg10`。
4. 对比各阶段耗时，占大头的那一段就是瓶颈层。
5. `strace -c -f -p <pid> -o /tmp/st.txt`，看 `% time` 列。

</details>

---

## 16. 安全加固清单

这一章是**可执行清单**，不是理论。每一条都给出命令和验证方法。

### 16.1 账号与权限

```bash
$ awk -F: '$3>=1000 && $3<65534 {print $1, $3, $7}' /etc/passwd   # 有登录能力的普通用户
$ awk -F: '$2=="*" || $2=="!" {print $1}' /etc/shadow              # 已锁定的账号
$ awk -F: '($2==""){print $1}' /etc/shadow                         # **空密码账号（必须为 0 个）**
$ getent group sudo; getent group wheel
$ sudo passwd -l olduser && sudo userdel -r olduser
$ sudo chage -l deploy
```

| 检查项 | 目标 |
| --- | --- |
| 无空密码账号 | `awk -F: '($2=="")' /etc/shadow` 为空 |
| sudo 组成员最小化 | 只有必要的人 |
| 无 UID 0 的额外账号 | `awk -F: '$3==0' /etc/passwd` 只有 root |
| 系统账号不可登录 | shell 为 `/usr/sbin/nologin` |
| root 远程登录受限 | `PermitRootLogin prohibit-password` |

### 16.2 SSH 加固（六项）

```bash
$ sudoedit /etc/ssh/sshd_config.d/99-hardening.conf
```

```text
PermitRootLogin prohibit-password
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 20
AllowUsers deploy
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
```

```bash
$ sudo sshd -t                              # 语法检查（必须先做）
$ sudo systemctl reload ssh                 # Debian/Ubuntu；RHEL 系是 sshd
# 验证：另开一个终端用新配置登录成功，再关掉旧终端
$ ssh -o PreferredAuthentications=publickey deploy@host
$ sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|allowusers'
```

⚠️ **顺序不能错**：先确保密钥能登录，再关密码登录；改完一定要**保留一个已登录的会话**，否则可能把自己锁死。

关于算法：OpenSSH 10.0 起 DSA 已彻底移除；现代默认已启用后量子混合密钥交换（`mlkem768x25519-sha256`），不需要你手动开。可以只保留强算法：

```text
KexAlgorithms sntrup761x25519-sha512@openssh.com,curve25519-sha256,mlkem768x25519-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256
```

### 16.3 防火墙与暴露面

```bash
$ sudo ss -tulpn                     # 所有监听端口，逐个问"这个必须对外吗"
$ sudo nft list ruleset              # 规则是否只有白名单
$ curl -s --max-time 3 ifconfig.me   # 确认公网 IP
$ nmap -Pn -p- --min-rate 2000 <IP>  # 从外部扫自己的端口（要授权！）
```

**最小暴露原则**：数据库、Redis、管理端口只监听 `127.0.0.1` 或内网；只开 22/80/443。

```text
# 只让本机访问（比防火墙更彻底）
bind-address = 127.0.0.1          # MySQL
bind 127.0.0.1 ::1                # Redis
```

### 16.4 SELinux / AppArmor

```bash
$ getenforce                          # Enforcing / Permissive / Disabled
$ sudo setenforce 0                   # 临时宽容（排查用，不要长期）
$ sudo ausearch -m avc -ts recent     # 看被拒绝的操作
$ sudo semanage port -l | grep http_port_t
$ sudo restorecon -Rv /var/www        # 修文件标签

$ sudo aa-status                      # AppArmor
$ sudo journalctl -k | grep -i apparmor
```

**永远不要用"关掉 SELinux"解决问题**。正确的做法是看 `ausearch`/`journalctl` 里的 AVC 记录，用 `semanage fcontext`、`setsebool`、`restorecon` 放行正确的那一项。

### 16.5 文件权限与敏感信息

```bash
$ sudo find / -xdev -perm -4000 -type f -ls 2>/dev/null    # SUID 文件清单（定期对比）
$ sudo find / -xdev -perm -0002 -type f -ls 2>/dev/null    # 全局可写文件
$ sudo find /var/www -type f ! -perm 0644 -ls | head
$ ls -l /etc/shadow /etc/gshadow /root
$ grep -rIl -E 'password|api[_-]?key|secret' /srv/app --include='*.env' --include='*.yml' 2>/dev/null
```

| 文件 | 应有权限 |
| --- | --- |
| `/etc/shadow` | 0640 root:shadow（或 0600） |
| `~/.ssh` | 0700，`id_*` 0600，`authorized_keys` 0600 |
| `.env` / 密钥 | 0600，且不进版本库 |
| 日志含敏感信息 | 0600 或脱敏 |

### 16.6 审计与入侵检测

```bash
$ sudo systemctl enable --now auditd
$ sudo auditctl -w /etc/passwd -p wa -k passwd_change
$ sudo ausearch -k passwd_change -ts today
$ sudo aureport --summary
$ sudo apt install lynis && sudo lynis audit system       # 一键体检
$ sudo journalctl -u ssh | grep -c 'Failed password'      # 暴力破解计数
```

**fail2ban** 自动封禁暴力破解来源：

```bash
$ sudo apt install fail2ban
$ sudo tee /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
EOF
$ sudo systemctl restart fail2ban
$ sudo fail2ban-client status sshd
```

### 16.7 补丁与更新

```bash
# Debian/Ubuntu
$ sudo apt update && sudo apt list --upgradable
$ sudo unattended-upgrade --dry-run -d
$ sudo apt install --only-upgrade nginx

# RHEL 系
$ sudo dnf check-update && sudo dnf upgrade --security
$ sudo dnf updateinfo list security
```

| 策略 | 说明 |
| --- | --- |
| 只自动装安全更新 | Ubuntu 用 `unattended-upgrades`；RHEL 用 `dnf-automatic` |
| 内核更新后要重启 | 检查 `/var/run/reboot-required` 或 `needs-restarting -r` |
| 先在测试机验证 | 生产直接全量升级是事故来源 |
| 保留可回滚 | 记录版本，必要时降级/快照 |

### 16.8 备份与"最后一道防线"

安全事件里最常见的致命错误是"备份被杀"。见第 14 章：**离线/不可变备份**是唯一可靠的答案。

```bash
$ sudo chattr +i /backup/critical.tar.gz     # 不可修改（连 root 都要先 -i）
$ lsattr /backup/critical.tar.gz
```

### 16.9 上线前安全检查清单

- [ ] 无空密码账号、无多余 UID 0 账号
- [ ] SSH 禁用密码登录、禁用 root 密码登录、`AllowUsers` 白名单
- [ ] 防火墙默认拒绝、只开必要端口、云安全组同步
- [ ] 数据库/缓存只监听本机或内网
- [ ] 应用以非 root 用户运行（`User=deploy`）
- [ ] 密钥/口令不在代码库、不在日志，文件权限 0600
- [ ] 自动安全更新已开，内核更新后重启策略明确
- [ ] fail2ban 或等效封禁已开
- [ ] auditd 关键文件监控（`/etc/passwd`、`/etc/sudoers`、authorized_keys）
- [ ] 备份存在且**演练过恢复**
- [ ] 有监控与告警（磁盘、内存、证书到期、服务存活）
- [ ] TLS 证书自动续期且验证过
- [ ] 依赖漏洞扫描做过（`npm audit`、`pip-audit`、`trivy`）

### 16.10 练习

1. 跑 `lynis audit system`，把 warning 按风险排序，修掉前三条。
2. 检查本机是否有空密码账号与多余 UID 0 账号。
3. 把 SSH 配置改成密钥登录、禁用密码，并用第二个终端验证。
4. 用 `ss -tulpn` 列出监听端口，为每个端口写"为什么必须开着"。
5. 配置 fail2ban，用错误密码故意失败 5 次，`fail2ban-client status sshd` 看封禁。

<details>
<summary>参考答案要点</summary>

1. `lynis` 输出按 hardening index 与 suggestion 分级，先处理 "AUTH"、"SSH"、"FILE" 分类。
2. `awk -F: '($2==""){print}' /etc/shadow`；`awk -F: '$3==0{print}' /etc/passwd`。
3. 先 `ssh-copy-id`，再改 `PasswordAuthentication no`，`sshd -t`，`systemctl reload ssh`，新终端验证。
4. 通常 22（管理）、80/443（Web）、必要时 3306 只绑内网；其余全关。
5. `jail.local` 写好 → restart → 故意失败 → `fail2ban-client status sshd` 看 `Banned IP list`。

</details>

---

## 17. 实战一：从零上线一台 VPS

目标：一台全新的 Ubuntu 24.04/26.04 VPS，从 root 裸机 → 一个用 HTTPS 提供服务的 Node 应用，且能重启自愈、有备份、有监控。

### 17.1 阶段一：第一次登录必做

```bash
# 用 root 登录（云厂商给的密码或密钥）
$ ssh root@<IP>

# 1) 更新系统
$ apt update && apt -y upgrade

# 2) 建普通用户 + 给 sudo
$ adduser deploy
$ usermod -aG sudo deploy

# 3) 装你的公钥
$ rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# 4) 时区与主机名
$ timedatectl set-timezone Asia/Shanghai
$ hostnamectl set-hostname app-prod-1
$ timedatectl status

# 5) 验证新用户能登录、能用 sudo（**另开一个终端**）
$ ssh deploy@<IP>
$ sudo -v
```

### 17.2 阶段二：SSH 加固（保留旧会话！）

```bash
$ sudo tee /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
AllowUsers deploy
X11Forwarding no
EOF
$ sudo sshd -t && sudo systemctl reload ssh
$ sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|allowusers'
```

在**新终端**确认 `ssh deploy@<IP>` 可登录、`ssh root@<IP>` 被拒，然后才关闭旧会话。

### 17.3 阶段三：防火墙与基础防护

```bash
$ sudo apt install -y nftables fail2ban unattended-upgrades
$ sudo tee /etc/nftables.conf <<'EOF'
#!/usr/sbin/nft -f
flush ruleset
table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        ct state established,related accept
        iif lo accept
        tcp dport 22 accept
        tcp dport { 80, 443 } accept
        icmp type echo-request accept
        icmpv6 type { nd-neighbor-solicit, nd-router-advert, nd-neighbor-advert, echo-request } accept
    }
    chain forward { type filter hook forward priority 0; policy drop; }
    chain output  { type filter hook output  priority 0; policy accept; }
}
EOF
$ sudo systemctl enable --now nftables
$ sudo nft list ruleset | head -20
```

⚠️ **在改防火墙前先确认 22 端口已放行**，否则下一条命令就把自己关在门外。云服务器还要在控制台安全组里放行 22/80/443。

```bash
$ sudo systemctl enable --now fail2ban
$ sudo systemctl enable --now unattended-upgrades
$ sudo dpkg-reconfigure --priority=low unattended-upgrades   # 选 Yes
```

### 17.4 阶段四：运行时与目录规划

```bash
# Node 24 LTS（用 NodeSource 或 nvm；这里用官方二进制更可控）
$ curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
$ sudo apt install -y nodejs
$ node -v && npm -v

# 目录规范
$ sudo mkdir -p /srv/app/{current,releases,shared}
$ sudo chown -R deploy:deploy /srv/app
```

```text
/srv/app/
├── current -> /srv/app/releases/20261027-0612   # 软链接，回滚只改它
├── releases/
│   └── 20261027-0612/
├── shared/
│   ├── .env
│   └── logs/
```

### 17.5 阶段五：部署应用

```bash
$ su - deploy
$ cd /srv/app/releases && mkdir 20261027-0612 && cd 20261027-0612
$ git clone --depth 1 git@github.com:me/app.git .
$ npm ci --omit=dev
$ ln -sfn /srv/app/shared/.env .env
$ node -e 'console.log("ok")'
```

### 17.6 阶段六：systemd 托管

```bash
$ sudo tee /etc/systemd/system/app.service <<'EOF'
[Unit]
Description=My Node App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/srv/app/current
EnvironmentFile=/srv/app/shared/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=3
TimeoutStopSec=20
KillSignal=SIGTERM
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/app/shared
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now app
$ systemctl status app --no-pager
$ journalctl -u app -n 30 --no-pager
$ curl -s localhost:3000/health
```

### 17.7 阶段七：Nginx 反向代理 + HTTPS

```bash
$ sudo apt install -y nginx
$ sudo tee /etc/nginx/sites-available/app <<'EOF'
server {
    listen 80;
    server_name app.example.com;
    location / { return 301 https://$host$request_uri; }
}
server {
    listen 443 ssl;
    http2 on;
    server_name app.example.com;

    ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
EOF
$ sudo ln -sfn /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
$ sudo rm -f /etc/nginx/sites-enabled/default
$ sudo nginx -t && sudo systemctl reload nginx
```

**先拿证书**（证书文件不存在时 `nginx -t` 会失败，所以要分两步）：

```bash
$ sudo apt install -y certbot python3-certbot-nginx
$ sudo certbot certonly --nginx -d app.example.com     # 只申请，不改配置
$ sudo nginx -t && sudo systemctl reload nginx
$ sudo certbot renew --dry-run                          # 验证续期
$ systemctl list-timers | grep certbot
```

### 17.8 阶段八：备份、监控与告警

```bash
# 每日备份（restic 到对象存储）
$ sudo tee /usr/local/bin/app-backup.sh <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
export RESTIC_REPOSITORY="s3:https://s3.example.com/backups/app"
export RESTIC_PASSWORD_FILE=/etc/restic/pass
restic backup /srv/app/shared /etc/nginx /etc/systemd/system/app.service --tag daily
restic forget --keep-daily 7 --keep-weekly 4 --prune
restic check
EOF
$ sudo chmod +x /usr/local/bin/app-backup.sh

# 基础监控（node_exporter + 外部 uptime 检查）
$ sudo apt install -y prometheus-node-exporter
$ curl -s localhost:9100/metrics | head -3
```

**最低监控项**：服务存活（外部 HTTP 检查）、磁盘用量、内存、证书到期天数、备份是否成功。

### 17.9 上线核查清单

- [ ] `systemctl status app` active (running)，开机自启已开
- [ ] `curl https://app.example.com/health` 返回 200
- [ ] 证书链完整（`curl -vI` 或 SSL Labs），续期计时器存在
- [ ] HTTP 自动跳 HTTPS，HSTS 头存在
- [ ] 防火墙只开 22/80/443，数据库未暴露
- [ ] `journalctl -u app` 无报错，日志在轮转
- [ ] 备份任务跑过一次且 `restic check` 通过
- [ ] 重启验证：`sudo reboot` 后服务自动恢复（这才是真正的"自愈"）
- [ ] 监控告警能收到（故意停服务试一次）

### 17.10 练习

1. 按本章顺序在一台虚拟机/云主机上完整走一遍，记录每步的输出。
2. `sudo reboot` 之后验证服务、Nginx、证书、备份 timer 是否都自动恢复。
3. 故意把 `app.service` 的 `ExecStart` 写错，用 `journalctl` 找出原因并修复。
4. 用 `curl -vI https://你的域名` 检查 TLS 版本、证书链、HSTS。
5. 把 17.6 的 service 文件里的硬化指令逐条解释一遍（`ProtectSystem=strict` 会带来什么限制？）。

<details>
<summary>参考答案要点</summary>

1. 每步都要有可验证输出（`sshd -T`、`nft list ruleset`、`systemctl status`、`curl -I`）。
2. `reboot` 后用 `systemctl --failed`、`systemctl list-timers`、`curl` 逐项确认。
3. `journalctl -u app -n 50` 里会有 `status=203/EXEC`（找不到可执行文件）或 node 的 ENOENT。
4. 看 `SSL connection using TLSv1.3`、`subject:`/`issuer:`、`strict-transport-security`。
5. `ProtectSystem=strict` 让 `/` 与 `/usr` 只读，所以要把需要写的位置显式加进 `ReadWritePaths`。

</details>

---

## 18. 实战二：巡检 + 备份 + 告警脚本包

这一章把前面零散的命令组织成**一个可以直接放进生产的脚本包**。

### 18.1 目录结构

```text
/opt/sysops/
├── bin/
│   ├── common.sh        # 公共函数（日志、告警、锁）
│   ├── preflight.sh     # 上线前体检
│   ├── backup.sh        # 备份
│   ├── report.sh        # 每日巡检报告
│   └── check.sh         # 轻量健康检查（给 timer 每 5 分钟跑）
├── etc/
│   └── sysops.conf      # 配置（阈值、路径、webhook）
└── var/
    ├── log/
    └── run/
```

### 18.2 `common.sh`：公共函数

```bash
#!/usr/bin/env bash
# /opt/sysops/bin/common.sh —— 被其他脚本 source
set -Eeuo pipefail
IFS=$'\n\t'

readonly SYSOPS_HOME="/opt/sysops"
readonly SYSOPS_ETC="${SYSOPS_HOME}/etc"
readonly SYSOPS_VAR="${SYSOPS_HOME}/var"
readonly LOG_DIR="${SYSOPS_VAR}/log"
readonly RUN_DIR="${SYSOPS_VAR}/run"

mkdir -p "$LOG_DIR" "$RUN_DIR"

log() { printf '[%s] [%s] %s\n' "$(date '+%F %T')" "${LOG_TAG:-sysops}" "$*" | tee -a "${LOG_DIR}/${LOG_TAG:-sysops}.log" >&2; }
warn() { log "WARN: $*"; }
die() { log "ERROR: $*"; notify "ERROR" "$*"; exit 1; }

# 只有配置了 webhook 才真的发
notify() {
    local level="$1" msg="$2"
    [[ -n "${WEBHOOK_URL:-}" ]] || return 0
    curl -fsS -m 10 -X POST "$WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "$(printf '{"level":"%s","host":"%s","msg":"%s"}' "$level" "$(hostname)" "$msg")" \
        >/dev/null 2>&1 || log "告警发送失败"
}

# 单实例锁
with_lock() {
    local name="$1"; shift
    exec 9>"${RUN_DIR}/${name}.lock"
    flock -n 9 || { warn "已有 ${name} 在跑，跳过"; return 0; }
    "$@"
}

load_conf() {
    [[ -f "${SYSOPS_ETC}/sysops.conf" ]] && . "${SYSOPS_ETC}/sysops.conf"
}

trap 'die "第 $LINENO 行失败，退出码 $?"' ERR
```

### 18.3 `check.sh`：每 5 分钟的健康检查

```bash
#!/usr/bin/env bash
# /opt/sysops/bin/check.sh
source "$(dirname "$0")/common.sh"
LOG_TAG="check"
load_conf

DISK_MAX=${DISK_MAX:-85}
MEM_MIN_MB=${MEM_MIN_MB:-200}
URLS=${URLS:-}

main() {
    local fail=0

    # 磁盘
    while read -r pct mount; do
        pct=${pct%\%}
        if (( pct >= DISK_MAX )); then
            warn "磁盘 ${mount} 使用率 ${pct}% ≥ ${DISK_MAX}%"
            notify "WARN" "磁盘 ${mount} ${pct}%"
            fail=1
        fi
    done < <(df -h --output=pcent,target -x tmpfs -x devtmpfs | tail -n +2)

    # 可用内存
    local avail
    avail=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo)
    (( avail < MEM_MIN_MB )) && { warn "可用内存 ${avail}MB < ${MEM_MIN_MB}MB"; fail=1; }

    # 服务存活
    for unit in ${UNITS:-}; do
        systemctl is-active --quiet "$unit" || { warn "服务 ${unit} 未运行"; notify "ERROR" "服务 ${unit} 挂了"; fail=1; }
    done

    # HTTP 健康检查
    for url in $URLS; do
        local code
        code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$url" || echo 000)
        [[ "$code" == "200" ]] || { warn "${url} 返回 ${code}"; notify "ERROR" "${url} 返回 ${code}"; fail=1; }
    done

    # 证书到期
    for domain in ${DOMAINS:-}; do
        local end days
        end=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null \
              | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || true)
        if [[ -n "$end" ]]; then
            days=$(( ( $(date -d "$end" +%s) - $(date +%s) ) / 86400 ))
            (( days < 14 )) && { warn "${domain} 证书 ${days} 天后到期"; notify "WARN" "${domain} 证书 ${days} 天到期"; fail=1; }
        fi
    done

    (( fail == 0 )) && log "全部检查通过"
    return "$fail"
}

main "$@"
```

### 18.4 `backup.sh`

```bash
#!/usr/bin/env bash
# /opt/sysops/bin/backup.sh
source "$(dirname "$0")/common.sh"
LOG_TAG="backup"
load_conf

BACKUP_DIR=${BACKUP_DIR:-/var/backups/sysops}
KEEP_DAYS=${KEEP_DAYS:-14}
BACKUP_PATHS=${BACKUP_PATHS:-"/etc /srv/app/shared"}
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="${BACKUP_DIR}/sysops-${STAMP}.tar.gz"

main() {
    mkdir -p "$BACKUP_DIR"
    log "开始备份: ${BACKUP_PATHS} → ${OUT}"

    # 排除日志与缓存，避免包过大
    tar -czf "$OUT" \
        --exclude='*.log' --exclude='node_modules' --exclude='.git' \
        $BACKUP_PATHS

    tar -tzf "$OUT" >/dev/null || die "备份校验失败: ${OUT}"
    local size
    size=$(du -h "$OUT" | cut -f1)
    log "备份完成: ${OUT} (${size})"

    find "$BACKUP_DIR" -name 'sysops-*.tar.gz' -mtime "+${KEEP_DAYS}" -print -delete

    # 可选：推到远端
    if [[ -n "${RSYNC_TARGET:-}" ]]; then
        rsync -az --partial "$OUT" "$RSYNC_TARGET/" && log "已同步到 ${RSYNC_TARGET}"
    fi

    notify "INFO" "备份完成 ${size}"
}

with_lock backup main
```

### 18.5 `report.sh`：每日巡检

```bash
#!/usr/bin/env bash
# /opt/sysops/bin/report.sh
source "$(dirname "$0")/common.sh"
LOG_TAG="report"

main() {
    {
        echo "# 每日巡检 $(date '+%F %T') $(hostname)"
        echo
        echo "## 概况"
        uptime
        echo
        echo "## 磁盘"
        df -hT -x tmpfs -x devtmpfs
        echo
        echo "## 内存"
        free -h
        echo
        echo "## 失败的 unit"
        systemctl --failed --no-legend || true
        echo
        echo "## 最近登录"
        last -n 10 | head -11
        echo
        echo "## 失败登录次数（今天）"
        journalctl -u ssh --since today 2>/dev/null | grep -c 'Failed password' || echo 0
        echo
        echo "## 可用更新（安全）"
        apt list --upgradable 2>/dev/null | grep -ci security || echo 0
        echo
        echo "## 证书到期"
        for d in ${DOMAINS:-}; do
            echo | openssl s_client -servername "$d" -connect "${d}:443" 2>/dev/null \
              | openssl x509 -noout -enddate 2>/dev/null | sed "s|^|$d: |"
        done
    } > "${LOG_DIR}/report-$(date +%F).txt"

    log "报告已生成: ${LOG_DIR}/report-$(date +%F).txt"
    notify "INFO" "每日巡检报告已生成"
}

main "$@"
```

### 18.6 用 timer 定时跑

```ini
# /etc/systemd/system/sysops-check.service
[Unit]
Description=sysops health check

[Service]
Type=oneshot
ExecStart=/opt/sysops/bin/check.sh
User=root
```

```ini
# /etc/systemd/system/sysops-check.timer
[Unit]
Description=每 5 分钟健康检查

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
AccuracySec=30s

[Install]
WantedBy=timers.target
```

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now sysops-check.timer
$ systemctl list-timers sysops-check.timer
$ journalctl -u sysops-check -n 20 --no-pager
```

备份用 `OnCalendar`：

```ini
# /etc/systemd/system/sysops-backup.timer
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
RandomizedDelaySec=300
```

### 18.7 配置与部署

```bash
# /opt/sysops/etc/sysops.conf
DISK_MAX=85
MEM_MIN_MB=200
UNITS="app nginx"
URLS="https://app.example.com/health"
DOMAINS="app.example.com"
BACKUP_DIR=/var/backups/sysops
KEEP_DAYS=14
BACKUP_PATHS="/etc /srv/app/shared"
WEBHOOK_URL="https://hooks.example.com/xxx"
```

```bash
$ sudo chmod 644 /opt/sysops/etc/sysops.conf
$ sudo chmod +x /opt/sysops/bin/*.sh
$ sudo bash -n /opt/sysops/bin/check.sh
$ sudo /opt/sysops/bin/check.sh
$ sudo /opt/sysops/bin/backup.sh
$ sudo /opt/sysops/bin/report.sh && cat /opt/sysops/var/log/report-$(date +%F).txt | head -20
```

### 18.8 练习

1. 把 `check.sh` 的磁盘检查改成同时检查 inode（`df -i`）。
2. 给 `check.sh` 加一条"load average 超过核数 × 2 就告警"。
3. 把 `backup.sh` 改成用 `restic` 而不是 tar，并保留相同的轮转语义。
4. 故意让 `/srv/app/shared` 不存在，验证脚本报错退出且发出告警。
5. 用 `systemctl list-timers` 与 `journalctl -u sysops-check` 确认 timer 在跑、日志有内容。

<details>
<summary>参考答案要点</summary>

1. 复制磁盘那段，改为解析 `df -i --output=ipcent,target | tail -n +2`，阈值单列（如 90%）。
2. `load=$(cut -d' ' -f1 /proc/loadavg)`；`cores=$(nproc)`；`awk -v l="$load" -v c="$cores" 'BEGIN{exit !(l > c*2)}'` 判断。
3. `restic backup $BACKUP_PATHS` + `restic forget --keep-daily 14 --prune` + `restic check`，锁与日志保留。
4. `[[ -d "$p" ]] || die "路径不存在: $p"`，`die` 内部调 `notify "ERROR"`，脚本以非 0 退出。
5. `list-timers` 显示 NEXT/LAST，`journalctl -u sysops-check --since -1h` 有每 5 分钟的记录。

</details>

---

<!-- NEXT -->

---

## 19. 陷阱与反模式

### 19.1 流传很广但错误的说法

| 流传说法 | 2026 年的正确说法 |
| --- | --- |
| "swap 应该是内存的两倍" | 现代服务器只需 2～4G 应急；数据库机器按需；云上很多镜像默认没 swap |
| "卡住了就 `kill -9`" | 先 `SIGTERM` 让它清理（关文件、提交事务），等 10～30 秒再 `-9`；`-9` 会让临时文件、锁、连接残留 |
| "权限问题就 `chmod -R 777`" | 777 = 任何人可改，等于开门；正解是 `chown` 给对用户 + 只加必要的 `g+rw` |
| "把 SELinux 关了就行" | 关掉等于拆掉一层防护；用 `ausearch`/`semanage`/`restorecon` 放行正确策略 |
| "有了 `iptables` 就不用 nftables" | 现代发行版底层就是 nftables；`iptables-nft` 只是兼容层，两套工具混用会互相看不见规则 |
| "`apt upgrade` 就是装安全更新" | `apt upgrade` 装所有可升级包；只装安全更新用 `unattended-upgrades` 或 `apt-get -s dist-upgrade` 前先看清单 |
| "cgroup v1 已经被删了" | 没删；systemd 默认只用 v2 统一层级，v1 需特殊开关且已弃用 |
| "`df` 满了就是文件占满了" | 也可能是已删除文件仍被进程占用（`lsof +L1`）、inode 满（`df -i`）、保留块 |
| "`ulimit -n` 改了永久生效" | 只在当前 shell 有效；永久要改 `/etc/security/limits.conf` 或 systemd 的 `LimitNOFILE=` |
| "`systemctl enable` 就是启动了" | `enable` 只设开机自启；要现在就跑得 `systemctl start`（或 `enable --now`） |
| "`ifconfig`/`netstat` 够用" | 已被 `ip`/`ss` 取代，`netstat` 在多数新发行版默认不装 |
| "用 `ntpdate` 校时" | 已被 `chrony`/`systemd-timesyncd` 取代；`ntpdate` 会跳变时间，破坏数据库与日志 |
| "`echo 3 > drop_caches` 能提速" | 清掉缓存只会让后续读更慢；`buff/cache` 是可回收的，不用管 |
| "`chmod 600` 就安全了" | 还要看文件属主、所在目录权限、有没有被进程以 root 读取后写日志 |
| "重启能解决一切" | 重启只是把问题推迟；先留下现场（`journalctl -b -1`、`dmesg`、`ps`），再决定重启 |
| "`rm -rf` 删掉就没了" | 打开着的文件仍在（`lsof`），磁盘空间不释放；`extundelete` 之类的恢复成功率极低 |
| "`crontab` 里写的和终端里一样" | cron 的 `PATH`、工作目录、环境变量都不同；一定要用绝对路径并重定向输出 |

### 19.2 十条高风险的坏习惯

1. **直接在生产上用 root 敲命令**，没有 `sudo` 日志、没有边界。
2. **`rm -rf $VAR/`** 而 `VAR` 可能为空 → `set -u` 与 `[[ -n "$VAR" ]]` 能救命。
3. **脚本没有 `set -euo pipefail`**，中间失败继续跑，留下一半状态。
4. **在 `/etc/fstab` 里写 `/dev/sdb1`** 而不是 UUID；盘序变了就起不来。
5. **备份和生产在同一块盘/同一台机器**，一起没。
6. **改了防火墙/SSH 没有备用会话**，一失手就锁死。
7. **日志没有轮转**，三个月后磁盘满导致服务全挂。
8. **`chmod 777` 解决权限**，然后忘了改回来。
9. **把密码/密钥写在脚本或 `.bash_history` 里**。
10. **定时任务不加锁**，重叠执行损坏数据。

### 19.3 排错时的思维陷阱

| 陷阱 | 表现 | 做法 |
| --- | --- | --- |
| 确认偏误 | 只找支持自己猜想的证据 | 先写下"如果是 X，应该看到 Y；如果看到 Z 就不是 X" |
| 同时改多处 | 不知道哪步生效 | 一次只改一个变量 |
| 相信缓存 | 改了配置但看到旧结果 | `systemctl daemon-reload`、`nginx -t` 后 reload、清浏览器缓存、`hash -r` |
| 跳过日志 | 直接猜 | 永远先看 `journalctl -u <unit> -n 50` |
| 忽略时间 | 日志时间对不上 | `timedatectl`；日志用 UTC 还是本地要统一 |
| 把"能跑"当"正确" | 手工能跑，服务不行 | 比环境：用户、工作目录、环境变量、权限（见 8.9 六步） |

### 19.4 Windows 用户转 Linux 的六个坑

| 坑 | 说明 | 做法 |
| --- | --- | --- |
| 路径分隔符 | Linux 只有 `/`，且**大小写敏感** | 脚本里永远用 `/` |
| 扩展名决定执行 | 没有 `.exe`，靠 `chmod +x` 与 shebang | `#!/usr/bin/env bash` + `chmod +x` |
| CRLF 换行 | Windows 编辑的文件在 Linux 里报 `bad interpreter: /usr/bin/env bash^M` | `dos2unix` 或 `.gitattributes` 里 `eol=lf` |
| 没有盘符 | 一切从 `/` 开始 | 记住 `/etc`、`/var`、`/srv`、`/opt` |
| 后台服务不是"装个程序" | 要写 systemd unit | 见第 8 章模板 |
| 权限概念 | 没有"管理员运行"，是 `sudo` + 文件权限 | 见第 3、6 章 |

### 19.5 练习

1. 从 19.1 的表里挑五条，各写一个"我怎么验证它是错的"的命令。
2. 找出你机器上 `df -h` 与 `du -sh /` 不一致的原因。
3. 检查你的 crontab 是否有未重定向输出的任务。
4. 用 `history | grep -E 'password|secret'` 检查自己有没有把口令敲进命令行。
5. 写一条"改了 SSH 配置但没锁死自己"的操作清单。

<details>
<summary>参考答案要点</summary>

1. 例如验证 "`enable` 不等于启动"：`systemctl is-enabled nginx` 与 `systemctl is-active nginx` 对比。
2. `lsof +L1` 找已删除但被占用的文件；`df -i` 看 inode。
3. `crontab -l | grep -v '>'`。
4. 若有，立刻 `history -c` 并改口令、启用 `HISTCONTROL=ignorespace` 加前导空格写法。
5. 保留已登录会话 → 改配置 → `sshd -t` → reload → 新终端验证 → 才关旧会话。

</details>

---

## 20. 练习总集

### 20.1 基础（会用）

1. 用一条命令列出 `/var/log` 下最大的 5 个文件。
2. 找出当前目录树里所有大于 100MB 的文件。
3. 统计 `/etc` 下有多少个 `.conf` 文件。
4. 把 `access.log` 里状态码为 500 的行导出到 `err.log`。
5. 查看进程 1234 的可执行文件路径、工作目录、打开的文件。
6. 只给文件属主读写权限，其他人都无权限。
7. 把某目录下所有 `.sh` 文件加上可执行位。
8. 查看系统最近 10 次登录失败。
9. 查看最近 24 小时的 systemd 日志里 error 级别的记录。
10. 显示当前监听的所有 TCP 端口与对应进程。

### 20.2 中级（会配）

11. 写一个 systemd service 托管一个 Node 应用，要求非 root、崩溃 3 秒后重启、限制文件描述符 65535。
12. 配一个 systemd timer 每天 03:30 备份 `/srv/app`，保留 14 天，且错过的执行要补跑。
13. 用 nftables 只放行 22/80/443，其余全拒绝（含 IPv6 的 ICMPv6）。
14. 用 `find` + `xargs -0` 批量重命名含空格的文件名（替换字符）。
15. 写脚本：检查磁盘、内存、指定服务状态，任一异常退出码非 0。
16. 用 `rsync` 把本地目录同步到远端，先 `--dry-run`，再真正同步，并保留权限与时间。
17. 用 `tar` 打增量包（只打包最近 7 天变化的文件）。
18. 用 `mysqldump --single-transaction` 备份一个库，导入临时库并核对行数。
19. 用 `logrotate` 为 `/var/log/myapp/*.log` 配每日轮转、保留 7 份、压缩、轮转后发 USR1。
20. 用 `ss` 与 `dig` 判断"DNS 解析慢"还是"连接慢"。

### 20.3 高级（会设计与排障）

21. 一台机器 load 40（8 核），但 CPU 空闲、磁盘 `%util` 100%。写出你的排查顺序与可能结论。
22. 服务日志显示 `Too many open files`，给出三条可能原因与验证命令。
23. 应用"每天凌晨 3 点变慢"，给出三个可能原因与各自的验证方法。
24. 设计一个"零停机发布"流程（用软链接 + systemd + Nginx 平滑 reload），写出每一步命令。
25. 有人误执行 `chmod -R 777 /`，给出处置步骤（先别重启）。
26. 写一个"证书到期前 14 天告警"的脚本，并说明怎么避免告警风暴。
27. 设计一个 3-2-1 备份方案，写明 RPO/RTO、介质、位置、演练频率。
28. 磁盘显示 100% 但 `du -sh /*` 加起来只有 40%，解释原因并修复。
29. 写一个幂等的"用户与 SSH 密钥"初始化脚本（重复执行结果一致）。
30. 用 `set -Eeuo pipefail` 写一个部署脚本，包含：预检、备份、发布、健康检查、失败自动回滚。

### 20.4 参考答案要点

<details>
<summary>点击展开</summary>

1. `du -ah /var/log | sort -rh | head -5`（或 `ls -S`）。
2. `find . -type f -size +100M -exec ls -lh {} \;`。
3. `find /etc -name '*.conf' | wc -l`。
4. `awk '$9==500' access.log > err.log`（按 common log 格式的字段位置）；用 `grep -E ' 500 '` 更粗但更通用。
5. `ls -l /proc/1234/exe /proc/1234/cwd`；`sudo ls -l /proc/1234/fd`。
6. `chmod 600 file`。
7. `find <dir> -name '*.sh' -exec chmod +x {} +`。
8. `lastb -n 10`（需 `/var/log/btmp` 可读，通常要 sudo）。
9. `journalctl --since '24 hours ago' -p err --no-pager`。
10. `ss -tlnp`。
11. `User=deploy`、`Restart=on-failure`、`RestartSec=3`、`LimitNOFILE=65535`（见 17.6）。
12. `OnCalendar=*-*-* 03:30:00`、`Persistent=true`；保留策略在脚本里 `find -mtime +14 -delete`。
13. 见 11.5 的 nftables 配置，注意 `policy drop` 与 ICMPv6 邻居发现。
14. `find . -type f -name '* *' -print0 | xargs -0 -I{} bash -c 'mv -- "$1" "${1// /_}"' _ {}`。
15. 见 18.3 的 `check.sh`。
16. `rsync -avhn --numeric-ids src/ dst/` 预演，去掉 `-n` 执行；`-a` 已含权限与时间。
17. `tar -czf inc.tgz --newer='7 days ago' -C /srv app`。
18. `mysqldump --single-transaction db > d.sql`；建临时库导入；`SELECT COUNT(*)` 对比。
19. `daily`、`rotate 7`、`compress`、`postrotate systemctl kill -s USR1 myapp`（或 `kill -USR1 $(cat /run/myapp.pid)`）。
20. `curl -w` 看 `time_namelookup` vs `time_connect`；`dig` 看 Query time。
21. 结论方向：IO 饱和（`iostat -x` 看 `%util`/`await`/`aqu-sz`）；用 `pidstat -d`、`iotop` 找进程；PSI 的 `io full` 确认；可能是备份/日志刷盘/数据库 checkpoint。
22. ① `LimitNOFILE` 太小（`/proc/<pid>/limits`）；② fd 泄漏（`lsof -p | wc -l` 随时间增长）；③ 大量 TIME_WAIT/连接未复用（`ss -s`）。临时 `ulimit -n` + 改 systemd 配置。
23. ① 定时任务/备份撞车（`crontab -l`、`list-timers`）；② 数据库备份或统计任务（慢查询日志）；③ 外部依赖/网络波动（`curl -w`、APM）。用固定时间窗口对比日志。
24. 发布到新目录 → `npm ci` → 健康检查 → `ln -sfn` 切换 `current` → `systemctl reload-or-restart app`（或 restart）→ `nginx -s reload` → 观察错误率 → 回滚只需把软链接切回旧版本再 restart。
25. 不要重启（会触发大量服务重读配置失败）。先 `getfacl`/记录；用 RPM/DEB 校验和恢复关键文件（`rpm --verify`/`dpkg -V`）；用备份恢复 `/etc`；修复 sshd 权限（`~/.ssh` 700、authorized_keys 600）；最后再重启验证。
26. `openssl s_client` 取 `enddate` → 算天数 → 低于 14 告警；避免风暴：告警去重（每天最多一次）、用 `OnFailure` 或告警平台的静默/聚合功能。
27. 每日全量 + 每日增量到本地另一块盘（RPO 24h/RTO 1h），每周同步到对象存储另一区域（异地），开启版本化/对象锁；每月演练恢复并记录时间。
28. 已删除但被进程占用的文件（`lsof +L1`）；也可能是挂载点覆盖了底层目录（`df` 与 `du` 统计的是不同视图）。修复：`truncate -s 0` 或重启进程；用 `findmnt` 检查重复挂载。
29. 用 `id -u user >/dev/null 2>&1 || useradd -m -s /bin/bash user`；密钥用 `grep -qF "$key" authorized_keys || echo "$key" >> ...`；权限统一 `chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys`。
30. 结构：`preflight`（依赖、磁盘、权限）→ `backup`（tar/restic，失败即停）→ `release`（新目录、`npm ci`、健康检查）→ `switch`（软链接 + restart + 等待 active）→ `verify`（curl 200）→ 失败则 `rollback`（切回旧链接 + restart）→ 每步 `log`，`trap ERR` 触发回滚。

</details>

---

## 21. 速查表与学习路径

### 21.1 命令速查（按场景）

**看系统**

```bash
uname -a; cat /etc/os-release      # 内核与发行版
uptime; nproc; free -h; df -hT     # 负载、核数、内存、磁盘
lsblk -f; findmnt                  # 块设备、挂载树
lscpu; lsmem; lspci                # 硬件
systemctl --failed                 # 失败的 unit
journalctl -p err -b               # 本次启动的 error
```

**进程**

```bash
ps aux | grep <name>               # 粗查
pgrep -af <name>                   # 精查（带完整命令行）
pstree -p <pid>                    # 进程树
top -o %CPU / htop                 # 实时
kill -TERM <pid>; kill -9 <pid>    # 先礼后兵
systemctl status <unit>            # 服务状态
```

**文件**

```bash
find /path -name '*.log' -mtime -7 -size +10M
du -sh * | sort -h | tail
df -h; df -i
ls -lSh | head
tail -f /var/log/syslog
grep -rn 'pattern' /etc
```

**网络**

```bash
ip -br addr; ip route
ss -tulpn; ss -s
dig +short example.com; dig +trace example.com
curl -vI https://example.com
tcpdump -i any -nn port 443
nft list ruleset
```

**权限与用户**

```bash
id; groups; whoami
ls -l; getfacl file; stat file
chmod 640 file; chown user:group file
sudo -l; sudo -u deploy cmd
useradd -m -s /bin/bash u; passwd u
```

**服务与日志**

```bash
systemctl start|stop|restart|reload|status|enable|disable <unit>
systemctl daemon-reload
journalctl -u <unit> -f
journalctl --since '1 hour ago' -p warning
logrotate -d /etc/logrotate.d/<name>    # 干跑
```

**包管理**

```bash
apt update; apt install pkg; apt remove pkg; apt list --upgradable
dnf install pkg; dnf update; dnf history
```

**压缩与传输**

```bash
tar -czf a.tgz dir; tar -xzf a.tgz; tar -tzf a.tgz
rsync -avh --dry-run src/ dst/
scp file user@host:/path
ssh -L 8080:127.0.0.1:80 host
```

### 21.2 服务状态与退出码对照

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| `active (running)` | 正常 | — |
| `failed` | 启动失败或崩溃 | `journalctl -u <unit> -n 50` |
| `activating (auto-restart)` | 正在重启 | 看 `Restart=` 与日志 |
| `inactive (dead)` | 未运行 | `systemctl start` |
| `enabled` | 开机自启（≠ 正在跑） | `is-active` 确认 |
| `masked` | 被禁止 | `systemctl unmask` |

| 退出码 | 含义 |
| --- | --- |
| 0 | 成功 |
| 1 | 通用错误 |
| 2 | 用法错误（shell 内建） |
| 126 | 找到但不可执行（无 x 权限） |
| 127 | 命令未找到 |
| 137 | 被 SIGKILL（OOM 或被 `-9`） |
| 143 | 被 SIGTERM |

### 21.3 排障决策树

```text
机器能 ping 通吗？
├─ 不能 → 网络层：ip addr / ip route / 安全组 / 云厂商状态
└─ 能
   ├─ 端口通吗（nc / telnet）？
   │  ├─ 不通 → ss -tulpn（有没有监听）/ 防火墙 / 云安全组
   │  └─ 通
   │     ├─ HTTP 有响应吗（curl -v）？
   │     │  ├─ 5xx → journalctl -u <app> / 应用日志 / 下游依赖
   │     │  ├─ 502 → 上游没起或端口错（nginx error.log: connect() failed）
   │     │  ├─ 504 → 上游超时（proxy_read_timeout / 应用慢）
   │     │  └─ 200 但慢 → curl -w 分段 / 数据库 / 外部依赖
   │     └─ 没响应 → tcpdump 看有没有到达 / TLS 握手
   └─ 慢得离谱 → uptime / free / iostat / PSI
```

### 21.4 与 Windows、Python 的对照

| 任务 | Linux | Windows | Python |
| --- | --- | --- | --- |
| 列目录 | `ls -la` | `dir` | `os.listdir` / `Path.iterdir` |
| 找文件 | `find` | `where` / `dir /s` | `Path.rglob` |
| 看进程 | `ps`/`top` | 任务管理器 | `psutil` |
| 杀进程 | `kill` | `taskkill` | `psutil.Process.kill` |
| 服务 | systemd | 服务管理器/sc | — |
| 环境变量 | `export` | `set`/`$env:` | `os.environ` |
| 管道 | `\|` | `\|` | 生成器/`subprocess` |
| 计划任务 | cron/timer | 任务计划程序 | `schedule`/APScheduler |

### 21.5 六周学习路径

| 周 | 重点 | 交付物 |
| --- | --- | --- |
| 1 | 第 1–3 章：心智模型、shell、文件权限 | 能独立在服务器上找文件、改权限、读日志 |
| 2 | 第 4–5 章：文本处理、进程与信号 | 用 `grep/sed/awk` 从日志里出报表 |
| 3 | 第 6–8 章：用户、sudo、包管理、systemd | 把一个小应用做成 systemd 服务 |
| 4 | 第 9–11 章：日志、存储、网络 | 配好防火墙、挂载数据盘、排查一次网络问题 |
| 5 | 第 12–14 章：脚本、定时任务、备份 | 写巡检脚本 + timer + 备份并恢复成功 |
| 6 | 第 15–18 章：性能、安全、两个实战 | 一台完整上线的 VPS + 脚本包 |

### 21.6 资源

- `man 7 signal`、`man 5 systemd.service`、`man 5 systemd.timer`、`man 5 crontab`、`man 5 fstab` —— 最权威，先查 man。
- `tldr`（简洁示例）、`explainshell`（拆解命令行）、`shellcheck`（脚本检查）。
- 《The Linux Command Line》(William Shotts)、*Linux System Programming*（进阶）。
- `Linux Journey`、`OverTheWire: Bandit`（命令行闯关）。
- systemd：`freedesktop.org/software/systemd/man/`；nftables wiki；`nginx.org/en/docs/`（配合 Nginx 手册）。
- 监控与可观测：Prometheus + node_exporter + Grafana 是自建最省事的一套。

### 21.7 三句话总结

1. **一切皆文件，进程也是文件（`/proc`）**——这是 Linux 排查的底层直觉。
2. **先量再改，一次只改一处**——性能与故障排查的纪律。
3. **能自动化的都写成脚本 + timer，并且演练恢复**——运维的价值不在敲命令，在可重复与可恢复。

---

<!-- END -->
