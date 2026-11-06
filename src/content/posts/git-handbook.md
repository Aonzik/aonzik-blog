---
title: Git 学习手册（理论与实战）
description: git 学习手册，带你系统学习版本控制。
date: 2026-11-01
category: 技术
tags:
  - AIGC
  - 技术
  - 笔记
readingTime: 145
---

面向"会写代码、用文件夹和 `cp` 备份过项目，但从没系统学过版本控制"的读者。

基线：**Git 2.56**（2026-09-28 发布的稳定版；本机实测用的是 2.51.2，这些日常命令在两者上完全一致），命令在 Windows / Linux / macOS 上通用；平台差异单列。

## 0. 怎么用这本书

### 0.1 这本书解决什么问题

Git 的难，不在于命令多，而在于**它背后有一张你没见过的图**。绝大多数"Git 好可怕"的体验都来自同一个原因：你在用文件系统的直觉操作一个内容寻址的数据库。

所以本书的顺序是：

```text
先建模型（第 1 章）→ 再配环境（第 2 章）→ 常规操作（第 3 章）
   → 改历史（第 4 章）→ 分支与合并（第 5 章）→ 撤销与救援（第 6 章）
   → 协作（第 7～10 章）→ 大规模与自动化（第 11～12 章）
   → 实战（第 13 章）→ 陷阱、练习、速查（第 14～16 章）
```

第 1 章的模型如果没吃透，后面的命令就只能靠背；反过来，一旦你理解了"提交是一张图上的节点，分支只是一个指针"，剩下 90% 的命令都能自己推出来。

### 0.2 你应该已经会什么

- 会用命令行：`cd`、`ls`、`mkdir`、`cat`，知道什么是当前目录。
- 会写代码，用某种编辑器（VS Code / Vim / JetBrains 都行）。
- 知道"文件有内容、有路径"就够了。**不需要**任何版本控制经验。

如果你用过 SVN 或 CVS：本书会在关键处标注"和 SVN 不同在哪"，但请不要把 SVN 的心智模型带过来——那是 Git 学习中最常见的阻力。

### 0.3 约定

- 命令前没有前缀的是普通命令；`$` 表示 shell 提示符（不输入）。
- 尖括号 `<like-this>` 是占位符，替换成你自己的值。
- 所有命令都在 Git 2.51.2 上实测过（2026-10，Windows 11 + Git Bash / PowerShell 7）；版本相关的新特性会单独标注支持版本。
- "工作区 / 暂存区 / 版本库"是本机三个概念，第 1.4 节细讲。

### 0.4 学完能做到什么

- 一个人从零建仓库、写提交、开分支、合并、打标签、推到远端。
- 团队协作中不再需要"删了重新 clone"这种暴力手段。
- 能读懂 `git status` / `git log --graph` 输出的每一行，遇到冲突、丢提交、误 reset 都能自己救回来。
- 知道什么操作**绝对不能**对已推送的历史做，以及为什么。

---

## 1. 先把心智模型装对

### 1.1 Git 存的是快照，不是差异

这是 Git 与 SVN、与"用 `cp` 建 `项目-备份-最终版`"最根本的区别。

先看 `cp` 备份的问题：

```text
项目/
项目-备份/
项目-备份-最终/
项目-备份-最终-真的最终/
项目-备份-最终-真的最终-改完这个就不改了/
```

你不知道每个目录之间**改了什么、为什么改**，也没法把"只改了一个函数"这件事和"改了 300 个文件"分开。

SVN 的做法是存**差异**（delta）：每次提交只记录"第 3 行改成 X、第 8 行删掉"。

Git 的做法是存**快照**（snapshot）：每次提交记录"这一刻整个项目长什么样"。

```text
提交 A          提交 B               提交 C
 file1: v1       file1: v1             file1: v2   ← 只这个变了
 file2: v1       file2: v2             file2: v2
 file3: v1       file3: v1             file3: v1
```

看起来"每次存全量"很浪费，但 Git 用了两个技巧把它变得很便宜：

1. **内容寻址**：文件内容一旦算成哈希，相同内容只存一份。`file1` 在提交 B 里没变，B 就直接引用 A 的那份数据。
2. **打包**：松散对象积累到一定数量后，Git 会把相似内容做增量压缩（`.git/objects/pack`）。

结果：一个几十万行的项目，加一个字符只多几十字节。所以"Git 存快照"不是比喻，也不是设计妥协，而是它快、能离线、能任意切分支的根本原因。

**这个模型直接解释了三件事**：

| 你的疑问 | 答案 |
| --- | --- |
| 为什么切分支这么快？ | 分支切换只是改 `HEAD` 指向的提交，再把工作区文件换成那个快照。 |
| 为什么 Git 能离线看历史？ | 历史全在你本地的对象库里。 |
| 为什么 Git 合并比 SVN 强？ | 每次提交都记得"我的父提交是谁"，三路合并有完整的三方信息可用。 |

### 1.2 四种对象与哈希

`.git` 目录里躺着四类对象，全部以内容的哈希命名（**默认仍是 SHA-1**；可以用 `--object-format=sha256` 建 SHA-256 仓库，但两种仓库无法互相操作，现状见 2.9）：

| 对象 | 存什么 | 例子 |
| --- | --- | --- |
| **blob** | 一个文件的内容（不含文件名！） | `README.md` 的文本 |
| **tree** | 一个目录：文件名 → blob/tree 的对应表 | `src/` 里有哪些文件 |
| **commit** | 一个快照：指向一个 tree + 父提交 + 作者/时间/说明 | 你 `git commit` 生成的那个 |
| **tag**（附注标签） | 指向某个 commit 的带签名/说明的引用 | `v1.0.0` |

注意 blob **不带文件名**——文件名在 tree 里。这个设计带来一个反直觉的结论：

```bash
# 两个内容完全相同的文件，只存一份 blob
$ echo hello > a.txt
$ echo hello > b.txt
$ git add a.txt b.txt && git commit -m "two files"
$ git cat-file -p HEAD^{tree}
100644 blob ce013625030ba8dba906f756967f9e9ca394464a    a.txt
100644 blob ce013625030ba8dba906f756967f9e9ca394464a    b.txt
#                                  ^^^^^^ 同一个哈希
```

（`HEAD^{tree}` 是"HEAD 这个提交指向的 tree"，`^{...}` 叫 peel 语法，第 9 章会再见到。）

**为什么 git 能识别重命名？** 因为它不记录"重命名"这件事。`git log --follow`、`git diff -M` 都是**事后猜**：内容相似度超过阈值就认为是改名。所以改名 + 大改内容时，Git 可能就认不出来了——不是 bug，是模型的必然结果。

### 1.3 提交图与分支

每个 commit 记录自己的父提交，于是历史天然是一张**有向无环图**（DAG）：

```text
        A ← B ← C ← D          ← main
                 ↖
                   E ← F        ← feature
```

（箭头指向父提交；`E` 的父是 `B`。）

**分支就是一张写着提交哈希的纸条**，放在 `.git/refs/heads/` 下：

```bash
$ cat .git/refs/heads/main
8f3c1e2...   # 一个 40 位哈希
```

`git branch feature` 做的事就是往 `.git/refs/heads/feature` 写一个新的哈希文件。仅此而已。所以：

- 创建分支是 O(1)，不是"复制一份代码"。
- 删除分支只是删掉那张纸条，提交本身还在（靠 reflog 能找回来，第 6 章）。
- `HEAD` 是"我现在在哪"的指针，通常指向某个分支名（`.git/HEAD` 内容是 `ref: refs/heads/main`），这叫"附着"状态；直接指向提交哈希就叫 **detached HEAD**（分离头指针）。

```bash
$ cat .git/HEAD
ref: refs/heads/main

$ git switch --detach HEAD~1     # 分离头指针，去看上一个提交
$ cat .git/HEAD
8f3c1e2...                       # 直接是哈希
```

分离头指针下写的提交不属于任何分支，切走之后就"没有名字"了——很容易丢，第 6.5 节讲怎么捞回来。

### 1.4 三棵树：日常操作的坐标系

这是最该背下来的一张图。Git 的管理对象不是"文件"，而是文件在三个区域之间的**移动**：

```text
  工作区                暂存区(index)            版本库(HEAD)
  working tree          staging area             repository
  你正在编辑的文件        下次提交的内容            最近一次提交
       │                     │                        │
       │  git add            │  git commit            │
       └────────────────────>└───────────────────────>│
                                                       
       <────────────────────────────────────────────────
              git restore / git reset / git checkout
```

- **工作区**：你能用 `ls` 看到的文件（准确说法是"被 Git 跟踪的那些文件的当前内容"）。
- **暂存区**（也叫索引 index）：一个二进制文件 `.git/index`，记录"如果现在提交，快照长什么样"。它让你可以只提交一部分改动。
- **版本库**：`.git/objects` 里的历史，`HEAD` 指向其中最新的那个提交。

日常命令本质都是"在三个区域搬运内容"：

| 命令 | 方向 | 通俗解释 |
| --- | --- | --- |
| `git add <file>` | 工作区 → 暂存区 | 把当前内容放进"下次提交"的篮子 |
| `git commit` | 暂存区 → 版本库 | 把篮子变成一个不可变的快照 |
| `git restore <file>` | 暂存区 → 工作区 | 用篮子里的内容覆盖文件（丢弃未暂存的修改） |
| `git restore --staged <file>` | 版本库 → 暂存区 | 把文件从篮子里拿出来（不碰工作区） |
| `git restore --source=HEAD --staged --worktree <file>` | 版本库 → 篮子 → 工作区 | 彻底还原成上次提交的样子 |

记住这张表，`git status` 的输出就不再是天书。

### 1.5 `git status` 到底在说什么

```bash
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:            # ← 暂存区 vs HEAD：这些会进入下次提交
  (use "git restore --staged <file>..." to unstage)
        modified:   src/app.ts

Changes not staged for commit:      # ← 工作区 vs 暂存区：改了但没 add
  (use "git add <file>..." to update what will be committed)
        modified:   README.md

Untracked files:                    # ← 工作区里 Git 完全没见过的文件
  (use "git add <file>..." to include in what will be committed)
        notes.txt
```

短格式更紧凑，建议早点习惯：

```bash
$ git status -s
 M README.md        # 工作区改了，未暂存（第一列空，第二列 M）
M  src/app.ts       # 已暂存（第一列 M，第二列空）
MM both.txt         # 暂存了一份，之后又改了（两列都有）
?? notes.txt        # 未跟踪
A  new.ts           # 新文件已暂存
 D old.ts           # 工作区删了，未暂存
D  gone.ts          # 删除已暂存
```

**第一列 = 暂存区相对 HEAD，第二列 = 工作区相对暂存区**。这两列经常不一致，这正是"三棵树"存在的证据。

### 1.6 动手：肉眼看一下对象库

```bash
$ mkdir git-lab && cd git-lab
$ git init
$ echo "hello" > a.txt
$ git add a.txt
$ git commit -m "first commit"

$ git log --oneline
9c1b0b4 (HEAD -> main) first commit

$ git cat-file -p HEAD          # 看提交对象
tree 5d7e2b8...                 # 指向目录快照
author 张三 <zhang@example.com> 1793000000 +0800
committer 张三 <zhang@example.com> 1793000000 +0800

first commit

$ git cat-file -p HEAD^{tree}   # 看目录树
100644 blob ce013625030ba8dba906f756967f9e9ca394464a    a.txt

$ git cat-file -p ce013625      # 看文件内容（前缀够用就行）
hello
```

三行 `cat-file` 看到的，就是 Git 的全部家底：**commit → tree → blob**。分支、标签、`HEAD` 都只是指向这些对象的引用。

> 换个说法：`.git/objects` 是"内容"（不可变），`.git/refs` 和 `HEAD` 是"名字"（可变）。Git 的所有操作，要么在造新内容，要么在挪名字。

### 1.7 练习

1. 在 `git-lab` 里再加一个内容与 `a.txt` 完全相同的 `c.txt`，提交后用 `git cat-file -p HEAD^{tree}` 确认两者哈希相同。
2. 用 `cat .git/HEAD` 和 `cat .git/refs/heads/main` 看看两者的内容关系。
3. 执行 `git switch --detach HEAD~1`（此时会报错说没有上一个提交，先再提交一次），然后 `cat .git/HEAD`，观察它变成了哈希。
4. 解释：为什么 `git branch x` 几乎瞬间完成，而 `cp -r` 一份大项目要很久？

<details>
<summary>参考答案</summary>

1. 两个条目指向同一个 blob 哈希，说明 Git 按内容去重。
2. `.git/HEAD` 是 `ref: refs/heads/main`（一个间接引用），`.git/refs/heads/main` 才是 40 位哈希。
3. 分离后 `HEAD` 文件内容直接是提交哈希，`git status` 也会提示 "HEAD detached at ..."。
4. 分支只是一个写着哈希的文件（几十字节），提交和 blob 已经存在，无需复制任何项目内容。

</details>

---

## 2. 环境与配置一次配好

### 2.1 装 Git

| 系统 | 推荐方式 | 备注 |
| --- | --- | --- |
| Windows | `winget install --id Git.Git -e` 或 [git-scm.com](https://git-scm.com/download/win) | 自带 Git Bash、凭证管理器 |
| macOS | `brew install git` | 系统自带的 `/usr/bin/git` 版本往往偏旧 |
| Debian/Ubuntu | `sudo apt install git` | 想用新版可加官方 PPA |
| Fedora | `sudo dnf install git` | |
| Arch | `sudo pacman -S git` | |

```bash
$ git --version
git version 2.51.2
```

低于 2.23 的版本不支持 `switch` / `restore` 这两个"语义更清楚"的命令，本书大量使用它们，建议升级。

### 2.2 首次配置：五条命令

Git 必须在提交里写作者，所以**先配身份**，后配习惯：

```bash
# 1) 身份（会写进每一个提交，写错了历史里到处都是错的）
git config --global user.name "张三"
git config --global user.email "zhangsan@example.com"

# 2) 默认分支名（新仓库用 main，避免和老平台默认的 master 混着用）
git config --global init.defaultBranch main

# 3) pull 的行为：只允许快进，不允许自动合并
git config --global pull.ff only

# 4) Windows 上的换行符策略（见 2.6）
git config --global core.autocrlf true

# 5) 中文文件名不要显示成 \344\270\255 这种八进制转义
git config --global core.quotepath false
```

`git config --list --show-origin` 能一次看到所有配置和它们来自哪个文件，排查"为什么我改了没生效"特别有用。

### 2.3 配置的四个层级

优先级从低到高，后面的覆盖前面的：

| 层级 | 文件 | 命令 | 用途 |
| --- | --- | --- | --- |
| system | `C:\Program Files\Git\etc\gitconfig` / `/etc/gitconfig` | `--system` | 机器级默认值 |
| global | `~/.gitconfig` 或 `~/.config/git/config` | `--global` | 你这台机器上的所有仓库 |
| local | `<repo>/.git/config` | `--local`（默认） | 单个仓库 |
| worktree | `<repo>/.git/config.worktree` | `--worktree` | 单个 worktree（第 9 章） |

```bash
$ git config --global user.email          # 读
$ git config --unset pull.ff              # 删
$ git config --global --edit              # 直接改 ~/.gitconfig
$ git config --list --show-origin         # 看来源
```

一个常见需求：公司仓库用工作邮箱，个人项目用私人邮箱。

```bash
$ cd ~/work/project
$ git config --local user.email "zhangsan@company.com"
```

更好的做法是用 `includeIf` 按目录自动切换（写进 `~/.gitconfig`）：

```ini
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work
```

`~/.gitconfig-work` 里再写 `[user] email = zhangsan@company.com` 即可。带 `gitdir:` 前缀的匹配方式是 Git 2.13 起支持的。

### 2.4 别名：把三行命令压成一行

```bash
git config --global alias.st status
git config --global alias.co switch
git config --global alias.br branch
git config --global alias.last 'log -1 HEAD --stat'
git config --global alias.unstage 'restore --staged --'
git config --global alias.lg "log --graph --oneline --decorate --all"
```

注意带空格的别名要用**单引号**包起来，否则 shell 会拆参数。改完直接：

```bash
$ git lg        # 一屏看清整张图
```

不必抄别人的一长串别名。**别名只对高频、且你完全理解其含义的命令有意义**——把 `git reset --hard` 设成 `git nuke` 之类的做法，是给自己挖坑。

### 2.5 认证：SSH 还是 HTTPS

两种方式都能用，现状（2026 年）：

| 方式 | 现状 | 适合谁 |
| --- | --- | --- |
| HTTPS + PAT | **已不支持账号密码推送**（GitHub 2021 起、GitLab 2022 起）。必须用个人访问令牌（PAT）或 OAuth | 偶尔提交、在公司网络里被墙 SSH 的人 |
| SSH 密钥 | 推荐。一次配置长期使用，不受令牌过期影响 | 大多数人 |

**SSH 配置（推荐）**：

```bash
$ ssh-keygen -t ed25519 -C "zhangsan@example.com"
# 一路回车（passphrase 建议设置，见下）
$ cat ~/.ssh/id_ed25519.pub       # 复制这一整行
```

把公钥贴到平台上（GitHub：Settings → SSH and GPG keys；GitLab：Preferences → SSH Keys），然后：

```bash
$ ssh -T git@github.com
Hi zhangsan! You've successfully authenticated, but GitHub does not provide shell access.
```

看到这一行就通了。`~/.ssh/config` 里可以按主机指定密钥，团队有多把密钥时很省心：

```text
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes
```

**PAT（HTTPS）**：在平台设置里生成，权限选最小（只勾 `repo`），有效期尽量短。凭证由系统的 credential helper 缓存：

```bash
# Windows 用 Git Credential Manager（安装 Git for Windows 时自带）
$ git config --global credential.helper manager
# macOS
$ git config --global credential.helper osxkeychain
# Linux（需要 libsecret）
$ git config --global credential.helper libsecret
```

> 不要把令牌写进 URL（`https://user:token@github.com/...`）。它会留在 `.git/config`、shell 历史、CI 日志里。用 helper，或者用环境变量 + CI 的 secret 机制。

### 2.6 换行符：一次讲清，以后不再乱

Windows 用 CRLF（`\r\n`），Linux/macOS 用 LF（`\n`）。如果不管，会出现"我只改了一行，diff 显示整个文件都变了"。

Git 有两个相关配置，容易混：

| 配置 | 作用 |
| --- | --- |
| `core.autocrlf` | 工作区 ↔ 版本库转换：`true`（Windows：提交时 CRLF→LF，检出时 LF→CRLF）、`input`（Linux/macOS：提交时 CRLF→LF，检出不动）、`false`（不转） |
| `.gitattributes` 里的 `text=auto` | 仓库级规则，**优先于** `core.autocrlf`，且会随仓库分发给所有人 |

**推荐做法**（现代项目已逐渐取代 `core.autocrlf`）：

```gitattributes
# .gitattributes
* text=auto eol=lf

# 这些是二进制，别碰
*.png binary
*.jpg binary
*.pdf binary
*.zip binary

# Windows 专用脚本保留 CRLF
*.bat text eol=crlf
*.ps1 text eol=crlf
```

仓库里统一 LF，Windows 检出时由 Git 按需转换；`.bat` / `.ps1` 这类必须 CRLF 的单独声明。

**已经乱了怎么办？** 规范化整个仓库（会产生一次大提交，务必单独提交、并在团队里说明）：

```bash
$ git add --renormalize .
$ git status
$ git commit -m "chore: normalize line endings"
```

### 2.7 `.gitignore`：让 `git status` 干净

```gitignore
# 依赖与构建产物
node_modules/
dist/
build/
*.pyc
__pycache__/
.venv/

# 编辑器与系统
.vscode/
.idea/
.DS_Store
Thumbs.db

# 密钥与本地配置（重要）
.env
.env.local
*.pem
secrets/

# 但不忽略示例配置
!.env.example
```

规则要点：

- `#` 注释；空行忽略。
- `dir/` 只匹配目录；`/dist` 只匹配仓库根下的 `dist`（**开头的斜杠锚定根目录**）。
- `!` 取反，但**父目录被忽略时，子文件的取反无效**——这是最常见的坑：`node_modules/` 已经忽略了整个目录，再写 `!node_modules/keep.js` 不生效。正确做法是先不忽略目录本身：

  ```gitignore
  node_modules/*
  !node_modules/keep.js
  ```

- `.gitignore` 只对**未跟踪**文件生效。已被跟踪的文件，加了规则也不会被忽略，必须先 `git rm --cached <file>`。

排查"为什么这个文件被忽略了"：

```bash
$ git check-ignore -v dist/app.js
.gitignore:3:dist/    dist/app.js       # 规则来自第 3 行
$ git status --ignored -s | head        # 看看被忽略的都有啥
```

全局忽略（本机所有仓库生效，适合 `.DS_Store`、`.idea/`）：

```bash
$ git config --global core.excludesFile ~/.gitignore_global
```

### 2.8 提交签名（可选，但越来越常见）

有些组织要求提交必须签名（GitHub 会显示 "Verified"）。两种方式：

```bash
# 用 SSH 密钥签名（最简单，复用 2.5 的密钥）
$ git config --global gpg.format ssh
$ git config --global user.signingkey ~/.ssh/id_ed25519.pub
$ git config --global commit.gpgsign true
```

```bash
# 用 GPG
$ gpg --full-generate-key            # 选 RSA 4096 或 ed25519
$ gpg --list-secret-keys --keyid-format=long
$ git config --global user.signingkey <KEY_ID>
$ git config --global commit.gpgsign true
```

然后把公钥上传到平台。签名只是证明"这个提交确实是持私钥的人做的"，它不改变提交内容的任何语义。

### 2.9 Git 3.0、reftable 与 SHA-256 的现状

这三个词经常被混在一起讲，其实它们各自独立。**结论先说：日常开发完全不受影响，但你会在文章里看到它们，别被吓到。**

**Git 3.0**：官方在 `BreakingChanges.adoc` 里的原话是 "There is no planned release date for this breaking version yet."——**没有计划日期**。它不是"下一个大版本马上要来"，而是一份"将来某个时刻会一起改"的清单：

| 计划变更 | 说明 |
| --- | --- |
| 新仓库默认哈希 sha1 → sha256 | sha1 不会被废弃 |
| 默认 ref 存储 files → reftable | 见下 |
| 默认分支名 master → main | `git init` 手册已写明"3.0 时改"；2.52 起已正式宣布 |
| Rust 成为构建必需 | 2.52 探测、2.55 默认开启、3.0 强制 |
| `safe.bareRepository` 默认收紧 | 裸仓库不再被默认信任 |
| 移除 grafts、`git pack-redundant`、`git whatchanged` 等 | 老工具清理 |

`git checkout` **不在移除清单里**——它会和 `switch`/`restore` 长期共存（`switch`/`restore` 是 2.23 引入的，2.51 起正式转正，不再标实验性）。

**reftable**：分支/标签这些"引用"过去的存储格式是 `.git/refs/` 目录 + `packed-refs` 文件。reftable 换成一套紧凑的二进制表格式（`.git/reftable/`），**2.45 起可用**，2.51 官方评价 "matured enough"，3.0 计划设为默认。

```bash
$ git init --ref-format=reftable repo
$ git refs list                      # 2.52+ 的子命令
$ git refs migrate --ref-format=reftable   # 把已有仓库迁过去
```

它解决的问题很具体：Linux 内核那种 86 万个 ref 的仓库，`packed-refs` 62MB 变 36MB，全量扫描 402ms 变 112ms，reflog 173MB 变 5MB。另一个官方理由很 Windows 友好——**files 后端下 `refs/heads/foo` 和 `foo/bar` 不能共存，在大小写不敏感的 Windows 上问题更明显**，reftable 没这个限制。

迁移有两条限制：不能迁带多 worktree 的仓库；无法阻止并发写（建议先 `git maintenance unregister`）。

**SHA-256**：`git init --object-format=sha256` 可用，但 **sha1 仍是默认**。障碍是互操作：SHA-256 仓库和 SHA-1 仓库之间没有兼容机制，官方文档明确写着在 Git 协议支持 SHA-256 之前，**不要把 SHA-256 仓库用于公开托管的服务器**。所以现在它只在"内部新仓库、工具链全都支持"的场景有人尝试。

**你该做什么**：什么都不用做。等到 3.0 发布时，升级 git 就像平时升级一样，旧仓库会被自动兼容（或给出迁移命令）。

### 2.10 练习

1. 用 `git config --list --show-origin` 找出 `user.email` 来自哪个文件。
2. 建一个仓库，配 `core.autocrlf false`，写一个只有 LF 的文件，提交后 `git show --stat` 看看有没有异常。
3. 在 `.gitignore` 里写 `*.log`，创建 `a.log` 并 `git status`；然后 `git add -f a.log` 强制加入，再 `git status` 观察它变成已跟踪。
4. 解释 `git check-ignore -v` 的输出格式，用一句话说明它比"猜"好在哪。

<details>
<summary>参考答案</summary>

1. 输出里每行形如 `file:~/.gitconfig	user.email=...`，冒号前就是来源。
2. 没有异常；`core.autocrlf false` 时 Git 原样存取，LF 文件保持 LF。
3. 被忽略的文件不出现在 `Untracked files` 里；`-f` 强制加入后，忽略规则对它不再生效。
4. 格式是 `<规则文件>:<行号>:<规则>	<路径>`，能直接定位到是哪条规则、哪一行在起作用。

</details>

---

## 3. 三棵树的日常操作

### 3.1 创建仓库的两种方式

```bash
# 方式一：把已有目录变成仓库
$ cd my-project
$ git init
Initialized empty Git repository in /path/my-project/.git/

# 方式二：克隆已有仓库
$ git clone https://github.com/user/repo.git
$ git clone git@github.com:user/repo.git my-dir    # 指定目录名
```

`git init` 只做三件事：建 `.git/`、写 `HEAD`、写默认配置。**它不会提交任何东西**，所以紧接着要 `git add` + `git commit`。

克隆时值得知道的三个参数：

```bash
$ git clone --depth 1 <url>          # 浅克隆：只要最近一次提交，CI 里常用
$ git clone --filter=blob:none <url> # 部分克隆：先不要文件内容，按需下载（第 11 章）
$ git clone --branch v1.2 <url>      # 直接检出某个分支或标签
```

### 3.2 暂存：`git add` 的四种粒度

```bash
$ git add file.txt            # 单个文件
$ git add src/                # 目录（递归，含新文件）
$ git add -A                  # 全部：新增 + 修改 + 删除
$ git add -u                  # 只处理已跟踪文件的修改与删除（不含新文件）
$ git add .                   # 当前目录下的全部变化（注意：在子目录里执行只影响子目录）
```

`git add -A` 和 `git add .` 在老版本里有区别（`.` 不含删除），现在行为基本一致；但**在子目录里执行 `git add .` 只暂存子目录**，这是新手最容易踩的坑之一。

真正好用的是补丁模式：

```bash
$ git add -p
```

它把每个改动块（hunk）单独问你：

```text
@@ -12,6 +12,8 @@ function render() {
   const el = document.querySelector("#app");
+  const title = "待办";
+  el.dataset.title = title;
   el.innerHTML = view();
```

按键：

| 键 | 含义 |
| --- | --- |
| `y` | 暂存这一块 |
| `n` | 跳过这一块 |
| `s` | 把这块拆得更小（拆不动就会提示） |
| `e` | 手工编辑这块的补丁 |
| `q` | 退出 |
| `?` | 帮助 |

**为什么值得学 `-p`**：它让你能写出"一个提交只做一件事"的历史。调试用的 `console.log` 和真正的修复混在一起时，`-p` 能把它们分开提交。

### 3.3 提交：一次提交一件事

```bash
$ git commit -m "fix: 修正空标题被当成有效任务的校验"
$ git commit                      # 打开编辑器写多行说明
$ git commit -v                   # 打开编辑器，同时把 diff 附在下面（推荐）
$ git commit -a -m "..."          # 跳过 add，直接暂存所有已跟踪文件的修改（新文件不行）
$ git commit --amend              # 改写最近一次提交（第 4 章）
```

**提交信息怎么写**。最实用的一套是 Conventional Commits：

```text
<type>(<scope>): <subject>

<body：为什么这么改，而不是改了什么>

<footer：关联 issue、BREAKING CHANGE>
```

```text
fix(auth): 令牌过期后不再无限重试

原来 catch 里统一重试三次，401 也会重试，导致用户被锁。
现在只对 5xx 和网络错误重试，401 直接抛给上层处理。

Closes #142
```

三个规则：

1. **标题 ≤ 50 字符，祈使句**（"修正"而不是"修正了"）。
2. **正文说"为什么"**，"改了什么"看 diff 就行。
3. **一个提交只做一件事**。回滚时你会感谢自己。

`git log --oneline` 是用来扫的，标题写清楚，半年后还认得出：

```bash
$ git log --oneline
a1b2c3d fix(auth): 令牌过期后不再无限重试
9f8e7d6 feat(todo): 支持按标签筛选
3c4b5a2 chore: 升级依赖到 Node 24
```

### 3.4 比较：`git diff` 家族

| 命令 | 比较对象 |
| --- | --- |
| `git diff` | 工作区 vs 暂存区（**下次 `add` 会加进去的内容**） |
| `git diff --staged`（同 `--cached`） | 暂存区 vs HEAD（**下次 commit 会提交的内容**） |
| `git diff HEAD` | 工作区 vs HEAD（两者之和） |
| `git diff main..feature` | 两个分支的末端 |
| `git diff main...feature` | 三个点：从共同祖先到 feature（**看"这个分支带来了什么"**） |
| `git diff <commit1> <commit2> -- path/` | 指定路径 |

常用修饰：

```bash
$ git diff --stat                  # 只列文件与增删行数
$ git diff -w                      # 忽略空白差异（换行符事故时救命）
$ git diff --word-diff             # 按词显示，适合文章/长段落
$ git diff --name-only             # 只列文件名
$ git diff --color-moved          # 移动的代码用不同颜色标出
```

两点 vs 三点，是团队协作里最容易被误用的：

```text
   A --- B --- C        ← main
          \
           D --- E      ← feature

git diff main..feature    → C 和 E 的差异（main 上的新东西也算进去）
git diff main...feature   → B 和 E 的差异（"feature 相对分叉点改了什么"）
```

看 PR 时你要的是三点。

### 3.5 查看历史

```bash
$ git log --oneline --graph --decorate --all
$ git log -5                        # 最近 5 条
$ git log --author="张三"           # 按人过滤
$ git log --since="2 weeks ago" --until="yesterday"
$ git log --grep="登录"             # 按提交信息搜索
$ git log -p src/app.ts             # 带 diff
$ git log --stat                    # 带文件变更统计
$ git log --follow src/old-name.ts  # 跟随重命名（单文件）
$ git show <commit>                 # 看某次提交的完整内容
$ git show <commit>:src/app.ts      # 看"那次提交时"这个文件的内容
```

`--decorate` 会显示分支和标签指向哪里，`--all` 包含所有分支。配上别名 `lg`，一屏就能看清整张图。

时间格式上，`--date=short`、`--date=iso`、`--date=relative` 都常用；`--format` 可以自定义：

```bash
$ git log --pretty=format:'%h %ad %an %s' --date=short
```

### 3.6 让文件"退出跟踪"

```bash
# 从版本库里删掉，但保留本地文件（改完 .gitignore 后常用）
$ git rm --cached .env
$ git commit -m "chore: 停止跟踪 .env"

# 真的删文件
$ git rm old.txt
$ git mv a.txt b.txt        # 等价于 mv + add + rm（Git 不记录重命名，只是语法糖）
```

### 3.7 空提交与 `--allow-empty`

```bash
$ git commit --allow-empty -m "ci: 触发重新构建"
```

CI 系统通常按提交触发，改配置重跑一次时有用。除此之外不要滥用——空提交会让"每个提交都有意义"的约定破功。

### 3.8 练习

1. 修改两个不同文件的同一个函数，用 `git add -p` 只暂存其中一个改动。
2. 造一个"改了一行但 diff 显示整个文件"的场景（提示：换行符），用 `git diff -w` 和 `git diff --ignore-cr-at-eol` 各看一次。
3. 用 `git log --pretty=format:'%h %s'` 输出最近 10 条提交，再用 `git log --graph --all` 看看图形差异。
4. 把 `.env` 加入 `.gitignore` 后仍能看到它出现在 `git status` 里，解释原因并修好。

<details>
<summary>参考答案</summary>

1. `git add -p` → 对第二个文件的所有 hunk 按 `n`，第一个按 `y`。
2. 用 `printf 'a\r\nb\r\n' > f.txt` 写入 CRLF，再改成 LF；`-w` 完全忽略空白，`--ignore-cr-at-eol` 只忽略行尾 CR。
3. `--pretty` 只是格式，`--graph` 才画图；两者可组合。
4. 因为 `.env` 已被跟踪：`gitignore` 只影响未跟踪文件。先 `git rm --cached .env` 并提交。

</details>

---

## 4. 历史是可以改的

### 4.1 一条铁律：只改没推送的历史

Git 的提交是内容寻址的：改一个字符，哈希就变，后面的提交全部要重建。这叫"改写历史"。

**判断标准只有一条**：

```text
这个提交是否已经推送到共享分支，并且别人可能已经拉到本地？
  是 → 不要改。用新提交去"撤销"（第 6 章 revert）
  否 → 随便改
```

个人分支（`feature/xxx`）上想怎么改都行。`main` 上不行——你改了，别人的本地历史和远端就对不上，下一次 pull 会变成一团乱麻。

### 4.2 `commit --amend`：改最近一次

```bash
$ git commit --amend                    # 改提交信息（会打开编辑器）
$ git commit --amend -m "新信息"
$ git commit --amend --no-edit          # 只改内容，信息不动（补文件时最常用）
$ git commit --amend --author="李四 <li@example.com>"
$ git commit --amend --date="2026-10-01T10:00:00"
```

典型用法：忘了加一个文件。

```bash
$ git commit -m "feat: 增加导出功能"
# 咦，忘了把 export.ts 加进去
$ git add src/export.ts
$ git commit --amend --no-edit
```

注意 `--amend` 是**新建一个提交替换旧的**，不是原地修改。旧提交还在 reflog 里（第 6 章能找回）。

### 4.3 交互式 rebase：整理一段历史

```bash
$ git rebase -i HEAD~5        # 整理最近 5 个提交
$ git rebase -i main          # 整理"从 main 分叉之后"的所有提交
```

编辑器里会列出这些提交（**顺序是从旧到新**，和 `git log` 相反）：

```text
pick 3c4b5a2 feat: 增加导出功能
pick 9f8e7d6 fix: 导出时少一个分号
pick a1b2c3d debug: 加了一行 console.log
pick 5e6f7a8 feat: 导出支持 CSV
```

把每行的 `pick` 换成动作：

| 动作 | 含义 |
| --- | --- |
| `pick` / `p` | 保留这个提交 |
| `reword` / `r` | 保留内容，改提交信息 |
| `edit` / `e` | 停下来，让你修改这个提交（可以 `--amend`、可以拆成多个） |
| `squash` / `s` | 合并进上一个提交，保留两者的信息 |
| `fixup` / `f` | 合并进上一个提交，**丢掉**这个的信息 |
| `drop` / `d` | 删掉这个提交（也可以直接删掉整行） |
| `exec` / `x` | 在这一行执行一条 shell 命令（跑测试很好用） |

最常见的整理：把调试提交压进功能提交。

```text
pick 3c4b5a2 feat: 增加导出功能
fixup 9f8e7d6 fix: 导出时少一个分号
fixup a1b2c3d debug: 加了一行 console.log
pick 5e6f7a8 feat: 导出支持 CSV
```

保存退出后，Git 会重放这些提交，前三个变成一个。

> 重排提交的**顺序**也是合法的（把 `pick` 行上下移动），但要注意后续提交可能依赖前面的代码，重排后容易冲突。

### 4.4 `--fixup` + `--autosquash`：不用记哈希

整理历史时你通常只知道"要修的是哪个提交"。两个命令配合能自动排好：

```bash
# 发现 3c4b5a2 有 bug，直接基于它生成一个 fixup 提交
$ git commit --fixup=3c4b5a2 -m "wip"      # 实际信息会被自动改成 "fixup! feat: 增加导出功能"

# 整理时自动把 fixup 排到目标提交后面
$ git rebase -i --autosquash main
```

也可以设成默认：

```bash
git config --global rebase.autoSquash true
```

同理有 `--fixup=amend:<commit>`（合并时连提交信息一起改）和 `--fixup=reword:<commit>`（只改信息）。

### 4.5 `rebase --update-refs`：一次整理多个分支

场景：你在 `feature/a` 上开发，从它分了 `feature/b`，现在想改 `feature/a` 的历史，让 `feature/b` 跟着动。

```bash
$ git rebase -i --update-refs main
```

Git 会列出所有"指向被重写提交的分支"，重写完成后自动把它们移到新位置。省掉"先 rebase a，再手动 rebase b"的麻烦。

### 4.6 rebase 出错了：`--abort` 与 `--skip`

```bash
$ git rebase --abort        # 完全回到 rebase 之前（最保险）
$ git rebase --skip         # 跳过当前这个提交
$ git rebase --continue     # 解决冲突并 add 之后继续
```

rebase 中途 `git status` 会告诉你现在在重放哪个提交、还剩几个。不要在这个状态下 `git commit`（会把冲突状态提交进去），只 `add` 然后 `--continue`。

### 4.7 reflog：改写历史的安全网

`reflog` 记录 **HEAD 和分支指针的每一次移动**，保留 90 天（`gc.reflogExpire`）。

```bash
$ git reflog
a1b2c3d HEAD@{0}: rebase (finish): returning to refs/heads/main
9f8e7d6 HEAD@{1}: rebase (squash): feat: 增加导出功能
3c4b5a2 HEAD@{2}: rebase (start): checkout main~5
5e6f7a8 HEAD@{3}: commit: feat: 导出支持 CSV
```

`HEAD@{n}` 是"n 步之前 HEAD 在哪"。rebase 搞砸了：

```bash
$ git reset --hard HEAD@{2}     # 回到 rebase 开始前
```

或者用 `ORIG_HEAD`——Git 在执行 rebase、merge、reset 这类"危险"操作前会自动把原来的 HEAD 存进去：

```bash
$ git reset --hard ORIG_HEAD
```

**这是本书最该记住的一句话**：只要提交过一次，哪怕分支被删、rebase 出错、`reset --hard` 手滑，**提交对象还在 `.git/objects` 里**，reflog 能带你回去。真正会丢的只有"从没提交过的工作区内容"。

### 4.8 什么情况不该改写历史

| 情况 | 后果 | 该怎么做 |
| --- | --- | --- |
| 共享分支（`main`、`develop`） | 所有人的历史分叉 | 用 `git revert` 生成反向提交 |
| 已发布的标签 | 下游依赖的版本变了 | 打新标签 |
| 别人已经基于此开分支 | 他们的分支会出现重复提交 | 提前沟通，或接受"重写 + 通知所有人重新 fetch" |
| 公开的开源贡献（PR 已 review） | 审查记录对不上 | 保持原样，用新提交修复 |

一个实操建议：**动手改写前先建个备份分支**，成本几乎为零，心理负担也小：

```bash
$ git branch backup/before-rebase
```

### 4.9 练习

1. 提交三次（第三个是调试用的 `console.log`），用 `rebase -i` 把它 `fixup` 进第二个提交，验证 `git log` 只剩两条。
2. 用 `git commit --fixup` + `git rebase -i --autosquash` 完成同样的事，比较两次的麻烦程度。
3. 故意把 rebase 做到一半 `--abort`，然后用 `git reflog` 找到 rebase 之前的哈希。
4. 解释：为什么 `--amend` 之后旧的提交哈希还在 `git log` 里找不到，但 `git reflog` 能找到？

<details>
<summary>参考答案</summary>

1. 编辑器中把第三行的 `pick` 改成 `fixup`，保存退出。
2. `git commit --fixup=<hash>` 生成自动命名的提交，rebase 时不用手工排序。
3. reflog 里 `rebase (start)` 那一条的前一条就是 rebase 前的 HEAD。
4. 因为 `--amend` 生成了新对象，旧对象不再被任何分支（ref）引用，所以 `git log` 从分支出发走不到它；但 reflog 记录了"HEAD 曾经在那个哈希上"。

</details>

---

## 5. 分支与合并

### 5.1 分支操作的完整集合

```bash
$ git branch                      # 列出本地分支（当前分支前有 *）
$ git branch -a                   # 含远端分支
$ git branch -v                   # 带最新提交信息
$ git branch --merged main        # 哪些分支已经合进 main（可安全删）
$ git branch --no-merged main     # 哪些还没合（删之前要确认）

$ git branch feature              # 创建（不切换）
$ git switch feature              # 切换
$ git switch -c feature           # 创建并切换（最常用）
$ git switch -c feature origin/feature   # 基于远端分支创建本地分支
$ git switch -                      # 回到上一个分支（像 cd -）

$ git branch -d feature           # 删除（未合并会拒绝，保护你）
$ git branch -D feature           # 强制删除
$ git branch -m old new           # 重命名
```

`switch` / `restore` 是 Git 2.23 引入的，把老 `checkout` 的多种职责拆开了：

| 老命令 | 新命令 | 说明 |
| --- | --- | --- |
| `git checkout branch` | `git switch branch` | 切分支 |
| `git checkout -b x` | `git switch -c x` | 建并切 |
| `git checkout -- file` | `git restore file` | 丢弃工作区修改 |
| `git checkout commit -- file` | `git restore --source=commit file` | 从某个提交取文件 |
| `git checkout commit` | `git switch --detach commit` | 分离头指针（意图明确） |

老命令仍然可用（`checkout` 不会被删除），但新命令能避免"我到底想干什么"的歧义。

### 5.2 合并的三种结果

```bash
$ git switch main
$ git merge feature
```

**结果一：fast-forward（快进）**

```text
A ← B ← C            main
         ↖
           D ← E      feature
```

`main` 是 `feature` 的祖先，没分叉。Git 直接把 `main` 指针挪到 `E`，不产生新提交。

```text
A ← B ← C ← D ← E    main, feature
```

**结果二：三方合并（true merge）**

```text
A ← B ← C            main
     ↖
       D ← E          feature
```

两边都有新提交，Git 造一个新提交 `M`，它有两个父提交：

```text
A ← B ← C ←—— M      main
     ↖      ↗
       D ← E         feature
```

**结果三：冲突**

同一个文件的同一处被两边改了，Git 不知道谁对，把决定权交给你（5.4）。

三个控制参数：

```bash
$ git merge --ff-only feature     # 只允许快进，否则报错（团队主分支推荐）
$ git merge --no-ff feature       # 强制产生合并提交，保留"这里合并过一个分支"的信息
$ git merge --squash feature      # 把 feature 的所有改动压成一个未提交的改动（不建合并提交）
```

**`--no-ff` 什么时候值得用**：想在图上永久保留"这是一整块功能"的边界时。代价是图更复杂。小团队、频繁合并的话，`--ff-only` + rebase 的线性历史更好读。

`--squash` 常被误解：它**不记录父子关系**，之后 Git 不知道这个分支合过了，`git branch --merged` 也看不出来。适合"这个分支的中间提交完全没价值"的情况。

### 5.3 merge 还是 rebase

这是团队里最容易吵起来的问题。结论先行：**看这条分支是不是"私有"的**。

| | merge | rebase |
| --- | --- | --- |
| 历史形状 | 保留分叉，图更真实 | 拉成一条直线 |
| 提交哈希 | 不变 | 全部重写 |
| 冲突解决 | 一次解决一处 | 可能每个提交都要解决一次 |
| 适合 | 共享分支之间合并（`main` ← `release`） | 个人分支跟上 `main` 的最新进展 |
| 风险 | 图复杂，`git log` 难读 | 对已推送分支 rebase = 灾难 |

**推荐组合**（也是多数团队的实际做法）：

```bash
# 1) 你在自己的分支上开发
$ git switch -c feature/login
# ... 提交若干次

# 2) main 更新了，把 main 的新东西接到自己分支上（rebase，私有分支）
$ git fetch origin
$ git rebase origin/main

# 3) 完成，推到远端，开 PR
$ git push -u origin feature/login

# 4) PR 被合并时，由平台做 merge（或 squash merge）
```

配置上把默认行为定死，能省很多意外：

```bash
$ git config --global pull.ff only        # pull 只允许快进，不自动合并
$ git config --global rebase.autoStash true  # rebase 前自动 stash 未提交的改动
```

### 5.4 解决冲突

冲突时 `git status` 会明确列出：

```text
Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   src/app.ts
```

打开文件，会看到冲突标记：

```text
<<<<<<< HEAD
const timeout = 3000;        ← 你当前分支（merge 时是 main）的内容
=======
const timeout = 5000;        ← 被合并分支的内容
>>>>>>> feature/login
```

`<<<<<<<` 后面跟的名字有讲究：

- **merge** 时：`HEAD` 是你所在的分支（`main`），另一边是 `feature`。
- **rebase** 时：`HEAD` 是**目标分支**（`main`），另一边才是你正在重放的提交。所以 `--ours` / `--theirs` 的含义在 rebase 里是**颠倒的**——这是最经典的踩坑点。不确定就用 `git log --merge -p <file>` 看清两边各自是什么。

解决流程：

```bash
# 1) 手工编辑，删掉冲突标记，留下正确内容
$ vim src/app.ts

# 2) 标记为已解决
$ git add src/app.ts

# 3) 继续
$ git merge --continue      # 或 git commit（merge 时）
$ git rebase --continue     # rebase 时

# 或者：放弃这次合并，回到干净状态
$ git merge --abort
$ git rebase --abort
```

常用辅助命令：

```bash
$ git diff --name-only --diff-filter=U   # 列出所有冲突文件
$ git checkout --ours src/app.ts         # 整份采用我方（merge 时）
$ git checkout --theirs src/app.ts       # 整份采用对方
$ git mergetool                          # 调用图形化工具（vimdiff、VS Code 等）
$ git merge --no-commit --no-ff <branch> # 先合但不提交，方便整体检查
```

配置一个顺手的合并工具（VS Code）：

```bash
$ git config --global merge.tool vscode
$ git config --global mergetool.vscode.cmd 'code --wait --merge $REMOTE $LOCAL $BASE $MERGED'
```

**减少冲突的工程手段**（比"手速快"有效得多）：

1. 分支生命周期短。活过一周的分支，冲突概率指数上升。
2. 每天 `git fetch` + `rebase origin/main`，让冲突小步出现。
3. 团队约定格式化工具（Prettier / gofmt / black），避免"只有空格不同"的假冲突。
4. 大重构提前打招呼，并且单独开分支、尽快合。
5. 打开 `rerere`，让 Git 记住你解决过的冲突：

   ```bash
   $ git config --global rerere.enabled true
   ```

   同一个冲突第二次出现时，Git 会自动套用上次的解法（`git rerere diff` 可以检查）。

### 5.5 练习

1. 造一个 fast-forward 合并，用 `git log --graph --oneline` 确认没有合并提交；再用 `--no-ff` 做一次，对比图形。
2. 造一个真冲突（两边改同一行），分别解决一次、`--abort` 一次。
3. 在 rebase 过程中观察 `git status` 里 `HEAD` 指向谁，确认 `--ours` / `--theirs` 与 merge 时相反。
4. 用 `git branch --merged main` 找出可以安全删除的分支。

<details>
<summary>参考答案</summary>

1. fast-forward 后图是直线；`--no-ff` 后多一个 `Merge branch 'feature'` 节点，`git log` 里能看到两条父链。
2. 冲突标记出现后，编辑删除标记 → `git add` → `git merge --continue`；`--abort` 则完全回退。
3. rebase 时 `HEAD` 是 `main`（目标），所以"我方"是 main，"对方"是被重放的提交。
4. `git branch --merged main` 的输出里，除 `main` 外都是已合并的，可以 `-d` 删除。

</details>

---

## 6. 撤销、回退与救援

### 6.1 先分清"撤什么"

犯错时先问三个问题，答案决定用哪条命令：

```text
1) 我要撤的是"还没提交的改动"，还是"已经进了历史的提交"？
2) 这个提交推给过别人吗？
3) 我想保留那些改动的内容吗？
```

```text
                       想保留内容                 不想保留
未提交的修改      git stash / 改回来            git restore <file>
已暂存未提交      git restore --staged <file>   git restore --staged --worktree <file>
已提交未推送      git reset --soft/--mixed      git reset --hard
已提交已推送      git revert <commit>           （不要 --hard 强推）
```

### 6.2 六个 `restore` 用法，覆盖"未提交"的 90% 场景

```bash
$ git restore src/app.ts                  # 丢弃工作区修改（回到暂存区版本）
$ git restore --staged src/app.ts         # 取消暂存（回到 HEAD 版本，工作区不动）
$ git restore --staged --worktree src/app.ts   # 两者都撤（彻底回到 HEAD）
$ git restore --source=HEAD~2 src/app.ts  # 取两个提交之前的版本
$ git restore --source=v1.0.0 --worktree src/   # 取某个标签下的整个目录
$ git restore .                           # 丢弃当前目录所有未暂存修改（危险）
```

记忆法：**`--staged` 管篮子，`--worktree` 管桌面，不写默认管桌面**。

`restore` 会**永久丢弃**工作区的修改（不进 reflog）。所以在跑 `git restore .` 之前，先 `git stash` 或者 `git diff` 看一眼——这也是为什么很多人宁可先 `git stash push -m "wip"`。

### 6.3 `reset` 三种模式：只动指针、动篮子、动桌面

```bash
$ git reset --soft HEAD~1     # 只移动分支指针；改动留在暂存区
$ git reset --mixed HEAD~1    # 移动指针 + 清空暂存区；改动留在工作区（默认）
$ git reset --hard HEAD~1     # 移动指针 + 清空暂存区 + 覆盖工作区（危险）
```

图示（撤销最近一个提交）：

```text
初始：      HEAD → C2 → C1
--soft：    HEAD → C1       暂存区仍是 C2 的内容（相当于 "撤销 commit，保留 add"）
--mixed：   HEAD → C1       暂存区清空（相当于 "撤销 commit 和 add"）
--hard：    HEAD → C1       工作区也回到 C1（改动没了，但 reflog 里 C2 还在）
```

三个高频用法：

```bash
# 提交信息写错了，想重新写（内容不变）
$ git reset --soft HEAD~1 && git commit -m "正确信息"

# 提交到错的分支了
$ git reset --soft HEAD~1      # 撤销这次提交，改动回到暂存区
$ git stash                    # 暂存起来
$ git switch right-branch
$ git stash pop

# 想撤销最近 3 个提交，但保留所有改动
$ git reset --soft HEAD~3
```

`--hard` 之后想救人：`git reflog` 找到那个哈希，`git reset --hard <hash>` 回来（6.7）。

### 6.4 `revert`：给已推送的历史"反向提交"

```bash
$ git revert <commit>              # 生成一个反向提交
$ git revert HEAD~3..HEAD          # 撤销一段（从旧到新依次 revert）
$ git revert --no-commit <commit>  # 只改工作区，不自动提交（多个一起撤时用）
$ git revert -m 1 <merge-commit>   # 撤销一个合并提交（1 表示保留第一父）
```

它**不改历史**，只追加新提交，所以可以安全地用在 `main` 上：

```text
之前：A ← B ← C           ← main
之后：A ← B ← C ← C'      ← main     （C' 的改动正好抵消 C）
```

撤销合并提交要小心：`-m 1` 告诉 Git"把主线当第一父"，撤销后那条分支的改动全部消失，**之后再想合并回来，Git 会认为已经合过了**。正确姿势是先 revert，日后要恢复时先 revert 那次 revert：

```bash
$ git revert <the-revert-commit>
```

### 6.5 分离头指针下写的提交，怎么救

```bash
$ git switch --detach HEAD~3
$ vim fix.ts
$ git commit -am "hotfix"
$ git switch main            # 警告：你正在离开一个没有名字的提交
```

这时那个提交只在 reflog 里：

```bash
$ git reflog | head -3
1a2b3c4 HEAD@{1}: commit: hotfix        ← 就是它
$ git branch hotfix 1a2b3c4             # 给它起个名字
# 或者
$ git switch -c hotfix 1a2b3c4
```

### 6.6 `stash`：临时挪开工作区

```bash
$ git stash push -m "调试一半"          # 保存（含已暂存 + 未暂存，不含未跟踪）
$ git stash push -u -m "含新文件"       # 连未跟踪文件一起（-u/--include-untracked）
$ git stash list                        # 看清单 stash@{0} 最新
$ git stash show -p stash@{1}           # 看内容
$ git stash pop                         # 取出并删除（可能冲突）
$ git stash apply stash@{1}             # 取出但保留（可多次应用）
$ git stash drop stash@{1}              # 删掉某个
$ git stash clear                       # 全清（不可恢复！）
$ git stash branch fix-branch stash@{0} # 把某个 stash 变成新分支（冲突时最稳）
```

`stash` 的典型误用是把它当长期存储。它没有说明、没有历史、容易和分支搞混——超过一天的东西，建分支。

### 6.7 reflog + fsck：最后的救援手段

```bash
$ git reflog                          # HEAD 的所有移动
$ git reflog show main                # 某个分支的移动历史
$ git log -g --oneline                # 同上，log 视角
```

reflog 只能救"曾经被引用过"的东西。如果分支被删、reflog 也过期了，还有一招：

```bash
$ git fsck --lost-found               # 找出所有"没有引用指向"的提交
$ git fsck --unreachable --no-reflogs
$ git show <dangling-commit>          # 确认内容
$ git branch rescue <dangling-commit>
```

`--lost-found` 会把找到的对象写到 `.git/lost-found/`。这是最后手段，成功率取决于 gc 有没有跑过（默认 `gc.reflogExpire` 90 天、`gc.reflogExpireUnreachable` 30 天）。

三个"救命"口诀：

```text
提交过 → reflog 能救
add 过  → git fsck --lost-found 可能能救（blob 还在）
从没 add 过 → 救不了（工作区内容 Git 根本不知道）
```

### 6.8 清理：`clean` 与"删干净"

```bash
$ git clean -n                # 预演（一定先 -n！）
$ git clean -f                # 删未跟踪文件
$ git clean -fd               # 连未跟踪目录
$ git clean -fdx              # 连 .gitignore 忽略的也删（会删掉 node_modules、.env）
```

`-x` 威力很大：把 `.env`、`node_modules`、本地数据库文件全删。用之前 `-n` 看一遍。

### 6.9 练习

1. 提交 A、B、C，用 `--soft` / `--mixed` / `--hard` 各撤销一次，观察 `git status` 与文件内容差异。
2. 制造"提交到错分支"，按 6.3 的方法修好。
3. 在分离头指针下提交一次，切回 main，用 reflog 找回并建分支。
4. 解释：`git revert` 和 `git reset --hard` 都能"撤销一个提交"，为什么团队分支上只能用前者？

<details>
<summary>参考答案</summary>

1. `--soft` 后 `git status` 显示 `Changes to be committed`；`--mixed` 显示 `Changes not staged`；`--hard` 什么都不显示（文件内容也回退了）。
2. `git reset --soft HEAD~1` → `git stash` → 切到正确分支 → `git stash pop`。
3. `git reflog | grep hotfix` 找到哈希 → `git switch -c hotfix <hash>`。
4. revert 只追加新提交，历史对其他人的本地仓库仍然兼容；reset 改写了历史，别人 pull 会分叉或覆盖他们的工作。

</details>

---

## 7. 远程协作

### 7.1 远端是什么

```bash
$ git remote -v
origin  git@github.com:user/repo.git (fetch)
origin  git@github.com:user/repo.git (push)
```

`origin` 只是个约定俗成的名字，不是关键字。一个仓库可以有多个远端：

```bash
$ git remote add upstream https://github.com/original/repo.git   # 上游（fork 场景）
$ git remote add backup git@backup.example.com:repo.git
$ git remote set-url origin <new-url>
$ git remote remove upstream
```

### 7.2 `fetch` 与 `pull`：一定要分清

```bash
$ git fetch origin            # 把远端的新提交下载到本地，更新 origin/main，不动你的分支
$ git pull                    # = fetch + 合并（默认 merge，可配置成 rebase / ff-only）
```

**推荐把 `pull` 配成只允许快进**：

```bash
$ git config --global pull.ff only
```

这样如果本地和远端分叉了，`git pull` 会直接报错而不是悄悄造一个合并提交。看到报错，你就知道该显式选择 rebase 还是 merge。

`fetch` 的安全价值：它不改工作区，可以随时执行。养成"开工前先 fetch 看一眼"的习惯：

```bash
$ git fetch --all --prune         # --prune 顺便清理远端已删除的分支引用
$ git log --oneline HEAD..origin/main   # 远端有什么我没有
$ git log --oneline origin/main..HEAD   # 我有什么远端没有
```

`..` 这个双点语法（7.6 会说清）是"看谁领先"的日常工具。

### 7.3 `push` 与 `--force-with-lease`

```bash
$ git push                                    # 推当前分支到同名远端分支
$ git push -u origin feature/login            # 首次推送并建立跟踪关系
$ git push origin --delete old-branch         # 删除远端分支
$ git push --tags                             # 推所有标签
$ git push origin v1.2.0                      # 推单个标签
```

改写历史后（rebase 过自己的分支）必须强推。**永远不要用 `--force`，用 `--force-with-lease`**：

```bash
$ git push --force-with-lease
```

区别：`--force` 会无条件覆盖远端，即使别人在你 fetch 之后推了新提交（把别人的工作直接抹掉）；`--force-with-lease` 会先检查"远端还是不是我上次看到的那个提交"，如果不是就拒绝。它把"覆盖别人"变成"只有在我知情的情况下才覆盖"。

最保险的版本是显式指定期望的旧值：

```bash
$ git push --force-with-lease=feature/login:<expected-sha>
```

### 7.4 跟踪分支与 `origin/main`

```bash
$ git branch -vv                      # 看每个分支跟踪谁、领先/落后多少
$ git switch -c local-name origin/remote-name   # 基于远端分支建本地分支
$ git branch -u origin/main           # 给当前分支设置上游
$ git push -u origin main             # 推送并设置上游
```

`origin/main` 是**只读的本地副本**，记录"我上次 fetch 时远端在哪"。它不是实时的，必须 fetch 才更新。这解释了一个常见困惑："为什么 `git log origin/main` 看不到同事刚推的提交？"——因为你没 fetch。

### 7.5 拉取请求（PR/MR）时代的协作流程

平台不同，叫法不同（GitHub PR、GitLab MR、Gitee PR），机制一致：**在一个分支上开发 → 推送到远端 → 请求合并到目标分支**。

标准流程：

```bash
# 1) 从最新的 main 开分支
$ git switch main
$ git pull --ff-only
$ git switch -c feature/login

# 2) 开发、提交（小步提交，信息清楚）
$ git add -p && git commit -m "feat(login): 增加邮箱登录表单"

# 3) 推送，开 PR
$ git push -u origin feature/login

# 4) 评审期间，把 main 的新改动接进来（保持分支线性）
$ git fetch origin && git rebase origin/main
$ git push --force-with-lease

# 5) 评审通过，平台上合并；本地清理
$ git switch main && git pull --ff-only
$ git branch -d feature/login
```

合并方式的选择（平台提供三种）：

| 方式 | 结果 | 什么时候用 |
| --- | --- | --- |
| Merge commit | 保留所有提交 + 一个合并提交 | 想保留完整开发过程 |
| Squash and merge | 整个 PR 变成一个提交 | 中间提交质量不高、想要干净主线（最常见） |
| Rebase and merge | 每个提交线性接到 main 上 | 提交本身写得很好，想保留粒度 |

### 7.6 双点与三点，再强调一次

```bash
$ git log A..B        # 在 B 里但不在 A 里的提交
$ git log A...B       # A 和 B 分叉之后各自独有的提交（对称差）
$ git diff A..B       # A 和 B 的内容差异（等于 diff A B）
$ git diff A...B      # 从"共同祖先"到 B 的差异
```

记法：`..` 是"集合差"，`...` 是"从分叉点算"。看 PR 用 `...`。

### 7.7 冲突在远端也会发生

别人先推了，你的推送被拒：

```text
! [rejected]        main -> main (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally.
```

这不是错误，是保护。选择之一：

```bash
$ git pull --rebase       # 把我的提交接到远端之后（线性）
# 解决冲突 → git add → git rebase --continue
$ git push
```

不要用 `--force` 绕过——那会删掉别人的提交。

### 7.8 练习

1. 建两个本地仓库（`git init --bare` 当远端），模拟 push / fetch / 被拒绝 / `--force-with-lease` 的全过程。
2. 用 `git branch -vv` 观察本地分支与远端分支的领先/落后关系。
3. 在 rebase 之后用 `--force` 与 `--force-with-lease` 各推一次，观察差异（先用第二个仓库模拟"别人也推了"的情况）。
4. 解释：为什么 `--force-with-lease` 在没有 fetch 的情况下也可能不安全？

<details>
<summary>参考答案</summary>

1. `git init --bare remote.git`；`git remote add origin ../remote.git`；push 后另建 clone，两边各提交，制造拒绝。
2. `-vv` 会显示 `[origin/main: ahead 2, behind 1]`。
3. `--force` 直接覆盖；`--force-with-lease` 在远端有新提交时拒绝并提示 `stale info`。
4. 因为它比较的是你本地的 `origin/xxx` 引用。如果你很久没 fetch，这个引用是旧的，lease 检查就形同虚设。

</details>

---

## 8. 标签、版本与发布

### 8.1 轻量标签 vs 附注标签

```bash
$ git tag v1.0.0                          # 轻量标签：只是一个指向提交的引用
$ git tag -a v1.0.0 -m "第一个正式版"      # 附注标签：带作者、日期、说明，可签名
$ git tag -a v1.0.0 <commit> -m "补打标签"
$ git tag                                 # 列出
$ git tag -l "v1.*"                       # 匹配
$ git show v1.0.0                         # 看附注标签的元数据
$ git tag -d v1.0.0                       # 删本地
$ git push origin --delete v1.0.0         # 删远端
```

**发布用附注标签**。轻量标签连"谁在什么时候打的"都不记录，出问题没法追。

签名标签（需要 2.8 的签名配置）：

```bash
$ git tag -s v1.0.0 -m "signed release"
$ git tag -v v1.0.0        # 验证
```

### 8.2 语义化版本

```text
主版本.次版本.修订号
  1  .  4  .  2
```

| 变化 | 什么时候加 |
| --- | --- |
| 主版本 | 不兼容的 API 变更 |
| 次版本 | 向后兼容地加功能 |
| 修订号 | 向后兼容地修 bug |

实战细节：

- `0.x.y` 表示"还没稳定"，API 随时可能变。
- 预发布版：`1.0.0-rc.1`、`1.0.0-beta.2`，排序上小于 `1.0.0`。
- 构建元数据：`1.0.0+build.5`，不参与排序。
- 不要用 `v1.0` 这种缩写打标签，工具链解析会出问题。

### 8.3 发布流程（可复制）

```bash
# 1) 确认干净
$ git status
$ git switch main && git pull --ff-only

# 2) 跑测试、改版本号（package.json / pyproject.toml / CMakeLists.txt）
$ npm version minor          # 自动改版本、提交、打 v 标签（Node 项目）
# 或者手工：
$ git commit -am "chore(release): v1.4.0"

# 3) 打附注标签
$ git tag -a v1.4.0 -m "v1.4.0: 支持批量导入"

# 4) 推提交与标签
$ git push origin main
$ git push origin v1.4.0

# 5) 平台自动从标签构建（GitHub Release / GitLab Release）
```

`git describe` 能把"当前提交"翻译成人话，CI 里常用来生成版本号：

```bash
$ git describe --tags --always --dirty
v1.4.0-3-g8f3c1e2-dirty
#  最近的标签 - 领先几个提交 - g+哈希 - 工作区有未提交改动
```

### 8.4 标签与发布分支的关系

两种常见模型：

```text
A) 标签即发布（主流）
   main 上每个稳定点打标签，CI 按标签构建
   main: A—B—C—D—E
              ↑     ↑
            v1.0  v1.1

B) 发布分支 + 标签（需要给老版本打补丁时）
   main:      A—B—C—D—E—F
                     ↓ 分出
   release/1.x:      C'—D'（只放修复）
                        ↑
                      v1.1.1
```

选 A 的前提是"只维护最新版本"。一旦要同时支持 1.x 和 2.x，就必须有发布分支，否则老版本的修复无法交付。

### 8.5 练习

1. 打一个附注标签和一个轻量标签，用 `git show` 对比输出。
2. 用 `git describe --tags` 在打过标签的仓库里生成描述，解释每一段的含义。
3. 模拟"给两个提交之前的提交补打标签"，并推送到远端。

<details>
<summary>参考答案</summary>

1. 附注标签 `git show` 会先显示 tag 对象（tagger、日期、说明），再显示提交；轻量标签直接显示提交。
2. `v1.4.0` 是最近标签，`-3` 表示领先 3 个提交，`g8f3c1e2` 是提交哈希前缀，`-dirty` 表示工作区脏。
3. `git tag -a v1.0.0 <commit> -m "..."` 然后 `git push origin v1.0.0`。

</details>

---

## 9. 历史搜索与取证

### 9.1 找"哪次提交引入了这行"

```bash
$ git log -S "maxRetries" --oneline          # 内容中出现/消失该字符串的提交（pickaxe）
$ git log -S "maxRetries" -p                 # 带 diff
$ git log -G "maxRetr.*=.*3" --oneline       # 按正则匹配 diff 内容
$ git log -L 12,20:src/app.ts                # 某个文件某几行的演变史
$ git blame src/app.ts                        # 每行最后一次是谁改的
$ git blame -L 10,25 src/app.ts              # 只看这几行
$ git blame -w -C -C src/app.ts              # 忽略空白、追踪跨文件复制
```

`-S` 和 `-G` 的区别容易混：`-S` 数"出现次数变了没有"（字符串增删），`-G` 直接匹配 diff 里的正则。

`git blame` 的真实用途不是"追责"，而是**理解代码为什么长这样**：拿到那一行的提交，再 `git show <commit>` 看完整上下文和提交信息。

### 9.2 `bisect`：二分定位 bug

一个 500 个提交的区间里有个 bug，逐个试太慢。二分只要 log₂(500) ≈ 9 次。

```bash
$ git bisect start
$ git bisect bad                 # 当前版本有 bug
$ git bisect good v1.3.0         # 这个版本是好的
# Git 自动检出中间的提交，你测试
$ git bisect good                # 或 git bisect bad
# ... 重复几次
$ git bisect reset               # 结束，回到原分支
```

自动化（有测试脚本时最爽）：

```bash
$ git bisect start HEAD v1.3.0
$ git bisect run npm test
```

`git bisect run` 用退出码判断：0 = good，1-127（除 125）= bad，125 = skip。它会把区间缩到一个提交并打印出来。

### 9.3 `worktree`：同时开多个分支

不用 `stash` 来切场景——直接给另一个分支开一个目录：

```bash
$ git worktree add ../project-hotfix hotfix/urgent
$ git worktree list
$ git worktree remove ../project-hotfix
```

典型用途：

- 线上出 bug 要紧急修，但当前分支改了一半。
- 一边跑长测试，一边继续开发。
- 对照两个分支的代码（配 IDE 双开）。

注意：**同一个分支不能在两个 worktree 同时检出**（Git 会拒绝），这是有意的保护。

### 9.4 其他取证工具

```bash
$ git show HEAD@{yesterday}          # reflog 的时间语法
$ git log --diff-filter=D --summary  # 找出被删除的文件
$ git log --all -- source/old.ts     # 所有分支里这个文件的提交
$ git rev-parse HEAD                 # 哈希
$ git rev-parse --short HEAD
$ git rev-parse --abbrev-ref HEAD    # 当前分支名（脚本里常用）
$ git merge-base main feature        # 共同祖先
$ git merge-tree --write-tree main feature   # 不用检出就能预演合并冲突
```

`git merge-tree`（2.38+ 的新实现）在 CI 里很有用：判断"这个 PR 合并到 main 会不会冲突"，不需要真的切分支。

### 9.5 练习

1. 用一个字符串做 `-S` 搜索，确认它是在哪次提交里被引入的。
2. 构造 8 个提交、其中一个引入 bug，用 `git bisect` 找到它。
3. 用 `git blame -L` 查某个函数最后一行的作者与提交，然后 `git show` 看当时的完整改动。
4. 用 `worktree` 同时打开两个分支，验证同一分支不能重复检出。

<details>
<summary>参考答案</summary>

1. `git log -S "字符串" --oneline` 会列出引入和删除它的提交，取最早的那个。
2. `bisect start` → `bad` → `good <好提交>` → 循环标记 → `reset`。
3. `git blame -L 30,45 file.ts` 拿到哈希，`git show <hash>` 看上下文。
4. 第二次 `worktree add` 同一分支会报 `already checked out at`。

</details>

---

## 10. 团队工作流

### 10.1 三种主流模型

**A. GitHub Flow（最简单，适合持续部署）**

```text
main 永远可发布
  └── 每个需求/修复开一个短分支
        └── PR → review → 合并 → 立即部署
```

规则只有两条：`main` 永远可部署；分支生命周期以天计。适合 Web 服务、SaaS。

**B. GitLab Flow（带环境分支）**

```text
feature → main → pre-production → production
```

代码从左往右流，每次合并到下游环境分支就触发一次部署。适合需要"预发验证"的团队。

**C. 发布分支模型（Git Flow 的简化版）**

```text
main（生产）  ← hotfix/* 直接修
develop       ← feature/* 合并进来
release/1.4   ← 从 develop 切出，只修 bug
```

适合有明确版本号、需要长期维护多个版本的产品（桌面软件、SDK、嵌入式）。**不适合**每天多次部署的 Web 应用——分支太重，合并地狱。

### 10.2 trunk-based 与特性开关

比 Git Flow 更激进的流派：所有人直接往 `main` 提交（或提交寿命 < 1 天的分支），未完成的功能用**特性开关**（feature flag）藏在代码里。

```javascript
// 未完成的功能合并进主干，但默认关闭
if (flags.enabled("new-checkout")) {
  return renderNewCheckout();
}
return renderLegacyCheckout();
```

好处：没有长期分支，就没有长期冲突；随时可发布任意组合。代价：需要开关管理（清理死开关是硬性纪律），测试矩阵变大。

### 10.3 分支命名与提交规范

约定本身不重要，重要的是**全队一致**。一套可用的约定：

```text
feature/<issue>-<short-desc>      feature/142-email-login
fix/<issue>-<short-desc>          fix/201-null-title
chore/<desc>                      chore/upgrade-node
hotfix/<desc>                     hotfix/session-leak
```

提交类型（Conventional Commits 常用子集）：

```text
feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert
```

配上工具可以自动生成 changelog：

```bash
$ npx standard-version            # 或 release-please / semantic-release
```

### 10.4 代码评审里的 Git 技巧

```bash
# 拉下 PR 分支到本地试跑
$ git fetch origin pull/142/head:pr-142
$ git switch pr-142

# 看这个 PR 相对 main 改了什么（三点！）
$ git diff origin/main...pr-142

# 只看某个文件的改动
$ git diff origin/main...pr-142 -- src/auth.ts

# 把评审意见直接落到本地提交（配合 --fixup 整理）
$ git commit --fixup=<被指出的提交>
```

平台上的 "suggest change" 功能本质就是生成一个 patch，本地 `git apply` 即可。

### 10.5 事故处理：线上回滚

```bash
# 情况一：最近一次部署有问题，且历史可改（自己维护、无外部依赖）
$ git revert <bad-commit>
$ git push

# 情况二：坏提交很多、想整体回到上个已知良好版本
$ git revert --no-commit v1.3.0..HEAD
$ git commit -m "revert: 回滚到 v1.3.0"

# 情况三：部署系统按标签发布
$ git checkout v1.3.0        # 或让 CI 重新部署旧标签
```

**回滚也是一次变更**，同样要走 PR / 审批 / 记录。直接在生产机上 `git checkout` 是事故放大器。

### 10.6 练习

1. 用 GitHub Flow 的规则，为一个假想需求走完整流程（分支、提交、PR 描述、合并、清理）。
2. 对比 GitHub Flow 与 Git Flow：各自在什么团队规模/发布节奏下更合适？
3. 用 `git revert --no-commit A..B` 撤销一段历史，检查工作区内容是否等于 A 的状态。

<details>
<summary>参考答案</summary>

1. 关键点：从最新 main 切分支、提交信息带类型和范围、PR 描述写"做了什么/为什么/怎么验证"、合并后删分支。
2. GitHub Flow 适合小团队 + 持续部署；Git Flow 适合多版本并行维护、发布周期长的产品。
3. 是的（忽略期间新增的文件），因为每个 commit 都被反向应用了一次。

</details>

---

## 11. 大仓库、性能与存储

### 11.1 先诊断：慢在哪

```bash
$ git count-objects -vH          # 对象数量与体积
$ git gc --prune=now            # 手动整理（一般不需要）
$ git maintenance run --task=gc
$ time git status               # 定位是 status 慢还是 log 慢
$ git config --get core.fsmonitor
```

常见原因与对策：

| 症状 | 原因 | 对策 |
| --- | --- | --- |
| `git status` 慢 | 工作区文件太多（`node_modules` 被跟踪） | 加 `.gitignore`，`git rm -r --cached` |
| `git log` 慢 | 提交太多、没有 commit-graph | `git maintenance start` |
| clone 慢 | 仓库太大/历史太长 | 浅克隆、部分克隆、LFS |
| checkout 慢 | 文件多、磁盘慢 | `sparse-checkout`、`core.fsmonitor=true` |

### 11.2 浅克隆与部分克隆

```bash
$ git clone --depth 1 <url>                  # 只要最近 1 个提交（CI 首选）
$ git clone --shallow-since="2026-01-01" <url>
$ git clone --filter=blob:none <url>         # 部分克隆：不要文件内容，按需下载
$ git clone --filter=tree:0 <url>            # 连 tree 也不要（最快，适合只看最近的提交）
```

部分克隆（partial clone）的关键点：`git log`、`git diff` 正常用，第一次 `git checkout` 某个旧提交时会**按需**从远端拉 blob（需要网络）。适合"只在需要时看老代码"的场景。

```bash
$ git fetch --filter=blob:none --no-tags origin
```

### 11.3 `sparse-checkout`：只检出部分目录

超大 monorepo 里，你只关心 `packages/web/`：

```bash
$ git clone --filter=blob:none --sparse <url>
$ cd repo
$ git sparse-checkout set packages/web packages/shared
$ git sparse-checkout list
$ git sparse-checkout add docs
$ git sparse-checkout disable          # 回到完整检出
```

默认是 cone 模式（按目录），性能最好、心智最简单。`--no-cone` 支持 gitignore 风格的模式，但更慢也更容易出错，除非确有必要。

注意两条现状（2026 年）：整条 `sparse-checkout` 命令的官方文档**仍标注 EXPERIMENTAL**，`git sparse-checkout init` 子命令与 non-cone 模式已被标记弃用（用 `set` 代替 `init`）；`sparse-index`（真正只索引部分目录）也仍是实验特性。功能可用、日常用着没问题，但别指望它"行为永远不变"。

### 11.4 Git LFS：大文件

图片、视频、数据集、二进制产物不适合放普通 Git 历史（每次改动都存一份全量）。

```bash
$ git lfs install
$ git lfs track "*.psd"
$ git add .gitattributes
$ git add design.psd && git commit -m "add design"
```

LFS 把大文件存到独立服务器，仓库里只留一个指针文件。要点：

- **务必用 LFS 3.8.1 或更新版本**（2026-10-22 发布，修了 4 个 CVE）；老版本客户端有已知安全问题。
- **必须在提交大文件之前 track**。已经进了历史的大文件，需要 `git lfs migrate import --include="*.psd"`（会重写历史，慎用）。
- clone 时需要装 LFS，否则拿到的是指针文本。
- `git lfs ls-files`、`git lfs status` 排查。

### 11.5 仓库整洁度巡查

```bash
$ git ls-files | wc -l                       # 跟踪了多少文件
$ git ls-files -o --exclude-standard | head  # 未跟踪但没被忽略的（说明 .gitignore 有漏）
$ git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n -r | head -20   # 最大的 20 个对象
$ git filter-repo --analyze                  # 需要 git-filter-repo，生成仓库分析报告
```

发现误提交的大文件（比如 200MB 的 zip）后，用 `git filter-repo`（推荐，比老的 `filter-branch` 快且安全）：

```bash
$ git filter-repo --path big.zip --invert-paths
```

注意：这会重写全部历史哈希，所有协作者都必须重新 clone。

### 11.6 `maintenance`：把日常保养自动化

```bash
$ git maintenance start        # 注册后台计划任务（Windows 用 schtasks）
$ git maintenance run --task=commit-graph
$ git maintenance run --task=prefetch
```

它会定期做 `gc`、`commit-graph`、`prefetch`（提前下载远端对象）、`incremental-repack`。对每天开着的仓库，开一次就够（2.29 起可用，大仓库官方明确推荐）。

`commit-graph` 值得单独说：它把提交的父子关系与时间预先算好存成二进制，`git log --graph` 在大仓库上能快一个数量级。带 `--changed-paths`（Bloom 过滤器）时，`git log -- <path>` 这种"按路径查历史"也会快很多。

> **不要把 `git maintenance` 和手动 `git gc` 混用**：官方文档专门警告过，两者同时跑会互相打架（抢 lock、重复打包）。用了 maintenance 就不要再手敲 `gc`。

### 11.7 练习

1. 在一个有很多文件的仓库里分别测 `git status` 与 `git log` 的耗时，解释差异来源。
2. 用 `--filter=blob:none` 克隆一个仓库，断网后 `git show` 一个老提交，观察行为。
3. 用 `git sparse-checkout` 只检出两个目录，确认 `git status` 里看不到其他目录。
4. 用 11.5 的命令找出仓库里最大的 3 个对象。

<details>
<summary>参考答案</summary>

1. `status` 慢通常是文件系统遍历（未跟踪文件多、`node_modules` 未忽略）；`log` 慢是对象/图遍历，可用 commit-graph 加速。
2. 会尝试按需拉取，断网则报错（`could not fetch ...`），说明部分克隆依赖网络。
3. 其他目录的文件从工作区消失，但历史仍在；`git sparse-checkout list` 能看到规则。
4. 按 size 排序取前三，通常能发现误提交的产物文件。

</details>

---

## 12. 钩子、子模块与自动化

### 12.1 钩子是什么

`.git/hooks/` 下有一批可执行脚本，Git 在特定时机调用它们。默认全是 `.sample` 后缀（不生效）。

```bash
$ ls .git/hooks/
applypatch-msg.sample      pre-push.sample
commit-msg.sample          pre-rebase.sample
post-commit.sample         pre-receive.sample
pre-commit.sample          update.sample
```

去掉 `.sample` 并给执行权限就生效。**钩子是本地的、不随仓库分发**——这是它最容易被误解的一点。想团队共享，要么用 `core.hooksPath` 指向仓库里的目录，要么用工具（Husky、pre-commit、lefthook）。

常用的几个：

| 钩子 | 时机 | 典型用途 |
| --- | --- | --- |
| `pre-commit` | 提交前 | 格式化、lint、跑快测试 |
| `commit-msg` | 提交信息写完后 | 校验 Conventional Commits 格式 |
| `pre-push` | 推送前 | 跑完整测试 |
| `post-checkout` | 切分支后 | 装依赖、提示 |
| `pre-rebase` | rebase 前 | 阻止对已推送分支 rebase |

### 12.2 自己写一个 `pre-commit`

```bash
#!/bin/sh
# .git/hooks/pre-commit
set -e

# 1) 禁止提交调试代码
if git diff --cached | grep -nE '^\+.*(console\.log|debugger|pdb\.set_trace)'; then
  echo "✗ 提交里有调试代码，请先删掉（或 git commit --no-verify 跳过）"
  exit 1
fi

# 2) 禁止提交大文件（> 5MB）
for f in $(git diff --cached --name-only --diff-filter=ACM); do
  if [ -f "$f" ] && [ "$(wc -c < "$f")" -gt 5242880 ]; then
    echo "✗ $f 超过 5MB，考虑用 Git LFS"
    exit 1
  fi
done

# 3) 有 package.json 就跑格式化
if [ -f package.json ]; then
  npx --no-install prettier --check . || {
    echo "✗ 格式不一致，运行 npx prettier --write . 后重试"
    exit 1
  }
fi
```

```bash
$ chmod +x .git/hooks/pre-commit      # Linux/macOS
# Windows 上 Git Bash 里的 chmod 同样有效
```

> 钩子可以用 `git commit --no-verify` 跳过。它的定位是"减少低级错误"，**不是安全边界**——真正的检查必须在 CI 里做。

### 12.3 团队共享钩子：`core.hooksPath`

```bash
$ mkdir -p .githooks
$ cp .git/hooks/pre-commit .githooks/
$ git config core.hooksPath .githooks    # 写进仓库配置（或让每个人自己执行）
```

更常见的做法是用现成工具，它们顺带处理了"安装钩子"这一步：

| 工具 | 生态 | 用法 |
| --- | --- | --- |
| Husky + lint-staged | Node | `npx husky init`，pre-commit 里跑 lint-staged（只检查暂存文件） |
| pre-commit | Python | `.pre-commit-config.yaml` 声明一堆检查器 |
| lefthook | Go（快） | `lefthook.yml`，并行跑多个检查 |

### 12.4 `commit-msg` 校验规范

```bash
#!/bin/sh
# .git/hooks/commit-msg
msg_file="$1"
first_line=$(head -n1 "$msg_file")

# 允许合并提交与 revert
case "$first_line" in
  "Merge "*|"Revert "*|"fixup! "*|"squash! "*) exit 0 ;;
esac

if ! printf '%s' "$first_line" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\([a-z0-9-]+\))?: .{4,}'; then
  echo "✗ 提交信息不符合规范，例如：feat(auth): 支持邮箱登录"
  exit 1
fi

if [ "${#first_line}" -gt 72 ]; then
  echo "✗ 标题超过 72 字符"
  exit 1
fi
```

### 12.5 子模块（submodule）：谨慎使用

子模块让你在一个仓库里嵌入另一个仓库的某个提交。

```bash
$ git submodule add https://github.com/user/lib.git vendor/lib
$ git submodule update --init --recursive    # 克隆后初始化
$ cd vendor/lib && git switch main && git pull
$ cd ../.. && git add vendor/lib && git commit -m "chore: 升级 lib"
$ git submodule status
```

它的痛点：clone 之后必须记得 `--recursive`；子模块里改代码容易忘记推；CI 配置复杂；分支切换时状态容易脏。

**经验法则**：

- 需要"锁死某个第三方版本、且它不在包管理器里" → 可以考虑子模块。
- 需要"共享内部代码" → 用包管理器（npm workspace / Python path 依赖 / monorepo 工具）。
- 只是想引入第三方代码 → 用依赖管理，不要子模块。

### 12.6 子树（subtree）与替代方案

`git subtree` 把另一个仓库的内容合并进子目录，历史也合并进来：

```bash
$ git subtree add --prefix=vendor/lib https://github.com/user/lib.git main --squash
$ git subtree pull --prefix=vendor/lib https://github.com/user/lib.git main --squash
```

比子模块"笨"但更省心：克隆者不需要额外操作。代价是历史膨胀、命令冗长。

现代团队更常见的替代：**monorepo + 包管理器 workspace**（npm/pnpm workspace、uv workspace、Cargo workspace），或者干脆把库发布成包。

### 12.7 CI 里的 Git 技巧

```bash
# 只拉最近 1 个提交（省时间）
$ git clone --depth 1 --branch main <url>

# 判断这次推送是不是打标签
$ git describe --tags --exact-match

# 生成"上次发布以来的变更"
$ git log --oneline v1.3.0..HEAD

# 检查是否有合并冲突（不检出）
$ git merge-tree --write-tree origin/main HEAD

# 拿提交数量/哈希做缓存 key
$ git rev-parse --short HEAD
```

平台通常提供现成变量（`GITHUB_SHA`、`CI_COMMIT_REF_NAME`），优先用它们的。

### 12.8 练习

1. 写一个 `pre-commit`，禁止提交含 `TODO` 的改动，并测试它能否被 `--no-verify` 跳过。
2. 用 `core.hooksPath` 把钩子放进仓库目录，验证另一个 clone 也能生效。
3. 用 `git mergetool` 之外的方式解决冲突后，`git commit` 是否还需要特殊参数？
4. 解释：为什么子模块在 CI 里经常"少文件"？

<details>
<summary>参考答案</summary>

1. `grep -nE '^\+.*TODO'` 命中就 `exit 1`；`--no-verify` 会跳过所有钩子。
2. `git config core.hooksPath .githooks` 写进仓库后，clone 下来的人仍需执行一次（或写进 CI/文档）。
3. 不需要，冲突标记消失且 `git add` 后即可正常 `git commit`（merge 时 Git 已准备好合并提交信息）。
4. 因为默认 `git clone` 不递归初始化子模块，必须 `git submodule update --init --recursive`。

</details>

---

## 13. 实战：从零到团队协作

这一章是一条可照抄的完整路径，中间穿插真实事故的复盘。**建议边读边在临时目录里敲一遍**。

### 13.1 准备一个"远端"

为了不依赖网络，用本地裸仓库模拟远端：

```bash
$ mkdir git-demo && cd git-demo
$ git init --bare remote.git                 # 裸仓库：没有工作区的仓库
$ git clone remote.git alice
$ git clone remote.git bob
```

现在 `alice/` 和 `bob/` 是两个独立的工作副本，`remote.git` 是共享的"服务器"。

### 13.2 Alice：建项目、写代码、推上去

```bash
$ cd alice
$ git config user.name "Alice"
$ git config user.email "alice@example.com"

$ printf '# todo\n' > README.md
$ printf 'export const version = "0.1.0";\n' > index.js
$ git add .
$ git commit -m "feat: 初始化项目"
$ git push -u origin main
```

### 13.3 Bob：拉下来、开分支、提 PR 内容

```bash
$ cd ../bob
$ git config user.name "Bob"
$ git config user.email "bob@example.com"
$ git switch -c feature/add-task
$ printf 'export const tasks = [];\n' >> index.js
$ git add index.js
$ git commit -m "feat(task): 增加任务列表"
$ git push -u origin feature/add-task
```

### 13.4 Alice 评审并合并

```bash
$ cd ../alice
$ git fetch origin
$ git log --oneline --graph --all        # 看清发生了什么
$ git diff main...origin/feature/add-task  # 三点：这个分支带来了什么
$ git merge --no-ff origin/feature/add-task -m "merge: feature/add-task"
$ git push
```

### 13.5 事故剧本一：密钥被提交了

```bash
# Bob 不小心把 .env 提上去了
$ echo 'API_KEY=secret-123' > .env
$ git add .env && git commit -m "chore: 配置"
$ git push
```

**第一步永远是：立刻吊销那个密钥。** Git 历史可以改，但已经公开的密钥不能等。

然后从历史里彻底删除：

```bash
# 用 filter-repo（需 pip install git-filter-repo）
$ git filter-repo --path .env --invert-paths
$ git push --force-with-lease --all
```

如果只想"以后不再跟踪"，但仍接受历史里有（密钥已吊销）：

```bash
$ echo '.env' >> .gitignore
$ git rm --cached .env
$ git commit -m "chore: 停止跟踪 .env"
```

> 教训：`.gitignore` 要在第一次提交之前写。项目模板里带上 `.env` 与 `.env.example` 是好习惯。

### 13.6 事故剧本二：`reset --hard` 手滑

```bash
$ git reset --hard HEAD~3        # 本来只想 --soft
```

```bash
$ git reflog
8f3c1e2 HEAD@{0}: reset: moving to HEAD~3
a1b2c3d HEAD@{1}: commit: 第三个提交     ← 目标
$ git reset --hard a1b2c3d
```

如果连 reflog 都没了（极少见），`git fsck --lost-found` 是最后的希望（6.7）。

### 13.7 事故剧本三：提交到了 `main`

```bash
$ git switch main
$ vim fix.js && git commit -am "fix: 修好了"
# 完了，应该在 feature 分支上
```

```bash
# 方案 A：把提交挪到新分支（推荐）
$ git switch -c feature/fix
$ git switch main
$ git reset --hard origin/main

# 方案 B：已经推送了但只有自己用这条分支
$ git reset --soft HEAD~1 && git stash
$ git switch -c feature/fix && git stash pop
```

### 13.8 事故剧本四：rebase 后冲突没完没了

```bash
$ git rebase origin/main
CONFLICT (content): Merge conflict in index.js
```

```bash
$ git status                    # 看清在重放哪个提交
$ vim index.js                  # 解决
$ git add index.js
$ git rebase --continue
# 又来一个冲突，重复；如果实在乱：
$ git rebase --abort            # 全部回到起点
# 换个策略：直接 merge 一次解决
$ git merge origin/main
```

### 13.9 事故剧本五：分支被误删

```bash
$ git branch -D feature/important      # 手滑
```

```bash
$ git reflog | grep "feature/important"
$ git branch feature/important <hash>
```

分支删除只删 `.git/refs/heads/` 下那个文件，提交对象还在，所以几乎总能找回。

### 13.10 事故剧本六：两个远端（fork 工作流）

给开源项目提 PR 时的标准配置：

```bash
$ git remote add upstream https://github.com/original/repo.git
$ git fetch upstream
$ git switch -c fix/typo upstream/main
# 改完
$ git push -u origin fix/typo
# 开 PR 到 upstream

# 之后保持同步
$ git fetch upstream
$ git switch main && git reset --hard upstream/main
```

### 13.11 事故剧本七：仓库太大，clone 不下来

```bash
$ git clone --depth 1 <url>                        # 先能跑起来
$ git clone --filter=blob:none --sparse <url>      # 再按需取
$ git sparse-checkout set apps/my-service
```

如果历史里确实有巨型文件，只有 `git filter-repo` 能根治——需要所有协作者配合重新 clone。

### 13.12 完整的日常循环

```bash
# 开工
$ git switch main && git pull --ff-only
$ git switch -c feature/xxx

# 干活（小步提交）
$ git add -p
$ git commit -m "feat(xxx): ..."

# 同步主干（每天至少一次）
$ git fetch origin && git rebase origin/main

# 推送、开 PR
$ git push -u origin feature/xxx

# 评审意见 → fixup 提交 → 整理
$ git commit --fixup=<hash>
$ git rebase -i --autosquash origin/main
$ git push --force-with-lease

# 合并后清理
$ git switch main && git pull --ff-only
$ git branch -d feature/xxx
$ git fetch --prune
```

把这段贴在自己的笔记里，前两周照着执行，形成肌肉记忆之后再按需变通。

---

## 14. 陷阱与反模式清单

### 14.1 会丢东西的操作（红色）

| 操作 | 丢了什么 | 能不能救 |
| --- | --- | --- |
| `git reset --hard` | 未提交的工作区改动 | 不能；已提交的能靠 reflog |
| `git restore .` / `git checkout -- .` | 未暂存改动 | 不能 |
| `git clean -fdx` | 未跟踪文件（含 `.env`） | 不能 |
| `git stash clear` | 所有 stash | 极难（fsck） |
| `git push --force` | 别人在远端的提交 | 别人的 reflog 可能能救 |
| `git checkout <branch> -- .` | 当前分支未提交改动 | 不能 |

**通用自保三件套**：

```bash
$ git stash push -u -m "wip: 实验性改动"   # 动手前
$ git branch backup/$(date +%s)            # 大手术前
$ git log --oneline -3                     # 确认自己在哪
```

### 14.2 语义误解（黄色）

| 误解 | 事实 |
| --- | --- |
| "git 保存的是差异" | 保存快照；差异是算出来的 |
| "分支是一份代码副本" | 分支是一个 41 字节的文件（哈希 + 换行） |
| "rebase 会丢历史" | 旧提交还在 reflog/objects 里，只是不再被引用 |
| "merge 一定产生合并提交" | 快进时不会；`--no-ff` 才强制 |
| "git pull = fetch + merge" | 默认如此，但可配成 rebase 或 ff-only |
| "commit 之后文件就安全了" | 只在本地安全；推送/备份之前仍可能丢（磁盘坏） |
| "改名 Git 会记录" | 不记录，靠相似度猜 |
| "git add 是保存" | 只是放进待提交篮子 |
| "--force-with-lease 绝对安全" | 久未 fetch 时 lease 依据是旧值，仍可能覆盖 |
| "删除分支等于删除提交" | 提交还在，直到 gc |

### 14.3 工程坏习惯（蓝色）

1. **`git add .` 不过脑**：把 `.env`、`node_modules`、临时文件全提上去。
2. **提交信息写 "update" / "fix" / "123"**：三个月后没人知道发生了什么。
3. **一个提交改 50 个文件**：评审没法看，回滚必出事。
4. **长期分支**：活过一个月的分支，合并时基本等于重写。
5. **在 `main` 上直接开发**：出事时没有"干净的对照版本"。
6. **用 `git commit -a` 跳过检查**：把调试代码一起提交。
7. **把 `node_modules` / `dist` 提交进仓库**：历史迅速膨胀，diff 全是噪音。
8. **直接提交密钥**：即使后来删掉，历史里仍然有（第 13.5 节）。
9. **rebase 已推送的共享分支**：制造别人的灾难。
10. **不写 `.gitattributes`**：Windows 同事和你永远在"整个文件都改了"的冲突里。

### 14.4 Windows 专场坑

| 坑 | 表现 | 解法 |
| --- | --- | --- |
| 换行符 | diff 全文件变红 | 2.6 的 `.gitattributes` + `core.autocrlf` |
| 文件名大小写不敏感 | `readme.md` 改名成 `README.md` 不生效 | `git mv -f readme.md README.md`，或改完 `git commit` 时注意 `core.ignorecase` |
| 路径过长（> 260 字符） | `Filename too long` | `git config --global core.longpaths true` |
| 中文文件名显示乱码 | `\344\270\255` | `git config --global core.quotepath false` |
| 可执行位不生效 | 钩子脚本跑不了 | 在 Git Bash 里 `chmod +x`，或 `git update-index --chmod=+x file` |
| CRLF 出现在 `.sh` 里 | Linux 上 `bad interpreter: ^M` | `*.sh text eol=lf` |

---

## 15. 练习总集（含答案）

### 15.1 基础（1–8）

1. 新建仓库，提交两次，用 `git cat-file -p HEAD^{tree}` 与 `git cat-file -p <blob>` 查看对象内容。
2. 用一行命令列出"最近 5 条提交的哈希与标题"。
3. 让 `git status` 只显示已暂存的改动。
4. 把某个文件从"已暂存"退回"未暂存"，但保留工作区内容。
5. 撤销最近一次提交但保留所有改动在暂存区。
6. 查看某个文件第 10–20 行最近一次是谁改的。
7. 用一个命令看清"所有分支的图形化历史"。
8. 把一个已被跟踪的 `dist/` 目录从版本库移除但保留本地文件。

<details>
<summary>参考答案</summary>

```bash
1. git cat-file -p HEAD^{tree}; git cat-file -p <hash>
2. git log -5 --pretty=format:'%h %s'
3. git status -s | grep '^[MADRC]'
4. git restore --staged <file>
5. git reset --soft HEAD~1
6. git blame -L 10,20 <file>
7. git log --graph --oneline --decorate --all
8. git rm -r --cached dist && echo 'dist/' >> .gitignore && git commit -m "chore: 停止跟踪 dist"
```

</details>

### 15.2 中级（9–16）

9. 把最近 3 个提交压成 1 个，保留合并后的信息。
10. 把某个提交里的一个文件单独"摘"到当前分支。
11. 找出引入字符串 `TODO: 移除` 的提交。
12. 用 `bisect` 在 10 个提交里定位坏提交（用 `git bisect run`）。
13. 给两个提交之前的提交补打附注标签并推送。
14. 撤销一个已经推送的提交，且不改写历史。
15. 用 `worktree` 在另一个目录检出 `release/1.x` 分支。
16. 生成"v1.0.0 以来"的变更清单（标题 + 作者）。

<details>
<summary>参考答案</summary>

```bash
9.  git rebase -i HEAD~3   # 后两个改成 squash
10. git cherry-pick <commit>            # 整个提交
    # 只要一个文件：
    git checkout <commit> -- path/file
11. git log -S "TODO: 移除" --oneline
12. git bisect start HEAD <good>; git bisect run ./test.sh
13. git tag -a v0.9.0 <commit> -m "..."; git push origin v0.9.0
14. git revert <commit> && git push
15. git worktree add ../proj-1x release/1.x
16. git log --pretty=format:'%h %an %s' v1.0.0..HEAD
```

</details>

### 15.3 高级（17–22）

17. 找出仓库里最大的 5 个对象，并判断是否需要 filter-repo。
18. 用 `--filter=blob:none` 克隆，然后验证"断网时看老提交会失败"。
19. 写一个 `pre-push` 钩子，在有未提交改动时拒绝推送。
20. 用 `git merge-tree --write-tree` 判断两个分支合并是否有冲突。
21. 让 rebase 自动复用之前解决过的冲突（rerere）。
22. 配置"公司目录用工作邮箱、其他用私人邮箱"的 `includeIf`。

<details>
<summary>参考答案</summary>

```bash
17. git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -nr | head -5
18. git clone --filter=blob:none <url>; 断网; git show <old-commit>:file
19. #!/bin/sh
    test -z "$(git status --porcelain)" || { echo "有未提交改动"; exit 1; }
20. git merge-tree --write-tree main feature; echo $?    # 非 0 表示冲突
21. git config --global rerere.enabled true
22. [includeIf "gitdir:~/work/"] path = ~/.gitconfig-work
```

</details>

---

## 16. 速查表与学习路径

### 16.1 一页纸命令表

```bash
# ---------- 仓库 ----------
git init                       # 建仓库
git clone <url> [dir]          # 克隆
git clone --depth 1 <url>      # 浅克隆

# ---------- 日常 ----------
git status -s                  # 短状态
git add -p                     # 按块暂存
git add -A                     # 全部（含删除）
git commit -m "type: msg"      # 提交
git commit --amend --no-edit   # 补进上次提交
git log --oneline --graph --all
git diff                       # 工作区 vs 暂存区
git diff --staged              # 暂存区 vs HEAD
git diff main...feat           # 分支带来了什么

# ---------- 分支 ----------
git switch -c feat             # 建并切
git switch -                   # 回上一个分支
git branch -vv                 # 看跟踪关系
git branch -d feat             # 删（安全）
git branch -D feat             # 强删

# ---------- 合并 ----------
git merge --ff-only feat       # 只快进
git merge --no-ff feat         # 强制合并提交
git rebase -i HEAD~3           # 整理历史
git rebase origin/main         # 接到主干
git rebase --abort             # 放弃
git cherry-pick <commit>       # 摘提交

# ---------- 撤销 ----------
git restore <f>                # 丢工作区改动
git restore --staged <f>       # 取消暂存
git reset --soft HEAD~1        # 撤提交，留改动在篮子
git reset --hard HEAD~1        # 撤提交并丢改动
git revert <commit>            # 反向提交（已推送时用）
git stash push -u -m "wip"     # 暂存工作区
git stash pop                  # 取回

# ---------- 救援 ----------
git reflog                     # 所有 HEAD 移动
git reset --hard HEAD@{2}      # 回到两步前
git fsck --lost-found          # 找悬空对象
git branch rescue <hash>       # 给悬空提交命名

# ---------- 远端 ----------
git remote -v
git fetch --all --prune
git push -u origin feat
git push --force-with-lease
git pull --ff-only
git push origin --delete old

# ---------- 标签 ----------
git tag -a v1.0.0 -m "release"
git push origin v1.0.0
git describe --tags

# ---------- 调查 ----------
git log -S "str" --oneline     # 字符串何时引入
git log -L 10,20:file          # 行范围历史
git blame -L 10,20 file
git bisect start / good / bad  # 二分
git worktree add ../dir branch
```

### 16.2 状态对照表：我在哪、文件在哪

| `git status -s` | 含义 | 一条命令修好 |
| --- | --- | --- |
| ` M file` | 改了没暂存 | `git add file` |
| `M  file` | 已暂存 | `git commit` |
| `MM file` | 暂存后又改 | `git add file` 再提交 |
| `?? file` | 未跟踪 | `git add file` 或加 `.gitignore` |
| ` D file` | 删了没暂存 | `git add file`（记录删除）或 `git restore file` |
| `A  file` | 新文件已暂存 | `git commit` |
| `UU file` | 冲突未解决 | 编辑后 `git add file` |

### 16.3 决策树

```text
我想撤销一个改动
├── 还没提交
│   ├── 只想取消暂存 → git restore --staged <f>
│   ├── 想丢掉工作区 → git restore <f>
│   └── 想留着以后用 → git stash push -m "..."
└── 已经提交
    ├── 还没推送
    │   ├── 是最近一次 → git commit --amend
    │   ├── 要保留改动 → git reset --soft HEAD~n
    │   └── 不要改动 → git reset --hard HEAD~n
    └── 已推送
        ├── 共享分支 → git revert
        └── 只有自己的分支 → rebase + push --force-with-lease
```

### 16.4 与其他工具的对照

| 概念 | Git | SVN | Python（文件操作） | C（构建） |
| --- | --- | --- | --- | --- |
| 快照 | commit | revision | 文件副本 | 编译产物 |
| 分支 | 指针 | 目录副本（贵） | 无 | 无 |
| 合并 | 三路合并 | 按行合并 | 手写 diff | 无 |
| 忽略规则 | `.gitignore` | `svn:ignore` | 无 | `.gitignore` 无关 |
| 钩子 | `.git/hooks` | 服务端 hook | 无 | Makefile 依赖 |

### 16.5 六周学习路径

| 周 | 内容 | 产出 |
| --- | --- | --- |
| 1 | 第 1–3 章：模型、配置、日常提交 | 一个人能干净地提交 20 次 |
| 2 | 第 4–5 章：改历史、分支、合并 | 能整理一段历史、解决一次真冲突 |
| 3 | 第 6–7 章：撤销与协作 | 能救回误操作，能开 PR |
| 4 | 第 8–10 章：标签、调查、工作流 | 能打发布标签、用 bisect 定位 bug |
| 5 | 第 11–12 章：大仓库、自动化 | 配好钩子、会处理超大仓库 |
| 6 | 第 13–15 章：实战与练习 | 独立完成 22 道练习 |

### 16.6 资源

| 类型 | 推荐 |
| --- | --- |
| 官方书（免费） | [Pro Git](https://git-scm.com/book/zh/v2)（有中文版，前 3 章必读） |
| 交互式练习 | [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN)（把分支图形化，非常直观） |
| 命令速查 | `git help <command>`、`git <command> -h` |
| 参考手册 | [git-scm.com/docs](https://git-scm.com/docs) |
| 常见问题的官方问答 | `man gitrevisions`（各种 `HEAD~2^2` 语法都在这里） |
| 工作流对比 | Atlassian 的 Git Workflows 系列文章 |

### 16.7 三句话总结

1. **Git 是内容寻址的快照数据库**，分支和 HEAD 只是指向上面的可移动指针。
2. **改动发生在三个区域之间**：工作区 → 暂存区 → 版本库，所有命令都是在搬这三层的内容。
3. **提交过的东西几乎不会真丢**：reflog 兜底，`--force-with-lease` 保护别人，只改没推送的历史。
