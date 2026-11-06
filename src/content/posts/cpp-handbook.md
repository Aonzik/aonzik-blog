---
title: C++ 学习手册：给"会 C 但没学过 C++"的人
description: 目标读者：写得出 `struct`、指针、`malloc/free`、`printf`，能看懂 `for (int i = 0; i < n; i++)`，但一遇到 `std::vector`、`class`、`&&`、`template` 就绕道的人。本书不重复 C 的内容。每一章都在回答同一个问题：**C 的做法在这里为什么不合适，C++ 的做法解决了什么问题。**教学基线是 **C++20**；但前三部分的核心代码刻意只用 **C++17**，因此用 `g++ 8.1 -std=c++17` 这样的老编译器也能全部编译运行。C++20/23/26 的新东西集中在第 15 章，并标注所需编译器版本。
date: 2026-11-01
category: 技术
tags:
  - AIGC
  - 技术
  - 笔记
---

## 目录

1. [0. 怎么用这本书](#0-怎么用这本书)
2. [1. 从 C 到 C++：语言层面的变化](#1-从-c-到-c语言层面的变化)
3. [2. 引用、const 与参数传递](#2-引用const-与参数传递)
4. [3. 类与对象：C 的 struct 长出了方法](#3-类与对象c-的-struct-长出了方法)
5. [4. 资源管理：智能指针与所有权](#4-资源管理智能指针与所有权)
6. [5. 移动语义与完美转发](#5-移动语义与完美转发)
7. [6. 继承、多态与虚函数](#6-继承多态与虚函数)
8. [7. 模板](#7-模板)
9. [8. 标准库容器：别再手写链表了](#8-标准库容器别再手写链表了)
10. [9. 迭代器、算法与 lambda](#9-迭代器算法与-lambda)
11. [10. 异常与错误处理](#10-异常与错误处理)
12. [11. 字符串与文本处理](#11-字符串与文本处理)
13. [12. 输入输出与文件](#12-输入输出与文件)
14. [13. 并发](#13-并发)
15. [14. 构建、调试与工具链](#14-构建调试与工具链)
16. [15. C++20 / C++23 / C++26：现代特性](#15-c20-c23-c26现代特性)
17. [16. 从 C 代码迁移到 C++](#16-从-c-代码迁移到-c)
18. [17. 实战一：CSV 统计工具（C++17，可直接编译）](#17-实战一csv-统计工具c17可直接编译)
19. [18. 实战二：线程池计算器（C++17）](#18-实战二线程池计算器c17)
20. [19. 陷阱与反模式](#19-陷阱与反模式)
21. [20. 练习总集（36 题）](#20-练习总集36-题)
22. [21. 速查表与学习路径](#21-速查表与学习路径)

---

## 0. 怎么用这本书

### 0.1 你现在的位置

| 你已经会的（C） | C++ 里对应的做法 | 为什么要换 |
| --- | --- | --- |
| `struct` + 函数 | `class` + 成员函数 | 把"数据"和"操作"绑在一起，由编译器检查 |
| `malloc/free` | `new/delete` → 更好：`std::vector`、智能指针 | 自动管理生命周期，异常安全 |
| `char*` + 手写长度 | `std::string`、`std::string_view` | 不用再算长度、不会忘 `'\0'` |
| 定长数组 + 长度变量 | `std::vector`、`std::array` | 自动扩容，知道自己的大小 |
| `qsort` + 函数指针 | `std::sort` + lambda | 类型安全、可内联、更快 |
| `#define` 常量 | `constexpr` | 有类型、可调试、有作用域 |
| 返回错误码 | 异常、`std::optional`、`std::expected` | 不可忽略，且能带信息 |
| 手写链表 | `std::list` / `std::map` / `std::unordered_map` | 现成且正确 |
| `switch` + 全局状态 | 多态、`std::variant` | 加新类型不改旧代码 |

### 0.2 三个必须先接受的事实

**事实一：C++ 的"零开销抽象"是真的。**

`std::vector` 的下标访问和裸数组一样快，`std::sort` 比 `qsort` 更快（能内联比较函数）。用标准库不是"为了安全牺牲性能"，多数情况下两者兼得。

**事实二：C++ 的复杂度主要来自"所有权"。**

谁分配、谁释放、谁持有、能不能共享——每个 API 都要回答这个问题。C 里靠约定（"这个函数返回的指针你要 free"），C++ 里靠类型（`std::unique_ptr` 就是"我独占"）。**学 C++ 的核心就是学所有权怎么表达。**

**事实三：编译期能抓住的错误，不要留到运行期。**

`const`、`override`、`noexcept`、`[[nodiscard]]`、模板——这些存在的意义都是把错误从"上线后崩溃"提前到"编译不过"。

### 0.3 编译器与标准

| 编译器 | 版本 | C++17 | C++20 | C++23 |
| --- | --- | --- | --- | --- |
| GCC | 8.1+ | 完整 | 部分（`-fconcepts` 实验） | 8 起零星，13+ 较好 |
| GCC | 11+ | 完整 | 基本完整 | 部分 |
| GCC | 13/14+ | 完整 | 完整 | 大部分 |
| Clang | 7+ | 完整 | 10+ 基本完整 | 16+ 较好 |
| MSVC | VS 2019 16.8+ | 完整 | 基本完整 | 需 `/std:c++latest` |

本书正文用 `-std=c++17` 验证。打开 C++20 只需要换参数：

```bash
g++ -std=c++17 -O2 -Wall -Wextra -Wpedantic main.cpp -o app
g++ -std=c++20 -O2 -Wall -Wextra main.cpp -o app
clang++ -std=c++20 -Wall -Wextra main.cpp -o app
```

注意：**不同编译器的默认标准不一样**。GCC 16 默认 `gnu++20`，Clang 16+ 仍默认 `gnu++17`，MSVC 默认甚至还是 C++14 级别，必须显式写 `/std:c++20`。所以**永远在构建脚本里写明标准版本**。

### 0.4 最小工程

```text
hello/
├── CMakeLists.txt
└── src/
    ├── main.cpp
    └── stats.h / stats.cpp
```

```cmake
cmake_minimum_required(VERSION 3.16)
project(hello CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)          # 用 -std=c++17 而不是 -std=gnu++17

add_executable(app src/main.cpp src/stats.cpp)
target_compile_options(app PRIVATE -Wall -Wextra -Wpedantic)
```

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
./build/app
```

没有 CMake 也能先跑：

```bash
g++ -std=c++17 -Wall -Wextra src/*.cpp -o app && ./app
```

### 0.5 能力地图

```text
语言核心（1–7 章）──┬─ 引用/const/auto
                    ├─ 类与 RAII（构造函数/析构函数）
                    ├─ 移动语义与所有权
                    ├─ 继承与多态
                    └─ 模板
标准库（8–12 章）───┬─ 容器
                    ├─ 迭代器与算法
                    ├─ 异常与错误
                    ├─ 字符串
                    └─ 并发
工程（13–18 章）────┬─ 构建与调试
                    ├─ C++20/23/26
                    ├─ 从 C 迁移
                    └─ 实战
```

### 0.6 本章速查

- C++ 相对 C 的三大增量：**类与 RAII**、**模板与标准库**、**所有权类型化**。
- 永远显式指定 `-std=c++17`（或更高）。
- 编译选项起步：`-Wall -Wextra -Wpedantic`；调试加 `-g`，优化用 `-O2`。

---

## 1. 从 C 到 C++：语言层面的变化

### 1.1 头文件与名字空间

```cpp
#include <cstdio>      // C 头文件加 c 前缀、去掉 .h
#include <cstring>
#include <cstdlib>

#include <string>      // C++ 标准库头文件没有 .h
#include <vector>
#include <iostream>

int main() {
    std::printf("%d\n", 42);          // std:: 前缀
    std::string name = "Ann";
    std::cout << "hello, " << name << '\n';
    return 0;
}
```

```cpp
// 不要写 using namespace std;（尤其不要在头文件里）
// 局部范围可以：
void f() {
    using std::string;
    string s = "ok";
}
```

要点：

- C 头文件 `<stdio.h>` 在 C++ 里也可用，但 `<cstdio>` 会把名字放进 `std`；
- 标准库几乎全在 `namespace std`；
- 自己的代码用命名空间划分模块（避免全局符号冲突）。

### 1.2 引用：别名，不是指针

```cpp
int x = 1;
int& r = x;        // r 是 x 的别名
r = 2;             // x 变成 2
int* p = &r;       // 取到 x 的地址

// 与指针的区别：
// 1) 必须初始化
// int& bad;                       // 编译错误
// 2) 不能改指向别的对象
// 3) 没有 null 引用，用法更简洁
```

C 里的 `void swap(int* a, int* b)` 在 C++ 里写成引用版：

```cpp
void swap_int(int& a, int& b) {
    int t = a;
    a = b;
    b = t;
}

int main() {
    int a = 1, b = 2;
    swap_int(a, b);           // 调用处不用 &
    std::printf("%d %d\n", a, b);
}
```

### 1.3 `const` 比 C 里强得多

```cpp
const int N = 10;
const int* p1 = &N;      // 指向 const int（不能改 *p1）
int const* p2 = &N;      // 同上，写法等价
int* const p3 = nullptr; // p3 本身是 const（不能改 p3 的指向）

// C++ 里 const 变量可以是编译期常量
constexpr int M = 20;    // 编译期求值（C 里只能用 #define 或 enum）
static_assert(M == 20, "编译期检查");

// const 成员函数、const 引用参数 —— 见第 3、4 章
```

`#define` 的替代：

```cpp
// ❌ C 风格
#define MAX_ITEMS 100
#define SQUARE(x) ((x) * (x))     // 宏的经典陷阱：SQUARE(a++) 会把 a 加两次

// ✅ C++
constexpr int kMaxItems = 100;
template <typename T>
constexpr T square(T x) { return x * x; }     // 有类型，不会重复求值
```

### 1.4 `auto` 与 `decltype`

```cpp
auto i = 42;              // int
auto d = 3.14;            // double
auto s = std::string("x");
auto v = std::vector<int>{1, 2, 3};
auto it = v.begin();      // std::vector<int>::iterator

// 结构化绑定（C++17）
std::map<std::string, int> m{{"a", 1}};
for (const auto& [key, value] : m) {
    std::cout << key << '=' << value << '\n';
}

// decltype：推导表达式的类型
int x = 0;
decltype(x) y = 1;        // int
decltype((x)) z = x;      // int&（带括号是左值引用）
```

经验：**能用 `auto` 就用**，但别在看不出类型的地方硬用（比如 `auto n = getCount();` 看不出返回的是 `int` 还是 `size_t`）。

### 1.5 `nullptr`

```cpp
int* p = nullptr;         // 类型安全，不是 0 也不是 NULL
// if (p == 0) 也能编过，但 nullptr 更明确且能避免重载歧义
```

### 1.6 类型转换：四个明确的 cast

```cpp
double d = 3.9;

int i1 = (int)d;                        // C 风格，不推荐（难搜索、语义不明）
int i2 = static_cast<int>(d);           // 数值转换 / 相关类型转换
const int* cp = &i2;
int* p = const_cast<int*>(cp);          // 只用于去掉 const（慎用）
void* raw = p;
int* p2 = static_cast<int*>(raw);       // void* → 具体类型，可以
// 基类 ↔ 派生类用 dynamic_cast（第 6 章）
// 位模式重解释用 reinterpret_cast（几乎总是错的做法）
```

规则：**不要用 C 风格转换**。它是四种转换的混合，出问题时你无法 grep。

### 1.7 `new` 与 C 的 `malloc`

```cpp
int* p = new int(42);        // 分配 + 构造
delete p;

int* arr = new int[10];      // 数组
delete[] arr;                // 必须配对！用错是未定义行为

// 但日常几乎不该直接写 new：
std::vector<int> v(10);              // 自动管理
auto up = std::make_unique<int>(42); // 见第 4 章
```

`new` 失败抛 `std::bad_alloc`（不像 `malloc` 返回 `NULL`），除非你写 `new (std::nothrow)`。

### 1.8 `iostream` vs `printf`

```cpp
#include <iostream>
#include <iomanip>

int main() {
    int n = 42;
    double pi = 3.14159;

    std::cout << "n = " << n << ", pi = " << pi << '\n';
    std::cout << std::fixed << std::setprecision(2) << pi << '\n';

    int x;
    if (std::cin >> x) {                 // 读失败时可判断
        std::cout << "读到 " << x << '\n';
    }
}
```

性能敏感时（大量输出）可以加 `std::ios::sync_with_stdio(false);` 并把 `'\n'` 写成 `'\n'`（`std::endl` 会 flush）。C++20 起有 `std::format` / `std::print`，见第 15 章。

### 1.9 练习

1. 把一段 C 代码的 `#define` 常量与函数式宏改成 `constexpr`。
2. 用引用重写 C 的 `void inc(int* p)`。
3. 解释 `int* const p` 与 `const int* p` 的区别。
4. 用结构化绑定遍历 `std::map<std::string, std::vector<int>>` 并打印。

### 1.10 答案（要点）

```cpp
// 1.
constexpr int kBufferSize = 4096;
template <typename T> constexpr T max_of(T a, T b) { return a > b ? a : b; }

// 2.
void inc(int& v) { ++v; }

// 3. int* const p：指针本身不能改（不能指向别处）；const int* p：不能通过 p 修改所指对象。

// 4.
std::map<std::string, std::vector<int>> m{{"a", {1, 2}}};
for (const auto& [k, vec] : m) {
    std::cout << k << ':';
    for (int v : vec) std::cout << ' ' << v;
    std::cout << '\n';
}
```

### 1.11 本章速查

| 主题 | 结论 |
| --- | --- |
| 头文件 | C++ 标准库无 `.h`；C 头文件用 `<cxxx>` |
| 引用 | 别名，必须初始化，不可改指向 |
| `const` | 修饰"不可改"，`constexpr` 修饰"编译期" |
| 转换 | 用 `static_cast` 等，不用 C 风格 |
| `new` | 抛 `bad_alloc`；日常用容器与智能指针替代 |

---

## 2. 引用、const 与参数传递

### 2.1 值、引用、const 引用三种参数

```cpp
#include <string>

void byValue(std::string s) { s += "!"; }             // 复制一份，改的是副本
void byRef(std::string& s) { s += "!"; }              // 改调用者
void byConstRef(const std::string& s) { /* 只读 */ }  // 不复制，也不能改
```

选择规则（背下来）：

| 参数类型 | 用于 |
| --- | --- |
| `T`（值） | 小对象（`int`、`double`、指针、`std::string_view`），或需要一份副本时 |
| `const T&` | 大对象只读（`std::string`、`std::vector`、自定义类） |
| `T&` | 需要修改调用者的对象 |
| `T&&` | 需要"窃取"资源（移动语义，第 5 章） |

```cpp
// 典型 API
void print(const std::vector<int>& v);        // 只读大对象
void fill(std::vector<int>& v);               // 修改
std::vector<int> make();                       // 返回值（有 RVO，不复制）
```

### 2.2 返回引用要小心

```cpp
// ❌ 返回局部变量的引用：悬垂引用
int& bad() {
    int local = 42;
    return local;        // 函数返回后 local 已销毁
}

// ✅ 返回静态对象（生命周期到程序结束）
const std::string& version() {
    static const std::string v = "1.0";
    return v;
}

// ✅ 返回成员引用（调用者需保证对象存活）
class Config {
    std::string name_;
public:
    const std::string& name() const { return name_; }
};
```

### 2.3 左值与右值（概念预热）

```cpp
int a = 1;
int& lref = a;          // 左值引用：绑定到有名字的存储
int&& rref = 42;        // 右值引用：绑定到临时量

// 用途：区分"可以窃取资源"的临时对象 —— 第 5 章展开
```

### 2.4 `std::string_view`（C++17）：只读字符串视图

```cpp
#include <string_view>

void log(std::string_view msg) {      // 不复制、不分配
    std::cout << msg << '\n';
}

log("literal");                       // 不构造 string
std::string s = "owned";
log(s);                               // 无需复制
```

⚠️ `string_view` **不拥有**内存，不能保存到比原字符串活得更久的地方：

```cpp
std::string_view dangling() {
    std::string local = "temp";
    return local;          // ❌ 局部 string 销毁后 view 悬垂
}
```

### 2.5 `const` 成员函数与 `mutable`

```cpp
class Counter {
    int count_ = 0;
    mutable int reads_ = 0;                 // 在 const 函数里也能改（用于缓存/统计）
public:
    int get() const { ++reads_; return count_; }   // 不修改逻辑状态
    void inc() { ++count_; }
};

void show(const Counter& c) {
    std::cout << c.get();      // 只能调用 const 成员函数
}
```

### 2.6 练习

1. 写 `void normalize(std::vector<double>& v)`，把元素缩放到 [0,1]。
2. 写 `size_t countChar(const std::string& s, char c)`。
3. 找出下面代码的问题：

```cpp
const std::string& getPath() {
    std::string p = "/tmp";
    return p;
}
```

4. 用 `std::string_view` 写一个 `trim`，要求不分配内存。

### 2.7 答案（要点）

```cpp
// 1.
void normalize(std::vector<double>& v) {
    if (v.empty()) return;
    auto [mn, mx] = std::minmax_element(v.begin(), v.end());
    const double range = *mx - *mn;
    if (range == 0) return;
    for (double& x : v) x = (x - *mn) / range;
}

// 4.
std::string_view trim(std::string_view s) {
    const auto notSpace = [](char c) { return !std::isspace(static_cast<unsigned char>(c)); };
    while (!s.empty() && !notSpace(s.front())) s.remove_prefix(1);
    while (!s.empty() && !notSpace(s.back())) s.remove_suffix(1);
    return s;
}
```

```text
// 3. 返回局部变量的引用 → 悬垂引用（未定义行为）。改成返回值，或返回 static 对象。
```

### 2.8 本章速查

| 场景 | 写法 |
| --- | --- |
| 只读大对象 | `const T&` |
| 要修改 | `T&` |
| 小对象 | `T` |
| 只读字符串（不拥有） | `std::string_view` |
| 返回值 | 按值返回（RVO 会消除复制） |

---

## 3. 类与对象：C 的 struct 长出了方法

### 3.1 从 struct 到 class

```cpp
// C 的写法
struct point_c { int x, y; };
void move_c(struct point_c* p, int dx, int dy) { p->x += dx; p->y += dy; }
double len_c(struct point_c p) { return std::sqrt(double(p.x * p.x + p.y * p.y)); }

// C++ 的写法
class Point {
public:
    Point(int x, int y) : x_(x), y_(y) {}      // 构造函数 + 初始化列表
    void move(int dx, int dy) { x_ += dx; y_ += dy; }
    double len() const { return std::sqrt(double(x_ * x_ + y_ * y_)); }

    int x() const { return x_; }
    int y() const { return y_; }

private:
    int x_;
    int y_;
};

int main() {
    Point p(3, 4);
    p.move(1, 1);
    std::cout << p.len() << '\n';
}
```

区别只有三点：**成员函数**、**访问控制**（`public`/`private`/`protected`）、**构造与析构**。

### 3.2 构造函数与初始化列表

```cpp
class Buffer {
    std::vector<char> data_;
    std::size_t capacity_;
public:
    Buffer() : capacity_(1024) {}                        // 默认构造
    explicit Buffer(std::size_t cap) : capacity_(cap) {  // explicit 防止隐式转换
        data_.resize(cap);
    }
};
```

必须在初始化列表里初始化的东西：

- `const` 成员；
- 引用成员；
- 没有默认构造函数的成员（例如 `std::reference_wrapper<T>`、自定义类）。

```cpp
class Bad {
    const int n_;
public:
    Bad(int n) { n_ = n; }        // ❌ 编译错误：const 成员不能在函数体里赋值
};

class Good {
    const int n_;
public:
    Good(int n) : n_(n) {}        // ✅
};
```

**初始化列表的顺序 = 成员声明顺序**，不是列表书写顺序。写反了会有隐蔽的 bug（`-Wreorder` 能抓）。

### 3.3 析构函数与 RAII

```cpp
#include <cstdio>

class FileGuard {
    std::FILE* f_;
public:
    explicit FileGuard(const char* path) : f_(std::fopen(path, "r")) {
        if (!f_) throw std::runtime_error("打开文件失败");
    }
    ~FileGuard() {                       // 离开作用域自动调用
        if (f_) std::fclose(f_);
    }
    FileGuard(const FileGuard&) = delete;             // 不允许复制（见下）
    FileGuard& operator=(const FileGuard&) = delete;

    std::FILE* get() const { return f_; }
};

void readConfig() {
    FileGuard f("config.txt");        // 构造
    // ... 即使这里抛异常，析构函数也会执行
}                                      // 析构，文件自动关闭
```

**RAII**（Resource Acquisition Is Initialization）= 把资源生命周期绑定到对象生命周期。C 里你要在每个返回点手写 `fclose`/`free`，C++ 里写一次析构就够了，**且异常安全**。

标准库里的 RAII 例子：`std::vector`（析构释放内存）、`std::lock_guard`（析构解锁）、`std::unique_ptr`（析构删除）、`std::fstream`（析构关闭文件）。

### 3.4 拷贝构造与拷贝赋值（rule of three 的起点）

```cpp
class MyString {
    char* data_;
    std::size_t size_;
public:
    explicit MyString(const char* s) : size_(std::strlen(s)) {
        data_ = new char[size_ + 1];
        std::memcpy(data_, s, size_ + 1);
    }

    // 拷贝构造
    MyString(const MyString& other) : size_(other.size_) {
        data_ = new char[size_ + 1];
        std::memcpy(data_, other.data_, size_ + 1);
    }

    // 拷贝赋值（注意自赋值与异常安全）
    MyString& operator=(const MyString& other) {
        if (this != &other) {
            char* tmp = new char[other.size_ + 1];
            std::memcpy(tmp, other.data_, other.size_ + 1);
            delete[] data_;
            data_ = tmp;
            size_ = other.size_;
        }
        return *this;
    }

    ~MyString() { delete[] data_; }
};
```

如果不写拷贝构造，编译器生成的是**逐成员复制**——两个对象会持有同一个指针，析构时 `double free`。这就是 C++ 最经典的坑。

**结论：手写资源管理的类要遵循 rule of three**（析构、拷贝构造、拷贝赋值要么都写，要么都不写）。更好的是 **rule of zero**：用 `std::vector`/`std::string`/智能指针做成员，一个都不用写。

### 3.5 `= default`、`= delete`、`explicit`

```cpp
class Config {
public:
    Config() = default;                     // 明确要默认构造
    Config(const Config&) = delete;         // 禁止复制（如文件句柄、锁、线程）
    Config& operator=(const Config&) = delete;
    explicit Config(int threads) : threads_(threads) {}
private:
    int threads_ = 4;
};

// explicit 防止这种意外：
// void setThreads(Config c);
// setThreads(8);       // 若构造函数非 explicit，会隐式构造
```

### 3.6 `this` 与链式调用

```cpp
class Builder {
    std::string s_;
public:
    Builder& add(const std::string& part) {
        s_ += part;
        return *this;                // 返回自身引用以支持链式
    }
    const std::string& build() const { return s_; }
};

std::string s = Builder().add("a").add("b").build();
```

### 3.7 静态成员

```cpp
class Counter {
public:
    static int created;             // 声明
    Counter() { ++created; }
};
int Counter::created = 0;           // 定义（C++17 起可写 inline static int created = 0;）

int main() {
    Counter a, b;
    std::cout << Counter::created << '\n';   // 2
}
```

### 3.8 `struct` 与 `class` 的唯一区别

默认访问权限：`struct` 默认 `public`，`class` 默认 `private`。用 `struct` 表示"纯数据聚合"，用 `class` 表示"有不变式的类型"。

```cpp
struct Point { int x, y; };                  // 数据聚合，成员全公开
class Account {                              // 有约束：余额不能为负
public:
    explicit Account(double init) : balance_(init) {}
    void withdraw(double amt) {
        if (amt < 0 || amt > balance_) throw std::invalid_argument("余额不足");
        balance_ -= amt;
    }
    double balance() const { return balance_; }
private:
    double balance_;
};
```

### 3.9 练习

1. 写 `class Stack`（内部用 `std::vector<int>`），提供 `push/pop/top/empty/size`，`pop` 在空时抛异常。
2. 写 `class Timer`，构造时记录时间，析构时打印耗时（RAII 计时器）。
3. 解释为什么 `FileGuard` 要 `= delete` 拷贝构造。
4. 写一个 `struct` 表示"矩形"，再用 `class` 表示"会校验的矩形"，比较两者适用场景。

### 3.10 答案（要点）

```cpp
// 1.
class Stack {
    std::vector<int> v_;
public:
    void push(int x) { v_.push_back(x); }
    int pop() {
        if (v_.empty()) throw std::out_of_range("stack is empty");
        int x = v_.back();
        v_.pop_back();
        return x;
    }
    int& top() { return v_.back(); }
    bool empty() const { return v_.empty(); }
    std::size_t size() const { return v_.size(); }
};

// 2.
class Timer {
    std::chrono::steady_clock::time_point start_;
    const char* name_;
public:
    explicit Timer(const char* name)
        : start_(std::chrono::steady_clock::now()), name_(name) {}
    ~Timer() {
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                      std::chrono::steady_clock::now() - start_).count();
        std::cout << name_ << " 耗时 " << ms << " ms\n";
    }
};
```

```text
// 3. 复制会导致两个对象持有同一个 FILE*，析构时重复 fclose（未定义行为）。
```

### 3.11 本章速查

| 概念 | 要点 |
| --- | --- |
| 构造 | 优先用初始化列表；`explicit` 防隐式转换 |
| 析构 | 自动调用；RAII 的核心 |
| rule of three | 析构/拷贝构造/拷贝赋值要么都写，要么都不写 |
| rule of zero | 用标准库成员，一个都不写 |
| `= delete` | 禁止某个操作（复制、隐式转换） |
| 初始化顺序 | 按成员声明顺序，不是书写顺序 |

---

## 4. 资源管理：智能指针与所有权

### 4.1 三种所有权

| 所有权 | 类型 | 什么时候用 |
| --- | --- | --- |
| 独占 | `std::unique_ptr<T>` | 默认选择：一个对象一个主人 |
| 共享 | `std::shared_ptr<T>` | 确实需要多主（缓存、图结构、回调注册） |
| 观察 | `T*` / `T&` / `std::weak_ptr<T>` | 不负责生命周期，只借用 |

**从 C 转过来的第一课：把 `T* ptr = malloc(...)` 换成 `std::unique_ptr<T>`。**

### 4.2 `unique_ptr`

```cpp
#include <memory>

struct Widget {
    int id;
    explicit Widget(int i) : id(i) { std::cout << "构造 " << id << '\n'; }
    ~Widget() { std::cout << "析构 " << id << '\n'; }
};

void use() {
    auto w = std::make_unique<Widget>(1);      // 推荐：make_unique（C++14）
    std::cout << w->id << '\n';

    auto w2 = std::move(w);                     // 转移所有权，w 变成 nullptr
    if (!w) std::cout << "w 已空\n";
}                                               // w2 析构，Widget 释放
```

特点：

- 不能复制（`std::unique_ptr` 的拷贝构造是 `= delete`）；
- 可以移动（`std::move`）；
- 大小和裸指针一样（零开销）；
- 容器里优先放 `unique_ptr` 而不是裸指针：`std::vector<std::unique_ptr<Shape>>`。

```cpp
// 多态 + unique_ptr
struct Shape { virtual ~Shape() = default; virtual double area() const = 0; };
struct Circle : Shape { double r; explicit Circle(double r_) : r(r_) {} double area() const override { return 3.14159 * r * r; } };

std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(1.0));
```

### 4.3 `shared_ptr` 与 `weak_ptr`

```cpp
#include <memory>

auto a = std::make_shared<int>(42);
{
    auto b = a;                     // 引用计数 2
    std::cout << a.use_count() << '\n';   // 2
}                                   // 计数 2 → 1
std::cout << a.use_count() << '\n';       // 1
```

共享指针的开销：一个控制块（引用计数、删除器），原子操作；所以**不要滥用**。

循环引用会导致内存泄漏：

```cpp
struct Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev;       // 反向指针用 weak_ptr 打破循环
};

auto a = std::make_shared<Node>();
auto b = std::make_shared<Node>();
a->next = b;
b->prev = a;                        // weak：不增加计数
```

`weak_ptr` 使用前必须 `lock()`：

```cpp
if (auto locked = weak.lock()) {
    locked->doSomething();          // 对象还活着
} else {
    // 已销毁
}
```

### 4.4 自定义删除器

```cpp
auto fileDeleter = [](std::FILE* f) { if (f) std::fclose(f); };
std::unique_ptr<std::FILE, decltype(fileDeleter)> fp(std::fopen("a.txt", "r"), fileDeleter);
```

### 4.5 不要做的事

```cpp
// ❌ 两个智能指针接管同一个裸指针
int* raw = new int(1);
std::unique_ptr<int> a(raw);
std::unique_ptr<int> b(raw);        // 双重释放

// ❌ 从 shared_ptr 的 get() 再构造一个 shared_ptr
std::shared_ptr<int> s = std::make_shared<int>(1);
std::shared_ptr<int> s2(s.get());   // 独立控制块 → 双重释放

// ❌ 用 new 构造 shared_ptr（若 new 成功但控制块分配失败会泄漏）
// 用 std::make_shared

// ✅ 函数返回所有权
std::unique_ptr<Widget> create() { return std::make_unique<Widget>(7); }
```

### 4.6 `pimpl`：隐藏实现、稳定 ABI

```cpp
// widget.h
class Widget {
public:
    Widget();
    ~Widget();
    void run();
private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

// widget.cpp
struct Widget::Impl { std::vector<int> data; };
Widget::Widget() : impl_(std::make_unique<Impl>()) {}
Widget::~Widget() = default;         // 必须在 .cpp 里（Impl 在这里可见）
void Widget::run() { impl_->data.push_back(1); }
```

好处：改实现不改头文件 → 调用方不用重编。代价：一次间接跳转、一次堆分配。

### 4.7 练习

1. 把 `new[]`/`delete[]` 的手写动态数组改成 `std::vector`。
2. 用 `unique_ptr` 重写一个"打开文件、读、关闭"的函数。
3. 构造一个 `shared_ptr` 循环引用并观察泄漏（打印析构），然后用 `weak_ptr` 修复。
4. 解释 `make_unique` 相比 `new` 的两个好处。

### 4.8 答案（要点）

```cpp
// 2.
std::string readAll(const std::string& path) {
    auto fp = std::unique_ptr<std::FILE, int(*)(std::FILE*)>(
        std::fopen(path.c_str(), "rb"), &std::fclose);
    if (!fp) throw std::runtime_error("open failed: " + path);

    std::string out;
    char buf[4096];
    std::size_t n;
    while ((n = std::fread(buf, 1, sizeof buf, fp.get())) > 0) out.append(buf, n);
    return out;
}
```

```text
// 4. (1) 异常安全：make_unique 里 new 和控制块分配是同一个表达式，不会一半成功一半失败；(2) 更短、无显式 new、避免裸指针泄漏。
```

### 4.9 本章速查

| 需求 | 类型 |
| --- | --- |
| 独占所有权 | `std::unique_ptr<T>` + `make_unique` |
| 共享所有权 | `std::shared_ptr<T>` + `make_shared` |
| 观察共享对象 | `std::weak_ptr<T>` + `lock()` |
| 仅借用 | `T*` / `T&` / `const T&` |
| 自定义释放 | `unique_ptr<T, Deleter>` |

---

## 5. 移动语义与完美转发

### 5.1 问题：复制太贵

```cpp
std::vector<std::string> makeNames() {
    std::vector<std::string> v;
    for (int i = 0; i < 1000; ++i) v.push_back("name" + std::to_string(i));
    return v;
}

std::vector<std::string> names = makeNames();   // 会复制 1000 个字符串吗？
```

在现代 C++ 里：**不会**。要么编译器做 RVO（返回值优化），要么走移动构造（转移内部指针，O(1)）。

```cpp
std::string a = "hello";
std::string b = a;              // 复制：分配 + 拷贝字符
std::string c = std::move(a);   // 移动：偷走缓冲区，a 变成空串
```

### 5.2 左值 / 右值 / 右值引用

```cpp
int x = 1;
int& lr = x;            // 左值引用
int&& rr = 1 + 2;       // 右值引用（绑定临时量）

// 具名变量默认是左值，即使它的类型是右值引用
void f(int&& v) {
    // v 本身在表达式里是左值
    int y = std::move(v);           // 显式转成右值
}
```

判断口诀：**有名字、能取地址 → 左值；临时量、字面量 → 右值。**

### 5.3 `std::move` 只是类型转换

```cpp
// std::move 等价于 static_cast<T&&>，它不移动任何东西
// 真正的移动发生在"移动构造/移动赋值"被调用时
```

```cpp
class Buffer {
    char* data_ = nullptr;
    std::size_t size_ = 0;
public:
    explicit Buffer(std::size_t n) : data_(new char[n]), size_(n) {}
    ~Buffer() { delete[] data_; }

    Buffer(const Buffer& other) : data_(new char[other.size_]), size_(other.size_) {
        std::memcpy(data_, other.data_, size_);         // 深拷贝
    }

    Buffer(Buffer&& other) noexcept                      // 移动构造：窃取
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    Buffer& operator=(const Buffer&) = delete;
};

std::vector<Buffer> v;
v.push_back(Buffer(10));      // 用移动构造（临时量）
```

要点：

- 移动构造要标 `noexcept`（否则 `std::vector` 扩容时会退化成复制以保证异常安全）；
- 移动后源对象必须是"有效但未指定"状态（这里置空最安全）；
- **`std::move` 之后不要再用被移走的值**。

### 5.4 完美转发

```cpp
#include <utility>

// 通用工厂：把参数原样转给构造函数，保留左值/右值属性
template <typename T, typename... Args>
std::unique_ptr<T> make(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

// 转发的两个条件：
// 1) 形参写成 T&&（万能引用，配合模板推导）
// 2) 传下去时用 std::forward<T>
```

```cpp
// 错误写法：参数会被当成左值，丢失移动机会
template <typename... Args>
void wrap(Args... args) { create(args...); }       // 全都是复制

template <typename... Args>
void wrap2(Args&&... args) { create(std::forward<Args>(args)...); }   // 保持原样
```

### 5.5 `emplace_back` vs `push_back`

```cpp
std::vector<std::string> v;
v.push_back(std::string("abc"));      // 构造临时 string，再移动进容器
v.emplace_back("abc");                // 直接在容器内构造，省一次移动
v.emplace_back(3, 'x');               // 调用 string(3, 'x')
```

多数情况下差别很小（移动很便宜），但 `emplace_back` 语义更直接。注意别写 `v.emplace_back(ptr)` 而本意是放入指针容器——`emplace` 会做隐式转换，反而不安全。

### 5.6 返回值优化（RVO/NRVO）

```cpp
std::vector<int> make() {
    std::vector<int> v = {1, 2, 3};
    return v;             // NRVO：直接在调用者的空间构造，零复制
}

// 所以：不要写 return std::move(v); —— 会阻止 NRVO，反而多一次移动
```

### 5.7 练习

1. 给第 3 章的 `MyString` 加移动构造与移动赋值。
2. 写一个 `template <typename... Args> void log(Args&&... args)`，把参数转发给 `printf` 风格或 `std::cout`。
3. 解释为什么移动构造要标 `noexcept`。
4. 下面代码有几处可优化？

```cpp
std::vector<std::string> f() {
    std::vector<std::string> out;
    std::string tmp = "hello";
    out.push_back(tmp);
    return std::move(out);
}
```

### 5.8 答案（要点）

```cpp
// 4. 两处：
//   out.push_back(tmp) → out.push_back(std::move(tmp)) 或 emplace_back
//   return std::move(out) → return out（std::move 阻止 NRVO）
```

```cpp
// 1.
MyString(MyString&& other) noexcept : data_(other.data_), size_(other.size_) {
    other.data_ = nullptr;
    other.size_ = 0;
}
MyString& operator=(MyString&& other) noexcept {
    if (this != &other) {
        delete[] data_;
        data_ = other.data_;
        size_ = other.size_;
        other.data_ = nullptr;
        other.size_ = 0;
    }
    return *this;
}
```

```text
// 3. vector 扩容时要在"强异常保证"与"性能"之间选：若移动构造是 noexcept，可以放心移动；否则为保异常安全只能复制（复制失败时原容器不变）。
```

### 5.9 本章速查

| 概念 | 结论 |
| --- | --- |
| `std::move` | 只是转成右值引用，不移动 |
| 移动构造 | 窃取指针/缓冲区，源对象置空 |
| `noexcept` | 移动操作应标 `noexcept` |
| 完美转发 | `T&&` + `std::forward<T>` |
| 返回值 | 直接 `return x`，别加 `std::move` |
| `emplace_back` | 就地构造，省一次移动 |

---

## 6. 继承、多态与虚函数

### 6.1 为什么需要多态

```cpp
// C 的写法：靠 tag + switch，加一种图形就要改所有 switch
enum Kind { CIRCLE, SQUARE };
struct Shape { Kind kind; double a, b; };
double area(const Shape& s) {
    switch (s.kind) {
        case CIRCLE: return 3.14159 * s.a * s.a;
        case SQUARE: return s.a * s.a;
    }
    return 0;
}

// C++：靠虚函数，加新类型不改旧代码
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual const char* name() const = 0;
};

class Circle : public Shape {
    double r_;
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159 * r_ * r_; }
    const char* name() const override { return "circle"; }
};

class Square : public Shape {
    double s_;
public:
    explicit Square(double s) : s_(s) {}
    double area() const override { return s_ * s_; }
    const char* name() const override { return "square"; }
};

void printAll(const std::vector<std::unique_ptr<Shape>>& shapes) {
    for (const auto& s : shapes) std::cout << s->name() << ": " << s->area() << '\n';
}
```

### 6.2 三个关键字：`virtual`、`override`、`final`

```cpp
class Base {
public:
    virtual void f();              // 可被覆写
    virtual void g() = 0;          // 纯虚：必须覆写（抽象类）
    virtual ~Base() = default;     // 有虚函数就必须有虚析构
};

class Derived : public Base {
public:
    void f() override;             // override：写错签名会编译报错
    void g() override;
};

class Leaf final : public Derived { // final：不能再被继承
    void f() final;                // final：不能再被覆写
};
```

**`override` 一定要写**。没有它，签名写错（比如漏了 `const`）会悄悄变成"新函数"，运行时调用不到——这类 bug 极难查。

### 6.3 虚析构：删除基类指针时必须

```cpp
class Base {
public:
    ~Base() {}                       // ❌ 非虚
};
class Derived : public Base {
    std::vector<int> data_;          // 有大资源
};

Base* p = new Derived();
delete p;                            // 只调用 ~Base()，Derived 的成员泄漏
```

规则：**类只要有虚函数，析构函数就写成 `virtual ~T() = default;`**。

### 6.4 对象切片（slicing）

```cpp
void take(Shape s);          // ❌ 按值传：Derived 被切成 Shape，虚函数失效
void take(const Shape& s);   // ✅ 引用

std::vector<Shape> v;        // ❌ 存不下派生类
std::vector<std::unique_ptr<Shape>> v2;   // ✅
```

### 6.5 访问控制与继承方式

| 继承方式 | public 成员 | protected 成员 |
| --- | --- | --- |
| `public` | 仍是 public | 仍是 protected |
| `protected` | 变 protected | protected |
| `private` | 变 private | private |

**99% 的情况用 `public` 继承**（表示"是一个"）。想复用实现而不想表达"是一个"，用**组合**：把对象当成员。

```cpp
class Logger {
public:
    void log(const std::string& s) { /* ... */ }
};

// ❌ 继承只为复用代码
class Service : public Logger { /* ... */ };

// ✅ 组合
class Service {
    Logger logger_;          // 需要时调用 logger_.log(...)
};
```

### 6.6 `dynamic_cast` 与 RTTI

```cpp
class Animal { public: virtual ~Animal() = default; };
class Dog : public Animal { public: void bark() {} };

void maybeBark(Animal* a) {
    if (auto* d = dynamic_cast<Dog*>(a)) {      // 失败返回 nullptr
        d->bark();
    }
}
```

`dynamic_cast` 需要 RTTI（默认开），有运行期开销。**频繁用 `dynamic_cast` 通常是设计信号**：应该把行为放进虚函数。

### 6.7 多重继承与虚继承（了解即可）

```cpp
class Swimmer { public: virtual void swim() = 0; };
class Flyer { public: virtual void fly() = 0; };
class Duck : public Swimmer, public Flyer { /* 实现两个接口 */ };
```

多重继承只在"继承多个纯接口"时安全好用。**继承多个有状态的基类**会带来菱形问题（需要虚继承），实践中几乎不用。

### 6.8 接口与契约

```cpp
// 用纯虚类定义接口
class Repository {
public:
    virtual ~Repository() = default;
    virtual std::optional<User> find(int id) const = 0;
    virtual void save(const User& u) = 0;
};

// 两个实现
class MemoryRepo : public Repository { /* ... */ };
class SqliteRepo : public Repository { /* ... */ };

// 使用者只依赖接口
void report(const Repository& repo) { /* ... */ }
```

这就是"面向接口编程"，也是单元测试里替换假实现的入口。

### 6.9 练习

1. 定义 `Shape` 接口，实现 `Circle`、`Rect`、`Triangle`，用 `vector<unique_ptr<Shape>>` 求总面积。
2. 解释没有虚析构会发生什么（举一个泄漏的例子）。
3. 用组合重写一个"继承自 Logger 的 Service"。
4. 找出下面代码的三处问题：

```cpp
class Base { public: void f(); virtual void g(); };
class D : public Base { public: void f(); void g(); };
void use(std::vector<Base> v);
```

### 6.10 答案（要点）

```text
2. delete 基类指针时只调用基类析构，派生类成员（如 vector）不释放 → 泄漏/未定义行为。
4. (1) f 没写 virtual 也不会被覆写（隐藏）；(2) g 覆写但缺 override 关键字；(3) vector<Base> 按值存会产生对象切片（且 Base 无虚析构，delete 不安全）。
```

```cpp
// 1.
std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(1.0));
shapes.push_back(std::make_unique<Rect>(2.0, 3.0));
double total = 0;
for (const auto& s : shapes) total += s->area();
```

### 6.11 本章速查

| 主题 | 规则 |
| --- | --- |
| 虚函数 | 有虚函数就要有 `virtual ~T()` |
| 覆写 | 必须写 `override` |
| 禁止继承/覆写 | `final` |
| 抽象类 | 至少一个纯虚函数 |
| 传参 | 用引用或指针，避免切片 |
| 复用实现 | 优先组合，不滥用继承 |

---

## 7. 模板

### 7.1 函数模板

```cpp
template <typename T>
T maxOf(T a, T b) { return a > b ? a : b; }

std::cout << maxOf(1, 2) << '\n';              // T = int
std::cout << maxOf(1.5, 2.5) << '\n';          // T = double
std::cout << maxOf<std::string>("a", "b") << std::endl;   // 显式指定
```

模板是**编译期**展开：每个用到的类型生成一份代码，所以没有运行期开销，但会增加编译时间和二进制体积。

### 7.2 类模板

```cpp
template <typename T>
class Box {
    T value_;
public:
    explicit Box(T v) : value_(v) {}
    const T& get() const { return value_; }
    void set(const T& v) { value_ = v; }
};

Box<int> a(1);
Box<std::string> b("x");
```

标准库容器都是类模板：`std::vector<T>`、`std::map<K, V>`。

### 7.3 多个模板参数与默认参数

```cpp
template <typename K, typename V, typename Compare = std::less<K>>
class MyMap { /* ... */ };
```

### 7.4 可变参数模板

```cpp
#include <iostream>

void printAll() { std::cout << '\n'; }

template <typename T, typename... Rest>
void printAll(const T& first, const Rest&... rest) {
    std::cout << first << ' ';
    printAll(rest...);          // 递归展开
}

int main() {
    printAll(1, 2.5, "three", std::string("four"));
}
```

C++17 起可以用折叠表达式：

```cpp
template <typename... Args>
auto sum(Args... args) {
    return (args + ...);        // 折叠
}
std::cout << sum(1, 2, 3, 4) << '\n';
```

### 7.5 模板特化

```cpp
template <typename T>
struct TypeName { static const char* get() { return "unknown"; } };

template <>
struct TypeName<int> { static const char* get() { return "int"; } };

template <>
struct TypeName<double> { static const char* get() { return "double"; } };

std::cout << TypeName<int>::get() << '\n';     // int
```

### 7.6 `type_traits` 与编译期分支（C++17 的 `if constexpr`）

```cpp
#include <type_traits>

template <typename T>
std::string describe(T v) {
    if constexpr (std::is_integral_v<T>) {
        return "整数: " + std::to_string(v);
    } else if constexpr (std::is_floating_point_v<T>) {
        return "浮点: " + std::to_string(v);
    } else {
        return "其他";
    }
}
```

`if constexpr` 会**丢弃不成立的分支**，所以不成立的代码即使对当前类型编译不过也没关系（C++17 之前要靠 SFINAE 标签分派，非常难读）。

### 7.7 模板的常见错误

```cpp
template <typename T>
void f(T a, T b);

f(1, 2.0);          // ❌ T 推导冲突（int vs double）→ 显式 f<double>(1, 2.0)
```

模板报错往往很长，因为错误发生在实例化处。技巧：

1. 从**最上面**的 `error:` 看起，而不是最后一行；
2. 找 "required from here" 定位你的调用；
3. 先用具体类型写通，再改成模板。

### 7.8 模板的工程约束

- 模板定义通常放**头文件**（实例化需要看到定义）；
- 编译时间会涨，胖模板代码可以用显式实例化把它挪到 `.cpp`；
- 大型项目用概念（C++20 `concepts`）让报错可读，见第 15 章。

### 7.9 练习

1. 写 `template <typename T> T clamp(T v, T lo, T hi)`。
2. 写 `template <typename T> class Stack`（用 `std::vector<T>` 实现）。
3. 用折叠表达式写 `allTrue(bool...)` 与 `concat(std::string...)`。
4. 解释为什么模板定义一般不能只放 `.cpp`。

### 7.10 答案（要点）

```cpp
// 1.
template <typename T>
constexpr T clamp(T v, T lo, T hi) { return v < lo ? lo : (v > hi ? hi : v); }

// 3.
template <typename... B>
constexpr bool allTrue(B... bs) { return (bs && ...); }

template <typename... S>
std::string concat(S&&... ss) { return (std::string{} + ... + std::forward<S>(ss)); }
```

```text
// 4. 模板要在使用处实例化，编译器必须看到完整定义；只在 .cpp 里定义会导致链接时找不到符号（undefined reference）。
```

### 7.11 本章速查

| 主题 | 要点 |
| --- | --- |
| 函数模板 | 编译期按类型生成，无运行期开销 |
| 类模板 | 标准容器都是模板 |
| 可变参数 | `typename... Args` + 折叠/递归 |
| 编译期分支 | `if constexpr`（C++17） |
| 报错阅读 | 从第一条 error 看起 |
| 定义位置 | 放头文件 |

---

## 8. 标准库容器：别再手写链表了

### 8.1 一张选择表

| 容器 | 结构 | 适用 | 访问 | 插入/删除 |
| --- | --- | --- | --- | --- |
| `std::vector<T>` | 连续动态数组 | **默认选择**：顺序存储、随机访问 | O(1) | 尾部 O(1) 摊还；中间 O(n) |
| `std::array<T,N>` | 定长数组 | 大小编译期已知 | O(1) | 不可增删 |
| `std::deque<T>` | 分段连续 | 头尾都要增删 | O(1) | 两端 O(1) |
| `std::list<T>` | 双向链表 | 大量中间插删 + 稳定迭代器 | O(n) | O(1) |
| `std::forward_list<T>` | 单向链表 | 极致省内存 | O(n) | O(1) |
| `std::map<K,V>` | 红黑树 | 有序遍历、按 key 查找 | O(log n) | O(log n) |
| `std::set<T>` | 红黑树 | 有序去重集合 | O(log n) | O(log n) |
| `std::unordered_map<K,V>` | 哈希表 | **只需查找、不需顺序** | 平均 O(1) | 平均 O(1) |
| `std::unordered_set<T>` | 哈希表 | 无序去重 | 平均 O(1) | 平均 O(1) |
| `std::stack/queue/priority_queue` | 容器适配器 | LIFO / FIFO / 堆 | — | — |

三条经验：

1. **默认用 `vector`**。它的缓存局部性让它在多数场景比链表快，即使中间插入（移动内存往往比追指针快）。
2. 需要"按 key 查"先想 `unordered_map`；需要"有序遍历"才用 `map`。
3. 链表只在"元素很大、插删极频繁、需要迭代器稳定"时才值得。

### 8.2 `vector` 的必备操作

```cpp
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v;                 // 空
    std::vector<int> v2(5);             // 5 个 0
    std::vector<int> v3(5, 7);          // 5 个 7
    std::vector<int> v4{1, 2, 3};       // 初始化列表

    v.push_back(1);
    v.emplace_back(2);                  // 就地构造（第 5 章）
    v.insert(v.begin(), 0);             // 头部插入 → O(n)，慎用
    v.pop_back();

    std::cout << v.size() << ' ' << v.capacity() << '\n';

    v.reserve(100);                     // 预留容量，避免反复扩容
    v.resize(10);                       // 改大小（新元素值初始化）
    v.clear();                          // 清空但保留容量

    for (int x : v4) std::cout << x << ' ';
    std::cout << '\n';
    std::cout << v4.front() << ' ' << v4.back() << ' ' << v4.at(1) << '\n';
}
```

`size()` 是元素个数，`capacity()` 是已分配空间。扩容通常按倍数增长，所以**总复杂度是摊还 O(1)**。

### 8.3 迭代器失效：最常见的崩溃来源

| 操作 | 影响 |
| --- | --- |
| `push_back` 触发扩容 | **全部**迭代器、指针、引用失效 |
| `insert`/`erase` | 插入点及之后失效（`vector`） |
| `erase` 后继续用旧迭代器 | 未定义行为 |
| `map`/`set` 的 `erase` | 只让被删元素的迭代器失效 |
| `list` 的插删 | 其他迭代器仍有效 |

```cpp
// ❌ 边遍历边删（vector）
for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it % 2 == 0) v.erase(it);      // erase 返回下一个有效迭代器，但 ++it 又跳过一个
}

// ✅ 用 erase 的返回值
for (auto it = v.begin(); it != v.end(); ) {
    if (*it % 2 == 0) it = v.erase(it);
    else ++it;
}

// ✅ 更简单：erase-remove 惯用法
v.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; }), v.end());
```

```cpp
// ❌ 在范围 for 里修改容器大小
for (int x : v) if (x < 0) v.push_back(0);      // 迭代器失效 → UB
```

### 8.4 `map` 与 `unordered_map`

```cpp
#include <map>
#include <unordered_map>
#include <string>

std::map<std::string, int> ordered;      // 按 key 排序
std::unordered_map<std::string, int> fast;

ordered["apple"] = 3;
fast["apple"] = 3;

// 查找：不要用 operator[]（不存在的 key 会被插入默认值！）
if (auto it = ordered.find("apple"); it != ordered.end()) {
    std::cout << it->second << '\n';
}

// C++17 更简洁：contains / try_emplace / insert_or_assign
if (ordered.contains("apple")) { /* ... */ }
ordered.try_emplace("banana", 5);            // 不存在才插入
ordered.insert_or_assign("apple", 10);       // 存在则赋值

// 遍历（有序）
for (const auto& [k, v] : ordered) std::cout << k << '=' << v << ' ';
```

`operator[]` 的陷阱值得单独记：

```cpp
std::map<std::string, int> m;
int x = m["missing"];        // 插入 {"missing", 0} 并返回 0 —— 查询变成了写入
std::cout << m.size();       // 1
```

只读查询用 `find` / `at`（`at` 不存在时抛 `out_of_range`）。

### 8.5 `vector<bool>` 是特例

```cpp
std::vector<bool> flags(10);   // 按位压缩存储，不是真正的 bool 数组
// flags[0] 返回代理对象，不能取地址，不能传给 bool*
```

需要真数组就用 `std::vector<char>` 或 `std::bitset<N>`。

### 8.6 二维数据

```cpp
// 方法一：vector 套 vector（不规则也行）
std::vector<std::vector<int>> grid(3, std::vector<int>(4, 0));
grid[1][2] = 5;

// 方法二：一维 + 索引计算（缓存更友好，HPC 常用）
std::size_t rows = 3, cols = 4;
std::vector<int> flat(rows * cols, 0);
auto at = [&](std::size_t r, std::size_t c) -> int& { return flat[r * cols + c]; };
at(1, 2) = 5;
```

### 8.7 练习

1. 读入 n 个整数，输出中位数（用 `vector` + `nth_element` 或排序）。
2. 统计一段文本的词频，按次数降序输出（`unordered_map` + 自定义排序）。
3. 用 `vector` 实现一个环形缓冲区（固定容量）。
4. 解释为什么下面代码会崩：

```cpp
std::vector<int> v{1, 2, 3};
for (int& x : v) { if (x == 1) v.push_back(4); }
```

### 8.8 答案（要点）

```cpp
// 2.
std::unordered_map<std::string, int> freq;
std::string w;
while (std::cin >> w) ++freq[w];

std::vector<std::pair<std::string, int>> items(freq.begin(), freq.end());
std::sort(items.begin(), items.end(), [](const auto& a, const auto& b) {
    return a.second != b.second ? a.second > b.second : a.first < b.first;
});
for (const auto& [w, c] : items) std::cout << w << ' ' << c << '\n';
```

```text
// 4. push_back 可能扩容 → 重新分配 → 范围 for 内部保存的迭代器失效 → 未定义行为。
```

### 8.9 本章速查

| 需求 | 容器 |
| --- | --- |
| 默认顺序容器 | `vector` |
| 编译期定长 | `array` |
| 两端增删 | `deque` |
| 有序 key | `map` / `set` |
| 快速 key 查找 | `unordered_map` / `unordered_set` |
| LIFO / FIFO | `stack` / `queue` |
| 边遍历边删 | `erase(remove_if(...), end())` 或 `erase` 返回值 |

---

## 9. 迭代器、算法与 lambda

### 9.1 算法库：把循环换成意图

```cpp
#include <algorithm>
#include <numeric>
#include <vector>

std::vector<int> v{3, 1, 4, 1, 5};

std::sort(v.begin(), v.end());                  // 升序
std::sort(v.begin(), v.end(), std::greater<>{}); // 降序（C++14 透明比较器）
bool has3 = std::find(v.begin(), v.end(), 3) != v.end();
auto it = std::find_if(v.begin(), v.end(), [](int x) { return x > 3; });
int sum = std::accumulate(v.begin(), v.end(), 0);
int mx = *std::max_element(v.begin(), v.end());
auto [mn, mxn] = std::minmax_element(v.begin(), v.end());
bool allPos = std::all_of(v.begin(), v.end(), [](int x) { return x > 0; });
auto cnt = std::count_if(v.begin(), v.end(), [](int x) { return x % 2 == 1; });
std::reverse(v.begin(), v.end());
```

常用算法速查：

| 目的 | 算法 |
| --- | --- |
| 排序 | `sort`、`stable_sort`、`partial_sort`、`nth_element` |
| 查找 | `find`、`find_if`、`binary_search`、`lower_bound` |
| 条件判断 | `all_of`、`any_of`、`none_of` |
| 计数/求和 | `count`、`count_if`、`accumulate`、`reduce` |
| 变换 | `transform`、`copy`、`copy_if`、`replace` |
| 删除 | `remove`、`remove_if`（配合 `erase`） |
| 去重 | `unique`（先排序） |
| 集合 | `set_union`、`set_intersection`、`set_difference` |
| 最值 | `min_element`、`max_element`、`minmax_element` |

### 9.2 lambda：算法最好的搭档

```cpp
auto add = [](int a, int b) { return a + b; };
std::cout << add(1, 2) << '\n';

// 捕获外部变量
int base = 10;
auto byValue = [base](int x) { return x + base; };      // 复制
auto byRef   = [&base](int x) { return x + base; };     // 引用
auto all     = [=](int x) { return x + base; };         // 全部按值
auto allRef  = [&](int x) { return x + base; };         // 全部按引用
auto mixed   = [base, &base](int x) { return x + base; };

// C++14 泛型 lambda
auto twice = [](auto x) { return x + x; };
std::cout << twice(1) << twice(1.5) << '\n';
```

**捕获的坑**：

```cpp
// ❌ 捕获局部变量的引用并保存到更晚执行的地方
std::function<void()> f;
{
    int x = 1;
    f = [&x]() { std::cout << x; };   // x 已销毁 → 悬垂
}
f();

// ❌ 在循环里按引用捕获循环变量（同一变量）
std::vector<std::function<int()>> fs;
for (int i = 0; i < 3; ++i) fs.push_back([&i] { return i; });   // 全是同一个 i

// ✅ 按值捕获
for (int i = 0; i < 3; ++i) fs.push_back([i] { return i; });    // 0 1 2
```

初始化捕获（C++14）用于**移动**进 lambda：

```cpp
auto p = std::make_unique<int>(42);
auto f = [q = std::move(p)]() { return *q; };      // 把 p 移进闭包
```

### 9.3 `std::function` 与性能

```cpp
#include <functional>

void run(const std::function<void(int)>& cb) { cb(1); }

// std::function 能装函数指针、lambda、成员函数绑定，但有类型擦除开销（可能堆分配）
```

- 需要**存起来**（回调列表、事件订阅）→ `std::function`；
- 只是**传参**（模板或立即调用）→ 用模板参数，零开销：

```cpp
template <typename F>
void runTemplate(F&& cb) { cb(1); }     // 编译器可内联，无虚调用/无分配
```

### 9.4 自定义比较：严格弱序

```cpp
struct Person { std::string name; int age; };

std::vector<Person> people{{"A", 30}, {"B", 25}, {"C", 30}};

std::sort(people.begin(), people.end(), [](const Person& a, const Person& b) {
    if (a.age != b.age) return a.age < b.age;
    return a.name < b.name;                    // 必须能区分，否则行为未定义
});
```

**`sort` 的比较函数必须满足严格弱序**（`comp(a,a) == false`）。写成 `<=` 是最常见的错误，可能导致崩溃（越界）或排序结果错误。

### 9.5 范围 for 的展开

```cpp
for (int x : v) { }                 // 复制
for (int& x : v) { x *= 2; }        // 可修改
for (const auto& x : v) { }         // 只读，不复制（最常用）
for (auto&& x : v) { }              // 万能引用，转发场景
```

### 9.6 练习

1. 用算法实现：读入 n 个数，去重并降序输出。
2. 用 `std::transform` + lambda 把字符串 vector 全部转大写。
3. 用 `std::partition` 把数组分成"偶数在前、奇数在后"。
4. 解释为什么 `sort` 的比较器写成 `<=` 是错的。

### 9.7 答案（要点）

```cpp
// 1.
std::sort(v.begin(), v.end(), std::greater<>{});
v.erase(std::unique(v.begin(), v.end()), v.end());

// 2.
std::transform(words.begin(), words.end(), words.begin(), [](std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::toupper(c); });
    return s;
});

// 3.
auto mid = std::partition(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
```

```text
// 4. 严格弱序要求 comp(a,a) 必须为 false；<= 会让相等元素也"小于"，破坏排序算法的前提，可能越界访问。
```

### 9.8 本章速查

| 需求 | 手段 |
| --- | --- |
| 替代手写循环 | 算法 + lambda |
| 删除符合条件的元素 | `erase(remove_if(...), end())` |
| 保存回调 | `std::function` |
| 立即调用回调 | 模板参数 |
| 排序比较器 | 严格弱序（用 `<`） |

---

## 10. 异常与错误处理

### 10.1 C 的错误码 vs C++ 的异常

```c
// C：每个调用点都要检查，容易漏
FILE* f = fopen("a.txt", "r");
if (!f) { perror("fopen"); return -1; }
```

```cpp
// C++：异常把"错误处理"从"正常流程"里分离出来
try {
    auto content = readFile("a.txt");     // 失败时抛异常
    process(content);
} catch (const std::runtime_error& e) {
    std::cerr << "失败：" << e.what() << '\n';
}
```

异常的价值：**不可能被忽略**（对比返回值），且能跨越任意多层调用；代价是二进制体积略增与运行期表（零成本模型下，正常路径几乎无开销）。

### 10.2 标准异常层次

```text
std::exception
├── std::logic_error        （程序缺陷，通常不该 catch 后继续）
│   ├── std::invalid_argument
│   ├── std::domain_error
│   ├── std::out_of_range
│   └── std::length_error
├── std::runtime_error      （运行期可恢复问题）
│   ├── std::range_error
│   ├── std::overflow_error
│   └── std::underflow_error
├── std::bad_alloc
└── std::bad_cast / std::bad_optional_access …
```

```cpp
#include <stdexcept>

double divide(double a, double b) {
    if (b == 0) throw std::invalid_argument("除数为 0");
    return a / b;
}
```

### 10.3 按引用捕获，按值抛出

```cpp
try {
    throw std::runtime_error("boom");
} catch (const std::exception& e) {        // ✅ 引用，避免切片
    std::cout << e.what() << '\n';
} catch (...) {                             // 兜底（不知道类型）
    std::cout << "未知异常\n";
}
```

```cpp
// ❌ 按值捕获：多态信息被切片
catch (std::exception e) { }
```

### 10.4 自定义异常

```cpp
class ConfigError : public std::runtime_error {
public:
    explicit ConfigError(const std::string& msg, std::string path)
        : std::runtime_error(msg), path_(std::move(path)) {}
    const std::string& path() const { return path_; }
private:
    std::string path_;
};
```

### 10.5 异常安全：三个保证等级

| 等级 | 含义 |
| --- | --- |
| 基本保证 | 异常后对象仍有效、不泄漏，但状态可能变 |
| 强保证 | 要么成功，要么回到操作前状态（事务性） |
| 不抛保证 | 承诺不抛异常（`noexcept`） |

实现强保证的常用手法：**copy-and-swap**。

```cpp
class Buffer {
    std::vector<char> data_;
public:
    void assign(const std::vector<char>& newData) {
        std::vector<char> tmp(newData);   // 可能失败，失败时 this 未变
        data_.swap(tmp);                   // swap 不抛异常
    }                                      // tmp 析构释放旧数据
};
```

### 10.6 `noexcept`

```cpp
void f() noexcept;          // 承诺不抛；抛了会调用 std::terminate
```

用途：

- 移动构造/移动赋值**应该** `noexcept`（否则容器扩容退化为复制）；
- 析构函数默认 `noexcept`，不要在里面抛；
- 明确不抛的接口标上，便于优化。

### 10.7 什么时候不用异常

| 场景 | 替代 |
| --- | --- |
| 可预期的"没有结果" | `std::optional<T>` |
| 需要携带错误码/信息且不想用异常 | `std::expected<T,E>`（C++23）或自定义 `Result<T,E>` |
| 嵌入式/无异常编译（`-fno-exceptions`） | 错误码 + `[[nodiscard]]` |
| 性能极敏感的热路径 | 返回 `bool` + out 参数 |

```cpp
#include <optional>

std::optional<int> parseInt(const std::string& s) {
    try {
        std::size_t pos = 0;
        int v = std::stoi(s, &pos);
        if (pos != s.size()) return std::nullopt;
        return v;
    } catch (const std::exception&) {
        return std::nullopt;
    }
}

auto v = parseInt("42");
if (v) std::cout << *v << '\n';
```

自定义 `Result`（C++17 可写，C++23 用 `std::expected`）：

```cpp
template <typename T, typename E>
class Result {
public:
    static Result ok(T v) { return Result(std::move(v)); }
    static Result err(E e) { return Result(std::move(e)); }

    explicit operator bool() const { return hasValue_; }
    const T& value() const { return value_; }
    const E& error() const { return error_; }
private:
    explicit Result(T v) : value_(std::move(v)), error_{}, hasValue_(true) {}
    explicit Result(E e) : value_{}, error_(std::move(e)), hasValue_(false) {}
    T value_{};
    E error_{};
    bool hasValue_;
};
```

### 10.8 异常与析构函数

**析构函数里绝不能抛异常**（尤其当栈正在展开时，会导致 `std::terminate`）。清理失败就记日志/忽略：

```cpp
~Connection() noexcept {
    try {
        close();
    } catch (...) {
        // 记录，不传播
    }
}
```

### 10.9 练习

1. 写 `std::vector<int> parseCsvInts(const std::string&)`，遇到非法字段抛 `std::invalid_argument` 并在消息里说明位置。
2. 把上一题改成返回 `std::optional` 版本，比较接口差异。
3. 用 copy-and-swap 给一个类实现强异常保证的赋值。
4. 解释 `catch (std::exception e)` 的问题。

### 10.10 答案（要点）

```text
4. 按值捕获会切片：派生类的额外信息丢失，且 e.what() 变成基类实现，无法拿到具体类型（除非 e 本身是基类对象的副本）。
```

```cpp
// 1.
std::vector<int> parseCsvInts(const std::string& s) {
    std::vector<int> out;
    std::size_t start = 0, idx = 0;
    while (start <= s.size()) {
        auto comma = s.find(',', start);
        auto field = s.substr(start, comma == std::string::npos ? std::string::npos : comma - start);
        try {
            out.push_back(std::stoi(field));
        } catch (const std::exception&) {
            throw std::invalid_argument("第 " + std::to_string(idx + 1) + " 个字段不是整数: '" + field + "'");
        }
        ++idx;
        if (comma == std::string::npos) break;
        start = comma + 1;
    }
    return out;
}
```

### 10.11 本章速查

| 主题 | 规则 |
| --- | --- |
| 捕获 | `catch (const std::exception&)` |
| 抛出 | 抛对象，不抛指针/整数 |
| 析构 | 不抛异常 |
| 强保证 | copy-and-swap |
| 无结果 | `std::optional` |
| 无异常 | 错误码 + `[[nodiscard]]` |

---

## 11. 字符串与文本处理

### 11.1 `std::string` 基本用法

```cpp
#include <string>

std::string s = "hello";
s += " world";
s.append("!");
std::cout << s.size() << ' ' << s.length() << '\n';    // 两者等价
std::cout << s.substr(0, 5) << '\n';                    // "hello"
std::cout << s.find("world") << '\n';                   // 6（找不到返回 npos）
std::cout << s.c_str() << '\n';                         // 给 C API 用
```

`npos` 判断：

```cpp
if (s.find("x") != std::string::npos) { /* 找到 */ }
```

### 11.2 三种"字符串"的区别

| 类型 | 拥有内存 | 可修改 | 用于 |
| --- | --- | --- | --- |
| `std::string` | 是 | 是 | 大多数字符串操作 |
| `std::string_view` | 否 | 否 | 只读参数、解析（零拷贝） |
| `const char*` | 不确定 | 否 | C 接口边界 |

```cpp
void print(std::string_view sv);       // 参数首选
std::string_view sv = s;               // 从 string 隐式转换
sv.substr(0, 3);                        // 返回 view，不复制
```

⚠️ 不要把 `string_view` 存到比源字符串更长的生命周期；不要从临时 `std::string` 构造后保存。

### 11.3 分割字符串（标准库没有，自己写）

```cpp
#include <string>
#include <string_view>
#include <vector>

std::vector<std::string_view> split(std::string_view s, char delim) {
    std::vector<std::string_view> out;
    std::size_t start = 0;
    while (true) {
        auto pos = s.find(delim, start);
        if (pos == std::string_view::npos) {
            out.push_back(s.substr(start));
            break;
        }
        out.push_back(s.substr(start, pos - start));
        start = pos + 1;
    }
    return out;
}
```

如果要**拥有**结果（源串会消失），把 `string_view` 换成 `std::string`：

```cpp
std::vector<std::string> splitOwned(const std::string& s, char delim) {
    std::vector<std::string> out;
    std::size_t start = 0;
    while (true) {
        auto pos = s.find(delim, start);
        if (pos == std::string::npos) { out.push_back(s.substr(start)); break; }
        out.push_back(s.substr(start, pos - start));
        start = pos + 1;
    }
    return out;
}
```

### 11.4 数字 ↔ 字符串

```cpp
std::string t = std::to_string(42);            // "42"
std::string d = std::to_string(3.14);          // "3.140000"（精度固定，不理想）

int i = std::stoi("42");                       // 抛异常（invalid_argument / out_of_range）
long l = std::stol("42");
double x = std::stod("3.14");

// 带位置检查
std::size_t pos;
int n = std::stoi("42abc", &pos);              // n=42, pos=2
```

格式化输出用 `ostringstream`（精度可控）：

```cpp
#include <sstream>
#include <iomanip>

std::ostringstream oss;
oss << std::fixed << std::setprecision(2) << 3.14159;
std::string s = oss.str();                     // "3.14"
```

C++17 的 `std::to_chars`/`from_chars` 更快且不抛异常，但 **GCC 8 只支持整数**，浮点要 GCC 11+。C++20 的 `std::format` 见第 15 章。

### 11.5 解析练习：键值对配置

```cpp
#include <map>
#include <string>
#include <string_view>

struct Config {
    std::map<std::string, std::string> kv;

    void parse(std::string_view text) {
        while (!text.empty()) {
            auto eol = text.find('\n');
            auto line = text.substr(0, eol);
            text.remove_prefix(eol == std::string_view::npos ? text.size() : eol + 1);

            line = trim(line);
            if (line.empty() || line.front() == '#') continue;

            auto eq = line.find('=');
            if (eq == std::string_view::npos) continue;
            kv[std::string(trim(line.substr(0, eq)))] = std::string(trim(line.substr(eq + 1)));
        }
    }

    std::string get(std::string_view key, std::string def = {}) const {
        auto it = kv.find(std::string(key));
        return it == kv.end() ? std::move(def) : it->second;
    }

private:
    static std::string_view trim(std::string_view s) {
        while (!s.empty() && std::isspace(static_cast<unsigned char>(s.front()))) s.remove_prefix(1);
        while (!s.empty() && std::isspace(static_cast<unsigned char>(s.back()))) s.remove_suffix(1);
        return s;
    }
};
```

### 11.6 Unicode 的现实

`std::string` 是**字节序列**，不是字符序列。UTF-8 下一个汉字占 3 字节，所以 `s.size()` 不等于"字数"，`s[i]` 拿到的是字节。

```cpp
std::string zh = "汉字";
std::cout << zh.size() << '\n';       // 6（UTF-8 字节数）

// 需要按"字符"处理时用专门库（utf8cpp、ICU）或 C++20 的 char8_t（仅类型层面）
```

常见错误：用 `std::toupper` 处理 UTF-8 字符串、用 `substr` 按"字符位置"切割。中文处理要么转 UTF-32，要么用库。

### 11.7 练习

1. 写 `trim`、`toLower`、`startsWith`（均用 `string_view`）。
2. 写 `join(const std::vector<std::string>&, const std::string& sep)`。
3. 统计一段文本里每个单词出现次数（只算字母数字构成的词）。
4. 把 `"2026-10-26"` 解析成 `{year, month, day}`，非法格式抛异常。

### 11.8 答案（要点）

```cpp
// 2.
std::string join(const std::vector<std::string>& parts, std::string_view sep) {
    std::string out;
    for (std::size_t i = 0; i < parts.size(); ++i) {
        if (i) out += sep;
        out += parts[i];
    }
    return out;
}

// 4.
struct Date { int y, m, d; };
Date parseDate(std::string_view s) {
    if (s.size() != 10 || s[4] != '-' || s[7] != '-') throw std::invalid_argument("格式应为 YYYY-MM-DD");
    return { std::stoi(std::string(s.substr(0, 4))),
             std::stoi(std::string(s.substr(5, 2))),
             std::stoi(std::string(s.substr(8, 2))) };
}
```

### 11.9 本章速查

| 需求 | 做法 |
| --- | --- |
| 参数只读 | `std::string_view` |
| 拼接 | `s += x` 或 `join` |
| 分割 | 手写 `split`（标准库没有） |
| 数字转换 | `std::stoi` / `to_string` / `ostringstream` |
| 精确格式化 | `ostringstream` + `setprecision` |
| 中文 | 注意 UTF-8 是字节不是字符 |

---

## 12. 输入输出与文件

### 12.1 `iostream` 三件套

```cpp
#include <iostream>
#include <iomanip>

int main() {
    std::cout << "标准输出\n";
    std::cerr << "错误输出\n";
    std::clog << "日志\n";

    std::string name;
    int age;
    std::cin >> name >> age;              // 空白分隔
    std::getline(std::cin, name);         // 读整行（注意与 >> 混用的换行残留）
}
```

混用 `>>` 与 `getline` 的经典坑：

```cpp
int n;
std::cin >> n;                 // 留下 '\n' 在缓冲区
std::string line;
std::getline(std::cin, line);  // 立刻读到空串

// 修法：先吃掉换行
std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
```

### 12.2 文件流

```cpp
#include <fstream>
#include <string>

// 读
std::ifstream in("input.txt");            // 析构自动关闭（RAII）
if (!in) throw std::runtime_error("打不开 input.txt");
std::string line;
while (std::getline(in, line)) {
    std::cout << line << '\n';
}

// 写
std::ofstream out("output.txt", std::ios::trunc);
if (!out) throw std::runtime_error("打不开输出文件");
out << "hello\n";
out.close();                               // 显式关闭以便检查错误
```

三种模式：`ios::in`、`ios::out`、`ios::app`、`ios::binary`、`ios::trunc`。

二进制读写：

```cpp
struct Header { int version; int count; };

std::ofstream bin("data.bin", std::ios::binary);
Header h{1, 100};
bin.write(reinterpret_cast<const char*>(&h), sizeof h);

std::ifstream binIn("data.bin", std::ios::binary);
Header h2;
binIn.read(reinterpret_cast<char*>(&h2), sizeof h2);
if (!binIn) throw std::runtime_error("数据不完整");
```

⚠️ 直接把 `struct` 写进文件有可移植性问题（字节序、填充、ABI）。跨平台要自己序列化字段。

### 12.3 `std::filesystem`（C++17）

```cpp
#include <filesystem>
namespace fs = std::filesystem;

for (const auto& entry : fs::directory_iterator(".")) {
    std::cout << entry.path() << '\n';
}

fs::create_directories("out/data");
fs::copy_file("a.txt", "out/a.txt", fs::copy_options::overwrite_existing);
std::uintmax_t size = fs::file_size("a.txt");
```

**编译器注意**：GCC 8 需要 `-lstdc++fs`；GCC 9+ 通常不需要。

```bash
g++ -std=c++17 files.cpp -lstdc++fs
```

### 12.4 性能：iostream 的缓冲

- `std::endl` 会 flush（慢）；日常用 `'\n'`；
- 大量输出时 `std::ios::sync_with_stdio(false)` 可明显加速；
- 追求极致吞吐用 `std::printf` 或 C++23 的 `std::print`。

```cpp
int main() {
    std::ios::sync_with_stdio(false);        // 与 C stdio 解绑
    std::cin.tie(nullptr);                   // 不自动 flush cout
}
```

### 12.5 练习

1. 读一个文件，统计行数、单词数、字节数（类似 `wc`）。
2. 把 CSV 里所有行按第二列排序后写回另一个文件。
3. 用 `filesystem` 列出当前目录下所有 `.txt` 文件及其大小。
4. 解释 `std::endl` 与 `'\n'` 的区别。

### 12.6 答案（要点）

```cpp
// 1.
std::ifstream in("a.txt");
std::size_t lines = 0, words = 0, bytes = 0;
std::string line;
while (std::getline(in, line)) {
    ++lines;
    bytes += line.size() + 1;
    std::istringstream ss(line);
    std::string w;
    while (ss >> w) ++words;
}
```

```text
// 4. endl 会写 '\n' 并立即 flush 缓冲区（系统调用），'\n' 只写字符；大量输出时 endl 显著变慢。
```

### 12.7 本章速查

| 需求 | 做法 |
| --- | --- |
| 读整行 | `std::getline` |
| 混用 `>>`/`getline` | 先 `ignore(...)` |
| 文件读写 | `ifstream` / `ofstream`（RAII） |
| 二进制 | `ios::binary` + `read/write` |
| 目录操作 | `std::filesystem`（GCC 8 加 `-lstdc++fs`） |
| 输出加速 | `sync_with_stdio(false)`、用 `'\n'` |

---

## 13. 并发

### 13.1 `std::thread` 基础

```cpp
#include <thread>
#include <iostream>
#include <vector>

void work(int id) {
    std::cout << "thread " << id << '\n';
}

int main() {
    std::thread t1(work, 1);
    std::thread t2(work, 2);

    t1.join();      // 等待结束（必须：否则析构时 terminate）
    t2.join();
}
```

规则：

- 每个 `std::thread` 必须 `join()` 或 `detach()`，否则析构时 `std::terminate`；
- `join` 表示"等它跑完"，`detach` 表示"放它自己跑"（慎用）；
- 线程函数抛出的异常不会传播到主线程（会 `terminate`）——线程内部要自己 try/catch。

### 13.2 数据竞争与 `mutex`

```cpp
#include <mutex>

int counter = 0;
std::mutex m;

void bump() {
    for (int i = 0; i < 100000; ++i) {
        std::lock_guard<std::mutex> lock(m);      // RAII：出作用域自动解锁
        ++counter;
    }
}
```

**数据竞争的后果是未定义行为**（不只是"结果不对"），所以必须用同步原语或原子类型。

```cpp
// 多个互斥量：用 scoped_lock 一次锁住（避免死锁）
std::mutex m1, m2;
{
    std::scoped_lock lock(m1, m2);               // C++17，内部按固定顺序加锁
}
```

### 13.3 `std::atomic`

```cpp
#include <atomic>

std::atomic<int> counter{0};
counter.fetch_add(1);          // 或 ++counter
int v = counter.load();
counter.store(10);

std::atomic<bool> stop{false};
```

原子类型只保证**单个操作**的原子性。`counter += 1` 对 `atomic` 是原子的，但"读-改-写多个变量"的整体仍然需要锁。

### 13.4 条件变量：生产者-消费者

```cpp
#include <condition_variable>
#include <mutex>
#include <queue>

template <typename T>
class BlockingQueue {
    std::queue<T> q_;
    std::mutex m_;
    std::condition_variable cv_;
    bool closed_ = false;
public:
    void push(T v) {
        {
            std::lock_guard<std::mutex> lock(m_);
            q_.push(std::move(v));
        }
        cv_.notify_one();
    }

    bool pop(T& out) {
        std::unique_lock<std::mutex> lock(m_);
        cv_.wait(lock, [this] { return closed_ || !q_.empty(); });   // 谓词版：防虚假唤醒
        if (q_.empty()) return false;                                 // 已关闭
        out = std::move(q_.front());
        q_.pop();
        return true;
    }

    void close() {
        {
            std::lock_guard<std::mutex> lock(m_);
            closed_ = true;
        }
        cv_.notify_all();
    }
};
```

要点：`wait` **必须配谓词**（防虚假唤醒），`notify` 在解锁之后调用更高效。

### 13.5 `std::async` 与 `future`

```cpp
#include <future>
#include <vector>

int compute(int x) { return x * x; }

int main() {
    auto f1 = std::async(std::launch::async, compute, 2);
    auto f2 = std::async(std::launch::async, compute, 3);

    int r = f1.get() + f2.get();      // get 会阻塞；只能调用一次
    std::cout << r << '\n';           // 13
}
```

⚠️ 不写 `std::launch::async` 时，实现可以选择"延迟执行"，`future` 析构时可能同步执行，容易踩坑。

### 13.6 线程池的思路（C++17 手写）

```cpp
#include <atomic>
#include <condition_variable>
#include <functional>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(unsigned n) {
        for (unsigned i = 0; i < n; ++i) {
            workers_.emplace_back([this] { workerLoop(); });
        }
    }

    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(m_);
            stop_ = true;
        }
        cv_.notify_all();
        for (auto& t : workers_) t.join();
    }

    void submit(std::function<void()> job) {
        {
            std::lock_guard<std::mutex> lock(m_);
            jobs_.push(std::move(job));
        }
        cv_.notify_one();
    }

private:
    void workerLoop() {
        while (true) {
            std::function<void()> job;
            {
                std::unique_lock<std::mutex> lock(m_);
                cv_.wait(lock, [this] { return stop_ || !jobs_.empty(); });
                if (stop_ && jobs_.empty()) return;
                job = std::move(jobs_.front());
                jobs_.pop();
            }
            try { job(); } catch (...) { /* 记录 */ }
        }
    }

    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> jobs_;
    std::mutex m_;
    std::condition_variable cv_;
    bool stop_ = false;
};
```

### 13.7 死锁的四个条件与预防

死锁条件：互斥、持有并等待、不可抢占、循环等待。实用预防：

1. **固定加锁顺序**（所有线程都先 A 后 B）；
2. 用 `std::scoped_lock` 一次锁多个；
3. 尽量缩小临界区，不在持锁时做 IO；
4. 用超时锁 `std::try_lock_for` 兜底。

### 13.8 内存序（只需知道存在）

```cpp
std::atomic<bool> ready{false};
int data = 0;

// 线程 A
data = 42;
ready.store(true, std::memory_order_release);

// 线程 B
while (!ready.load(std::memory_order_acquire)) { }
assert(data == 42);
```

默认的 `memory_order_seq_cst` 最安全也最慢。除非在写高性能库，否则**不要改内存序**。

### 13.9 练习

1. 用 4 个线程求 1..1e8 的和（分块），比较单线程耗时。
2. 用 `BlockingQueue` 实现"生产者-消费者"，生产者 2 个、消费者 3 个。
3. 写一个"只执行一次的初始化"（`std::call_once`）。
4. 解释为什么 `std::thread` 不 `join` 就析构会 `terminate`。

### 13.10 答案（要点）

```cpp
// 3.
std::once_flag flag;
std::call_once(flag, [] { /* 只执行一次 */ });
```

```text
// 4. 析构时若线程仍可 join（joinable），标准要求调用 std::terminate —— 因为无法安全地决定"等它"还是"丢掉它"（detach 可能访问已销毁的对象）。
```

### 13.11 本章速查

| 需求 | 手段 |
| --- | --- |
| 起线程 | `std::thread` + `join` |
| 保护共享数据 | `std::mutex` + `lock_guard`/`scoped_lock` |
| 简单计数 | `std::atomic` |
| 等待条件 | `condition_variable` + 谓词 |
| 取异步结果 | `std::async` + `future` |
| 避免死锁 | 固定顺序 / `scoped_lock` / 缩小临界区 |

---

## 14. 构建、调试与工具链

### 14.1 编译过程

```text
源码 .cpp → 预处理（#include 展开）→ 编译 → 汇编 → 目标文件 .o → 链接 → 可执行文件
```

```bash
g++ -std=c++17 -c main.cpp -o main.o        # 只编译
g++ -std=c++17 -c stats.cpp -o stats.o
g++ main.o stats.o -o app                   # 链接
```

### 14.2 头文件与源文件的分工

```cpp
// stats.h —— 只放声明
#pragma once
#include <vector>

struct Stats { double mean; double max; };
Stats compute(const std::vector<double>& data);
double total(const std::vector<double>& data);

// stats.cpp —— 放定义
#include "stats.h"
#include <algorithm>

Stats compute(const std::vector<double>& data) {
    if (data.empty()) return {0, 0};
    double sum = 0;
    for (double d : data) sum += d;
    return { sum / data.size(), *std::max_element(data.begin(), data.end()) };
}
```

规则：

- 头文件里**不要**写定义（除了 `inline`、模板、`constexpr`）；
- 用 `#pragma once`（或 include guard）；
- 只 include 需要的，其余用**前向声明**减少编译时间：

```cpp
// 头文件里
class Widget;                     // 前向声明，够用指针/引用
void use(Widget* w);
```

### 14.3 ODR 与 `inline`

一个函数/变量在多个 `.cpp` 里定义会链接错误（multiple definition）。两种修法：

```cpp
// 1) 头文件里的函数加 inline（C++17 起也适用于变量）
inline int square(int x) { return x * x; }
inline constexpr int kMax = 100;      // C++17 的 inline 变量

// 2) 声明在头、定义在 .cpp
```

### 14.4 CMake 现代写法

```cmake
cmake_minimum_required(VERSION 3.16)
project(app CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(core STATIC src/stats.cpp)
target_include_directories(core PUBLIC include)
target_compile_features(core PUBLIC cxx_std_17)

add_executable(app src/main.cpp)
target_link_libraries(app PRIVATE core)
target_compile_options(app PRIVATE -Wall -Wextra -Wpedantic)

# 外部依赖
# find_package(fmt REQUIRED)
# target_link_libraries(app PRIVATE fmt::fmt)
```

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j 8
ctest --test-dir build
```

### 14.5 编译警告与静态分析

```bash
g++ -std=c++17 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Werror
```

| 工具 | 用途 |
| --- | --- |
| `-Wall -Wextra` | 基础警告，**必开** |
| `-Werror` | 警告当错误（CI 里开） |
| `-fsanitize=address` | 内存越界、UAF、泄漏 |
| `-fsanitize=undefined` | 未定义行为（溢出、空指针解引用） |
| `-fsanitize=thread` | 数据竞争 |
| `clang-tidy` | 代码规范与常见 bug 检查 |
| `cppcheck` | 轻量静态分析 |
| `-fanalyzer`（GCC 10+） | 路径敏感的静态分析（复杂代码较慢） |

```bash
g++ -std=c++17 -g -fsanitize=address,undefined -fno-omit-frame-pointer main.cpp -o app_asan
./app_asan
```

### 14.6 调试

```bash
g++ -std=c++17 -g -O0 main.cpp -o app
gdb ./app
# (gdb) break main
# (gdb) run
# (gdb) next / step
# (gdb) print x
# (gdb) bt          ← 调用栈（崩溃时最重要）
```

常用手段：

- `-g` 生成调试符号；
- `assert` 检查不变量（`NDEBUG` 会禁用，Release 里别依赖）；
- `-D_GLIBCXX_ASSERTIONS` 让 `vector::operator[]` 也检查边界；
- 崩溃日志里"`0x... in ???`"通常是没符号或栈被破坏。

### 14.7 性能分析

```bash
# 采样分析（推荐，开销小）
perf record -g ./app && perf report

# 或 gprof（老派）
g++ -pg ... && ./app && gprof ./app gmon.out
```

优化顺序：算法 → 数据结构 → 减少分配 → 缓存友好 → 编译器优化（`-O2`）→ 最后才手写优化。

### 14.8 优化选项

| 选项 | 作用 |
| --- | --- |
| `-O0` | 不优化（调试用） |
| `-O2` | 生产默认，性价比最高 |
| `-O3` | 更激进（可能增大代码体积） |
| `-march=native` | 用本机指令集（**不可分发**） |
| `-flto` | 链接期优化（跨编译单元内联） |
| `-DNDEBUG` | 关闭 `assert`（Release 构建） |

### 14.9 练习

1. 把一个单文件程序拆成 `.h` + 两个 `.cpp`，用 CMake 构建。
2. 故意写一个越界访问，用 ASan 跑出来，读报错信息。
3. 用 `-Wall -Wextra -Werror` 编译自己以前的代码，修掉所有警告。
4. 对比 `-O0` 与 `-O2` 下一个循环的耗时。

### 14.10 答案（要点）

```text
2. ASan 会打印 "heap-buffer-overflow" + 分配栈 + 访问栈，并指出 READ/WRITE of size N at 0x...
```

### 14.11 本章速查

| 环节 | 工具 |
| --- | --- |
| 构建 | CMake（或 Makefile） |
| 警告 | `-Wall -Wextra -Wpedantic` |
| 内存检查 | `-fsanitize=address,undefined` |
| 数据竞争 | `-fsanitize=thread` |
| 静态分析 | clang-tidy / cppcheck |
| 调试 | `gdb` + `-g -O0` |
| 性能 | `perf` + `-O2` |

---

## 15. C++20 / C++23 / C++26：现代特性

### 15.1 先说版本现状（2026-10）

| 版本 | 状态 | 说明 |
| --- | --- | --- |
| C++17 | 已发布（2017） | 本书正文基线，所有编译器都完整支持 |
| C++20 | 已发布（2020） | **推荐教学/新项目基线**：concepts、ranges、协程、模块、`std::span`、`std::format` |
| C++23 | 已发布：**ISO/IEC 14882:2024**（2024-10 出版） | 注意标准号是 2024；`print`、`expected`、`mdspan`、`generator`、`ranges::to` |
| C++26 | **技术定稿，但 ISO 表决未通过**（2026-10-23 DIS 投票被否决） | 不要写"已发布"。语言特性已冻结，出版流程未完成 |

C++26 那次否决是史上第一次：赞成票 12/20（需 2/3 = 14），反对 9/22（上限 25%），争议中心是 contracts（P2900）。ISO 给的四条出路（8 周修订再投／修订 CD／降级为技术规范／取消）尚未确定。

**对你的实际影响**：现在写代码就用 **C++20**；编译器支持就用 C++23 的 `print`、`expected`、`mdspan`；C++26 的东西（反射、contracts、`#embed`、`std::simd`）只在 GCC 16+ 的实验开关下能玩，不要进生产。

### 15.2 编译器支持速查

| 特性 | GCC | Clang | MSVC |
| --- | --- | --- | --- |
| concepts / requires | 10+ | 10+ | 19.30+ |
| ranges（基础） | 10+ | 13+ | 19.29+ |
| `std::format` | 13+ | 14+ | 19.29+ |
| `std::print`（C++23） | 14+ | 18+ | 19.37+ |
| `std::expected` | 12+ | 16+ | 19.33+ |
| `std::mdspan` | 14+ | 17+ | 19.39+ |
| 协程 | 10+ | 14+ | 19.28+ |
| 模块 | 14+（实验，需 `-fmodules`） | 16+ | 17.4+ |
| 反射（C++26） | 16+（`-freflection`） | — | — |

结论：**用 C++20 写的代码在 2022 年后的三大编译器上都能跑**；C++23 的库特性要看具体版本。

### 15.3 concepts：让模板报错可读

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template <Addable T>
T add(T a, T b) { return a + b; }

int main() {
    std::cout << add(1, 2) << '\n';
    // add(std::string("a"), 1);   // 报错直接说 "constraints not satisfied"，而不是几十行模板展开
}
```

标准库现成的概念：`std::integral`、`std::floating_point`、`std::same_as`、`std::convertible_to`、`std::invocable`、`std::ranges::range`、`std::ranges::sized_range`。

```cpp
template <std::integral T>
T twice(T x) { return x * 2; }

void printAll(std::ranges::range auto&& r) {
    for (const auto& x : r) std::cout << x << ' ';
}
```

### 15.4 ranges：算法直接接容器

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6};

    auto evens = v | std::views::filter([](int x) { return x % 2 == 0; })
                   | std::views::transform([](int x) { return x * x; });

    for (int x : evens) std::cout << x << ' ';     // 4 16 36
}
```

| 视图 | 作用 |
| --- | --- |
| `views::filter` | 过滤 |
| `views::transform` | 映射 |
| `views::take(n)` / `drop(n)` | 取前 n / 跳过 n |
| `views::reverse` | 反转 |
| `views::iota(a, b)` | 生成序列 |
| `views::chunk(n)`（C++23） | 分块 |
| `views::join` | 展平 |
| `views::split` | 分割 |

视图是**惰性**的：不产生中间容器，组合起来仍只遍历一次。

### 15.5 `std::span`：非拥有数组视图

```cpp
#include <span>

void sumAll(std::span<const int> data) {       // 不复制、不知道来源是 vector/数组/C 数组
    long long s = 0;
    for (int x : data) s += x;
    std::cout << s << '\n';
}

int arr[] = {1, 2, 3};
std::vector<int> v{4, 5};

sumAll(arr);
sumAll(v);
```

这是替代 `(const int* p, size_t n)` 的现代写法：**类型安全、长度自带、零开销**。

### 15.6 `constexpr` / `consteval` / `constinit`

```cpp
constexpr int square(int x) { return x * x; }        // 可用于编译期

consteval int compileTimeOnly(int x) { return x * 2; }   // 必须编译期求值（C++20）

constinit int g = 42;      // 保证静态初始化（避免"静态初始化顺序"问题，C++20）

constexpr auto table = [] {
    std::array<int, 5> t{};
    for (int i = 0; i < 5; ++i) t[i] = i * i;
    return t;
}();                        // 编译期生成查找表
```

### 15.7 指定初始化器与结构化绑定（C++20 补充）

```cpp
struct Config { int threads; bool verbose; std::string name; };

Config c{ .threads = 4, .verbose = true, .name = "app" };    // C++20 指定初始化

// C++17 就有结构化绑定
auto [a, b] = std::pair{1, 2};
```

### 15.8 `std::format` 与 `std::print`

```cpp
#include <format>
#include <print>          // C++23
#include <iostream>

int main() {
    std::string s = std::format("{} + {} = {}", 1, 2, 3);
    std::cout << s << '\n';

    std::cout << std::format("{:>8.2f}\n", 3.14159);     // 右对齐、两位小数
    // std::println("{} 岁", 30);                         // C++23
}
```

`std::format` 语法类似 Python 的 `str.format`：`{}`、`{:d}`、`{:.2f}`、`{:>8}`、`{0}` 位置参数。

### 15.9 协程（了解概念）

```cpp
// C++20 只提供了"语言机制"（co_await/co_yield/co_return），
// 具体的 Task/Generator 类型要库或自己写。
// 实际项目用 cppcoro、asio 的 awaitable、或者 C++23 的 std::generator。

#include <generator>          // C++23

std::generator<int> naturals() {
    for (int i = 0; ; ++i) co_yield i;
}

for (int x : naturals() | std::views::take(5)) std::cout << x << ' ';
```

**现状**：语言层完备，标准库的异步生态（`std::execution`）已进 C++26 但工程采用率低。生产里常见的是 asio/libunifex，或者干脆不用协程。

### 15.10 模块（modules）

```cpp
// math.ixx / math.cppm
export module math;
export int add(int a, int b) { return a + b; }

// main.cpp
import math;
int main() { return add(1, 2); }
```

现实：

- GCC 需 `-fmodules`（实验）；Clang 16+ 与 MSVC 17.4+ 可用；
- `import std;` 要 Clang 18.1.2+ / MSVC 14.36+ / GCC 15+；
- CMake 3.28+ 支持扫描，`import std` 需 4.5（实验），且只有 Ninja 生成器；
- 生态（库的模块化发布）几乎没有。

**结论：继续用头文件。** 模块没有解决你今天的任何问题，但会引入构建复杂度。

### 15.11 C++23 值得用的

```cpp
// std::expected：带错误值的返回值
#include <expected>

std::expected<int, std::string> parse(std::string_view s) {
    try { return std::stoi(std::string(s)); }
    catch (...) { return std::unexpected("不是整数"); }
}

auto r = parse("42");
if (r) std::cout << *r;
else std::cout << r.error();
```

```cpp
// std::print / println（比 iostream 更快更简洁）
std::println("hello {}", name);

// std::mdspan：多维数组视图（科学计算）
// std::generator：协程生成器
// ranges::to：视图转容器
auto v = views::iota(1, 5) | std::ranges::to<std::vector>();
```

### 15.12 C++26 前瞻（别进生产）

| 特性 | 说明 | 可用性 |
| --- | --- | --- |
| 反射（P2996） | `^^T` 取元信息、生成代码 | GCC 16 `-freflection` |
| contracts（P2900） | `pre`/`post`/`contract_assert` —— 正是它导致 DIS 被否 | GCC 16 实验 |
| `#embed` | 把二进制文件编进程序 | GCC 16 |
| expansion statements | `for...` 展开包 | GCC 16 |
| `std::simd` | 数据并行 | GCC 16 |
| `std::execution` | sender/receiver 异步模型 | 已入标准，生态弱 |
| 模式匹配 | 目标 C++29，**未进 C++26** | — |

### 15.13 练习

1. 用 `concept` 约束一个只接受算术类型的 `average` 函数。
2. 用 ranges 把 `vector<int>` 过滤出偶数、平方、取前 3 个。
3. 用 `std::span` 写一个不依赖容器的求和函数。
4. 用 `std::format` 生成对齐的表格行。

### 15.14 答案（要点）

```cpp
// 1.
template <std::floating_point T>
T average(std::span<const T> xs) {
    if (xs.empty()) return T{};
    T s{};
    for (T x : xs) s += x;
    return s / static_cast<T>(xs.size());
}

// 2.
auto out = v | std::views::filter([](int x){ return x % 2 == 0; })
             | std::views::transform([](int x){ return x * x; })
             | std::views::take(3);

// 4.
std::cout << std::format("| {:>8} | {:<8} |\n", "name", "value");
```

### 15.15 本章速查

| 版本 | 关键特性 |
| --- | --- |
| C++17 | `string_view`、`optional`、`variant`、`filesystem`、结构化绑定、`if constexpr` |
| C++20 | concepts、ranges、`span`、`format`、协程、模块、`consteval` |
| C++23 | `print`、`expected`、`mdspan`、`generator`、`ranges::to` |
| C++26 | 反射、contracts（**未发布**）、`#embed`、`simd` |

---

## 16. 从 C 代码迁移到 C++

### 16.1 迁移策略：从边界往里换

不要"重写"。按风险从低到高逐步替换：

```text
第 1 步：工具链换成 C++ 编译器（.c 直接当 C++ 编译，先看报错）
第 2 步：把 malloc/free 换成容器与智能指针（局部、逐个函数）
第 3 步：把 struct + 函数 换成 class（保持接口不变）
第 4 步：把错误码换成异常/optional（从内层往外层）
第 5 步：用标准库替换手写数据结构与算法
第 6 步：打开严格警告，清理不安全转换
```

### 16.2 直接用 C++ 编译 C 代码会遇到什么

| C 代码 | C++ 下的问题 | 修法 |
| --- | --- | --- |
| `void* p = malloc(n);` 赋值给 `T*` | C++ 不允许隐式 `void*` → `T*` | 加 `static_cast<T*>(...)`，或改用容器 |
| `char* s = "abc";` | 字符串字面量是 `const char[N]` | 写 `const char*` |
| `int* p = 0;` | 可以编过，但不推荐 | `nullptr` |
| 变量名 `new`/`class`/`delete`/`this`/`template` | 是关键字 | 改名 |
| `void f();` 声明后调用 `f(1,2)` | C++ 要求原型匹配（C 的旧式声明） | 修正原型 |
| 函数名重载冲突 | C 不允许，C++ 一旦你加了重载就变语义 | 检查 |
| `struct S s = {0};` | 多数情况可行；有构造函数后不行 | 用 `S s{};` |

### 16.3 保留 C 接口边界：`extern "C"`

```cpp
// C 头文件可以被 C 和 C++ 共用
#ifdef __cplusplus
extern "C" {
#endif

int c_api_init(const char* path);
void c_api_free(void* p);

#ifdef __cplusplus
}
#endif
```

如果头文件是别人的、没写 `extern "C"`，在 C++ 里包一层：

```cpp
extern "C" {
#include "legacy.h"
}
```

**为什么需要**：C++ 会做名字修饰（name mangling），C 不会。不加 `extern "C"` 就会出现链接错误"undefined reference to `c_api_init`"（而 `nm` 里其实有 `_Z10c_api_initPKc`）。

### 16.4 逐个替换的对照清单

```c
// before: C
typedef struct { int* data; size_t len; size_t cap; } IntVec;
void intvec_init(IntVec* v) { v->data = NULL; v->len = v->cap = 0; }
void intvec_push(IntVec* v, int x) {
    if (v->len == v->cap) {
        size_t ncap = v->cap ? v->cap * 2 : 8;
        int* nd = realloc(v->data, ncap * sizeof(int));
        if (!nd) { fprintf(stderr, "oom\n"); exit(1); }
        v->data = nd; v->cap = ncap;
    }
    v->data[v->len++] = x;
}
void intvec_free(IntVec* v) { free(v->data); v->data = NULL; v->len = v->cap = 0; }
```

```cpp
// after: C++
std::vector<int> v;
v.push_back(1);
// 没有 init、没有 free、没有扩容逻辑、没有 oom 处理
```

```c
// before: 手写链表节点
struct Node { int val; struct Node* next; };
```

```cpp
// after
std::list<int> l;           // 或 std::vector / std::deque，先问"真的需要链表吗"
```

```c
// before: 错误码层层传递
int read_config(const char* path, Config* out);
if (read_config(p, &cfg) != 0) { ... }
```

```cpp
// after: 异常（或 expected）
Config readConfig(const std::string& path);      // 失败抛异常，调用点不必逐个 if
```

### 16.5 不要一次改完：灰度的三个技巧

1. **C 与 C++ 混合编译**：`.c` 用 C 编译器、`.cpp` 用 C++ 编译器，通过 `extern "C"` 头文件对接（CMake 支持）；
2. **先把 C 代码当 C++ 编过**（`g++ -x c++ legacy.c`），这一步会暴露所有类型/关键字冲突；
3. **先换叶子模块**：解析、字符串处理、数据结构最安全；I/O 与线程最后动。

### 16.6 常见"从 C 带来的坏习惯"

| 坏习惯 | 更好的做法 |
| --- | --- |
| 到处 `T*` + 长度 | `std::span` / `std::vector` / `string_view` |
| 用 `malloc` 管对象 | `make_unique` / 容器 |
| 用 `#define` 定义常量 | `constexpr` |
| 用 `#define` 写"函数" | `inline` 函数或模板 |
| 用 `switch(type)` 做多态 | 虚函数或 `std::variant` + `visit` |
| 手动 `strcpy`/`strcat` | `std::string` |
| 忽略返回值 | 标 `[[nodiscard]]` |
| 全局可变状态 | 传参 / 类成员 |
| 用 `int` 表示错误码 + 输出参数 | 返回值 + 异常/`optional`/`expected` |

### 16.7 练习

1. 拿一个自己写的 C 文件，用 `g++ -x c++` 编译，列出所有报错并分类（类型 / 关键字 / 原型）。
2. 把一个用 `malloc` 的 C 函数改成用 `std::vector`。
3. 写一个 `extern "C"` 的接口，让 C 程序能调用你的 C++ 函数（参数只用 C 类型）。
4. 把 `switch` 分派改成 `std::variant` + `std::visit`。

### 16.8 答案（要点）

```cpp
// 4.
using Shape = std::variant<Circle, Rect, Triangle>;
double area(const Shape& s) {
    return std::visit([](const auto& x) { return x.area(); }, s);
}
```

```text
// 3. 关键：接口只用 C 能表达的类型（int/double/char*/struct），不要暴露 std::string、模板、异常。
```

### 16.9 本章速查

| 阶段 | 动作 |
| --- | --- |
| 1 | 换 C++ 编译器编过 |
| 2 | `malloc/free` → 容器/智能指针 |
| 3 | `struct`+函数 → 类 |
| 4 | 错误码 → 异常/`optional` |
| 5 | 手写结构 → 标准库 |
| 边界 | `extern "C"` + `#ifdef __cplusplus` |

---

## 17. 实战一：CSV 统计工具（C++17，可直接编译）

目标：读 CSV，按某列分组统计金额，输出汇总表。要求：纯 C++17、无第三方库、可用 `g++ -std=c++17` 编译。

### 17.1 完整代码

```cpp
// csv_stats.cpp
#include <algorithm>
#include <cctype>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <numeric>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

namespace {

std::string_view trim(std::string_view s) {
    auto notSpace = [](char c) { return !std::isspace(static_cast<unsigned char>(c)); };
    while (!s.empty() && !notSpace(s.front())) s.remove_prefix(1);
    while (!s.empty() && !notSpace(s.back())) s.remove_suffix(1);
    return s;
}

// 支持双引号包裹、字段内逗号与转义引号
std::vector<std::vector<std::string>> parseCsv(std::string_view text) {
    std::vector<std::vector<std::string>> rows;
    std::vector<std::string> row;
    std::string field;
    bool inQuotes = false;

    for (std::size_t i = 0; i < text.size(); ++i) {
        const char c = text[i];
        if (inQuotes) {
            if (c == '"') {
                if (i + 1 < text.size() && text[i + 1] == '"') { field += '"'; ++i; }
                else inQuotes = false;
            } else {
                field += c;
            }
            continue;
        }
        if (c == '"') { inQuotes = true; continue; }
        if (c == ',') { row.push_back(std::move(field)); field.clear(); continue; }
        if (c == '\n') { row.push_back(std::move(field)); field.clear(); rows.push_back(std::move(row)); row.clear(); continue; }
        if (c == '\r') continue;
        field += c;
    }
    if (!field.empty() || !row.empty()) {
        row.push_back(std::move(field));
        rows.push_back(std::move(row));
    }
    return rows;
}

struct Group {
    std::string name;
    std::size_t count = 0;
    double total = 0.0;
};

class Report {
public:
    void add(std::string_view category, double amount) {
        auto& g = groups_[std::string(category)];
        g.name = std::string(category);
        g.count += 1;
        g.total += amount;
    }

    std::size_t invalid() const { return invalid_; }
    void noteInvalid() { ++invalid_; }

    std::vector<Group> sorted() const {
        std::vector<Group> v;
        v.reserve(groups_.size());
        for (const auto& [k, g] : groups_) v.push_back(g);
        std::sort(v.begin(), v.end(), [](const Group& a, const Group& b) {
            if (a.total != b.total) return a.total > b.total;
            return a.name < b.name;
        });
        return v;
    }

    double total() const {
        double s = 0.0;
        for (const auto& [k, g] : groups_) s += g.total;
        return s;
    }

private:
    std::map<std::string, Group> groups_;
    std::size_t invalid_ = 0;
};

std::string readAll(const std::string& path) {
    std::ifstream in(path, std::ios::binary);
    if (!in) throw std::runtime_error("无法打开文件: " + path);
    std::ostringstream ss;
    ss << in.rdbuf();
    std::string text = ss.str();

    // Excel / Numbers 导出的 UTF-8 CSV 常带 BOM（EF BB BF），
    // 不剥掉它，第一列列名会变成 "\uFEFFcategory"，永远匹配不上。
    if (text.size() >= 3 &&
        static_cast<unsigned char>(text[0]) == 0xEF &&
        static_cast<unsigned char>(text[1]) == 0xBB &&
        static_cast<unsigned char>(text[2]) == 0xBF) {
        text.erase(0, 3);
    }
    return text;
}

}  // namespace

int main(int argc, char** argv) {
    std::ios::sync_with_stdio(false);

    if (argc < 2) {
        std::cerr << "用法: " << argv[0] << " <file.csv> [groupColumn] [amountColumn]\n";
        return 2;
    }
    const std::string groupCol = argc > 2 ? argv[2] : "category";
    const std::string amountCol = argc > 3 ? argv[3] : "amount";

    try {
        const std::string text = readAll(argv[1]);
        auto rows = parseCsv(text);
        if (rows.empty()) throw std::runtime_error("文件为空");

        const auto& header = rows.front();
        auto findColumn = [&](const std::string& name) -> std::size_t {
            for (std::size_t i = 0; i < header.size(); ++i) {
                if (trim(header[i]) == name) return i;
            }
            throw std::runtime_error("找不到列: " + name);
        };

        const std::size_t gi = findColumn(groupCol);
        const std::size_t ai = findColumn(amountCol);

        Report rep;
        for (std::size_t r = 1; r < rows.size(); ++r) {
            const auto& row = rows[r];
            if (row.size() <= std::max(gi, ai)) { rep.noteInvalid(); continue; }
            const std::string amountText(trim(row[ai]));
            if (amountText.empty()) { rep.noteInvalid(); continue; }
            try {
                std::size_t pos = 0;
                const double amount = std::stod(amountText, &pos);
                if (pos != amountText.size()) { rep.noteInvalid(); continue; }
                rep.add(trim(row[gi]), amount);
            } catch (const std::exception&) {
                rep.noteInvalid();
            }
        }

        std::cout << "分组统计（按 " << groupCol << " 汇总 " << amountCol << "）\n";
        std::cout << std::left << std::setw(16) << "分类"
                  << std::right << std::setw(8) << "条数" << std::setw(14) << "合计"
                  << std::setw(14) << "均值" << '\n';

        for (const auto& g : rep.sorted()) {
            std::cout << std::left << std::setw(16) << g.name
                      << std::right << std::setw(8) << g.count
                      << std::setw(14) << std::fixed << std::setprecision(2) << g.total
                      << std::setw(14) << (g.count ? g.total / static_cast<double>(g.count) : 0.0)
                      << '\n';
        }

        std::cout << std::string(52, '-') << '\n'
                  << "总计 " << std::fixed << std::setprecision(2) << rep.total()
                  << "，无效行 " << rep.invalid() << '\n';
        return rep.invalid() == 0 ? 0 : 1;
    } catch (const std::exception& e) {
        std::cerr << "错误: " << e.what() << '\n';
        return 1;
    }
}
```

```bash
g++ -std=c++17 -Wall -Wextra -Wpedantic csv_stats.cpp -o csv_stats
./csv_stats sales.csv category amount
```

### 17.2 这个程序用到了哪些章节

| 代码 | 章节 |
| --- | --- |
| `std::string_view` 参数 | 2、11 |
| `std::map` 分组 | 8 |
| `std::sort` + lambda | 9 |
| `throw std::runtime_error` | 10 |
| `ifstream` / `ostringstream` | 12 |
| 移动语义（`std::move(field)`） | 5 |
| `namespace {}` 匿名命名空间 | 14 |

### 17.3 几处设计取舍

- **为什么用 `std::map` 而不是 `unordered_map`**：输出需要稳定顺序（按总额降序，但同额时按名字），用 `map` 保证确定性，便于测试；
- **为什么先读整个文件**：示例追求简单；生产上应改成流式逐行（`getline`），否则大文件会撑爆内存；
- **为什么 `main` 里包一层 `try`**：异常不能越过 `main` 之外，否则 `std::terminate`；
- **退出码 1 表示"有无效行"**：让脚本能判断数据质量。

关于 BOM：这一处是实测踩到的坑。用 Excel 另存为 CSV（UTF-8）后，文件开头会多出三个字节 `EF BB BF`。程序照旧读，第一列列名就变成 `"\uFEFFcategory"`，于是报"找不到列: category"——数据看起来完全正常，报错却莫名其妙。`readAll` 里剥掉 BOM 的三行就是为这个准备的。

```text
$ ./csv_stats bom.csv
错误: 找不到列: category      # 不剥 BOM 时
```

这类问题的通用教训：**处理文本输入时，先确认"你以为的字节序/编码"和文件实际的字节是否一致**；错误信息里出现看不见的字符时，用 `xxd`（Linux）或 `Format-Hex`（PowerShell）看头部字节。

### 17.4 扩展练习

1. 改成流式读取（不把整个文件读进内存）。
2. 加 `--top N` 只输出前 N 组。
3. 支持 TSV（分隔符可配置）。
4. 加单元测试（简单 `assert` 或引入 Catch2）。

---

## 18. 实战二：线程池计算器（C++17）

目标：把 N 个任务分给 4 个线程，统计耗时，演示线程池、`future`、原子操作。

### 18.1 完整代码

```cpp
// pool_demo.cpp
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <future>
#include <iostream>
#include <memory>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(std::size_t n) {
        for (std::size_t i = 0; i < n; ++i) {
            workers_.emplace_back([this] { loop(); });
        }
    }

    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(m_);
            stop_ = true;
        }
        cv_.notify_all();
        for (auto& t : workers_) {
            if (t.joinable()) t.join();
        }
    }

    ThreadPool(const ThreadPool&) = delete;
    ThreadPool& operator=(const ThreadPool&) = delete;

    template <typename F>
    auto submit(F&& f) -> std::future<decltype(f())> {
        using R = decltype(f());
        auto task = std::make_shared<std::packaged_task<R()>>(std::forward<F>(f));
        std::future<R> fut = task->get_future();
        {
            std::lock_guard<std::mutex> lock(m_);
            jobs_.emplace([task] { (*task)(); });
        }
        cv_.notify_one();
        return fut;
    }

    std::size_t size() const { return workers_.size(); }

private:
    void loop() {
        while (true) {
            std::function<void()> job;
            {
                std::unique_lock<std::mutex> lock(m_);
                cv_.wait(lock, [this] { return stop_ || !jobs_.empty(); });
                if (stop_ && jobs_.empty()) return;
                job = std::move(jobs_.front());
                jobs_.pop();
            }
            job();
        }
    }

    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> jobs_;
    std::mutex m_;
    std::condition_variable cv_;
    bool stop_ = false;
};

long long fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

int main() {
    constexpr std::size_t kThreads = 4;
    const std::vector<int> inputs{28, 30, 32, 34, 30, 31, 29, 33};

    // 串行
    auto t0 = std::chrono::steady_clock::now();
    long long serialSum = 0;
    for (int n : inputs) serialSum += fib(n);
    auto t1 = std::chrono::steady_clock::now();

    // 并行
    ThreadPool pool(kThreads);
    std::atomic<long long> parallelSum{0};
    std::vector<std::future<void>> futures;
    futures.reserve(inputs.size());

    auto t2 = std::chrono::steady_clock::now();
    for (int n : inputs) {
        futures.push_back(pool.submit([n, &parallelSum] {
            parallelSum.fetch_add(fib(n), std::memory_order_relaxed);
        }));
    }
    for (auto& f : futures) f.get();
    auto t3 = std::chrono::steady_clock::now();

    auto ms = [](auto a, auto b) {
        return std::chrono::duration_cast<std::chrono::milliseconds>(b - a).count();
    };

    std::cout << "线程数: " << pool.size() << '\n'
              << "串行: " << ms(t0, t1) << " ms, 和 = " << serialSum << '\n'
              << "并行: " << ms(t2, t3) << " ms, 和 = " << parallelSum.load() << '\n';

    if (serialSum != parallelSum.load()) {
        std::cerr << "结果不一致！\n";
        return 1;
    }
    return 0;
}
```

```bash
g++ -std=c++17 -O2 -pthread pool_demo.cpp -o pool_demo
./pool_demo
```

### 18.2 关键点

| 设计 | 原因 |
| --- | --- |
| `packaged_task` + `shared_ptr` | 任务可拷贝进 `std::function`，结果通过 `future` 取 |
| `condition_variable` + 谓词 | 避免忙等与虚假唤醒 |
| `stop_` + 排空队列 | 析构时把剩余任务跑完，不丢任务 |
| `atomic` + `relaxed` | 只做累加，不需要顺序约束（但要注意：这里依赖 `f.get()` 做同步） |
| `-pthread` | Linux 上必须链接线程库 |

### 18.3 常见错误示范

```cpp
// ❌ 捕获局部变量的引用，任务执行时变量已销毁
for (int i = 0; i < 4; ++i) pool.submit([&] { use(i); });

// ✅ 按值捕获
for (int i = 0; i < 4; ++i) pool.submit([i] { use(i); });
```

```cpp
// ❌ 忘记 f.get()：任务可能没跑完 main 就退出
pool.submit([]{ heavy(); });

// ✅
auto f = pool.submit([]{ heavy(); });
f.get();
```

### 18.4 扩展练习

1. 加"任务优先级"（两个队列）。
2. 加工作窃取（每个线程自己的 deque）。
3. 用 `std::async` 重写一遍，比较代码长度与线程数控制。
4. 用 `-fsanitize=thread` 跑一遍，看是否报数据竞争。

---

## 19. 陷阱与反模式

### 19.1 内存与生命周期

| 陷阱 | 后果 | 修法 |
| --- | --- | --- |
| 返回局部变量的引用/指针 | 悬垂引用 | 返回值，或返回 `static`/成员 |
| `delete` 基类指针但基类无虚析构 | 派生类成员泄漏 | `virtual ~Base() = default;` |
| 两个智能指针管同一裸指针 | 双重释放 | 只从一个所有者交出所有权 |
| `new[]` 配 `delete` | UB | 用容器 |
| 迭代器在容器修改后继续用 | UB | 用 `erase` 返回值、重新获取 |
| 保存 `string_view` 到源串之后 | 悬垂 | 需要持有时用 `std::string` |
| 引用成员 + 临时对象 | 悬垂 | 存值，或用 `std::reference_wrapper` 并保证生命周期 |

### 19.2 类型与转换

```cpp
// ❌ 隐式窄化
void f(int n);
f(3.9);                          // 静默截断为 3

// ✅ 用花括号初始化，编译器会拦窄化
int x{3.9};                      // 编译错误

// ❌ 有符号/无符号混比
std::vector<int> v;
for (int i = 0; i < v.size(); ++i)   // signed 与 size_t 比较，-Wsign-compare 会警告
    ;

// ✅
for (std::size_t i = 0; i < v.size(); ++i)
    ;
```

### 19.3 异常相关

```cpp
// ❌ 在析构函数里抛
~T() { throw std::runtime_error("x"); }

// ❌ 捕获后静默
try { risky(); } catch (...) {}

// ❌ catch 基类对象（切片）
catch (std::exception e) {}

// ❌ 用异常做流程控制
try { for (;;) { if (cond) throw Stop{}; } } catch (Stop&) {}
```

### 19.4 性能反模式

| 反模式 | 影响 | 改进 |
| --- | --- | --- |
| 循环里 `v.push_back` 不 `reserve` | 多次扩容复制 | 估算大小后 `reserve` |
| 函数参数按值传大对象 | 每次调用复制 | `const T&` |
| 返回 `std::string` 时 `return std::move(s)` | 阻止 NRVO | 直接 `return s` |
| 循环里拼接大量字符串 | O(n²) | `reserve` 或 `ostringstream` |
| 用 `std::endl` 大量输出 | 每次 flush | `'\n'` |
| 频繁 `new`/`delete` 小对象 | 分配器压力 | 用容器/对象池 |
| 拷贝 `shared_ptr` 到热路径 | 原子操作开销 | 传 `const T&` 或裸指针 |

### 19.5 可读性反模式

- 一个函数 200 行：拆成有名字的小函数；
- 5 层嵌套：提前 `return`（卫语句）；
- 名字 `a`、`tmp`、`data2`：用语义化名字，必要时加后缀 `_` 表示成员；
- 到处 `auto` 导致看不出类型：关键位置写明确类型；
- 注释解释"做了什么"：注释应解释"为什么"。

### 19.6 本章速查

| 类别 | 一句话 |
| --- | --- |
| 生命周期 | 谁拥有谁负责；用 RAII 与智能指针表达 |
| 转换 | 用 `static_cast`；优先花括号初始化 |
| 异常 | 析构不抛；捕获用引用 |
| 性能 | 传引用、`reserve`、别阻止 NRVO |

---

## 20. 练习总集（36 题）

### 20.1 基础（1–12）

1. 写 `swap(int&, int&)`，并说明为什么不用指针。
2. 写 `constexpr int factorial(int n)`。
3. 把 `#define MAX(a,b)` 改成模板函数，说明改进点。
4. 写 `struct Point` 与 `class Circle`（含面积），比较何时用哪个。
5. 写 `class Timer`（RAII 计时）。
6. 用 `std::vector` 实现"读入 n 个数并反转输出"。
7. 用 `std::array` 实现固定大小环形缓冲区。
8. 用 `std::string` 做简易 `trim`（不用 `string_view` 版本对照）。
9. 写 `bool isPalindrome(const std::string&)`。
10. 用 `std::map` 统计字符出现次数。
11. 写 `std::optional<int> toInt(const std::string&)`。
12. 用 `std::sort` 对 `std::vector<std::pair<std::string,int>>` 按值降序。

### 20.2 进阶（13–26）

13. 实现 `MyString`（rule of three），再改成移动语义（rule of five）。
14. 用 `unique_ptr` 实现"依赖注入"的 `Logger` 接口（控制台/文件两种实现）。
15. 实现 `Shape` 接口 + 三种图形 + 工厂函数 `makeShape(kind)`。
16. 用模板实现 `Stack<T>` 与 `Queue<T>`。
17. 用 `if constexpr` 写 `toJson(T)`，对字符串/数字/布尔分别处理。
18. 用折叠表达式写 `maxOf(a, b, c...)`。
19. 实现 `split` + `join`（`string_view` 版）。
20. 实现 CSV 解析（支持引号），并写测试。
21. 实现一个最小 `variant` 访问（用 `std::variant` + `visit`）。
22. 实现 `Result<T,E>` 并写 `parseInt` 使用它。
23. 实现 `BlockingQueue<T>` 生产者消费者。
24. 用 `std::async` 并行计算多个文件的行数。
25. 实现"线程池 + 任务队列"（第 18 章），加优先级。
26. 用 `std::atomic` 实现无锁计数器，并对比 `mutex` 版本。

### 20.3 综合（27–36）

27. 写一个迷你 CSV 数据库：加载、查询、按条件过滤、排序、分页。
28. 写一个 JSON 序列化器（只处理对象/数组/字符串/数字/布尔），要求输出合法 JSON。
29. 写一个内存分配追踪器（重载 `operator new`/`delete` 统计次数与字节数）。
30. 写一个 LRU 缓存（`std::list` + `unordered_map`）。
31. 写一个事件循环（`epoll`/`select` 任选，或仅用线程 + 队列模拟）。
32. 实现一个简单的表达式求值器（递归下降，支持 + - * / 括号）。
33. 用 `std::filesystem` 实现 `du`（递归统计目录大小）。
34. 用协程（或 `std::generator`）实现斐波那契生成器。
35. 给第 27 题写单元测试（`assert` 或 Catch2）。
36. 用 ASan + UBSan 跑一遍第 27–33 题，修掉所有问题。

### 20.4 参考答案（要点摘录）

```cpp
// 11.
std::optional<int> toInt(const std::string& s) {
    try {
        std::size_t pos = 0;
        int v = std::stoi(s, &pos);
        if (pos != s.size()) return std::nullopt;
        return v;
    } catch (...) {
        return std::nullopt;
    }
}

// 18.
template <typename T>
constexpr T maxOf(T a, T b) { return a > b ? a : b; }

template <typename T, typename... Rest>
constexpr T maxOf(T first, T second, Rest... rest) {
    return maxOf(maxOf(first, second), rest...);
}
```

```cpp
// 30. LRU
template <typename K, typename V>
class LruCache {
    using List = std::list<std::pair<K, V>>;
    List items_;
    std::unordered_map<K, typename List::iterator> index_;
    std::size_t cap_;
public:
    explicit LruCache(std::size_t cap) : cap_(cap) {}

    std::optional<V> get(const K& k) {
        auto it = index_.find(k);
        if (it == index_.end()) return std::nullopt;
        items_.splice(items_.begin(), items_, it->second);   // 移到表头
        return it->second->second;
    }

    void put(const K& k, V v) {
        auto it = index_.find(k);
        if (it != index_.end()) {
            it->second->second = std::move(v);
            items_.splice(items_.begin(), items_, it->second);
            return;
        }
        if (items_.size() == cap_) {
            index_.erase(items_.back().first);
            items_.pop_back();
        }
        items_.emplace_front(k, std::move(v));
        index_[k] = items_.begin();
    }
};
```

```cpp
// 29. 分配统计（简化）
std::atomic<long long> g_allocs{0};
void* operator new(std::size_t n) {
    g_allocs.fetch_add(1, std::memory_order_relaxed);
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc();
}
void operator delete(void* p) noexcept { std::free(p); }
```

### 20.5 自测标准

- 1–12：C 程序员入门线；
- 13–26：能写出合格的 C++ 库代码；
- 27–36：具备做项目的能力（会拆模块、会写测试、会用 sanitizer）。

---

## 21. 速查表与学习路径

### 21.1 语法速查

```cpp
// 声明与初始化
int x{42};                    // 列表初始化（防窄化）
auto v = std::vector<int>{1, 2, 3};
constexpr int kMax = 100;
inline constexpr int kSize = 8;      // C++17 头文件里的常量

// 引用
void f(const std::string& s);        // 只读大对象
void g(std::string& s);              // 修改
void h(std::string&& s);             // 移动/转发

// 类
class A {
public:
    A() = default;
    explicit A(int x) : x_(x) {}     // 初始化列表
    virtual ~A() = default;          // 有虚函数就要虚析构
    virtual void f() = 0;            // 纯虚
    void g() const { }               // const 成员函数
private:
    int x_ = 0;                      // 默认成员初始化
};

// 继承与多态
class B : public A {
public:
    void f() override;
    void g() final;
};

// 智能指针
auto p = std::make_unique<T>(args);
auto s = std::make_shared<T>(args);
std::weak_ptr<T> w = s;

// 容器
std::vector<int> v;
std::map<std::string, int> m;
std::unordered_map<int, std::string> h;
v.emplace_back(1);
v.reserve(100);
for (const auto& [k, val] : m) { }

// 算法
std::sort(v.begin(), v.end());
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
v.erase(std::remove_if(v.begin(), v.end(), pred), v.end());
auto it = std::find_if(v.begin(), v.end(), [](int x) { return x > 3; });

// 异常
try { ... } catch (const std::exception& e) { e.what(); }
throw std::runtime_error("msg");

// optional / variant
std::optional<int> maybe;
if (maybe) use(*maybe);
std::variant<int, std::string> var = 42;
std::visit([](const auto& v) { }, var);

// 并发
std::thread t(fn, arg); t.join();
std::mutex m; { std::lock_guard<std::mutex> lk(m); }
std::atomic<int> cnt{0};
std::condition_variable cv; cv.wait(lk, pred);

// C++20（简述）
template <std::integral T> T f(T);           // concepts
auto r = v | std::views::filter(pred);        // ranges
std::span<const int> sp(v);                   // 视图
std::string s = std::format("{}", 42);
consteval int c(int x) { return x * 2; }
```

### 21.2 与 C / Python / JavaScript 的对照

| 概念 | C | C++ | Python | JavaScript |
| --- | --- | --- | --- | --- |
| 内存管理 | `malloc/free` | RAII + 智能指针 | 引用计数 + GC | GC |
| 字符串 | `char*` | `std::string` / `string_view` | `str`（不可变） | `string`（不可变） |
| 动态数组 | 手写 realloc | `std::vector` | `list` | `Array` |
| 字典 | 手写哈希 | `std::unordered_map` | `dict` | `Map` / `Object` |
| 多态 | 函数指针 / union | 虚函数 / variant | 鸭子类型 | 原型 / class |
| 泛型 | `void*` + 宏 | 模板 / concepts | 动态类型（`typing`） | 动态类型（TS） |
| 错误 | 返回码 | 异常 / `optional` / `expected` | 异常 | 异常 |
| 并发 | pthread | `std::thread` + mutex | `threading` / `asyncio` | 单线程 + Worker |
| 常量 | `#define` / `enum` | `constexpr` | 约定命名 / `Final` | `const` |
| 编译 | 编译 | 编译（模板在编译期展开） | 解释（字节码） | JIT |

### 21.3 常见面试/实战问题

| 问题 | 要点 |
| --- | --- |
| `new` 与 `malloc` 区别 | 构造/析构、异常 vs NULL、类型安全 |
| 为什么虚析构 | 多态删除时保证派生类析构被调用 |
| 深拷贝 vs 浅拷贝 | 指针成员是否复制所指对象 |
| `move` 做了什么 | 类型转换，触发移动构造；源对象置为有效但未指定 |
| 为什么 `noexcept` 重要 | 容器扩容时选择移动而非复制 |
| `unique_ptr` vs `shared_ptr` | 独占 vs 引用计数；后者有原子开销 |
| `vector` 扩容后指针失效 | 重新分配；用索引或 `reserve` |
| `reserve` vs `resize` | 改容量 vs 改元素个数 |
| 值传递/引用传递/移动 | 复制代价与所有权的表达 |
| RAII 是什么 | 资源生命周期绑定对象生命周期 |
| `const` 的位置 | 修饰指针本身 vs 修饰所指对象 |
| 模板为什么放头文件 | 实例化需要看到定义 |
| 内存泄漏怎么查 | ASan、valgrind、堆快照 |
| 数据竞争怎么查 | TSan |

### 21.4 八周学习路径

| 周 | 内容 | 产出 |
| --- | --- | --- |
| 1 | 第 1–3 章：引用、const、类、RAII | 把一段 C 代码改成类 + 析构函数 |
| 2 | 第 4–5 章：智能指针、移动语义 | 用 `unique_ptr` 重写资源管理 |
| 3 | 第 6–7 章：继承、模板 | 写接口 + 两个实现；写一个模板容器 |
| 4 | 第 8–9 章：容器、算法、lambda | 用算法替换所有手写循环 |
| 5 | 第 10–12 章：异常、字符串、IO | 写一个 CSV 读写工具 |
| 6 | 第 13 章：并发 | 写线程池并测试 |
| 7 | 第 14–16 章：构建、C++20、从 C 迁移 | 配好 CMake + sanitizer；迁移一个小模块 |
| 8 | 第 17–20 章：实战与练习 | 完成第 17、18 章 + 10 道综合题 |

### 21.5 资源

| 类型 | 推荐 |
| --- | --- |
| 参考 | cppreference.com（日常查询第一站） |
| 标准 | isocpp.org、eel.is/c++draft（草案） |
| 书 | 《C++ Primer（第 5 版）》《Effective Modern C++》《C++ Core Guidelines》 |
| 指南 | isocpp.github.io/CppCoreGuidelines |
| 工具 | CMake、clang-tidy、ASan/UBSan/TSan、perf、gdb/lldb |
| 社区 | ISO C++ 博客、Reddit r/cpp、Compiler Explorer（godbolt.org） |

### 21.6 最后三条建议

1. **把所有权画出来**。写一个类之前先问：谁创建、谁销毁、能不能共享。答案确定了，代码结构就定了。
2. **先用标准库**。你以为需要手写链表的地方，八成用 `vector` 更快也更短。
3. **打开警告与 sanitizer**。C++ 的错误大多不是"逻辑想错"，而是"碰了不该碰的内存"——工具能当场抓住。
