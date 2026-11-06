---
title: Docker 学习手册
description: 为会写代码、也懂一点 Linux 命令的人编写的 docker 容器学习手册。
date: 2026-11-01
category: 技术
tags:
  - AIGC
  - 技术
  - 笔记
readingTime: 145
---

面向"会写代码、也懂一点 Linux 命令，但从没系统用过容器"的读者。

读完之后你应该能：把一个应用打成镜像、用 Compose 起一套多容器环境、把镜像瘦下来、并在服务器上稳定地跑起来。

**版本基线**（核对到 2026-10-27）：Docker Engine **29.9.2**（2026-10-20，29.0 于 2025-11-10 发布）、Docker Compose **v5.6.1**（2026-10-21）、Docker Desktop **4.97.0**（2026-10-26）、Buildx **v0.38.1**、BuildKit **v0.34.1**、Dockerfile 前端 **1.28.0**。文中凡涉及版本差异的地方都会标注。

三个容易搞混的命名，先在这里说清：

- **Engine 早已没有 CE / EE 之分，也没有 LTS 分支命名**。看到"Docker CE 27.x LTS"这类说法可以直接判定为过时。
- **Compose CLI 的版本（v5.x）和 Compose 文件格式的版本不是一回事**。文件顶层的 `version:` 字段已经被规范标为 obsolete，写了会告警但不影响运行——本手册的示例都不写它。
- **`docker build` 现在就是 `docker buildx build` 的别名**（BuildKit 是默认构建器）。所以第 11 章讲 buildx 时不用另学一套命令。

## 0. 怎么用这份手册

### 0.1 你需要的前置知识

| 需要 | 到什么程度 | 不满足怎么办 |
| --- | --- | --- |
| 命令行 | 会 `cd`、`ls`、`cat`、`grep` | 先补 Linux 基础 |
| 进程与端口 | 知道"程序在某个端口监听" | 读完本文第 1 章也能懂 |
| 网络基础 | 知道 IP、端口、DNS 大概是什么 | 第 5 章会补 |
| 一个能跑的应用 | 随便一个 Node/Python 程序 | 第 12 章会从零给一个 |

**不需要**：不需要先学 Kubernetes，不需要懂内核，不需要买服务器——本机就能跑完全部练习。

### 0.2 三句话讲清 Docker

1. **镜像是"文件系统快照 + 启动命令"的只读包**，分层存放，层可复用。
2. **容器是镜像的一次运行实例**，本质上是宿主机上的一个（被隔离的）普通进程。
3. **Dockerfile 是造镜像的脚本，Compose 是编排多个容器的说明书**。

### 0.3 学习路径

```text
第 1 章  心智模型      ← 决定你后面所有操作的理解方式
第 2 章  安装与验证
第 3 章  容器生命周期  ← 80% 的日常操作在这一章
第 4–5 章 数据与网络   ← 出问题时 80% 的原因在这两章
第 6–7 章 Dockerfile 与多阶段构建
第 8 章  Compose
第 9–11 章 瘦身、安全、生产
第 12–13 章 两个完整实战
第 14–16 章 陷阱、练习、速查表
```

每章结尾有练习，答案折叠在 `<details>` 里。**先自己想，再看答案。**

### 0.4 约定

- 命令前的 `$` 表示在宿主机终端执行，`#` 表示在容器内执行。
- 所有路径都是 Linux 风格（容器内部就是 Linux）。
- 示例应用统一用一个小 Node 服务，方便和前面几份手册衔接。

---

## 1. 心智模型：容器到底是什么

### 1.1 容器不是"轻量虚拟机"

很多人第一反应是"容器 = 小虚拟机"。这个类比会让你在排查问题时走错方向。准确的说法是：

> **容器 = 一组被隔离的 Linux 进程。**

隔离靠内核的两个机制：

| 机制 | 作用 | 类比 |
| --- | --- | --- |
| **namespace** | 让进程"看不见"外面的东西（PID、网络、挂载点、主机名、用户） | 给进程戴上一副只能看到自己世界的眼镜 |
| **cgroup** | 限制进程"能用多少"（CPU、内存、IO） | 给进程发一张有额度的饭卡 |

所以容器里的 `ps aux` 只看到自己那几个进程（PID namespace），容器里 `ifconfig` 只看到自己那块网卡（network namespace），而**它们跑的都是宿主机同一个内核**。

这带来三个直接推论：

1. **容器启动是毫秒级**——不需要启动操作系统，只是 `fork` 一个进程。
2. **容器不能装"另一个操作系统"**——`ubuntu:24.04` 镜像里只是 Ubuntu 的用户态文件（`/bin`、`/lib`），内核还是宿主机的。
3. **容器的隔离性弱于虚拟机**——共享内核意味着内核漏洞可能逃逸，所以"跑不可信代码"仍需要虚拟机级别的隔离（gVisor、Firecracker 这类方案是在补这个洞）。

```text
┌─────────────────────── 宿主机（一个内核）───────────────────────┐
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ 容器 A      │  │ 容器 B      │  │ 容器 C      │  ← 各自 namespace│
│  │ nginx      │  │ node       │  │ postgres   │     + cgroup     │
│  └────────────┘  └────────────┘  └────────────┘                │
│  containerd / runc（负责真正创建进程）                            │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 镜像：分层文件系统

镜像由一层层"差异"叠起来，每层只记录相对上一层的改动：

```text
┌─────────────────────────────┐
│ 第 4 层  COPY app.js /app   │  你的代码
├─────────────────────────────┤
│ 第 3 层  npm ci             │  依赖
├─────────────────────────────┤
│ 第 2 层  WORKDIR /app       │  元数据（不占空间）
├─────────────────────────────┤
│ 第 1 层  FROM node:24-alpine│  基础系统
└─────────────────────────────┘
```

两个关键性质：

- **层是只读且共享的**：你起 10 个 `node:24-alpine` 的容器，基础层在磁盘上只有一份。
- **容器启动时在最上面加一个可写层**：容器内所有写操作都在这里，容器删掉这层就没了——这就是"容器里存的数据会丢"的根本原因（第 4 章讲怎么解决）。

```bash
$ docker image history node:24-alpine
IMAGE          CREATED       CREATED BY                                      SIZE
a1b2c3d4e5f6   2 weeks ago   CMD ["node"]                                    0B
<missing>      2 weeks ago   ENTRYPOINT ["docker-entrypoint.sh"]             0B
<missing>      2 weeks ago   RUN /bin/sh -c apk add --no-cache ...           1.2MB
<missing>      2 weeks ago   ADD alpine-minirootfs-3.x.tar.gz /             7.8MB
```

`<missing>` 表示这层来自更早的基础镜像。

### 1.3 容器 = 镜像 + 运行时状态

```bash
$ docker run -d --name web -p 8080:80 nginx
```

这一行背后发生了：

1. 本地找 `nginx:latest`，没有就从 registry 拉。
2. 把镜像的只读层叠起来，再加一个空的可写层。
3. 创建新的 namespace（PID、网络、挂载、UTS…），设置 cgroup 限额。
4. 执行镜像里记录的 `ENTRYPOINT`/`CMD`。
5. 把这个进程的 PID 记录为容器的主进程（PID 1）。

**关键：容器的生命周期绑定它的 PID 1。** 主进程退出（哪怕退出码 0），容器就结束。这就是为什么"后台服务必须前台运行"——如果镜像里写 `CMD service nginx start`（自己 fork 到后台然后退出），容器会立刻停止。

### 1.4 镜像名、标签、摘要

```text
registry.example.com/team/api:1.4.2@sha256:9f8e...
└──────┬──────────┘ └──┬──┘ └─┬─┘ └──────┬──────┘
    仓库地址           仓库名  标签      摘要（不可变）
```

| 部分 | 省略时的默认值 | 说明 |
| --- | --- | --- |
| registry | `docker.io`（Docker Hub） | 公司通常有私有 registry |
| namespace | `library` | `nginx` 实际是 `library/nginx` |
| tag | `latest` | **`latest` 不是"最新版本"，只是默认标签** |
| digest | — | 内容的 sha256，唯一不可变标识 |

```bash
$ docker pull nginx:1.29-alpine
$ docker pull nginx@sha256:xxx        # 用摘要锁定，最可靠
```

> **生产环境永远不要用 `latest`**。它不会自动更新，也不会告诉你现在是哪个版本，回滚时无从下手。用具体版本号，最好再加 digest。

### 1.5 和虚拟机的对照

| 维度 | 容器 | 虚拟机 |
| --- | --- | --- |
| 启动时间 | 毫秒 ~ 秒 | 秒 ~ 分钟 |
| 磁盘占用 | MB 级（共享层） | GB 级（整套系统） |
| 隔离强度 | 进程级（共享内核） | 硬件级 |
| 密度 | 一台机器几十上百个 | 几个到十几个 |
| 迁移 | 镜像推到哪都能跑 | 整机迁移，重 |
| 适合 | 无状态服务、CI、微服务 | 跑不同内核、强隔离、桌面虚拟化 |

### 1.6 和 Kubernetes 的关系

- **Docker 负责"造镜像 + 单机跑容器"**。
- **Kubernetes 负责"多台机器上调度一堆容器"**，它不造镜像（要造也用别的工具），只是消费镜像。

所以顺序是：先把 Docker 用熟（本篇），再考虑编排。绝大多数项目用 Compose 就够，上 k8s 是规模或组织需求驱动的，不是技术先进性的标志。

### 1.7 动手：看见隔离

```bash
$ docker run --rm alpine sh -c 'echo "容器里的主机名: $(hostname)"; ps aux'
容器里的主机名: 3f9a1c2b8d4e
PID   USER     TIME  COMMAND
    1 root      0:00 sh -c echo ...
    7 root      0:00 ps aux

$ hostname            # 宿主机主机名完全不同
my-laptop
$ ps aux | wc -l      # 宿主机上有几百个进程
312
```

容器里只有 2 个进程，且 PID 从 1 开始——这不是裁剪过的系统，而是 namespace 让它看不见别的。

```bash
$ docker run --rm alpine cat /etc/os-release | head -3
NAME="Alpine Linux"
ID=alpine
VERSION_ID=3.22

$ docker run --rm alpine uname -r
6.11.0-19-generic        # 这是宿主机内核！容器里没有自己的内核
```

**`uname -r` 输出宿主机内核版本**，是"容器共享内核"最直接的证据。在 macOS/Windows 上你会看到 Docker Desktop 那个 Linux 虚拟机的内核。

### 1.8 练习

1. 起一个 `alpine` 容器执行 `hostname`，再用 `--hostname mybox` 起一个，对比输出。
2. 起一个容器，在容器里 `adduser` 建个用户，然后删掉容器，再起一个新的看用户还在不在。
3. 解释：为什么 `docker run ubuntu:24.04`（不带命令）会立刻退出？
4. 拉 `nginx` 和 `nginx:alpine` 两个镜像，比较体积，猜差异在哪。

<details>
<summary>参考答案</summary>

1. 默认主机名是容器 ID；`--hostname` 显式指定。
2. 不在。可写层随容器删除而消失（要持久化用第 4 章的数据卷）。
3. 它的 `CMD` 是 `bash`，而 `docker run` 默认不带 TTY 输入，`bash` 从没有输入的 stdin 读到 EOF 就退出；用 `docker run -it ubuntu:24.04` 才能进交互。
4. `nginx:alpine` 小很多（约 50MB vs 190MB），因为基础系统换成 Alpine（musl libc + busybox）。

</details>

---

## 2. 安装与第一印象

### 2.1 选哪种安装方式

| 场景 | 推荐 | 说明 |
| --- | --- | --- |
| macOS | Docker Desktop | 唯一的顺手方案；内含 Linux 虚拟机 |
| Windows 10/11 专业版 | Docker Desktop + WSL2 后端 | 比 Hyper-V 后端快很多 |
| Windows 家庭版 | Docker Desktop + WSL2 后端 | 需要 WSL2，Win10 2004+ |
| Linux 桌面 | Docker Engine（官方源） | 也可以装 Docker Desktop for Linux |
| Linux 服务器 | Docker Engine（官方源） | 不装 Desktop |

> **Windows 用户注意**：一定要选 WSL2 后端（默认就是）。WSL1 后端会带来文件同步慢、端口映射怪等问题。

### 2.2 Linux 服务器上装 Engine

以 Debian/Ubuntu 为例（官方推荐用源，不要用 `apt install docker.io`，那个版本老旧）：

```bash
# 1) 加官方 GPG key 与源
$ sudo install -m 0755 -d /etc/apt/keyrings
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
$ sudo chmod a+r /etc/apt/keyrings/docker.gpg

$ echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 2) 安装
$ sudo apt update
$ sudo apt install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

# 3) 启动并设开机自启
$ sudo systemctl enable --now docker

# 4) 让普通用户也能用 docker（免 sudo）
$ sudo usermod -aG docker $USER
$ newgrp docker          # 或者注销重登
```

验证：

```bash
$ docker version
Client: Docker Engine - Community
 Version:           28.x.x
 ...
Server: Docker Engine - Community
 Engine:
  Version:          28.x.x
```

**只有 `Server` 段有输出，才说明连上了 daemon。** 如果报：

```text
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```

按顺序排查：`systemctl status docker` → `sudo systemctl start docker` → 用户是否在 `docker` 组（`groups`）→ 是否设置了错误的 `DOCKER_HOST`。

### 2.3 国内镜像加速

拉镜像慢或超时，可以配置 registry mirror。Docker Desktop 在设置里的 *Docker Engine* 直接编辑 JSON：

```json
{
  "registry-mirrors": ["https://<你的镜像地址>"],
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "3" }
}
```

Linux 上改 `/etc/docker/daemon.json` 后 `sudo systemctl reload docker`。

> 公益镜像站经常变动、限速甚至关闭，公司环境请用自建 registry（Harbor、registry:2）或云厂商提供的加速地址。**不要在生产环境依赖不明来源的镜像站。**

### 2.4 第一个容器

```bash
$ docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

这一行发生了什么：

1. 本地没有 `hello-world:latest` → 去 registry 拉。
2. 创建容器，执行镜像里的 `/hello`。
3. `/hello` 打印文字后退出（退出码 0）。
4. 容器变成 `Exited (0)` 状态，仍留在 `docker ps -a` 里。

```bash
$ docker ps -a
CONTAINER ID   IMAGE         COMMAND    CREATED         STATUS                     NAMES
3f9a1c2b8d4e   hello-world   "/hello"   2 minutes ago   Exited (0) 2 minutes ago   happy_banana
```

名字 `happy_banana` 是 Docker 随机起的（形容词+科学家名）。用 `--name` 自己指定更省心。

### 2.5 `docker run` 的常用旗标

```bash
$ docker run -d --name web -p 8080:80 -e TZ=Asia/Shanghai \
    -v webdata:/usr/share/nginx/html:ro --restart unless-stopped nginx:1.29-alpine
```

| 旗标 | 作用 | 记忆点 |
| --- | --- | --- |
| `-d` | 后台运行（detach） | 不加就占用当前终端 |
| `-it` | 交互 + 分配 TTY | 进容器 shell 必备 |
| `--rm` | 退出后自动删除容器 | 一次性命令必加 |
| `--name` | 指定容器名 | 名字唯一 |
| `-p 宿主:容器` | 端口映射 | 左边是宿主机的 |
| `-e KEY=VAL` | 环境变量 | 可重复；也可 `--env-file .env` |
| `-v 源:目标` | 挂载 | 卷名或绝对路径（第 4 章） |
| `--restart` | 重启策略 | `no`/`on-failure`/`always`/`unless-stopped` |
| `--network` | 加入网络 | 不指定就在默认 bridge（第 5 章） |
| `--memory` / `--cpus` | 资源限制 | 生产必配 |

> `-p 8080:80` 的意思是"把宿主机的 8080 转发到容器的 80"。**容器内部的端口不会自动暴露到外面**，忘写 `-p` 就会出现"我明明启动了却访问不了"。

### 2.6 端口冲突怎么办

```bash
$ docker run -d -p 8080:80 nginx
docker: Error response from daemon: driver failed programming external
connectivity: Bind for 0.0.0.0:8080 failed: port is already allocated.
```

```bash
# 看谁占了
$ docker ps --format 'table {{.Names}}\t{{.Ports}}'
$ sudo ss -tlnp | grep 8080          # Linux
$ netstat -ano | findstr :8080       # Windows

# 换个宿主端口
$ docker run -d -p 8081:80 nginx
```

在生产编排里（Compose / k8s），一般只给网关容器映射端口，其余容器之间走内部网络，冲突面就小了。

### 2.7 2026 年该知道的四个变化

装在 2024 年左右的教程里学 Docker，会遇到几处已经变了的地方：

| 变化 | 从哪个版本起 | 对写代码的影响 |
| --- | --- | --- |
| **containerd 镜像存储成为全新安装的默认值** | Engine 29.0.0（2025-11-10） | 多平台镜像、`--mount type=image`、部分缓存后端都依赖它；旧安装不会自动切换 |
| **cgroup v1 被标记为弃用**（"support continues until at least May 2029"） | Engine 29.0.0 | 现在仍能用，但新机器建议直接上 cgroup v2 |
| **Compose CLI 跳到 v5** | Compose v5.0.0（2025-12-02） | `version:` 字段已 obsolete；`docker compose start --wait` 等新命令可用 |
| **`docker build` 就是 `docker buildx build`** | Buildx 成为默认 | 多架构、`--cache-to`、`--sbom` 都不需要换命令 |

顺带一个容易踩的细节：containerd 2.1.5 把容器内 `ulimit -n` 从 1048576 降到了 **1024**。跑高并发服务时如果报 "too many open files"，用 `--ulimit nofile=65535:65535` 或 daemon.json 的 `default-ulimits` 显式提高，别以为是代码问题。

### 2.8 练习

1. 用 `hello-world` 起一个容器，之后清理掉它（包括镜像）。
2. 起一个 `nginx`，把宿主机 8888 映射到它，用 `curl` 验证，然后看 `docker logs`。
3. 起一个容器，跑 `sleep 300`，用 `docker exec` 进去查它的环境变量与挂载。
4. 故意不写 `-d`、也不写 `-it` 地跑 `ubuntu`，解释看到的现象。

<details>
<summary>参考答案</summary>

```bash
1. docker run --rm hello-world && docker rmi hello-world
2. docker run -d --name web -p 8888:80 nginx && curl -I localhost:8888
3. docker run -d --name s1 alpine sleep 300
   docker exec -it s1 env; docker exec -it s1 cat /proc/mounts
4. 容器立刻退出（退出码 0），因为 `bash` 读到 stdin EOF。
```

</details>

---

## 3. 容器的生命周期与日常操作

### 3.1 状态机

```text
             docker create
                  │
                  ▼
   ┌──────────► created ──docker start──► running ──docker stop──► exited
   │                                        │  ▲                     │
   │                                        │  └──docker restart─────┘
   │                                        │
   │                                   docker pause
   │                                        ▼
   │                                     paused
   │
   └──────────────── docker rm ◄──（任何非 running 状态）
```

- `docker run` = `create` + `start`（前台的话还加 `attach`）。
- **停掉的容器仍然占磁盘**（可写层、日志），上线久了会有几十上百个 `Exited` 容器。
- `docker rm` 只能删非运行中的；运行中的要先 `stop`，或者 `rm -f`。

### 3.2 查看：`ps`、`inspect`、`stats`

```bash
$ docker ps                       # 运行中
$ docker ps -a                    # 全部（含已退出）
$ docker ps -s                    # 含磁盘占用
$ docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
$ docker ps -q | xargs docker stop      # 停掉所有运行中的
```

```bash
$ docker inspect web
```

输出是一大段 JSON（数组，因为 `inspect` 支持多个对象）。日常更实用的是带 `--format` 的定点查询：

```bash
$ docker inspect -f '{{.State.Status}}' web
running
$ docker inspect -f '{{.NetworkSettings.IPAddress}}' web
172.17.0.2
$ docker inspect -f '{{json .Config.Env}}' web | jq
$ docker inspect -f '{{range .Mounts}}{{.Type}} {{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' web
```

```bash
$ docker stats --no-stream
CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT     MEM %   NET I/O       BLOCK I/O
3f9a1c2b8d4e   web    0.02%   3.4MiB / 15.6GiB       0.02%   1.2kB / 646B  0B / 0B
```

`docker stats` 是排查"容器吃内存/CPU"的第一站。

### 3.3 日志

```bash
$ docker logs web                 # 全部
$ docker logs -f web              # 跟着看（类似 tail -f）
$ docker logs --tail 100 web
$ docker logs --since 10m web
$ docker logs --since 2026-10-27T05:00:00 web
$ docker logs -t web              # 每行带时间戳
```

三个必知事实：

1. **日志在宿主机的 `/var/log/...` 之外**，由 Docker 的日志驱动保存（默认 `json-file`，在 `/var/lib/docker/containers/<id>/<id>-json.log`）。
2. **默认不轮转**，跑几个月的容器日志能有几十 GB，把磁盘撑满。配置见 10.4。
3. **只收集 stdout/stderr**。应用如果把日志写到文件里，`docker logs` 看不到——容器里请一律输出到标准输出。

### 3.4 进容器：`exec` vs `attach`

```bash
$ docker exec -it web sh          # 新开一个进程（推荐）
$ docker exec -it web bash        # 镜像里有 bash 时
$ docker exec web ls /etc/nginx   # 跑一条命令就退出
$ docker attach web               # 接到 PID 1 的 stdin/stdout
```

**用 `exec`，别用 `attach`**：`attach` 接的是主进程，退出时（Ctrl+C）可能把主进程一起干掉。`exec` 是真的开新终端。

进不去时依次检查：

```bash
$ docker exec -it web sh
OCI runtime exec failed: exec failed: unable to start container process:
exec: "sh": executable file not found in $PATH
```

说明镜像里没有 shell（distroless、scratch 镜像就是这样）。这类镜像的调试方式见 9.5。

### 3.5 拷文件：`cp`

```bash
$ docker cp web:/etc/nginx/nginx.conf ./nginx.conf
$ docker cp ./nginx.conf web:/etc/nginx/nginx.conf
$ docker cp web:/var/log ./logs
```

改完配置记得重载：

```bash
$ docker exec web nginx -s reload
```

> `docker cp` 只适合临时取文件。**配置应该通过挂载（第 4 章）或构建进镜像**，否则容器一重建就没了。

### 3.6 撤底清理

```bash
$ docker rm web                   # 删容器
$ docker rm -f web                # 强删（运行中也删）
$ docker rm $(docker ps -aq)      # 删所有容器
$ docker rmi nginx:1.29-alpine    # 删镜像
$ docker image prune              # 删悬空镜像（<none>）
$ docker image prune -a           # 删所有没被容器使用的镜像
$ docker volume prune             # 删未使用的卷（危险！）
$ docker system prune -a --volumes  # 大扫除（更危险）
```

两条铁律：

- `docker system prune --volumes` 会删掉数据库卷。**在生产机器上永远别敲。**
- 磁盘告警时先 `docker system df -v` 看清哪里占的：

```bash
$ docker system df
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          42        7         18.4GB    14.2GB (77%)
Containers      31        3         1.2GB     1.1GB (91%)
Local Volumes   12        4         6.8GB     2.1GB (30%)
Build Cache     210       0         9.4GB     9.4GB
```

### 3.7 前台运行与"退出码"

```bash
$ docker run --rm alpine sh -c 'exit 42'
$ echo $?
42
$ docker ps -a --filter name=... --format '{{.Status}}'
Exited (42) 3 seconds ago
```

退出码会被保留，这在 CI 里很有用。注意：

| 退出码 | 常见含义 |
| --- | --- |
| 0 | 正常结束 |
| 1 | 应用自己报错 |
| 125 | docker 命令本身出错（参数错、daemon 不可用） |
| 126 | 命令找到了但不可执行（权限/格式） |
| 127 | 命令不存在（拼错、PATH 不对） |
| 137 | 被 `SIGKILL` 杀掉（`docker kill`、OOM、`docker stop` 超时） |
| 143 | 被 `SIGTERM` 杀掉（`docker stop` 正常结束） |

**137 是最容易被误判的**：不是"程序崩了"，而是被杀。可能是 OOM（看 `docker inspect -f '{{.State.OOMKilled}}'`），也可能是 `docker stop` 等 10 秒后强杀（应用的优雅关闭处理太慢）。

```bash
$ docker inspect -f '{{.State.OOMKilled}} {{.State.ExitCode}}' web
true 137
```

### 3.8 `restart` 策略与"自愈"

```bash
$ docker run -d --restart unless-stopped nginx
```

| 策略 | 行为 |
| --- | --- |
| `no`（默认） | 不重启 |
| `on-failure[:n]` | 非 0 退出才重启，最多 n 次 |
| `always` | 总是重启（含 daemon 重启后） |
| `unless-stopped` | 同 `always`，但手动 `stop` 后不再拉起 |

**`--restart` 只处理"进程退出"，不处理"进程活着但不健康"。** 后者要靠 healthcheck：

```yaml
# compose 里
healthcheck:
  test: ["CMD", "curl", "-fsS", "http://localhost:8080/health"]
  interval: 10s
  timeout: 3s
  retries: 3
  start_period: 5s
```

```bash
$ docker inspect -f '{{.State.Health.Status}}' web
healthy
```

### 3.9 练习

1. 起三个 `nginx` 容器（名字 web1/web2/web3），分别映射 8081/8082/8083，然后一次性停掉全部并删除。
2. 起一个容器，让它 3 秒后自己退出（退出码 7），用 `docker inspect` 读出退出码。
3. 用 `docker stats` 观察一个 `stress` 容器在 `--memory 128m` 下被 OOM 杀掉的过程（可用 `stress --vm 1 --vm-bytes 200M`）。
4. 找出本机上占用空间最大的 3 个镜像。

<details>
<summary>参考答案</summary>

```bash
1. for i in 1 2 3; do docker run -d --name web$i -p 808$i:80 nginx; done
   docker stop web1 web2 web3 && docker rm web1 web2 web3
2. docker run --name x alpine sh -c 'sleep 3; exit 7'
   docker inspect -f '{{.State.ExitCode}}' x
3. docker run --rm --memory 128m alpine sh -c 'apk add --no-cache stress-ng >/dev/null && stress-ng --vm 1 --vm-bytes 200M --timeout 10s'
   docker inspect -f '{{.State.OOMKilled}}' <id>
4. docker images --format '{{.Size}}\t{{.Repository}}:{{.Tag}}' | sort -hr | head -3
```

</details>

---

## 4. 数据持久化：卷、绑定挂载、tmpfs

### 4.1 为什么必须谈这个

容器的可写层随容器删除而消失。任何"要留下"的东西——数据库文件、上传目录、缓存——都必须放在容器外部。

```bash
$ docker run --rm alpine sh -c 'echo hello > /data.txt'
$ docker run --rm alpine cat /data.txt
cat: can't open '/data.txt': No such file or directory
```

### 4.2 三种挂载方式

| 方式 | 声明 | 数据存在哪 | 适合 |
| --- | --- | --- | --- |
| **卷（volume）** | `-v mydata:/data` | Docker 管理的目录（`/var/lib/docker/volumes/`） | 数据库、需要备份的持久数据 |
| **绑定挂载（bind）** | `-v /host/path:/data` | 你指定的宿主机路径 | 开发时挂源码、挂配置文件 |
| **tmpfs** | `--tmpfs /data` | 内存 | 临时文件、敏感数据不落盘 |

用 `--mount` 语法更明确（推荐在脚本/Compose 里用）：

```bash
$ docker run --mount type=volume,src=mydata,dst=/data nginx
$ docker run --mount type=bind,src=/srv/html,dst=/usr/share/nginx/html,readonly nginx
$ docker run --mount type=tmpfs,dst=/tmp,tmpfs-size=64m nginx
```

`-v` 与 `--mount` 的关键差异：`-v /不存在/的路径:/data` 会**自动创建一个同名目录**（常见 bug 来源）；`--mount` 会直接报错。

### 4.3 卷的完整用法

```bash
$ docker volume create pgdata
$ docker volume ls
$ docker volume inspect pgdata
[
    {
        "Name": "pgdata",
        "Driver": "local",
        "Mountpoint": "/var/lib/docker/volumes/pgdata/_data",
        ...
    }
]
$ docker volume rm pgdata                 # 必须没有容器在用
$ docker volume prune                     # 删所有未使用的（危险）
```

```bash
$ docker run -d --name pg -e POSTGRES_PASSWORD=secret \
    -v pgdata:/var/lib/postgresql/data postgres:17-alpine
```

**匿名卷的坑**：`-v /var/lib/postgresql/data`（只写容器路径）会创建一个随机名字的匿名卷，容器删了卷还在但名字对不上，久了就变成一堆垃圾数据。永远写成 `名字:路径` 或 `绝对路径:路径`。

### 4.4 绑定挂载的坑

```bash
$ docker run -v $(pwd):/app -w /app node:24-alpine node src/main.js
```

在 **macOS / Windows** 上，绑定挂载跨了虚拟机边界，IO 会慢 10~50 倍。`node_modules` 这种几万个小文件的目录尤其明显。

三个应对办法：

1. **把依赖装在卷里**而不是挂进去：

```bash
$ docker run --rm -v "$(pwd)":/app -v /app/node_modules -w /app \
    node:24-alpine sh -c 'npm ci && npm test'
```

`-v /app/node_modules`（只写容器路径）= 匿名卷覆盖该目录，宿主机空目录不会盖住容器内的 `node_modules`。

2. 在 WSL2 的 Linux 文件系统里（`\\wsl$\Ubuntu\home\...`）而不是 `/mnt/c/...`。
3. 开发时用 **named volume 存依赖 + bind 挂源码**；生产不要 bind。

### 4.5 权限问题（Linux 上最常见的"写不进去"）

```bash
$ docker run --rm -v /srv/data:/data alpine touch /data/x
touch: /data/x: Permission denied
```

原因：容器里的进程以某个 UID 运行（如 `node` 镜像的 `node` 用户 UID 1000），而宿主机 `/srv/data` 属于 root（UID 0）。**容器的 root 与宿主机的 root 在同一个 UID 空间**（除非用 rootless / userns-remap）。

四种解法（按推荐度）：

| 方案 | 做法 | 适用 |
| --- | --- | --- |
| 对齐 UID | Dockerfile 里 `USER` 用与宿主同 UID，或 `docker run --user $(id -u):$(id -g)` | 开发环境 |
| 先 chown | `docker run --rm -v /srv/data:/data alpine chown -R 1000:1000 /data` | 一次性修 |
| 用卷而非 bind | `-v pgdata:/var/lib/postgresql/data` | 数据库类 |
| rootless 模式 | daemon 层做 UID 映射 | 安全要求高的环境 |

### 4.6 备份与恢复

卷不是"自动备份"，`/var/lib/docker/volumes/` 直接拷是**不被推荐**的（可能不一致）。标准做法是用一个临时容器打包：

```bash
# 备份
$ docker run --rm -v pgdata:/data -v "$(pwd)":/backup alpine \
    tar czf /backup/pgdata-$(date +%F).tar.gz -C /data .

# 恢复
$ docker run --rm -v pgdata:/data -v "$(pwd)":/backup alpine \
    sh -c 'rm -rf /data/* && tar xzf /backup/pgdata-2026-10-27.tar.gz -C /data'
```

数据库类最好是逻辑备份（`pg_dump`、`mysql_dump`）而不是文件打包——文件打包无法保证事务一致。

```bash
$ docker exec pg pg_dump -U postgres app > backup/app-$(date +%F).sql
```

### 4.7 练习

1. 建一个卷，用两个不同的容器分别写入和读取，验证数据共享。
2. 把宿主机的某个目录绑定到 `nginx` 的 html 目录，放一个 `index.html` 进去，浏览器访问验证。
3. 用 tmpfs 起一个容器，写一个大文件，然后 `df -h` 看它占用的是内存。
4. 备份一个卷到当前目录的 tar.gz，删掉卷，再恢复，验证文件内容。

<details>
<summary>参考答案</summary>

```bash
1. docker volume create v1
   docker run --rm -v v1:/d alpine sh -c 'echo hi > /d/a.txt'
   docker run --rm -v v1:/d alpine cat /d/a.txt
2. docker run -d -p 8080:80 -v "$(pwd)/html":/usr/share/nginx/html:ro nginx
3. docker run --rm --tmpfs /t:size=64m alpine sh -c 'dd if=/dev/zero of=/t/big bs=1M count=32 && df -h /t'
4. 见 4.6 两段命令
```

</details>

---

## 5. 网络

### 5.1 默认的四种网络

```bash
$ docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
a1b2c3d4e5f6   bridge    bridge    local
c7d8e9f0a1b2   host      host      local
3c4d5e6f7a8b   none      null      local
```

| 驱动 | 说明 | 什么时候用 |
| --- | --- | --- |
| `bridge` | 默认。每个容器一块虚拟网卡，通过 NAT 出去 | 单机开发 |
| `host` | 直接用宿主机网络栈，没有隔离 | 性能敏感、端口要占满（Linux 专属） |
| `none` | 只有 loopback | 完全离线的批处理 |
| `overlay` | 跨主机（Swarm） | 集群 |
| `macvlan`/`ipvlan` | 容器拿宿主机网段的 IP | 需要被同网段设备直接访问 |

### 5.2 端口映射的两种写法

```bash
$ docker run -p 8080:80 nginx              # 宿主机所有网卡
$ docker run -p 127.0.0.1:8080:80 nginx    # 只监听本机（更安全）
$ docker run -p 8080:80/udp nginx          # UDP
$ docker run -P nginx                      # 随机映射 EXPOSE 的端口
```

```bash
$ docker port web
80/tcp -> 0.0.0.0:8080
```

> 云服务器上直接 `-p 8080:80` 会把服务暴露到公网（还要看安全组/防火墙）。**只给需要对外的东西映射端口，且尽量绑 `127.0.0.1`，前面放反向代理。**

### 5.3 用户自定义 bridge 与容器间 DNS

默认 `bridge` 网络里的容器**只能靠 IP 互相访问**，IP 还会变。自定义网络则提供内建 DNS：

```bash
$ docker network create appnet
$ docker run -d --network appnet --name db postgres:17-alpine
$ docker run -d --network appnet --name api myapp
$ docker exec api sh -c 'getent hosts db'
172.20.0.2      db
```

于是 `api` 里可以用 `postgres://db:5432/app` 这样的地址连数据库——**服务名就是主机名**。这是 Compose 能工作的基础。

```bash
$ docker network connect appnet web       # 运行中的容器加入网络
$ docker network disconnect appnet web
$ docker network inspect appnet
```

### 5.4 `EXPOSE` 与实际可达性

常见误解：`EXPOSE 8080` 会"开放端口"。**它只是元数据 + 文档**，不会改变可达性。

| 写法 | 效果 |
| --- | --- |
| 容器监听 `0.0.0.0:8080` | 同网络的其他容器可通过 `容器名:8080` 访问 |
| 容器监听 `127.0.0.1:8080` | 其他容器**也访问不到**（只监听了容器内的 loopback） |
| 宿主机 `-p 8080:8080` | 外部可访问 |

**"容器里启动了但外部访问不了"最常见的原因**：应用绑定了 `127.0.0.1`（`localhost`）而不是 `0.0.0.0`。在容器里 `localhost` 只是它自己。

```js
// 错误：只监听容器内 loopback
app.listen(3000, "127.0.0.1");

// 正确：监听所有网卡
app.listen(3000, "0.0.0.0");
```

### 5.5 网络排查四连

```bash
# 1) 容器在哪个网络、IP 是多少
$ docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{$v.IPAddress}}{{"\n"}}{{end}}' api

# 2) 从容器内部测连通性
$ docker exec api sh -c 'ping -c1 db || true'
$ docker exec api sh -c 'nc -zv db 5432 || true'
$ docker exec api sh -c 'wget -qO- http://web/health || true'

# 3) 从宿主机测端口
$ curl -v localhost:8080/health

# 4) 看端口有没有在监听（容器内）
$ docker exec api sh -c 'ss -tlnp || netstat -tlnp'
```

> 很多精简镜像没有 `ping`/`curl`/`ss`。可以临时起一个 `nicolaka/netshoot` 容器加入同一网络来排查：
> ```bash
> $ docker run -it --rm --network appnet nicolaka/netshoot
> ```

### 5.6 与宿主机的三种互通方式

| 方向 | 方式 |
| --- | --- |
| 容器 → 宿主机 | Linux 上 `host.docker.internal` 需要额外参数；更稳的是用 `--network host` 或加 `--add-host=host.docker.internal:host-gateway` |
| 宿主机 → 容器 | `-p` 端口映射 |
| 容器 → 外网 | 默认 NAT 出去即可，无需配置 |

```bash
$ docker run --rm --add-host=host.docker.internal:host-gateway alpine \
    sh -c 'wget -qO- http://host.docker.internal:8080/health || true'
```

Docker Desktop（macOS/Windows）自带 `host.docker.internal`。

### 5.7 练习

1. 创建自定义网络，起两个 `alpine` 容器，用名字互相 `ping`（先 `apk add iputils`）。
2. 起一个 `nginx` 只绑定 `127.0.0.1:8080`，从另一个容器里访问它，观察失败；改成绑定默认再试。
3. 让容器内进程 `curl` 宿主机上跑的一个服务（用 `--add-host` 方案）。
4. 用 `docker network inspect` 找出某个容器所属网络的子网。

<details>
<summary>参考答案</summary>

```bash
1. docker network create n1
   docker run -d --network n1 --name a1 alpine sleep 600
   docker run -d --network n1 --name a2 alpine sleep 600
   docker exec a2 sh -c 'apk add -q iputils && ping -c1 a1'
2. 失败因为 `-p 127.0.0.1:8080:80` 只在宿主机 loopback 上监听，其他容器走网卡 IP 连不到宿主 loopback。
3. docker run --rm --add-host=host.docker.internal:host-gateway curlimages/curl \
     curl -s http://host.docker.internal:8080/health
4. docker network inspect n1 --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

</details>

---

## 6. Dockerfile 入门

### 6.1 一个最小可用示例

```dockerfile
# 用一个带 Node 的基础镜像
FROM node:24-alpine

# 设置工作目录（之后的相对路径都基于它）
WORKDIR /app

# 先只复制依赖清单
COPY package.json package-lock.json ./

# 装依赖（用 ci 保证与 lock 文件一致）
RUN npm ci --omit=dev

# 再复制源码
COPY . .

# 声明监听端口（仅元数据）
EXPOSE 3000

# 以非 root 用户运行（安全）
USER node

# 容器启动命令
CMD ["node", "src/server.js"]
```

```bash
$ docker build -t myapp:0.1 .
$ docker run --rm -p 3000:3000 myapp:0.1
```

### 6.2 指令速查

| 指令 | 作用 | 要点 |
| --- | --- | --- |
| `FROM` | 基础镜像 | 每条 `FROM` 开始一个新阶段（见第 7 章） |
| `WORKDIR` | 设置工作目录 | 目录不存在会自动创建；优先于 `RUN cd` |
| `COPY` | 从构建上下文复制 | 支持 `--chown`；不能用通配父目录 |
| `ADD` | 同 `COPY`，另支持 URL 与自动解压 tar | **一般不用**，行为隐蔽 |
| `RUN` | 构建时执行命令 | 每个 `RUN` 是一层，尽量合并 |
| `ENV` | 环境变量（构建时+运行时） | 会被写进镜像 |
| `ARG` | 构建参数（仅构建时） | `--build-arg` 传入 |
| `EXPOSE` | 声明端口 | 仅元数据 |
| `USER` | 切用户 | 生产必须设 |
| `VOLUME` | 声明匿名卷 | 慎用：会阻止后续 `RUN` 写入该路径 |
| `CMD` | 默认启动命令 | 可被 `docker run` 的参数覆盖 |
| `ENTRYPOINT` | 固定的入口 | `docker run` 的参数会追加到它后面 |
| `HEALTHCHECK` | 健康检查 | 配合 `--restart` 才算"自愈" |
| `SHELL` | 改变 `RUN` 用的 shell | 如 `["/bin/bash", "-c"]` |

### 6.3 `CMD` 与 `ENTRYPOINT` 的组合

这是最容易被问倒的一组。四种组合：

| Dockerfile | `docker run img` | `docker run img foo` |
| --- | --- | --- |
| 无 ENTRYPOINT，`CMD ["a","b"]` | 执行 `a b` | 执行 `foo`（完全覆盖） |
| `ENTRYPOINT ["e"]`，无 CMD | 执行 `e` | 执行 `e foo`（追加） |
| `ENTRYPOINT ["e"]`，`CMD ["c"]` | 执行 `e c` | 执行 `e foo`（覆盖 CMD） |
| `ENTRYPOINT ["e"]` + 用户 `--entrypoint x` | 执行 `x c` | 执行 `x foo` |

**规律**：`ENTRYPOINT` 是"这个镜像是什么"，`CMD` 是"默认参数"。

```dockerfile
ENTRYPOINT ["node", "src/server.js"]
CMD ["--port", "3000"]
```

```bash
$ docker run myapp                    # node src/server.js --port 3000
$ docker run myapp --port 8080        # node src/server.js --port 8080
```

**为什么用数组形式（exec form）**：`CMD node server.js`（shell form）会变成 `/bin/sh -c "node server.js"`，于是容器里的 PID 1 是 `sh` 而不是 node，`SIGTERM` 传不到 node，`docker stop` 只能等超时后强杀（退出码 137）。**这是"容器停不下来、要等 10 秒"的头号原因。**

### 6.4 构建上下文与 `.dockerignore`

```bash
$ docker build -t app .
                       └── 构建上下文：这个目录会被打包发给 daemon
```

**上下文越小越快**。忘了写 `.dockerignore` 会把 `node_modules`、`.git`、`dist` 一起发过去，构建时间从 3 秒变 3 分钟。

```text
# .dockerignore
.git
.gitignore
node_modules
dist
coverage
*.log
.env*
!.env.example
Dockerfile*
docker-compose*.yml
README.md
```

> 上下文里的文件如果被 `COPY` 引用，`--build-arg` 之外**不要**指望"用什么技巧访问父目录"——构建上下文之外的路径无法访问（`COPY ../x` 会报错）。

### 6.5 层缓存：为什么指令顺序这么重要

Docker 逐条执行指令，每条指令的结果是一层。**只要某层的输入（父层 + 指令内容 + 被复制的文件内容摘要）没变，就复用缓存。**

```dockerfile
# 好：依赖很少变，缓存命中率高
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# 坏：改一行代码就要重装依赖
COPY . .
RUN npm ci
```

实测差异（改一行源码后重新构建）：

| 写法 | 构建耗时 |
| --- | --- |
| 先拷清单再装依赖 | 1.2s（只有 `COPY . .` 之后的层重建） |
| 先拷全部再装依赖 | 42s（`COPY . .` 变了，`npm ci` 全部重跑） |

其他缓存要点：

- `RUN apt-get update` 与 `RUN apt-get install` **必须写在同一条 RUN 里**，否则缓存会让 `update` 长期不执行，装到旧包或 404。
- 用 `--no-install-recommends` 减少无用包。
- 装完删缓存 `rm -rf /var/lib/apt/lists/*`（同一条 RUN 内）。
- 构建时用 `--cache-from` / 远程缓存（第 11 章）。
- 想强制不用缓存：`docker build --no-cache`。

### 6.6 `ARG` 与 `ENV` 的区别

```dockerfile
ARG NODE_VERSION=24            # 只能构建时用，不进最终镜像的运行时环境
ENV NODE_ENV=production        # 运行时也有，会出现在 docker inspect
```

```bash
$ docker build --build-arg NODE_VERSION=22 -t app .
```

**不要把密钥写进 `ARG`/`ENV`**：它们会被记录在镜像历史里（`docker history` 可见）。构建期需要密钥用 BuildKit 的 secret 挂载（第 9 章）。

### 6.7 健康检查

```dockerfile
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```

用 `fetch` 而不是 `curl` 可以省掉装 `curl` 的体积（Node 18+ 自带 fetch）。

只有 `HEALTHCHECK` + `--restart` 组合起来才是"进程活着但服务坏了也能自愈"。

### 6.8 练习

1. 写一个 Dockerfile，把第 3 章那个 `sleep` 命令做成镜像，构建并运行。
2. 故意把 `COPY . .` 放在 `RUN npm ci` 前面，改一行源码，计时比较两种顺序的构建时间。
3. 用 `docker history` 查看你自己镜像的每一层大小，找出最肥的一层。
4. 把 `CMD node server.js` 改成 exec form，用 `docker stop` 计时，比较两者的停止耗时。

<details>
<summary>参考答案</summary>

```bash
1. FROM alpine
   CMD ["sleep", "300"]
   docker build -t sleeper . && docker run -d --name s sleeper
2. 见 6.5 的实测表；用 `time docker build -t app .` 对比。
3. docker history myapp:0.1
4. shell form 停 10 秒（超时后 SIGKILL，退出码 137）；exec form 秒退（SIGTERM 直接到 node，退出码 143 或 0）。
```

</details>

---

## 7. 多阶段构建与构建优化

### 7.1 问题：构建工具不该进最终镜像

第 6 章的示例有个隐蔽问题——`npm ci` 装的是开发依赖，但如果项目用 TypeScript，最终镜像里还留着 `typescript`、`eslint`、`vitest` 这些只在构建时需要的东西。一个 300MB 的 `node_modules` 里可能有 250MB 是构建工具。

多阶段构建解决的就是这个：**在"胖"镜像里编译，只把产物拷进"瘦"镜像。**

```dockerfile
# ---------- 阶段 1：构建 ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                       # 含 devDependencies
COPY . .
RUN npm run build                # 产出 dist/

# ---------- 阶段 2：运行 ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev            # 只要生产依赖
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```bash
$ docker build -t myapp:0.2 .
$ docker images myapp
REPOSITORY   TAG   IMAGE ID       CREATED         SIZE
myapp        0.2   a1b2c3d4e5f6   5 seconds ago   148MB
myapp        0.1   9f8e7d6c5b4a   20 minutes ago  612MB
```

**体积差 4 倍**，而且 `docker history` 里再也看不到 `typescript` 这类东西。

### 7.2 命名阶段与"只构建某一阶段"

```dockerfile
FROM node:24-alpine AS deps
...
FROM deps AS build
...
FROM nginx:1.29-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
```

```bash
$ docker build --target build -t myapp:debug .     # 只构建到 build 阶段，便于调试
$ docker build --target prod -t myapp:prod .
```

`--target` 在排查"产物到底生成没有"时非常有用：进 `myapp:debug` 里 `ls /app/dist` 就知道。

### 7.3 前端静态站点：构建 + Nginx

纯静态站点（React/Vue/Astro 产物）根本不需要 Node 运行时：

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

最终镜像约 50MB，且没有 Node。

### 7.4 `scratch` 与 Go/Rust 静态二进制

如果产物是静态链接的单个二进制，可以连基础系统都不要：

```dockerfile
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/app .

FROM scratch
COPY --from=build /out/app /app
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
ENTRYPOINT ["/app"]
```

`scratch` 镜像只有几 MB。代价：没有 shell、没有 `ls`、没有时区库、没有 CA 证书——需要什么从构建阶段拷什么。

### 7.5 构建缓存进阶：`--mount=type=cache`

BuildKit 支持把包管理器的缓存目录挂到构建过程里，跨构建复用但**不进镜像层**：

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
```

```dockerfile
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends curl
```

`sharing=locked` 防止多个并行构建互相踩。

第一次构建后，后续构建即使 `package.json` 变了，`npm` 也不用重新下载所有包。

### 7.6 构建参数与平台

```bash
$ docker build \
    --build-arg NODE_VERSION=24 \
    --platform linux/amd64 \
    --progress=plain \
    -t myapp:0.2 .
```

`--progress=plain` 在 CI 里比默认的 TUI 友好得多（能看清每一步的输出）。

### 7.7 用 `docker init` 生成脚手架

`docker init` **是 Docker Desktop 提供的命令**（官方文档原文就是 "Docker Desktop provides the `docker init` CLI command"），所以只装了 Engine 的服务器上用不了它。它问几个问题，然后生成 `Dockerfile`、`.dockerignore`、`compose.yaml`、`README.Docker.md`：

```bash
$ docker init
? What application platform does your project use? Node
? What version of Node do you want to use? 24
? Which package manager do you want to use? npm
...
CREATED: .dockerignore
CREATED: Dockerfile
CREATED: compose.yaml
CREATED: README.Docker.md
```

生成的模板质量不错，适合当起点，但**默认值不是最优**（比如常漏掉 `USER`），要自己审一遍。

### 7.8 练习

1. 把第 6 章的 Dockerfile 改成多阶段，比较前后体积。
2. 用 `--target` 构建中间阶段，进容器确认 `dist/` 是否存在。
3. 给一个 Go 或 Rust 程序写 `scratch` 镜像，验证它能起来。
4. 给 `npm ci` 加 `--mount=type=cache`，连续构建两次并比较第二次的耗时。

<details>
<summary>参考答案</summary>

1. 见 7.1；用 `docker images` 对比 SIZE，用 `docker history` 确认 devDependencies 不在运行时镜像。
2. `docker build --target build -t app:dbg . && docker run --rm -it app:dbg sh -c 'ls -la dist'`。
3. 关键是 `CGO_ENABLED=0` 与 `-ldflags='-s -w'`；起容器后 `docker logs` 确认监听。
4. 第二次构建应显著更快（`npm ci` 步骤从 ~40s 降到 ~5s）。

</details>

---

## 8. Docker Compose

### 8.1 它解决什么问题

一个真实应用通常有：应用容器、数据库、缓存、反向代理。用 `docker run` 一个个起，参数极长且难以重现。

Compose 用一个 YAML 描述"这一套东西"，一条命令起停。

```bash
$ docker compose up -d
$ docker compose ps
$ docker compose logs -f api
$ docker compose down
```

> 注意命令形式：**`docker compose`（v2，空格）**。老教程里的 `docker-compose`（连字符）是 v1，已停止维护。二者 YAML 也不完全兼容。

### 8.2 一个完整示例

```yaml
# compose.yaml
name: shop

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
      args:
        NODE_VERSION: "24"
    image: shop-api:0.1
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://app:secret@db:5432/app
      REDIS_URL: redis://cache:6379
    env_file:
      - ./api/.env
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 5s

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]

  web:
    image: nginx:1.29-alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      api:
        condition: service_healthy

volumes:
  pgdata:
  uploads:

networks:
  default:
    name: shop-net
```

### 8.3 关键字段

| 字段 | 说明 | 坑 |
| --- | --- | --- |
| `name` | 项目名（默认取目录名） | 影响所有资源名前缀，改名字会创建一整套新资源 |
| `image` + `build` | 同时写时，构建出来的镜像会打上 `image` 这个名字 | 只写 `build` 时镜像名是 `<项目>-<服务>` |
| `depends_on` | 启动顺序 | **默认只等"启动"，不等"就绪"**，必须用 `condition: service_healthy` |
| `environment` | 环境变量 | 可写成 `- KEY=VAL` 或映射两种形式 |
| `env_file` | 从文件读变量 | 文件中不要有 `export`，不要有引号 |
| `ports` | 端口映射 | `"宿主:容器"`，建议加引号（避免 `YAML` 把 `8080:80` 解析成六十进制数字） |
| `volumes` | 挂载 | 短语法 `源:目标`，长语法可加 `read_only` |
| `restart` | 重启策略 | 同 `docker run --restart` |
| `healthcheck` | 健康检查 | `CMD` 是 exec 形式；要用 shell 特性用 `CMD-SHELL` |
| `profiles` | 按需启用的服务 | `docker compose --profile debug up` |
| `deploy.resources` | 资源限制 | `docker compose`（非 Swarm）也支持 `limits` |

### 8.4 `depends_on` 的真相

```yaml
depends_on:
  - db        # 短语法：只保证 db 容器"启动"，不保证数据库能连
```

数据库从"容器起来"到"能接受连接"通常要几秒，这就是经典的 `ECONNREFUSED` 报错来源。正确写法：

```yaml
depends_on:
  db:
    condition: service_healthy
```

并在 `db` 上定义 `healthcheck`。更稳的做法是**应用端也要有重试**——健康检查只解决启动顺序，解决不了运行中数据库重启。

### 8.5 `.env` 与变量替换

Compose 自己会读同目录下的 `.env`（用于 **YAML 内部替换**），这与服务的 `env_file` 是两件事：

```yaml
services:
  api:
    image: shop-api:${TAG:-latest}      # 从 .env 或环境变量取值，:后面是默认值
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
```

```bash
# .env（与 compose.yaml 同目录）
TAG=0.2
DB_PASSWORD=secret
```

```bash
$ docker compose config          # 验证并打印替换后的最终配置
```

**养成习惯：改完 YAML 先 `docker compose config` 看一眼**，能提前发现缩进错、变量没替换、字段拼错。

### 8.6 常用命令

```bash
$ docker compose up -d                    # 起（后台）
$ docker compose up -d --build            # 重新构建镜像
$ docker compose up -d api                # 只起 api 及其依赖
$ docker compose down                     # 停 + 删容器与网络（保留卷）
$ docker compose down -v                  # 连卷一起删（危险）
$ docker compose down --rmi local         # 连镜像一起删
$ docker compose ps
$ docker compose logs -f --tail 100 api
$ docker compose exec api sh
$ docker compose run --rm api npm test    # 一次性任务（不占 running 容器）
$ docker compose restart api
$ docker compose pull && docker compose up -d   # 更新镜像并重建
$ docker compose config --services        # 列出服务名
```

**`docker compose run` 与 `exec` 的区别**：`run` 新起一个容器（会执行 `CMD` 或你指定的命令），`exec` 进已有容器。

### 8.7 开发/生产两套配置

Compose 支持叠加文件：

```bash
$ docker compose -f compose.yaml -f compose.dev.yaml up
```

```yaml
# compose.dev.yaml —— 只写差异
services:
  api:
    build:
      target: build            # 用构建阶段，方便调试
    command: ["npx", "tsx", "watch", "src/server.ts"]
    volumes:
      - ./api/src:/app/src     # 挂源码热更新
      - /app/node_modules      # 用容器内的依赖覆盖宿主空目录
    environment:
      NODE_ENV: development
    ports:
      - "9229:9229"            # 调试端口
```

生产则用 `compose.prod.yaml` 覆盖成不可变配置（不挂源码、`NODE_ENV=production`、加资源限制）。

### 8.8 `docker compose watch`（开发热更新）

新版 Compose 提供 `watch` 子命令，比手写 bind mount 更高效（同步而不是挂载）：

```yaml
services:
  api:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
```

```bash
$ docker compose watch
```

改了 `src/` 自动同步进容器，改了 `package.json` 自动重建镜像。

### 8.9 练习

1. 用 Compose 起 `nginx + redis`，验证 `docker compose exec web sh -c 'nc -zv cache 6379'` 成功。
2. 给一个服务加 healthcheck，故意让它失败，观察 `docker compose ps` 的状态。
3. 用 `depends_on` 短语法起 `api + postgres`，在 api 里立刻连数据库，复现 `ECONNREFUSED`；改用 `service_healthy` 后验证不再报错。
4. 用两个 YAML 叠加实现：默认跑生产配置，`-f compose.dev.yaml` 时挂源码热更新。

<details>
<summary>参考答案</summary>

```bash
1. 服务名即主机名；`nc` 在 alpine 里来自 busybox，可直接用。
2. 状态从 starting → unhealthy；`docker inspect -f '{{.State.Health.Status}}'` 确认。
3. 短语法下 api 启动时 db 还在初始化，连接被拒；加 healthcheck + `condition: service_healthy` 解决。
4. `docker compose -f compose.yaml -f compose.dev.yaml up -d`，后者覆盖 `command`/`volumes`/`environment`。
```

</details>

---

## 9. 镜像瘦身与安全

### 9.1 瘦身：从哪开始

```bash
$ docker images --format '{{.Size}}\t{{.Repository}}:{{.Tag}}' | sort -hr | head -10
$ docker history --no-trunc myapp:0.2
$ dive myapp:0.2        # 第三方工具：逐层浏览，找出无用文件
```

常见瘦身手段，按收益排序：

| 手段 | 典型收益 |
| --- | --- |
| 换 alpine/slim/distroless 基础镜像 | 200MB → 50MB |
| 多阶段构建（7.1） | 去掉构建工具链 |
| `npm ci --omit=dev` / `pip install --no-cache-dir` | 几十 MB |
| 同一条 `RUN` 里清理缓存 | 20~100MB |
| `.dockerignore` 排除测试/文档 | 不定 |
| 静态二进制 + `scratch` | 到几 MB |

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

> 不要用"先装再删"的方式跨 `RUN` 清理：`RUN apt-get install` 和 `RUN rm -rf` 是两层，删掉的文件仍存在于下面那层，镜像一点都不小。

### 9.2 基础镜像怎么选

| 基础镜像 | 体积 | 有 shell | glibc | 适用 |
| --- | --- | --- | --- | --- |
| `alpine` | ~8MB | busybox sh | ❌ musl | 通用，注意 musl 兼容性 |
| `debian:*-slim` | ~80MB | ✅ | ✅ | 需要 glibc 但不要构建工具 |
| `distroless` | ~2–20MB | ❌ | ✅ | 安全优先，调试不便 |
| `scratch` | 0 | ❌ | ❌ | 静态二进制 |

**Alpine 的 musl 坑**：某些原生依赖（旧版 Node 某些包、部分 Python C 扩展、glibc 专用的二进制）在 Alpine 上编不过或运行报 `Error loading shared library`。遇到就换 `-slim` 版本，别硬扛。

### 9.3 非 root 运行

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
CMD ["node", "src/server.js"]
```

**为什么要非 root**：容器默认以 root（UID 0）运行，若发生逃逸或以卷挂载方式访问宿主目录，破坏力是 root 级。

```bash
$ docker run --rm myapp id
uid=1000(node) gid=1000(node) groups=1000(node)
```

自定义用户：

```dockerfile
RUN addgroup -S app && adduser -S -G app app
USER app
```

`-S` 是 Alpine 的"系统用户"参数（Debian 用 `--system`）。注意建用户要在 `COPY` 之后、`USER` 之前，且别忘了 `--chown`。

### 9.4 只读文件系统与能力裁剪

```bash
$ docker run --rm --read-only --tmpfs /tmp -v data:/data myapp
```

| 选项 | 作用 |
| --- | --- |
| `--read-only` | 根文件系统只读，防止运行时篡改镜像内容 |
| `--tmpfs /tmp` | 需要写的临时目录挂内存盘 |
| `--cap-drop ALL --cap-add NET_BIND_SERVICE` | 去掉内核能力 |
| `--security-opt no-new-privileges` | 禁止提权 |
| `--user 1000:1000` | 覆盖镜像里的 USER |
| `--pids-limit 100` | 防 fork 炸弹 |

在 Compose 里：

```yaml
services:
  api:
    read_only: true
    tmpfs: ["/tmp"]
    cap_drop: ["ALL"]
    security_opt: ["no-new-privileges:true"]
    pids_limit: 200
```

### 9.5 构建期密钥：不要 `ARG`

```dockerfile
# ❌ 密钥留在镜像历史里
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && npm ci

# ✅ BuildKit secret 挂载，用完即消失
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

```bash
$ docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .
```

Compose 里：

```yaml
services:
  api:
    build:
      secrets:
        - npmrc
secrets:
  npmrc:
    file: ~/.npmrc
```

### 9.6 扫描漏洞

```bash
$ docker scout cves myapp:0.2          # Docker 官方
$ trivy image myapp:0.2                # 社区常用
$ grype myapp:0.2
```

实践建议：

- 在 CI 里跑，只在"新增高危"时阻塞（否则永远红）。
- **基础镜像的漏洞占绝大多数**，所以定期 `docker pull` 基础镜像并重建，比改代码更有效。
- 用 digest 固定基础镜像（`FROM node:24-alpine@sha256:...`）能避免"昨天还好今天构建出问题"。

### 9.7 安全清单

- [ ] 基础镜像用具体版本 + digest，不用 `latest`
- [ ] 多阶段构建，运行时镜像不含构建工具
- [ ] `USER` 非 root
- [ ] 不把密钥写进 `ARG`/`ENV`/镜像层
- [ ] `.dockerignore` 排除 `.env`、`.git`
- [ ] `--read-only` + `cap_drop: ALL` + `no-new-privileges`
- [ ] 资源限制（内存/CPU/pids）
- [ ] 定期重建 + 漏洞扫描
- [ ] registry 私有且开启认证
- [ ] 镜像签名 / 来源验证（大组织）

### 9.8 练习

1. 把一个 `node:24` 的镜像换成 `node:24-alpine`，比较体积，并检查有没有 musl 相关问题。
2. 用 `docker history` 找出镜像里最大的一层，说明它为什么大。
3. 把镜像改成非 root，用 `id` 与 `whoami` 验证。
4. 用 `--read-only` 跑你的应用，观察哪个路径写入失败，并用 tmpfs 修好。

<details>
<summary>参考答案</summary>

1. 体积约 1/4；若 `npm ci` 里有原生模块，可能出现 `Error loading shared library libc.musl`，换 `-slim`。
2. 通常是 `RUN npm ci` 或 `apt-get install`；用 `dive` 看具体文件。
3. Dockerfile 加 `USER node`（或自定义用户），`docker run --rm img id` 验证。
4. 常见是 `/tmp`、日志目录、缓存目录；`--tmpfs /tmp --tmpfs /app/.cache`。

</details>

---

## 10. 把它稳定地跑在生产上

### 10.1 资源限制

```bash
$ docker run -d --memory 512m --memory-swap 512m --cpus 1.5 \
    --pids-limit 200 --restart unless-stopped myapp
```

| 选项 | 说明 |
| --- | --- |
| `--memory` | 硬上限，超了 OOM kill（退出码 137） |
| `--memory-swap` | 内存+交换总量；等于 `--memory` 表示禁用交换 |
| `--cpus` | CPU 核数（可以是小数） |
| `--cpu-shares` | 相对权重（不是上限） |
| `--pids-limit` | 进程数上限，防 fork 炸弹 |

**不给限制的后果**：一个内存泄漏的容器能把整台机器拖死。**给太紧的后果**：Node/Python 的运行时自身要几百 MB，给 128m 会在启动时就 OOM。

经验起点：Node 应用 `--memory` 设为容器内 `--max-old-space-size` 的 1.5 倍。

```bash
$ docker run --memory 512m myapp node --max-old-space-size=320 dist/server.js
```

### 10.2 日志轮转（必配）

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "3" }
}
```

```bash
$ sudo systemctl reload docker
```

单个容器覆盖：

```bash
$ docker run --log-opt max-size=10m --log-opt max-file=3 myapp
```

**不配的典型事故**：跑了 3 个月的服务，`/var/lib/docker` 涨到 200GB，磁盘满，数据库写不进去。

生产更推荐把日志送到集中系统（stdout → fluent-bit/vector → Loki/ELK），容器本身不落盘。

### 10.3 时区与 locale

容器默认 UTC。国内业务常见需求：

```dockerfile
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && cp /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone
```

Alpine 必须装 `tzdata`，否则 `TZ` 环境变量不生效。

### 10.4 优雅关闭

`docker stop` 会发 `SIGTERM`，等 10 秒（默认）再 `SIGKILL`。应用必须正确处理：

```js
// Node 示例
const server = app.listen(3000, "0.0.0.0");
let closing = false;

async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`收到 ${signal}，开始优雅关闭`);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();   // 兜底
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

```bash
$ docker stop -t 30 web      # 给 30 秒
```

三个要点：

1. **PID 1 必须收到信号**（第 6.3 节的 exec form）。
2. **要在 10 秒内关完**（或调大 `--stop-timeout`）。
3. **`process.exit(0)` 之前要把连接池关掉**，否则数据库侧会堆积连接。

有些框架用 `tini` 做 PID 1 更省心：

```dockerfile
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
```

### 10.5 重启策略 + 健康检查 = 自愈

只有健康检查、没有重启策略，坏了也没人管；只有重启策略、没有健康检查，进程活着但服务挂了也不会被重启。**两者都要。**

```yaml
services:
  api:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s
```

> 注意：**Compose 本身不会因为 unhealthy 而重启容器**。`restart` 只处理进程退出。要让"unhealthy 就重启"，需要外部监控（systemd、watchtower、脚本站点）或上编排系统（k8s 会重启失败的探针容器）。

### 10.6 私有 registry

```bash
$ docker login registry.example.com
$ docker tag myapp:0.2 registry.example.com/team/myapp:0.2
$ docker push registry.example.com/team/myapp:0.2
$ docker pull registry.example.com/team/myapp:0.2
```

自己搭一个最小的：

```bash
$ docker run -d -p 5000:5000 --name registry \
    -v registry-data:/var/lib/registry registry:2
$ docker tag myapp:0.2 localhost:5000/myapp:0.2
$ docker push localhost:5000/myapp:0.2
```

生产要用 Harbor 或云厂商的 registry（带认证、复制、扫描、保留策略）。

### 10.7 用 systemd 管理（不用 Compose 的单容器场景）

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=MyApp
After=docker.service
Requires=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run --rm --name myapp \
  -p 127.0.0.1:3000:3000 \
  --env-file /etc/myapp/env \
  registry.example.com/team/myapp:0.2
ExecStop=/usr/bin/docker stop myapp
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now myapp
$ journalctl -u myapp -f
```

> `docker run` 加 `--rm` 配合 systemd 的 `Restart=always`，能实现"进程退出→systemd 重启→docker 重跑"的循环。更干净的做法是直接跑 `docker compose up` 并让 systemd 管它。

### 10.8 监控要看什么

| 指标 | 来源 |
| --- | --- |
| 容器状态/重启次数 | `docker ps`、`docker events`、cAdvisor |
| CPU/内存/网络 | `docker stats`、cAdvisor + Prometheus |
| 健康状态 | healthcheck 结果、外部探针 |
| 日志错误率 | Loki/ELK 聚合 |
| 磁盘与镜像层 | `docker system df`、node_exporter |

```bash
$ docker events --filter container=myapp        # 实时事件流
$ docker inspect -f '{{.RestartCount}}' myapp   # 重启次数
```

### 10.9 练习

1. 给容器设 `--memory 128m` 并在里面分配 200MB 内存，观察 OOM 与 `ExitCode`。
2. 配好日志轮转（10m × 3），用循环往 stdout 狂写，验证日志文件不会无限增长。
3. 写一个 Node 服务，收到 SIGTERM 时打印并延迟 2 秒退出；用 `docker stop` 验证它走的是优雅路径而不是 137。
4. 用 `docker events` 观察 `docker restart` 时发出的事件。

<details>
<summary>参考答案</summary>

1. `docker run --memory 128m alpine sh -c 'head -c 200M /dev/zero | tail -c 1 >/dev/null'`；`docker inspect -f '{{.State.OOMKilled}}'` 为 true，退出码 137。
2. `docker run --log-opt max-size=10m --log-opt max-file=3 ... sh -c 'while true; do echo x; done'`，然后用 `docker inspect -f '{{.LogPath}}'` 看文件大小。
3. 关键点：exec form CMD + `process.on("SIGTERM")`；`docker stop` 应立即返回而不是等 10 秒。
4. 会看到 `kill`、`die`、`start` 等事件；`docker events --format '{{.Time}} {{.Action}}'`。

</details>

---

## 11. buildx、多架构与供应链

### 11.1 buildx 是什么

`docker buildx` 是 BuildKit 构建器的前端，支持多架构构建、远程缓存、多种输出（本地目录、tar、registry）。

```bash
$ docker buildx ls
NAME/NODE       DRIVER/ENDPOINT   STATUS    BUILDKIT   PLATFORMS
default*        docker            running   v0.x.x     linux/amd64, linux/arm64, ...
```

Docker Desktop 开箱即用；Linux 上需要 `docker-buildx-plugin`（第 2 章已装）。

### 11.2 构建多架构镜像

ARM 服务器（如 AWS Graviton、Apple Silicon 的服务器端）很常见，一个镜像要同时支持 amd64/arm64：

```bash
$ docker buildx create --name multi --use --bootstrap
$ docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t registry.example.com/team/myapp:0.2 \
    --push .
```

注意：**多平台构建不能 `--load` 到本地 docker**（本地镜像库只存单一架构），只能 `--push` 到 registry，或 `--output type=oci,dest=./img.tar`。

```bash
$ docker buildx imagetools inspect registry.example.com/team/myapp:0.2
Manifests:
  Platform: linux/amd64
  Platform: linux/arm64
```

### 11.3 远程缓存（CI 提速关键）

CI 每次都是干净环境，本地层缓存没用。把缓存推到 registry：

```bash
$ docker buildx build \
    --cache-from type=registry,ref=registry.example.com/team/myapp:buildcache \
    --cache-to type=registry,ref=registry.example.com/team/myapp:buildcache,mode=max \
    --push -t registry.example.com/team/myapp:0.2 .
```

`mode=max` 会缓存所有层（包括中间阶段），比默认的 `min` 命中率高得多。

### 11.4 多平台 + 平台相关的条件

```dockerfile
ARG TARGETPLATFORM
ARG TARGETARCH
RUN echo "构建目标: $TARGETPLATFORM / $TARGETARCH"

# 按架构下载不同的二进制
RUN case "$TARGETARCH" in \
      amd64) URL=https://example.com/tool-linux-amd64 ;; \
      arm64) URL=https://example.com/tool-linux-arm64 ;; \
    esac && wget -O /usr/local/bin/tool "$URL" && chmod +x /usr/local/bin/tool
```

可用内置参数：`TARGETPLATFORM`、`TARGETOS`、`TARGETARCH`、`TARGETVARIANT`、`BUILDPLATFORM`。

### 11.5 供应链：SBOM 与证明

新版 buildx 可以在构建时生成 SBOM 与来源证明（provenance）：

```bash
$ docker buildx build \
    --sbom=true \
    --provenance=mode=max \
    -t registry.example.com/team/myapp:0.2 --push .
```

```bash
$ docker buildx imagetools inspect registry.example.com/team/myapp:0.2 \
    --format '{{json .SBOM}}'
```

这些信息让下游能回答"这个镜像里到底有什么、怎么构建出来的"，是供应链安全的基础。大组织还应做镜像签名（cosign / Notation）。

### 11.6 CI 里的最小构建流程

```yaml
# GitHub Actions 片段
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
  with:
    registry: ${{ vars.REGISTRY }}
    username: ${{ secrets.REGISTRY_USER }}
    password: ${{ secrets.REGISTRY_TOKEN }}
- uses: docker/build-push-action@v6
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ vars.REGISTRY }}/team/myapp:${{ github.sha }}
    cache-from: type=registry,ref=${{ vars.REGISTRY }}/team/myapp:buildcache
    cache-to: type=registry,ref=${{ vars.REGISTRY }}/team/myapp:buildcache,mode=max
    sbom: true
    provenance: mode=max
```

要点：

- **用 commit sha 做 tag**，不要用 `latest`；发布时再额外打语义化版本 tag。
- 缓存走 registry，构建时间能从 6 分钟降到 40 秒。
- 构建和推送在同一个 action 里完成（不要 `docker build` 完再 `docker push`，多架构下不成立）。

### 11.7 练习

1. 用 `buildx` 构建 amd64 + arm64 的镜像并推到本地 registry（可只推 amd64 验证流程）。
2. 用 `imagetools inspect` 查看一个多架构镜像的 manifest 列表。
3. 给构建加上 registry 缓存，连续两次 CI 构建比较耗时。
4. 生成 SBOM 并检查里面有没有你意料之外的包。

<details>
<summary>参考答案</summary>

1. `docker buildx build --platform linux/amd64,linux/arm64 -t localhost:5000/x:1 --push .`（本地 registry 需允许 http，或用 `--allow-insecure-entitlement`）。
2. `docker buildx imagetools inspect <ref>`。
3. 第二次应显著更快；注意 `mode=max`。
4. `docker buildx imagetools inspect <ref> --format '{{json .SBOM}}'`，重点看基础镜像引入的包。

</details>

---

## 12. 实战一：把一个 Node 应用完整容器化

这一章从零做一个能跑的小服务，包含健康检查、优雅关闭、非 root、多阶段构建，最后写 Compose。**所有文件都是完整的，可以直接建目录照抄。**

### 12.1 项目骨架

```text
todo-api/
├── package.json
├── package-lock.json
├── tsconfig.json
├── .dockerignore
├── Dockerfile
├── compose.yaml
├── src/
│   ├── server.ts
│   ├── store.ts
│   └── health.ts
└── SQL/            # 首次启动用的建表脚本（挂给 postgres）
    └── init.sql
```

### 12.2 应用代码

`src/store.ts`：

```ts
export type Todo = { id: number; title: string; done: boolean };

const items: Todo[] = [];
let nextId = 1;

export const store = {
  list(): Todo[] {
    return items;
  },
  add(title: string): Todo {
    const todo: Todo = { id: nextId++, title, done: false };
    items.push(todo);
    return todo;
  },
  toggle(id: number): Todo | undefined {
    const t = items.find((x) => x.id === id);
    if (t) t.done = !t.done;
    return t;
  },
};
```

`src/health.ts`：

```ts
export type Health = { status: "ok" | "degraded"; uptime: number };

export function health(): Health {
  return { status: "ok", uptime: Math.round(process.uptime()) };
}
```

`src/server.ts`——重点看**监听地址**与**优雅关闭**：

```ts
import { createServer } from "node:http";
import { store } from "./store.ts";
import { health } from "./health.ts";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";   // 必须 0.0.0.0，否则容器外访问不到

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const send = (code: number, body: unknown) => {
    res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET" && url.pathname === "/health") return send(200, health());
  if (req.method === "GET" && url.pathname === "/todos") return send(200, store.list());

  if (req.method === "POST" && url.pathname === "/todos") {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    if (typeof body.title !== "string" || !body.title.trim()) {
      return send(400, { error: "title required" });
    }
    return send(201, store.add(body.title.trim()));
  }

  const m = url.pathname.match(/^\/todos\/(\d+)\/toggle$/);
  if (req.method === "POST" && m) {
    const t = store.toggle(Number(m[1]));
    return t ? send(200, t) : send(404, { error: "not found" });
  }

  send(404, { error: "no route" });
});

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});

// ---- 优雅关闭：容器收到 SIGTERM 后要能干净退出 ----
let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`收到 ${signal}，停止接收新请求`);
  server.close(() => {
    console.log("已关闭，退出");
    process.exit(0);
  });
  // 兜底：8 秒还没关完就强制退出（docker stop 默认等 10 秒）
  setTimeout(() => {
    console.warn("超时，强制退出");
    process.exit(1);
  }, 8000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

`package.json`：

```json
{
  "name": "todo-api",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "start": "node --experimental-strip-types src/server.ts",
    "build": "tsc -p .",
    "typecheck": "tsc -p . --noEmit"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^7.0.0"
  }
}
```

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["es2023"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

> 这里的 `allowImportingTsExtensions` + `rewriteRelativeImportExtensions` 让"直接 `node src/server.ts`"和"编译后 `node dist/server.js`"两种跑法都能工作（细节见 Node 手册 §17.2）。

`SQL/init.sql`：

```sql
CREATE TABLE IF NOT EXISTS app_meta (
  key   text PRIMARY KEY,
  value text NOT NULL
);
INSERT INTO app_meta (key, value) VALUES ('schema', '1')
  ON CONFLICT (key) DO NOTHING;
```

### 12.3 多阶段 Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ---------- 阶段 1：构建 ----------
FROM node:24-alpine AS build
WORKDIR /app

# 依赖清单单独一层，最大化缓存命中
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 只装生产依赖，得到一份瘦 node_modules
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---------- 阶段 2：运行 ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# 用非 root 用户（node 镜像自带 uid 1000 的 node 用户）
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["node", "dist/server.js"]
```

**几处值得注意的设计**：

| 选择 | 原因 |
| --- | --- |
| 两段都 `npm ci` | 构建段要 devDeps（tsc），运行段只要生产依赖 |
| `--mount=type=cache,target=/root/.npm` | 二次构建不用重新下载包 |
| `COPY package.json` 分开 | 只改源码时依赖层不失效 |
| `ENTRYPOINT` exec form | `SIGTERM` 能直达 node，优雅关闭才有效 |
| `--chown=node:node` | 否则 `USER node` 后读不到文件 |
| `HEALTHCHECK` 用 Node 内置 fetch | 不用额外装 curl（省 10MB） |

`.dockerignore`：

```text
node_modules
dist
.git
.gitignore
*.log
.env*
!.env.example
Dockerfile
compose*.yaml
README.md
coverage
```

### 12.4 构建与本地验证

```bash
$ docker build -t todo-api:0.1 .
$ docker images todo-api
REPOSITORY   TAG   IMAGE ID       SIZE
todo-api     0.1   9f8e7d6c5b4a   62MB

$ docker run -d --name api -p 3000:3000 todo-api:0.1
$ docker logs api
listening on http://0.0.0.0:3000

$ curl -s localhost:3000/health
{"status":"ok","uptime":3}

$ curl -s -X POST localhost:3000/todos -H 'content-type: application/json' -d '{"title":"写手册"}'
{"id":1,"title":"写手册","done":false}
```

验证健康检查与优雅关闭：

```bash
$ docker inspect -f '{{.State.Health.Status}}' api
healthy

$ time docker stop api
api
# 应该在 0.x 秒内返回，日志里能看到"收到 SIGTERM"
```

如果 `docker stop` 卡了 10 秒才返回，说明 PID 1 没收到信号——回去检查是否用了 shell form。

### 12.5 为什么这个镜像 62MB，而不是 300MB

```bash
$ docker history todo-api:0.1
IMAGE   CREATED BY                                     SIZE
xxx     ENTRYPOINT ["node" "dist/server.js"]           0B
xxx     HEALTHCHECK &{...}                            0B
xxx     EXPOSE map[3000/tcp:{}]                        0B
xxx     COPY ./dist ./dist # build                     44kB
xxx     COPY ./node_modules ./node_modules # build     12.1MB
xxx     ENV NODE_ENV=production                        0B
xxx     WORKDIR /app                                   8B
<missing>  CMD ["node"]                                 0B
<missing>  ENV NODE_VERSION=24.x                       0B
<missing>  RUN /bin/sh -c apk add ...                  0B
<missing>  ADD alpine-minirootfs-3.x.tar.gz /          7.8MB
```

基础镜像约 50MB（Node 二进制 + Alpine），你的代码与依赖 12MB。**这就是为什么"选对基础镜像"是最大的瘦身手段。**

### 12.6 练习

1. 把 `HOST` 改成 `127.0.0.1` 重新构建运行，从宿主机 `curl` 看会怎样，解释原因。
2. 把 `ENTRYPOINT` 改成 shell form（`ENTRYPOINT node dist/server.js`），用 `time docker stop` 对比耗时。
3. 让 `/health` 在某个条件下返回 503，观察 `docker inspect` 的 Health 状态变化。
4. 用 `docker run --read-only --tmpfs /tmp` 跑这个镜像，看是否还工作。

<details>
<summary>参考答案</summary>

1. `curl localhost:3000` 会连接被拒（即使 `-p 3000:3000` 已映射），因为端口映射转发到容器 IP，而进程只监听容器内的 loopback。
2. shell form 下 PID 1 是 `/bin/sh`，SIGTERM 不转发，`docker stop` 要等 10 秒后 SIGKILL（退出码 137）。
3. 例如读一个环境变量 `FAIL_HEALTH=1` 时返回 503，健康检查连续失败 3 次后状态变 `unhealthy`。
4. 能跑；`--read-only` 只是禁止写根文件系统，这个应用不写盘。

</details>

---

## 13. 实战二：一套 Compose 环境（Nginx + API + Postgres + Redis）

### 13.1 目录结构

```text
shop/
├── compose.yaml
├── .env
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── src/server.js
├── nginx/
│   ├── default.conf
│   └── certs/           # 本地自签证书（可选）
└── SQL/
    └── init.sql
```

### 13.2 Nginx 配置（作为网关）

`nginx/default.conf`：

```nginx
upstream api_upstream {
    server api:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 5m;

    location = /healthz {
        access_log off;
        return 200 "ok\n";
    }

    location /api/ {
        proxy_pass http://api_upstream/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 3s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

> `proxy_pass` 末尾有没有 `/` 差别很大：`http://api_upstream/` 会**丢掉** `/api/` 前缀，`http://api_upstream` 会保留。这两个写法的实际效果见 Nginx 手册第 4 章。

### 13.3 完整的 `compose.yaml`

```yaml
name: shop

services:
  web:
    image: nginx:1.29-alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./static:/usr/share/nginx/html:ro
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1/healthz || exit 1"]
      interval: 15s
      timeout: 3s
      retries: 3

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    image: shop-api:0.1
    environment:
      NODE_ENV: production
      PORT: "3000"
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
      REDIS_URL: redis://cache:6379
    env_file:
      - ./api/.env
    expose:
      - "3000"
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 512m
          cpus: "1.0"

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./SQL/init.sql:/docker-entrypoint-initdb.d/10-init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

`.env`（与 compose.yaml 同目录，**不要提交**）：

```text
DB_PASSWORD=change-me-please
```

### 13.4 逐层验证

```bash
$ docker compose config --quiet && echo "YAML OK"
YAML OK

$ docker compose up -d --build
[+] Building ...
[+] Running 5/5
 ✔ Network shop-net     Created
 ✔ Container shop-db    Healthy
 ✔ Container shop-cache Started
 ✔ Container shop-api   Started
 ✔ Container shop-web   Started

$ docker compose ps
NAME         IMAGE               STATUS                    PORTS
shop-api     shop-api:0.1        Up (healthy)              3000/tcp
shop-cache   redis:7-alpine      Up (healthy)              6379/tcp
shop-db      postgres:17-alpine  Up (healthy)              5432/tcp
shop-web     nginx:1.29-alpine   Up (healthy)              0.0.0.0:8080->80/tcp
```

```bash
# 1) 网关通
$ curl -s localhost:8080/healthz
ok

# 2) 经网关到 API（注意 /api/ 前缀被剥掉）
$ curl -s localhost:8080/api/health
{"status":"ok","uptime":5}

# 3) 从 api 容器连 db
$ docker compose exec api node -e "console.log(process.env.DATABASE_URL)"
postgres://app:change-me-please@db:5432/app

# 4) 从 api 容器连 redis
$ docker compose exec cache redis-cli ping
PONG

# 5) 数据库真的初始化了
$ docker compose exec db psql -U app -d app -c "select * from app_meta;"
 key    | value
--------+-------
 schema | 1
```

### 13.5 常见故障与排查

| 现象 | 最可能的原因 | 排查 |
| --- | --- | --- |
| `web` 502 | api 没起来或在 restart 循环 | `docker compose logs api` |
| `web` 502 但 api 是 healthy | `proxy_pass` 路径写错 | 检查末尾斜杠 |
| api 报 `ECONNREFUSED db:5432` | 没有 `service_healthy` 条件 | 加 healthcheck |
| api 启动即退出 | 环境变量缺失 | `docker compose logs api` 看第一条错误 |
| `db` 一直 unhealthy | 密码/用户不匹配 | `docker compose logs db` |
| 改了 `init.sql` 不生效 | 初始化只在空数据卷时执行 | `docker compose down -v` 再起 |

**"改了数据库初始化脚本不生效"是最高频的坑**：`docker-entrypoint-initdb.d` 只在数据目录为空时执行。要么删卷重来，要么手动 `psql -f`。

### 13.6 上线前的检查清单

- [ ] `docker compose config` 通过，没有 `WARN`
- [ ] 所有服务有 `healthcheck`，依赖用 `service_healthy`
- [ ] 端口只映射到需要对外的那一个，且尽量绑 `127.0.0.1`（前面再放一层）
- [ ] 数据落在命名卷里，卷有备份策略
- [ ] `restart: unless-stopped` 全覆盖
- [ ] 资源限制（`deploy.resources.limits`）
- [ ] 日志有轮转（daemon 级或 `logging` 选项）
- [ ] 镜像 tag 是具体版本，不是 `latest`
- [ ] `.env`、证书不在仓库里
- [ ] `docker compose down && up` 能完整复原

### 13.7 练习

1. 把 `web` 服务的 `depends_on` 从 `service_healthy` 改成短语法，重启整套，观察 502 是否出现。
2. 给 `api` 加一个 `read_only: true` + `tmpfs: ["/tmp"]`，验证还能工作。
3. 用 `docker compose --profile` 加一个只在调试时启用的 `adminer`（数据库 Web 客户端）服务。
4. 把 `db` 的密码改成从不写进 compose 文件的 `secret`。

<details>
<summary>参考答案</summary>

1. 大概率出现：nginx 启动时 api 可能还没就绪，`proxy_pass` 解析失败 → 502；健康检查条件下 nginx 会等 api healthy。
2. 该应用不写盘，能工作；如果它写日志到文件就会失败。
3. `profiles: ["debug"]` 只在 `--profile debug up` 时启动。
4. 用 `secrets:` + `POSTGRES_PASSWORD_FILE=/run/secrets/db_password`（postgres 官方镜像支持从文件读密码）。

</details>

---

## 14. 陷阱与反模式清单

### 14.1 高频错误（按踩坑率排序）

| # | 错误 | 后果 | 正确做法 |
| --- | --- | --- | --- |
| 1 | 数据没挂卷 | 容器重建数据全丢 | 命名卷 + 备份 |
| 2 | `CMD` 用 shell form | `docker stop` 等 10 秒、退出码 137 | exec form `["node","x.js"]` |
| 3 | 应用监听 `127.0.0.1` | 外部访问不了 | 监听 `0.0.0.0` |
| 4 | 忘写 `.dockerignore` | 构建巨慢、镜像巨大 | 排除 `node_modules`/`.git` |
| 5 | `COPY . .` 在 `RUN npm ci` 之前 | 改一行代码就重装依赖 | 先拷清单再装 |
| 6 | 用 `latest` 标签 | 无法复现、回滚困难 | 具体版本 + digest |
| 7 | `depends_on` 短语法 | 启动竞态、`ECONNREFUSED` | `service_healthy` |
| 8 | 密钥写进 `ARG`/`ENV` | `docker history` 里能看到 | BuildKit secret |
| 9 | 日志不轮转 | 磁盘被写满 | `log-opts max-size` |
| 10 | 容器里以 root 跑 | 逃逸即 root | `USER` 非 root |
| 11 | `npm ci` 不带 `--omit=dev` | 镜像多几百 MB | 多阶段 + `--omit=dev` |
| 12 | `docker system prune -a --volumes` | 数据库卷被删 | 生产禁用 |
| 13 | 绑定挂载 `node_modules` | 宿主空目录盖住容器依赖 | `-v /app/node_modules` 匿名卷 |
| 14 | 所有服务都映射端口 | 端口冲突、暴露面大 | 只映网关，内部走网络 |
| 15 | 在镜像里 `apt upgrade` | 构建不可复现 | 只在需要时精确安装 |

### 14.2 概念性误解

| 误解 | 事实 |
| --- | --- |
| "容器是轻量虚拟机" | 是一组被隔离的进程，共享宿主机内核 |
| "`EXPOSE` 会开放端口" | 只是元数据，必须 `-p` 才映射 |
| "镜像层可写" | 层是只读的；运行时写的是容器顶部的可写层 |
| "`docker ps` 显示的就是全部容器" | 只是运行中的，`-a` 才是全部 |
| "`docker stop` 立刻杀掉进程" | 先 SIGTERM，10 秒后 SIGKILL |
| "容器重启数据还在" | 只有卷里的还在，可写层随容器删除 |
| "`docker compose down` 会删数据" | 默认保留卷，`-v` 才删 |
| "`latest` 会自动更新" | 不会，除非你 `pull` |
| "镜像里删了文件，体积就小了" | 跨 `RUN` 删除只是在上层记录"删了"，下层数据还在 |
| "`--restart always` 能处理服务假死" | 只处理进程退出，假死要靠健康检查 + 外部重启 |

### 14.3 反模式

1. **把容器当虚拟机用**：在里面装 sshd、vim、systemd、cron。容器一个进程一个职责。
2. **一个镜像做所有事**：既是 web 又是 worker，扩缩容时分不开。
3. **提交 `docker-compose.override.yml` 里的个人配置**。
4. **在 Dockerfile 里 `git clone` 私有仓库**（需要凭据，凭据会泄漏）。用 `ADD` 拉 tar 或 CI 里先 checkout 再 `COPY`。
5. **`docker exec` 进去改配置**（重启即失效）。改 Dockerfile 或挂载。
6. **`--privileged`**：等于放弃隔离，几乎总有更窄的选项（`--cap-add`、`--device`）。
7. **镜像里含构建工具链**：在 CI 里够用，在服务器上是多余攻击面。
8. **用 `volume` 当"备份"**：卷和容器在同一块盘上，盘坏了都没了。

---

## 15. 练习总集（含答案）

### 15.1 基础（1–8）

1. 用一条命令列出所有已退出容器的 ID，并全部删除。
2. 起一个 `nginx`，改掉默认首页内容，不重建镜像。
3. 把一个容器里的 `/etc/hosts` 拷到本地查看。
4. 查看某容器的内存占用与限制值。
5. 让容器在退出后自动删除，且宿主机端口 8080。
6. 用一个命令查看镜像的每一层大小。
7. 把本地的 `dist/` 目录挂到 nginx 的 html 目录，只读。
8. 查看某个容器的重启次数。

<details>
<summary>参考答案</summary>

```bash
1. docker ps -aq --filter status=exited | xargs docker rm
2. docker exec -it web sh -c 'echo hi > /usr/share/nginx/html/index.html'
3. docker cp web:/etc/hosts ./hosts
4. docker stats --no-stream web
5. docker run -d --rm -p 8080:80 nginx      # 注意：-d 与 --rm 组合在退出时才删
6. docker history myimg:tag
7. docker run -d -p 8080:80 -v "$(pwd)/dist":/usr/share/nginx/html:ro nginx
8. docker inspect -f '{{.RestartCount}}' web
```

</details>

### 15.2 中级（9–16）

9. 写一个 Dockerfile，把 Python 应用打包，用 `python:3.12-slim` 做多阶段（构建 wheel，运行装 wheel）。
10. 让容器只能用 0.5 核 CPU、256MB 内存，超出被 OOM。
11. 用自定义 bridge 网络让两个容器用名字互通，并验证 `getent hosts`。
12. 给一个服务加 `HEALTHCHECK`，故意让它失败，观察状态变化。
13. 把日志限制为 10MB × 3 个文件，并验证。
14. 用 `buildx` 构建多架构镜像（只需验证 manifest 生成）。
15. 用 BuildKit secret 在构建时注入一个 token，并验证 `docker history` 里看不到。
16. 用 `docker compose` 起一套 nginx + api，验证从 nginx 到 api 的代理。

<details>
<summary>参考答案</summary>

```bash
9. FROM python:3.12-slim AS build
   WORKDIR /app
   COPY requirements.txt .
   RUN pip wheel --no-cache-dir -r requirements.txt -w /wheels
   FROM python:3.12-slim
   WORKDIR /app
   COPY --from=build /wheels /wheels
   RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*.whl && rm -rf /wheels
   COPY . .
   CMD ["python", "-m", "app"]
10. docker run --cpus 0.5 --memory 256m ...
11. docker network create n1; docker run -d --network n1 --name a ...; docker exec b getent hosts a
12. healthcheck test 设为 `exit 1`；等 interval*retries 后 `docker inspect -f '{{.State.Health.Status}}'` 变 unhealthy
13. docker run --log-opt max-size=10m --log-opt max-file=3 ...
14. docker buildx create --use && docker buildx build --platform linux/amd64,linux/arm64 -t x:1 --push .
15. RUN --mount=type=secret,id=tok ... ; docker build --secret id=tok,src=./tok.txt . ; docker history 里查不到
16. 见第 13 章 compose.yaml
```

</details>

### 15.3 高级（17–22）

17. 把一个 1GB 的基础镜像换掉，使最终镜像降到 100MB 以内，说明每一步的收益。
18. 用 `--read-only` + `cap_drop ALL` + `pids_limit` 加固一个服务，逐条验证限制生效。
19. 写一个 systemd unit，让单容器应用开机自启、崩溃自愈。
20. 用 `docker events` 观察 `docker stop` 的完整事件序列。
21. 在 CI 里实现"构建 → 扫描 → 推私有 registry → 打语义化标签"的流程（可用脚本模拟）。
22. 设计一个多容器环境，要求"数据库损坏时 api 不会崩"，说明你的重试/降级策略。

<details>
<summary>参考答案</summary>

```bash
17. 关键顺序：多阶段 → 去 devDeps → alpine → 同层清理缓存 → digest 固定；用 docker history + dive 验证。
18. --read-only 会让写盘失败（需 tmpfs）；cap_drop ALL 后需要 bind 80 端口要 cap_add NET_BIND_SERVICE；pids_limit 可用 fork 炸弹脚本验证。
19. 见 10.7 的 unit 文件；关键 Restart=always + ExecStop=docker stop + After=docker.service。
20. `docker events --filter container=web --format '{{.Action}}'` → kill, die, stop。
21. 见 11.6 的 GitHub Actions 片段 + 9.6 的扫描工具。
22. 要点：连接池失败要重试（指数退避）、健康检查要区分"依赖不可用"与"自身不可用"（前者应返回 degraded 而不是 crash）、启动时不强依赖数据库可用。
```

</details>

---

## 16. 速查表与学习路径

### 16.1 容器

```bash
docker run -d --name c -p 8080:80 -v v:/data -e K=V img   # 起
docker ps -a                        # 列出全部
docker logs -f --tail 100 c         # 日志
docker exec -it c sh                # 进容器
docker inspect -f '{{.State.Status}}' c
docker stats --no-stream c
docker stop c && docker start c
docker restart c
docker rm -f c
docker cp c:/etc/x ./x
docker top c                        # 容器内进程
docker diff c                       # 可写层改了哪些文件
docker events --filter container=c
```

### 16.2 镜像

```bash
docker build -t img:tag .
docker build --target build -t img:dbg .
docker build --no-cache -t img:tag .
docker pull img:tag
docker push img:tag
docker tag img:tag registry/img:tag
docker images
docker history img:tag
docker rmi img:tag
docker image prune -a
docker save img:tag -o img.tar
docker load -i img.tar
docker buildx build --platform linux/amd64,linux/arm64 --push -t img:tag .
```

### 16.3 卷与网络

```bash
docker volume create v && docker volume ls && docker volume inspect v
docker volume rm v && docker volume prune
docker network create n
docker network ls
docker network inspect n
docker network connect n c
docker network disconnect n c
docker run --network n --name a alpine ping a2
```

### 16.4 Compose

```bash
docker compose up -d [--build] [service]
docker compose ps
docker compose logs -f --tail 100 [service]
docker compose exec service sh
docker compose run --rm service cmd
docker compose restart service
docker compose stop / start
docker compose down [-v] [--rmi local]
docker compose config [--quiet]
docker compose pull
docker compose watch
docker compose --profile debug up
```

### 16.5 清理与磁盘

```bash
docker system df [-v]
docker system prune
docker system prune -a --volumes          # 危险
docker builder prune
docker image prune -a
docker container prune
docker volume prune
```

### 16.6 Dockerfile 指令速记

```dockerfile
FROM img:tag AS stage     # 阶段起点
WORKDIR /app              # 工作目录
COPY --chown=u:g src dst  # 复制（能不用 ADD 就不用）
RUN --mount=type=cache,target=/root/.npm npm ci
RUN --mount=type=secret,id=token some-command
ENV K=V                   # 构建+运行时
ARG K=V                   # 仅构建时
EXPOSE 3000               # 元数据
USER app                  # 非 root
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD node healthcheck.js
ENTRYPOINT ["node", "dist/server.js"]   # exec form！
CMD ["--port", "3000"]                  # 默认参数
```

### 16.7 排错决策表

| 症状 | 先看什么 |
| --- | --- |
| 容器起不来（Exited 1） | `docker logs` 第一条错误 |
| 容器 137 | `docker inspect -f '{{.State.OOMKilled}}'`、内存限制、`docker stop` 超时 |
| 端口访问不到 | 有没有 `-p`；应用是否监听 `0.0.0.0`；防火墙/安全组 |
| 容器间连不上 | 同一网络？用名字？端口对吗？ |
| 写文件失败 | 挂载路径权限、UID 是否一致、是否 `--read-only` |
| 镜像太大 | `docker history`、`dive`、是否多阶段 |
| 构建太慢 | `.dockerignore`、层顺序、`--mount=type=cache`、远程缓存 |
| 磁盘满 | `docker system df -v`、日志是否轮转 |
| 改了配置不生效 | 是否在容器里改的（重启即失效）、是否用了缓存层 |

### 16.8 与其他技术的对照

| 概念 | Docker | 虚拟机 | Python venv | Node nvm |
| --- | --- | --- | --- | --- |
| 隔离级别 | 进程 | 硬件 | 无 | 无 |
| 打包单位 | 镜像 | 磁盘镜像 | 目录 | 目录 |
| 复现性 | 高（镜像即环境） | 高 | 中（依赖版本） | 中（node 版本） |
| 启动开销 | 毫秒 | 秒~分钟 | 0 | 0 |
| 交付物 | registry 里的 tag | 镜像文件 | requirements/lock | .nvmrc |

### 16.9 六周学习路径

| 周 | 内容 | 验收 |
| --- | --- | --- |
| 1 | 第 1–3 章 | 能解释容器与进程的关系，熟练做 run/ps/logs/exec |
| 2 | 第 4–5 章 | 能给数据库配卷、能排查容器间不通 |
| 3 | 第 6–7 章 | 能写多阶段 Dockerfile，把镜像压到 100MB 内 |
| 4 | 第 8 章 | 能用 Compose 起一套带健康检查的环境 |
| 5 | 第 9–11 章 | 能加固、能配日志轮转、能构建多架构 |
| 6 | 第 12–15 章 | 完成两个实战 + 22 道练习 |

### 16.10 资源

| 类型 | 推荐 |
| --- | --- |
| 官方文档 | [docs.docker.com](https://docs.docker.com/)（Dockerfile 参考与 Compose 规范必读） |
| 镜像分析 | [dive](https://github.com/wagoodman/dive) |
| 漏洞扫描 | [trivy](https://github.com/aquasecurity/trivy)、`docker scout` |
| 镜像仓库 | [Harbor](https://goharbor.io/) |
| 最小镜像 | [distroless](https://github.com/GoogleContainerTools/distroless)、`scratch` |
| 编排进阶 | Kubernetes 官方教程（先别急） |

### 16.11 三句话总结

1. **容器是被 namespace/cgroup 隔离的普通进程**，镜像只是它的只读文件系统。
2. **一切状态都在容器之外**：数据进卷、配置进环境变量/挂载、日志进 stdout。
3. **要稳定就三件事**：exec form + 健康检查 + 资源限制；要快就三件事：多阶段 + 缓存挂载 + `.dockerignore`。
