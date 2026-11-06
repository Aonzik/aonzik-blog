---
title: JavaScript 进阶手册：从"会写页面脚本"到"会写程序"
description: 为有少量 JavaScript 基础的人讲解 JavaScript 的运行模型。
date: 2026-11-01
category: 技术
tags:
  - AIGC
  - 技术
  - 笔记
readingTime: 145
---

目标读者：会写变量、`if`、`for`、函数，能改页面上的按钮和表单，但一遇到闭包、`this`、原型、Promise 链、模块化就含糊的人。

本书讲 JavaScript 的**运行模型**：作用域与闭包、`this` 与原型、事件循环与微任务、迭代协议、模块系统、内存与性能。看懂这些，框架与库对你来说只是"约定"，而不是"魔法"。

代码在 Node 24（V8 13.6）与最新浏览器上验证；涉及标准年份与运行时可用性的地方会**分开标注**（这两者经常不一致）。

## 0. 怎么用这本书

### 0.1 你已经会什么，还缺什么

| 你已经会的 | 本书补上的 |
| --- | --- |
| `let` / `const` / `var` | 作用域链、TDZ、提升的真实规则 |
| 函数声明与调用 | 闭包、高阶函数、柯里化、`this` 的四条绑定规则 |
| 用 `document.querySelector` 改页面 | 事件模型（捕获/冒泡/委托）、异步与渲染的关系 |
| 听过 Promise、`async/await` | 微任务队列、并发控制、取消、错误传播 |
| 用过对象与数组 | 原型链、属性描述符、`Map`/`Set`/`WeakMap`、迭代协议 |
| 听说过 `npm install` | ESM vs CJS、`package.json` 的 `exports`、打包与 tree-shaking |
| 遇到过"`this` 是 undefined" | 为什么，以及怎么修 |

### 0.2 三个必须先建立的认知

**认知一：JavaScript 是单线程 + 事件循环，不是"多线程但慢"。**

同步代码一口气跑完，异步任务进队列，等调用栈清空后才执行。所以：一个长循环会卡住页面；`await` 之前的代码是同步的；微任务（Promise 回调）比宏任务（`setTimeout`）先执行。第 7 章会把这条讲透。

**认知二：值是"原始值"或"对象引用"两分类。**

```js
let a = { n: 1 };
let b = a;          // b 指向同一个对象
b.n = 2;
console.log(a.n);   // 2

let s = "abc";
let t = s;
t += "d";           // 原始值不可变，t 变成新字符串
console.log(s);     // "abc"
```

**认知三：`this` 不是"当前对象"，而是调用方式决定的。**

```js
const obj = { name: "Ann", hi() { return this.name; } };
const f = obj.hi;
console.log(f());          // undefined（严格模式）—— 调用时没有接收者
console.log(obj.hi());     // "Ann" —— 方法调用
```

### 0.3 工具链基线（2026 年 10 月）

| 工具 | 版本/状态 | 作用 |
| --- | --- | --- |
| Node.js | **24 LTS**（生产基线）；26 已发布但尚未转 LTS | 本地运行、构建、测试 |
| pnpm | 12.x | 包管理（比 npm 快、省磁盘） |
| Vite | 8.x（Rolldown 内核） | 开发服务器与打包 |
| Vitest | 5.x | 单元测试 |
| ESLint | 10.x（flat config 为唯一形态） | 静态检查 |
| Prettier / Biome | 3.x / 2.x | 格式化 |
| TypeScript | 7.x（原生编译器） | 类型检查（JS 项目可用 JSDoc + `checkJs`） |

最小可跑的工程：

```bash
pnpm create vite myapp --template vanilla
cd myapp && pnpm i && pnpm dev
```

```json
// package.json
{
  "name": "myapp",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint ."
  }
}
```

### 0.4 能力地图

```text
语言核心（1–6 章）──┬─ 作用域/闭包
                    ├─ this/原型/类
                    ├─ 对象/集合/迭代
                    └─ 数组与函数式
异步（7、8 章）─────┬─ 事件循环/微任务
                    ├─ Promise/async
                    └─ 取消/流/Worker
工程（9、10、14 章）─┬─ 模块系统
                    ├─ 错误与调试
                    └─ 构建/测试/lint
架构（15 章）与实战（17–19 章）
```

**学习建议**：第 1、2、3、7 章是分水岭，必须精读并动手验证；第 5、6 章决定你写出的代码是否"现代"；第 8、14 章决定能否进生产。

### 0.5 本章速查

- 单线程 + 事件循环：长任务卡 UI，微任务先于宏任务。
- 原始值按值、对象按引用；`const` 只锁绑定不锁内容。
- `this` 由调用形式决定，箭头函数不绑定 `this`。
- 现代基线：Node 24 LTS + pnpm + Vite 8 + Vitest 5 + ESLint 10（flat config）。

---

## 1. 值与类型：那些"看起来能用"的坑

### 1.1 七种原始类型 + 对象

```js
// 原始值：string、number、boolean、null、undefined、symbol、bigint
// 其余都是对象：Object、Array、Function、Date、Map、Set、RegExp、Promise …

typeof "a"          // "string"
typeof 1            // "number"
typeof 1n           // "bigint"
typeof true         // "boolean"
typeof undefined    // "undefined"
typeof Symbol()     // "symbol"
typeof null         // "object"   ← 历史 bug，永远如此
typeof []           // "object"
typeof function(){} // "function" ← 特例，便于判断可调用
```

判断数组与普通对象：

```js
Array.isArray([]);                       // true
Object.prototype.toString.call(null);    // "[object Null]"
[] instanceof Array;                     // true（跨 realm 会失效）
```

### 1.2 相等：`===`、`==`、`Object.is`

```js
0 == ""            // true   ← 隐式转换
0 === ""           // false
null == undefined  // true
null === undefined // false
NaN === NaN        // false  ← 唯一不等于自身的值
Object.is(NaN, NaN)      // true
Object.is(0, -0)         // false
```

规则：

- **永远用 `===`**（除判断 `x == null` 同时匹配 `null`/`undefined` 这一惯用法）；
- 判 `NaN` 用 `Number.isNaN(x)`；
- 比较对象永远比引用，要比较内容自己写（或用 `structuredClone` 后比较）。

### 1.3 真值与假值

假值只有 8 个：`false`、`0`、`-0`、`0n`、`""`、`null`、`undefined`、`NaN`。其余全为真，包括 `[]`、`{}`、`"0"`、`"false"`、`new Boolean(false)`。

```js
if ([]) console.log("空数组也是真值");     // 会打印
if (items.length) { /* 正确：用长度判断 */ }
```

### 1.4 数字的坑

```js
0.1 + 0.2 === 0.3            // false
Number.isInteger(1.0)        // true
Number.MAX_SAFE_INTEGER      // 9007199254740991
9007199254740993             // 精度已丢失
(0.1 + 0.2).toFixed(2)       // "0.30"（仅用于展示）
```

- 金额用**整数分**或 `decimal.js`，别用浮点；
- 超大整数用 `BigInt`（`123n`），但 BigInt 与 Number 不能混算；
- `parseInt("08")` 没问题，但 `parseInt("0x10")` = 16，`parseInt("10px")` = 10（会忽略尾部）。

### 1.5 逻辑运算符与空值合并

```js
const name = input.name || "匿名";       // 空字符串也会被替换
const name2 = input.name ?? "匿名";      // 只有 null/undefined 才替换（推荐）

user?.profile?.avatar ?? "/default.png"  // 可选链 + 空值合并

a ||= b;    // a 为假值时赋值
a ??= b;    // a 为 null/undefined 时赋值
a &&= b;    // a 为真值时赋值
```

### 1.6 解构与展开

```js
const { a, b = 2, ...rest } = obj;
const [first, , third = 3] = arr;
const { x: renamed } = obj;

const merged = { ...defaults, ...overrides };
const copy = [...arr];
const clone = { ...obj };        // 浅拷贝！

// 深拷贝（现代浏览器/Node 17+）
const deep = structuredClone(obj);   // 支持 Map/Set/Date，不支持函数
```

注意展开只做**一层**：`{...obj}` 里嵌套对象仍是共享引用。

### 1.7 练习

1. 解释 `[1, 2, 3] == "1,2,3"` 为什么为 `true`。
2. 写 `deepEqual(a, b)`（支持数组、对象、原始值，不用库）。
3. 下面代码输出什么？为什么？

```js
const a = { n: 1 };
const b = { ...a };
a.n = 2;
console.log(b.n);
```

### 1.8 答案（要点）

```js
// 1. 数组转字符串调用 join → "1,2,3"，== 又做类型转换，所以相等。这也是要用 === 的理由。
// 3. 输出 1：展开是浅拷贝，b.n 独立；但若 a = { n: { deep: 1 } }，改 a.n.deep 会同时影响 b。
```

```js
// 2.
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}
```

### 1.9 本章速查

| 主题 | 规则 |
| --- | --- |
| 相等 | 用 `===`；`NaN` 用 `Number.isNaN` |
| 假值 | `false 0 -0 0n "" null undefined NaN` |
| 默认值 | 用 `??` 而不是 `||` |
| 深拷贝 | `structuredClone`（不支持函数） |
| 数值精度 | 金额用整数分或 decimal 库 |

---

## 2. 作用域与闭包

### 2.1 三种声明与作用域

```js
var x = 1;        // 函数作用域，会提升
let y = 2;        // 块级作用域，TDZ
const z = 3;      // 块级作用域，不能重新赋值

{
  var a = 1;
  let b = 2;
}
console.log(a);   // 1（var 泄漏到函数/全局）
// console.log(b); // ReferenceError
```

TDZ（暂时性死区）：从块开始到声明语句之间，访问 `let`/`const` 变量会抛 `ReferenceError`。

```js
console.log(typeof notDeclared);   // "undefined"（未声明）
// console.log(typeof tdzVar);     // ReferenceError（已声明但未初始化）
let tdzVar = 1;
```

### 2.2 提升

```js
console.log(f());       // "ok" —— 函数声明整体提升
function f() { return "ok"; }

console.log(g);         // undefined —— var 声明提升，赋值没提升
var g = 1;
```

`let`/`const`/`class` 也会提升但进 TDZ，所以行为上等价于"没提升"。

### 2.3 闭包的本质

闭包 = 函数 + 它被创建时所在的作用域。

```js
function makeCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
  };
}

const c = makeCounter();
c.inc(); c.inc();
console.log(c.get());    // 2
```

用途：

| 用途 | 示例 |
| --- | --- |
| 私有状态 | 上面的 `count` |
| 工厂 | `makeAdder(5)` |
| 记忆化 | 缓存计算结果 |
| 防抖/节流 | 定时器句柄保存在闭包里 |
| 模块模式 | 老代码里的 IIFE |

```js
const memo = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
};

const fib = memo((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
console.log(fib(60));   // 1548008755920，瞬间出结果
```

### 2.4 循环中的闭包

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));   // 3 3 3
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));   // 0 1 2（let 每次迭代创建新绑定）
}
```

### 2.5 IIFE 与现代替代

```js
// 老写法：隔离作用域
(function () {
  var privateVar = 1;
})();

// 现代：直接用块 + let/const，或者模块
{
  const privateVar = 1;
}
```

### 2.6 闭包导致的内存泄漏

```js
function attach() {
  const huge = new Array(1e7).fill(0);
  document.querySelector("#btn").addEventListener("click", () => {
    console.log(huge.length);      // 闭包持有 huge，按钮在，内存就在
  });
}
```

修法：不需要的数据别闭包捕获；用 `WeakMap` 存关联数据；页面卸载时移除监听（`AbortController` 见第 8 章）。

### 2.7 练习

1. 用闭包实现 `once(fn)`：只执行一次，后续调用返回第一次结果。
2. 实现 `debounce(fn, ms)` 与 `throttle(fn, ms)`。
3. 下面为什么输出 3 个 3？给出两种修法。

```js
const fns = [];
for (var i = 0; i < 3; i++) fns.push(() => i);
console.log(fns.map((f) => f()));
```

### 2.8 答案（要点）

```js
function once(fn) {
  let called = false, result;
  return (...args) => {
    if (!called) { called = true; result = fn(...args); }
    return result;
  };
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}
```

```js
// 3. var 是函数作用域，三个箭头函数共享同一个 i；修法一：let；修法二：立即传值 fns.push(((j) => () => j)(i))
```

### 2.9 本章速查

| 概念 | 结论 |
| --- | --- |
| `var` | 函数作用域 + 提升（值 `undefined`） |
| `let`/`const` | 块级 + TDZ |
| 闭包 | 函数记住定义时的作用域，可持有状态 |
| 循环 + 闭包 | 用 `let` 或立即传值 |
| 泄漏 | 闭包持有大对象 + 长生命周期监听器 |

---

## 3. `this`、原型与类

### 3.1 `this` 的四条规则

```js
// 1) 默认绑定：普通调用，严格模式是 undefined，非严格是 globalThis
function f() { return this; }
console.log(f() === undefined);        // 模块/严格模式下 true

// 2) 隐式绑定：作为方法调用，this = 调用者
const obj = { name: "Ann", hi() { return this.name; } };
console.log(obj.hi());                 // "Ann"

// 3) 显式绑定：call / apply / bind
function greet(greeting) { return `${greeting}, ${this.name}`; }
console.log(greet.call({ name: "Bob" }, "Hi"));      // "Hi, Bob"
console.log(greet.apply({ name: "Cid" }, ["Yo"]));   // "Yo, Cid"
const bound = greet.bind({ name: "Dan" });
console.log(bound("Hello"));                          // "Hello, Dan"

// 4) new 绑定：this = 新对象
function Person(name) { this.name = name; }
const p = new Person("Eve");
console.log(p.name);                   // "Eve"
```

优先级：`new` > 显式绑定 > 隐式绑定 > 默认。**箭头函数没有自己的 `this`**，它沿用外层（定义处）的 `this`，且不能被 `call`/`bind` 改变。

```js
const counter = {
  n: 0,
  start() {
    setInterval(() => { this.n++; }, 100);   // 箭头函数：this 是 counter
  },
};

const counter2 = {
  n: 0,
  start() {
    setInterval(function () { this.n++; }, 100);  // 普通函数：this 是 undefined/全局
  },
};
```

**丢失 `this` 的三种典型场景**：把方法当回调传出去、`setTimeout(obj.method, 0)`、`const { method } = obj`。

### 3.2 原型链

```js
const animal = { speak() { return "..."; } };
const dog = Object.create(animal);
dog.bark = () => "Woof";

console.log(dog.bark());          // "Woof"
console.log(dog.speak());         // "..."（沿原型链找到）
console.log(Object.getPrototypeOf(dog) === animal);   // true
```

每个对象都有内部槽 `[[Prototype]]`（可用 `Object.getPrototypeOf` 读）。属性查找：自身 → 原型 → 原型的原型 → … → `null`。

```js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return `Hi, ${this.name}`;
};

const p = new Person("Ann");
console.log(p.greet());                            // 继承自原型
console.log(Object.getPrototypeOf(p) === Person.prototype);  // true
```

### 3.3 `class` 是语法糖

```js
class Person {
  #secret = "hidden";          // 私有字段（真私有）
  static count = 0;            // 静态字段

  constructor(name) {
    this.name = name;
    Person.count++;
  }

  get upper() { return this.name.toUpperCase(); }

  set upper(v) { this.name = v.toLowerCase(); }

  greet() { return `Hi, ${this.name}`; }

  static create(name) { return new Person(name); }

  static {                     // 静态初始化块
    Person.defaultName = "anon";
  }
}

class Employee extends Person {
  constructor(name, role) {
    super(name);               // 必须先调用 super
    this.role = role;
  }
  greet() { return `${super.greet()} (${this.role})`; }
}

const e = new Employee("Ann", "dev");
console.log(e.greet(), Person.count, e.upper);
// console.log(e.#secret);     // SyntaxError：私有字段只能类内部访问
```

要点：

- `class` 内部默认严格模式；
- 方法定义在 `prototype` 上，字段在实例上；
- 私有用 `#x`（真私有），别再用 `_x` 约定；
- `super()` 必须在 `this` 之前调用。

### 3.4 混入与组合

```js
const Serializable = {
  toJSON() { return { ...this }; },
};

class Config {
  constructor(env) { this.env = env; }
}
Object.assign(Config.prototype, Serializable);

console.log(JSON.stringify(new Config("prod")));
```

现代建议：**优先组合**——把能力写成函数或小的对象，通过参数传入，而不是多层继承。

### 3.5 `Object.create(null)` 与纯字典

```js
const dict = Object.create(null);
dict.__proto__ = "x";        // 只是普通属性，不会改原型
console.log(Object.keys(dict));   // ["__proto__"]

// 或者直接用 Map（更推荐，键可以是任意类型）
const m = new Map([["a", 1]]);
```

### 3.6 练习

1. 解释输出：

```js
const obj = {
  name: "Ann",
  greet: () => this.name,
};
console.log(obj.greet());
```

2. 用 `class` 实现 `Stack`（`push`/`pop`/`size`/`peek`），私有字段存数组。
3. 写 `bindAll(obj)`，把对象上所有方法绑定到该对象。
4. 用 `Object.create` 实现一个"只读视图"：读正常，写抛错。

### 3.7 答案（要点）

```js
// 1. 箭头函数在定义时绑定 this（模块顶层是 undefined），输出 undefined。

class Stack {
  #items = [];
  push(x) { this.#items.push(x); return this; }
  pop() { return this.#items.pop(); }
  peek() { return this.#items.at(-1); }
  get size() { return this.#items.length; }
}

function bindAll(obj) {
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === "function") obj[k] = obj[k].bind(obj);
  }
  return obj;
}
```

### 3.8 本章速查

| 调用形式 | `this` |
| --- | --- |
| `f()` | 严格模式 `undefined` |
| `obj.f()` | `obj` |
| `f.call(x)` / `apply` / `bind` | `x` |
| `new F()` | 新对象 |
| 箭头函数 | 外层 `this`（不可改） |

---

## 4. 函数进阶

### 4.1 一等函数与高阶函数

```js
const add = (a, b) => a + b;
const apply = (fn, ...args) => fn(...args);
console.log(apply(add, 1, 2));

const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const inc = (x) => x + 1;
const double = (x) => x * 2;
console.log(pipe(inc, double)(3));    // 8
```

### 4.2 箭头函数 vs 普通函数

| 维度 | 箭头函数 | 普通函数 |
| --- | --- | --- |
| `this` | 词法（外层） | 调用时决定 |
| `arguments` | 无 | 有（不推荐用） |
| `new` | 不能构造 | 可以 |
| `prototype` | 无 | 有 |
| 适合 | 回调、短函数 | 方法、构造函数、需要 `arguments` |

### 4.3 默认参数与剩余参数

```js
function createUser({ name, role = "user", tags = [] } = {}) {
  return { name, role, tags };
}

function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }

console.log(createUser({ name: "Ann" }), sum(1, 2, 3));
```

### 4.4 柯里化与部分应用

```js
const curry = (fn) => {
  const arity = fn.length;
  const collect = (args) => (...more) => {
    const all = [...args, ...more];
    return all.length >= arity ? fn(...all) : collect(all);
  };
  return collect([]);
};

const add3 = curry((a, b, c) => a + b + c);
console.log(add3(1)(2)(3), add3(1, 2)(3));    // 6 6
```

### 4.5 纯函数与不可变

```js
// 不纯：修改入参、依赖外部状态
function pushBad(arr, x) { arr.push(x); return arr; }

// 纯：返回新数组
function pushGood(arr, x) { return [...arr, x]; }
```

不可变更新的三个工具：展开、`map`/`filter`/`reduce`、`structuredClone`（深拷贝）。

### 4.6 递归与尾调用

```js
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
```

V8 不支持尾调用优化（TCO 已在规范中但因兼容性未实现），深递归会 `RangeError: Maximum call stack size exceeded`。改成循环或显式栈。

### 4.7 练习

1. 实现 `compose(f, g)` 与 `pipe(f, g, h)`。
2. 实现带缓存的 `memoize`，支持自定义 key 函数。
3. 实现 `partial(fn, ...preset)`。
4. 把一段命令式循环改写成 `map`/`filter`/`reduce` 链。

### 4.8 答案（要点）

```js
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

function memoize(fn, keyFn = (...a) => JSON.stringify(a)) {
  const cache = new Map();
  return (...args) => {
    const k = keyFn(...args);
    if (!cache.has(k)) cache.set(k, fn(...args));
    return cache.get(k);
  };
}

const partial = (fn, ...preset) => (...rest) => fn(...preset, ...rest);
```

### 4.9 本章速查

| 模式 | 用途 |
| --- | --- |
| `pipe`/`compose` | 组合小函数 |
| `curry`/`partial` | 预置参数、提高复用 |
| `memoize` | 纯函数缓存 |
| 纯函数 | 可测试、可并发、可缓存 |

---

## 5. 对象、集合与元编程

### 5.1 属性描述符

```js
const obj = {};
Object.defineProperty(obj, "hidden", {
  value: 42,
  writable: false,
  enumerable: false,      // 不出现在 keys / for...in / JSON
  configurable: false,
});

console.log(obj.hidden);                  // 42
console.log(Object.keys(obj));            // []
obj.hidden = 1;                           // 静默失败（严格模式抛错）
```

`Object.freeze` 是"浅冻结"：嵌套对象仍可修改。

```js
const config = Object.freeze({ env: "prod", nested: { a: 1 } });
config.env = "dev";        // 无效
config.nested.a = 2;       // 有效（浅冻结）
```

### 5.2 `Object` 常用静态方法

```js
Object.keys(o); Object.values(o); Object.entries(o);
Object.fromEntries(entries);            // 与 entries 互逆
Object.assign(target, ...sources);      // 浅合并（会改 target）
Object.hasOwn(o, "k");                  // 比 hasOwnProperty 安全
Object.getOwnPropertyNames(o);
Object.getPrototypeOf(o);
```

```js
// entries → 转换 → 还原
const prices = { apple: 3, banana: 5 };
const doubled = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, v * 2])
);
console.log(doubled);    // { apple: 6, banana: 10 }
```

### 5.3 `Map` / `Set` / `WeakMap` / `WeakSet`

```js
const m = new Map();
m.set("a", 1).set({ id: 1 }, "obj key");   // 键可以是任意值
console.log(m.get("a"), m.size);

const s = new Set([1, 2, 2, 3]);
console.log(s.size);                        // 3
console.log([...s]);                        // [1, 2, 3]

// WeakMap：键必须是对象，弱引用，不阻止 GC
const meta = new WeakMap();
function tag(obj) { meta.set(obj, { seen: Date.now() }); }
```

对比 `Object`：

| 维度 | `Object` | `Map` |
| --- | --- | --- |
| 键类型 | 字符串 / Symbol | 任意 |
| 顺序 | 插入序（整数键特殊） | 严格插入序 |
| 大小 | `Object.keys().length` | `size` |
| 迭代 | 需转换 | 直接可迭代 |
| 性能 | 小对象快 | 频繁增删快 |

### 5.4 `Symbol` 与迭代协议

```js
const id = Symbol("id");           // 唯一，避免命名冲突
const obj = { [id]: 42 };

// 自定义迭代
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  *[Symbol.iterator]() {
    for (let i = this.start; i < this.end; i++) yield i;
  }
}

console.log([...new Range(1, 4)]);   // [1, 2, 3]
```

### 5.5 `Proxy` 与 `Reflect`

```js
const target = { name: "Ann" };

const p = new Proxy(target, {
  get(t, key, receiver) {
    if (!(key in t)) {
      console.warn(`访问了不存在的属性 ${String(key)}`);
      return undefined;
    }
    return Reflect.get(t, key, receiver);
  },
  set(t, key, value) {
    if (key === "age" && typeof value !== "number") {
      throw new TypeError("age 必须是数字");
    }
    return Reflect.set(t, key, value);
  },
});

p.age = 30;
console.log(p.age, p.missing);
// p.age = "x";  // TypeError
```

Proxy 的用途：校验、日志、响应式（Vue 3 的 `reactive` 就是 Proxy）、负索引数组、默认值。

### 5.6 `structuredClone` vs JSON 深拷贝

```js
const original = { d: new Date(), m: new Map([["a", 1]]), n: undefined };

const bad = JSON.parse(JSON.stringify(original));   // Date 变字符串，Map 变 {}，undefined 丢失
const good = structuredClone(original);             // 保留类型
```

限制：不能克隆函数、DOM 节点、类实例的原型（只保留可枚举数据）。

### 5.7 练习

1. 用 Proxy 实现"数组负索引"：`arr[-1]` 返回最后一个元素。
2. 用 WeakMap 给任意对象挂私有数据，验证对象被回收后不泄漏。
3. 用 `Object.defineProperty` 实现一个只读的 `version`，赋值时抛错。
4. 写出 `groupBy(items, fn)`（3.12 之前 `Object.groupBy` 不可用时的替代）。

### 5.8 答案（要点）

```js
function negativeIndex(arr) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && /^-\d+$/.test(prop)) {
        return target[target.length + Number(prop)];
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function groupBy(items, fn) {
  const out = Object.create(null);
  for (const item of items) {
    const key = String(fn(item));
    (out[key] ??= []).push(item);
  }
  return out;
}
```

### 5.9 本章速查

| 需求 | 工具 |
| --- | --- |
| 任意键映射 | `Map` |
| 去重 | `Set` |
| 挂载额外数据且不泄漏 | `WeakMap` |
| 拦截读写 | `Proxy` + `Reflect` |
| 深拷贝 | `structuredClone` |
| 不可枚举属性 | `Object.defineProperty` |

---

## 6. 数组、迭代与正则

### 6.1 数组方法的"是否变异"表

| 变异（改原数组） | 不变异（返回新值） |
| --- | --- |
| `push` `pop` `shift` `unshift` | `slice` `concat` `map` `filter` |
| `splice` `sort` `reverse` `fill` | `flat` `flatMap` `reduce` |
| `copyWithin` | `toSorted` `toReversed` `toSpliced` `with`（ES2023） |

```js
const nums = [3, 1, 2];
const sorted = nums.toSorted((a, b) => a - b);   // 原数组不动
console.log(nums, sorted);                        // [3,1,2] [1,2,3]

const updated = nums.with(0, 99);                // 返回替换后的副本
console.log(nums, updated);                       // [3,1,2] [99,1,2]
```

`sort` 的默认行为是**按字符串比较**：

```js
[10, 9, 1].sort();              // [1, 10, 9]  ← 坑
[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10]
```

### 6.2 `reduce` 的正确姿势

```js
const orders = [
  { item: "书", price: 59.9, qty: 2 },
  { item: "笔", price: 3.5, qty: 10 },
];

const total = orders.reduce((sum, o) => sum + o.price * o.qty, 0);
console.log(total.toFixed(2));

// 分组
const byItem = orders.reduce((acc, o) => {
  (acc[o.item] ??= []).push(o);
  return acc;
}, {});

// 不要用 reduce 做 map/filter 能做的事——可读性更差
```

### 6.3 迭代器与生成器

```js
function* naturals() {
  let i = 0;
  while (true) yield i++;
}

const it = naturals();
console.log(it.next().value, it.next().value);   // 0 1

// 生成器 + for...of + 惰性
function* take(gen, n) {
  let i = 0;
  for (const x of gen) {
    if (i++ >= n) return;
    yield x;
  }
}

console.log([...take(naturals(), 3)]);   // [0, 1, 2]
```

生成器的价值：把"分页/流式/无限序列"写成普通循环，且只在需要时计算。

### 6.4 Iterator helpers（ES2025，Baseline 2025）

```js
const result = [1, 2, 3, 4, 5]
  .values()
  .map((x) => x * 2)
  .filter((x) => x > 4)
  .take(2)
  .toArray();

console.log(result);   // [6, 8]
```

特点：**惰性**，可以处理无限生成器；`.toArray()` 才求值。

### 6.5 `for...of` 比 `forEach` 更好吗

```js
// forEach：不能 break/return，不能 await 串行
items.forEach(async (item) => { await save(item); });   // 不会等待！

// for...of：可以 break/continue/return，可以顺序 await
for (const item of items) {
  if (item.skip) continue;
  await save(item);
}
```

需要"并发执行再等待"用 `Promise.all(items.map(save))`（第 7 章）。

### 6.6 正则进阶

```js
const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const m = re.exec("2026-10-26");
console.log(m.groups.year, m.groups.month);   // 2026 10

"a1b22".match(/\d+/g);                        // ["1", "22"]
"a-b_c".split(/[-_]/);                        // ["a", "b", "c"]

// 前瞻/后顾
"price: $42".match(/(?<=\$)\d+/)[0];          // "42"
"abc123".match(/[a-z]+(?=\d)/)[0];            // "abc"

// 粘性、Unicode 集合
/^\p{Script=Han}+$/u.test("汉字");            // true

// 转义用户输入（ES2025 标准）
RegExp.escape("a.b*c");                       // "a\\.b\\*c"
```

要点：

- 用 `u`（或 `v`）标志启用 Unicode 模式；
- 有 `g` 的正则对象带状态 `lastIndex`，重复 `exec` 会续接——复用前 `lastIndex = 0`；
- 用 `.test()` 只判断存在，`exec` 取分组，`matchAll` 取全部（`String.prototype.matchAll` 需要 `g`）。

### 6.7 练习

1. 用 `reduce` 把 `[{tag:"a"},{tag:"b"},{tag:"a"}]` 变成 `{a:2,b:1}`。
2. 用生成器实现"每 n 个元素分块"。
3. 用正则从日志行提取 `level`、`user`、`msg`。
4. 解释为什么 `items.forEach(async ...)` 不等结果。

### 6.8 答案（要点）

```js
const counts = items.reduce((acc, { tag }) => ((acc[tag] = (acc[tag] ?? 0) + 1), acc), {});

function* chunked(iterable, n) {
  let buf = [];
  for (const x of iterable) {
    buf.push(x);
    if (buf.length === n) { yield buf; buf = []; }
  }
  if (buf.length) yield buf;
}

// 4. forEach 只负责调用回调，不等待返回的 Promise；要用 for...of + await 或 Promise.all。
```

### 6.9 本章速查

| 需求 | 用法 |
| --- | --- |
| 不改原数组 | `map/filter/slice/toSorted/with` |
| 求和/分组 | `reduce` |
| 惰性管道 | `.values().map().filter().take().toArray()` |
| 顺序异步 | `for...of` + `await` |
| 并发异步 | `Promise.all(items.map(...))` |
| 正则全部匹配 | `matchAll` / `match(/.../g)` |

---

## 7. 异步基础：事件循环与 Promise

### 7.1 事件循环一图流

```text
┌───────────────┐
│  调用栈（同步代码）
└───────┬───────┘
        │ 栈空
        ▼
┌───────────────┐   清空所有微任务
│  微任务队列    │  Promise.then / queueMicrotask / MutationObserver
└───────┬───────┘
        ▼
┌───────────────┐   取一个宏任务执行
│  宏任务队列    │  setTimeout / setInterval / I/O / 用户事件
└───────┬───────┘
        └──► 回到栈空判断（浏览器在两个宏任务之间可能渲染）
```

验证：

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
console.log("5");
// 输出：1 5 3 4 2
```

**结论**：微任务总在同一轮事件循环内、宏任务之前全部执行完；因此微任务里再排微任务会"插队"，可能饿死渲染。

### 7.2 Promise 三态

```js
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 100);
});

p.then((v) => console.log(v))
 .catch((e) => console.error(e))
 .finally(() => console.log("done"));
```

- 状态只能转移一次：`pending → fulfilled` 或 `pending → rejected`；
- `then` 返回**新** Promise，所以可以链式；
- 在 `then` 里 `throw` 会变成 rejected，`return Promise` 会被展开（自动等待）。

### 7.3 组合器

| 方法 | 语义 | 何时用 |
| --- | --- | --- |
| `Promise.all` | 全部成功才成功，任一失败立即失败 | 依赖全部结果 |
| `Promise.allSettled` | 等全部结束，返回 `{status, value/reason}` | 批量任务要统计成败 |
| `Promise.race` | 第一个结束（成功或失败） | 超时竞争 |
| `Promise.any` | 第一个**成功** | 多源冗余请求 |
| `Promise.withResolvers` | 手写 Promise 的现代写法 | 封装回调 API |

```js
const [a, b] = await Promise.all([fetchA(), fetchB()]);

const results = await Promise.allSettled(tasks);
const ok = results.filter((r) => r.status === "fulfilled").length;

const data = await Promise.any([mirror1(), mirror2()]);   // 谁先成功用谁

// 超时
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
await Promise.race([slowTask(), timeout(1000)]);
```

```js
// Promise.withResolvers：把回调风格包成 Promise
const { promise, resolve, reject } = Promise.withResolvers();
button.addEventListener("click", () => resolve("clicked"), { once: true });
const result = await promise;
```

### 7.4 `async/await` 只是语法糖

```js
async function load() {
  const res = await fetch("/api");     // 暂停，让出主线程
  const data = await res.json();
  return data;                          // 自动包成 resolved Promise
}

load().then(console.log);

// 等价于
function load2() {
  return fetch("/api")
    .then((res) => res.json())
    .then((data) => data);
}
```

五个高频坑：

```js
// 1) forEach 不等
items.forEach(async (i) => await save(i));       // ❌
for (const i of items) await save(i);            // ✅ 串行
await Promise.all(items.map((i) => save(i)));    // ✅ 并发

// 2) 忘了 await
const data = load();          // ❌ 得到 Promise
const data2 = await load();   // ✅

// 3) 顺序 await 导致串行变慢
const a = await fetchA();
const b = await fetchB();     // ❌ 总耗时 = A + B
const [a2, b2] = await Promise.all([fetchA(), fetchB()]);   // ✅ max(A, B)

// 4) all 一个失败全挂
try { await Promise.all(tasks); } catch { /* 其余任务还在跑，结果丢失 */ }
// 需要部分成功 → allSettled

// 5) 吞异常
async function bad() {
  try { await risky(); } catch (e) { }   // ❌ 静默失败
}
```

### 7.5 并发控制

```js
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

await mapLimit(urls, 5, (u) => fetch(u));
```

### 7.6 练习

1. 把回调风格的 `readFile(path, cb)` 包成 Promise。
2. 实现 `retry(fn, times, delay)`，支持指数退避。
3. 用 `Promise.allSettled` 实现"下载 10 个 URL，输出成功/失败数量"。
4. 预测输出并解释：

```js
async function f() {
  console.log(1);
  await null;
  console.log(3);
}
console.log(0);
f();
console.log(2);
```

### 7.7 答案（要点）

```js
// 1.
const readFileAsync = (path) =>
  new Promise((resolve, reject) =>
    readFile(path, (err, data) => (err ? reject(err) : resolve(data)))
  );

// 2.
async function retry(fn, times = 3, delay = 200) {
  let lastErr;
  for (let i = 0; i < times; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < times - 1) await new Promise((r) => setTimeout(r, delay * 2 ** i));
    }
  }
  throw lastErr;
}

// 4. 输出 0 1 2 3：f 是 async，同步执行到第一个 await 后让出，后面的代码进入微任务。
```

### 7.8 本章速查

| 概念 | 结论 |
| --- | --- |
| 执行顺序 | 同步 → 微任务 → 宏任务 |
| `then` | 返回新 Promise，可链式 |
| `all` vs `allSettled` | 全成功 vs 全结束 |
| `race` / `any` | 第一个结束 / 第一个成功 |
| `await` | 只在 async 函数里，且真的会暂停 |
| 并发 | `Promise.all` + 限流 `mapLimit` |

---

## 8. 异步进阶：取消、流、Worker

### 8.1 `AbortController`：取消的标准做法

```js
const ac = new AbortController();

fetch("/api/slow", { signal: ac.signal })
  .then((r) => r.json())
  .catch((err) => {
    if (err.name === "AbortError") console.log("用户取消了请求");
    else console.error(err);
  });

setTimeout(() => ac.abort(), 500);
```

同一个 `signal` 能取消的东西：

| API | 用法 |
| --- | --- |
| `fetch` | `{ signal }` |
| `addEventListener` | `{ signal }`（移除监听） |
| `setTimeout`（Node） | `timersPromises.setTimeout(ms, val, { signal })` |
| `ReadableStream` | `.pipeTo(dest, { signal })` |
| 自定义异步函数 | 自己检查 `signal.aborted` |

```js
// 组合超时 + 手动取消
function withTimeout(ms) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error("timeout")), ms);
  return { signal: ac.signal, done: () => clearTimeout(timer) };
}

const { signal, done } = withTimeout(1000);
try {
  await fetch(url, { signal });
} finally {
  done();
}
```

`AbortSignal.timeout(ms)` 与 `AbortSignal.any([s1, s2])` 在 Node 20+/现代浏览器可用：

```js
await fetch(url, { signal: AbortSignal.timeout(3000) });

// 多个来源任一触发即取消
const combined = AbortSignal.any([userSignal, AbortSignal.timeout(3000)]);
```

```js
// 事件监听器的自动清理（单页应用里非常有用）
const ac = new AbortController();
element.addEventListener("click", onClick, { signal: ac.signal });
element.addEventListener("keydown", onKey, { signal: ac.signal });
// 组件卸载时：
ac.abort();   // 两个监听器一起移除，不会泄漏
```

### 8.2 Streams：流式处理大量数据

```js
// 读取文件并流式处理（Node）
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const rl = createInterface({
  input: createReadStream("big.log", "utf8"),
  crlfDelay: Infinity,
});

let errors = 0;
for await (const line of rl) {
  if (line.includes("ERROR")) errors++;
}
console.log(errors);
```

Web Streams（浏览器与 Node 通用）：

```js
const res = await fetch("/big.json");
const reader = res.body.getReader();
const decoder = new TextDecoder();

let received = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  received += value.length;
  // value 是 Uint8Array
}
```

```js
// 用 TransformStream 做逐块转换
const upper = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(new TextEncoder().encode(
      new TextDecoder().decode(chunk).toUpperCase()
    ));
  },
});

await fetch("/download").then((r) => r.body.pipeThrough(upper).pipeTo(dest));
```

要点：

- 大文件**不要** `await res.text()` 全量读进内存；
- Node 的 `stream.pipeline()` 会传播错误并清理，别手写 `on("data")`；
- 背压：`pipeTo` 会自动处理，手工 `write()` 要检查返回值。

### 8.3 Worker：真正的并行

```js
// main.js
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

worker.postMessage({ n: 40 });
worker.onmessage = (e) => {
  console.log("结果是", e.data);
  worker.terminate();
};

// worker.js
self.onmessage = (e) => {
  const { n } = e.data;
  const fib = (k) => (k < 2 ? k : fib(k - 1) + fib(k - 2));
  self.postMessage(fib(n));
};
```

Worker 的边界：

- 数据通过 `postMessage` **结构化克隆**传递（函数、DOM 节点不能传）；
- 传大对象会复制（有开销），可以用 `Transferable`（`ArrayBuffer`、`MessagePort`）零拷贝转移；
- Worker 里没有 `document`、没有 `window`，但有 `fetch`、`IndexedDB`、`WebSocket`。

```js
// 零拷贝转移 ArrayBuffer
const buf = new ArrayBuffer(1024 * 1024);
worker.postMessage({ buf }, [buf]);   // 第二个参数列出转移对象
console.log(buf.byteLength);          // 0 —— 已经转移走
```

| 场景 | 选择 |
| --- | --- |
| 少量 JSON 处理 | 主线程 |
| 大数组计算、图片处理、加解密 | Worker |
| 频繁小任务 | Worker 池（自己写或 `piscina`） |
| Node 里 CPU 密集 | `worker_threads`（见 Node 手册） |

### 8.4 `requestIdleCallback`、`queueMicrotask` 与调度

```js
// 空闲时做低优先级工作
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && queue.length) {
    processOne(queue.shift());
  }
});

// 微任务：在当前宏任务结束后立即执行
queueMicrotask(() => console.log("A"));
Promise.resolve().then(() => console.log("B"));   // A 先于 B（同为微任务，按入队顺序）
```

`await` 之后的代码在微任务里；`setTimeout(..., 0)` 是宏任务，至少下一轮。要让出主线程给渲染，用 `setTimeout` 或 `scheduler.yield()`（新 API，可用性有限）而不是无限微任务。

### 8.5 练习

1. 写一个 `fetchWithTimeout(url, ms)`，超时抛出可识别的错误。
2. 用 `AbortController` 实现"用户输入时取消上一次搜索请求"（防抖 + 取消）。
3. 把一个大数组的 `sort` 放到 Worker 里执行，主线程不卡顿。
4. 用 `for await` 逐行统计日志中某关键词出现次数。

### 8.6 答案（要点）

```js
async function fetchWithTimeout(url, ms = 5000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(new DOMException("timeout", "TimeoutError")), ms);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

let current = null;
let timer = null;
function search(q) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    current?.abort();
    current = new AbortController();
    try {
      const data = await fetch(`/search?q=${encodeURIComponent(q)}`, { signal: current.signal });
      render(await data.json());
    } catch (e) {
      if (e.name !== "AbortError") throw e;
    }
  }, 300);
}
```

### 8.7 本章速查

| 需求 | API |
| --- | --- |
| 取消请求/监听 | `AbortController` + `signal` |
| 超时 | `AbortSignal.timeout(ms)` |
| 组合信号 | `AbortSignal.any([...])` |
| 大文件 | Streams / `for await` |
| CPU 密集 | Worker / `worker_threads` |
| 零拷贝 | `postMessage(msg, [transferable])` |

---

## 9. 模块系统：ESM 与 CJS

### 9.1 两种模块格式

```js
// ESM（现代标准）
import { readFile } from "node:fs/promises";
import path from "node:path";
export const VERSION = "1.0";
export default function hello() {}

// CJS（旧，Node 历史格式）
const fs = require("node:fs");
module.exports = { hello() {} };
```

| 维度 | ESM | CJS |
| --- | --- | --- |
| 语法 | `import`/`export` | `require`/`module.exports` |
| 加载 | 静态、异步、可 tree-shake | 同步、运行时 |
| 顶层 `await` | 支持 | 不支持 |
| `this` | `undefined` | `module.exports` |
| 变量提升 | 导入被提升（先用后导入也行，但不推荐） | `require` 在调用处执行 |
| 文件扩展名 | 必须写全（`.js`/`.mjs`） | 可省略 `.js` |
| 浏览器 | 原生支持（`type="module"`） | 不支持 |

**新代码一律用 ESM。** CJS 只在维护老包或某些工具要求时使用。

### 9.2 Node 如何判断模块类型

```json
// package.json
{
  "type": "module",        // .js 按 ESM 解析
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./utils": "./dist/utils.js",
    "./package.json": "./package.json"
  },
  "files": ["dist"]
}
```

规则：

- `"type": "module"` → `.js` 是 ESM；`"type": "commonjs"` 或缺省 → `.js` 是 CJS；
- `.mjs` 永远是 ESM，`.cjs` 永远是 CJS（不受 `type` 影响）；
- **`exports` 一旦存在，就封闭了包的外部可访问路径**（未列出的子路径会 `ERR_PACKAGE_PATH_NOT_EXPORTED`）。

### 9.3 在 ESM 里用 CJS，在 CJS 里用 ESM

```js
// ESM 导入 CJS：默认导入拿到 module.exports
import pkg from "old-cjs-package";
const { helper } = pkg;

// 具名导入有时可用（Node 的 cjs-module-lexer 静态分析）
import { helper } from "old-cjs-package";   // 视包而定，可能失败

// CJS 里不能用 require 加载 ESM（旧版本），要用动态 import
(async () => {
  const esm = await import("./modern.mjs");
})();
```

Node 20.19+/22.12+ 起支持 `require(esm)`（同步、无顶层 await 的 ESM），但**通用建议仍是：CJS 里用 `await import()`**。

### 9.4 动态导入与代码分割

```js
button.addEventListener("click", async () => {
  const { openEditor } = await import("./editor.js");   // 点击时才下载
  openEditor();
});

// 条件加载
const adapter = await (isNode ? import("./node.js") : import("./browser.js"));
```

打包器（Vite/Rolldown、webpack）会把 `import()` 切成独立 chunk，这是前端首屏优化的核心手段。

### 9.5 循环依赖

```js
// a.js
import { b } from "./b.js";
export const a = "a";
console.log(b);

// b.js
import { a } from "./a.js";
export const b = "b";
console.log(a);      // 可能 undefined（取决于执行顺序）
```

ESM 用"活绑定"，循环依赖时不报错但可能拿到 `undefined`（尚未初始化）。**解法**：把共享部分抽到第三个模块；或用函数延迟访问（`() => imported.x`）。

### 9.6 `import.meta`

```js
console.log(import.meta.url);        // 当前模块的 file:// URL
console.log(import.meta.dirname);    // Node 20.11+ / 21.2+：目录
console.log(import.meta.filename);   // 文件路径
console.log(import.meta.env);        // Vite 注入（MODE、DEV、PROD、VITE_*）
```

```js
// 相对当前模块解析路径（替代 __dirname + path.join）
import path from "node:path";
const here = import.meta.dirname;
const dataPath = path.join(here, "data.json");
```

### 9.7 练习

1. 把一段 `require` 代码改写成 ESM（注意 `.js` 后缀与 `__dirname` 的处理）。
2. 给一个库写 `exports` 字段，同时支持 `import` 与 `require`，并暴露 `./utils` 子路径。
3. 用动态 `import()` 实现"只在用户点击时才加载图表库"。
4. 解释为什么 `import { a } from "./a.js"` 里 `.js` 不能省。

### 9.8 答案（要点）

```json
{
  "name": "mylib",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./utils": { "types": "./dist/utils.d.ts", "import": "./dist/utils.js", "require": "./dist/utils.cjs" }
  }
}
```

```js
// 4. ESM 是静态解析，不做"补后缀"猜测；浏览器与 Node 的 ESM 加载器都要求完整路径。
```

### 9.9 本章速查

| 主题 | 结论 |
| --- | --- |
| 新项目 | `"type": "module"`，全 ESM |
| 后缀 | ESM 必须写全 `.js`/`.mjs` |
| 双格式发布 | `exports` 里 `import` + `require` 两个入口 |
| 懒加载 | `await import()` |
| `__dirname` 替代 | `import.meta.dirname` |

---

## 10. 错误处理与调试

### 10.1 `Error` 家族

```js
new Error("msg");
new TypeError("类型不对");
new RangeError("越界");
new SyntaxError("解析失败");
new ReferenceError("未定义");
new AggregateError([e1, e2], "多个错误");

// 自定义错误：保留原型链与 name
class AppError extends Error {
  constructor(message, { code, cause } = {}) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
  }
}
```

要点：

- `error.message` 给人看，`error.code` 给程序判断；
- `cause` 保留原始错误链（`new Error("加载失败", { cause: e })`）；
- 抛出**Error 实例**而不是字符串（`throw "失败"` 会丢失堆栈）。

### 10.2 同步与异步的错误边界

```js
// 同步：try/catch 能抓
try { JSON.parse("{bad"); } catch (e) { /* SyntaxError */ }

// Promise：await 能抓，漏 await 就抓不到
try {
  await fetchThing();      // ✅
} catch (e) { /* ... */ }

// 回调：错误通过第一个参数传（Node 风格）
fs.readFile(path, (err, data) => {
  if (err) return handle(err);
});

// 事件监听器里的异常不会被调用方捕获
button.addEventListener("click", () => { throw new Error("x"); });  // 变成 uncaught
```

### 10.3 全局兜底（Node）

```js
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  process.exit(1);          // 进程状态已不可信，必须退出
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandledRejection");
  process.exit(1);
});
```

浏览器：

```js
window.addEventListener("error", (e) => report(e.error));
window.addEventListener("unhandledrejection", (e) => report(e.reason));
```

**兜底不是恢复手段**，只是让你能在退出前记录现场。

### 10.4 可重试的错误分类

```js
function isRetryable(err) {
  if (err instanceof AppError) return err.code === "TIMEOUT" || err.code === "RATE_LIMIT";
  // 网络错误（fetch 失败）通常可重试；4xx 不可重试
  return err?.name === "TypeError" || err?.name === "AbortError";
}
```

| 错误类型 | 是否重试 |
| --- | --- |
| 网络断开、超时、5xx | 是（指数退避） |
| 429 限流 | 是（按 `Retry-After`） |
| 400/401/403/404 | 否 |
| 校验失败、编程错误 | 否（重试也没用） |

### 10.5 调试手段

| 手段 | 用途 |
| --- | --- |
| `debugger;` | 断点，配合 DevTools |
| `console.table(arr)` | 表格展示数组/对象 |
| `console.time/timeEnd` | 粗测耗时 |
| `console.trace()` | 打印调用栈 |
| `console.count(label)` | 计数 |
| `node --inspect-brk app.js` | 在 Chrome DevTools 里调试 Node |
| `--enable-source-maps` | 让堆栈指向 TS/打包前的源码 |
| `performance.mark/measure` | 精确性能测量 |

```js
console.time("parse");
const data = JSON.parse(bigJson);
console.timeEnd("parse");        // parse: 12.34ms

performance.mark("start");
await work();
performance.mark("end");
performance.measure("work", "start", "end");
console.log(performance.getEntriesByName("work")[0].duration);
```

### 10.6 日志：结构化输出

```js
function log(level, msg, extra = {}) {
  console.error(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }));
}
log("info", "user login", { userId: 42 });
```

生产环境用 `pino`（Node）或前端 SDK；关键是**带上请求 id / trace id**，否则并发日志无法串起来。

### 10.7 练习

1. 定义 `ValidationError`、`NotFoundError` 两个子类，并写一个 `handle(err)` 映射到 HTTP 状态码。
2. 实现 `retry(fn, { attempts, baseDelay, isRetryable })`。
3. 给一段会抛错的代码加上合适的 try/catch，说明哪些不该 catch。
4. 用 `console.table` 打印一组对象的指定字段。

### 10.8 答案（要点）

```js
class ValidationError extends Error { constructor(m, d) { super(m); this.name = "ValidationError"; this.details = d; } }
class NotFoundError extends Error { constructor(m) { super(m); this.name = "NotFoundError"; } }

function httpStatus(err) {
  if (err instanceof ValidationError) return 400;
  if (err instanceof NotFoundError) return 404;
  return 500;   // 未知错误：记录堆栈，对外只给通用信息
}

async function retry(fn, { attempts = 3, baseDelay = 200, isRetryable = () => true } = {}) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= attempts - 1 || !isRetryable(e)) throw e;
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** i));
    }
  }
}
```

```js
// 3. 不该 catch 的情况：catch 之后什么都不做（吞异常）、catch 住的其实是编程错误（TypeError 说明代码有问题，应修而不是吞）。
```

### 10.9 本章速查

| 主题 | 规则 |
| --- | --- |
| 抛什么 | 总抛 `Error` 实例；用 `class` 分类型 |
| 保留原因 | `new Error(msg, { cause })` |
| 异步 | 必须 `await` 才会进 catch |
| 兜底 | `uncaughtException`/`unhandledRejection` → 记录后退出 |
| 堆栈 | Node 加 `--enable-source-maps` |

---

## 11. 现代语法与标准演进

### 11.1 怎么读"ES20xx"

- **ECMAScript** 是标准，**JavaScript** 是实现；
- 每年 6 月发布一版，编号 = 年份；
- "提案阶段"：Stage 0（想法）→ 1（提案）→ 2（草案）→ 3（候选，即将进入标准）→ 4（已完成，进下一版标准）。

### 11.2 ES2024（2024-06）

```js
// Object.groupBy / Map.groupBy
const people = [{ name: "A", age: 20 }, { name: "B", age: 30 }, { name: "C", age: 20 }];
Object.groupBy(people, (p) => p.age);
// { "20": [{A},{C}], "30": [{B}] }

// Promise.withResolvers
const { promise, resolve } = Promise.withResolvers();

// 正则 v 标志（Unicode 集合运算）
/[\p{Script=Han}--\p{Script=Han}]/v;

// 字符串良构检查
"\uD800".isWellFormed();    // false
```

### 11.3 ES2025（2025-06）

```js
// Iterator helpers（惰性）
[1, 2, 3].values().map((x) => x * 2).toArray();

// Set 运算
const a = new Set([1, 2, 3]), b = new Set([2, 3, 4]);
a.union(b);              // Set {1,2,3,4}
a.intersection(b);       // Set {2,3}
a.difference(b);         // Set {1}
a.symmetricDifference(b);// Set {1,4}
a.isSubsetOf(b);         // false
a.isDisjointFrom(b);     // false

// Promise.try：同步异常也变成 rejection
Promise.try(() => mayThrow()).catch(handle);

// RegExp.escape：安全拼接用户输入
new RegExp(RegExp.escape(userInput));

// JSON 模块 / import attributes
import data from "./data.json" with { type: "json" };
```

### 11.4 ES2026（已定稿，共 7 项）

```js
// 1) Upsert：有则取、无则插
const m = new Map();
m.getOrInsert("k", 0);                          // 不存在则插入并返回 0
m.getOrInsertComputed("k2", () => expensive()); // 只在缺失时计算

// 2) JSON.parse 源文本（reviver 能拿到原始片段）
JSON.parse(src, (key, value, context) => context?.source);

// 3) Iterator.concat
Iterator.concat([1, 2].values(), [3].values()).toArray();

// 4) Uint8Array <-> base64/hex
new Uint8Array([1, 2]).toBase64();
Uint8Array.fromBase64("AQI=");

// 5) Math.sumPrecise（避免浮点累加误差）
Math.sumPrecise([0.1, 0.2, 0.3]);

// 6) Error.isError
Error.isError(new Error());     // true

// 7) Array.fromAsync
await Array.fromAsync(asyncIterable);
```

**注意**：`Temporal` 与 `using` **不在 ES2026**，标准年份是 ES2027（引擎已先行实现）。

### 11.5 Temporal（标准排到 ES2027，但 Node 26 与部分浏览器已可用）

```js
// ❌ 旧的 Date：可变、月份从 0、时区处理糟糕
new Date(2026, 9, 26);      // 2026-10-26：月份从 0 开始，9 = 十月

// ✅ Temporal
const d = Temporal.PlainDate.from("2026-10-26");
d.add({ days: 10 }).toString();          // "2026-11-05"
const zoned = Temporal.Now.zonedDateTimeISO("Asia/Shanghai");
zoned.toLocaleString("zh-CN");
Temporal.PlainDate.from("2026-01-31").add({ months: 1 }).toString();  // "2026-02-28"（自动收敛）
```

可用性（2026-10）：Chrome/Edge 144+、Firefox 139+ 已支持；**Safari 未支持**，全球覆盖约 70%。生产环境用 `@js-temporal/polyfill`。

### 11.6 `using`（显式资源管理，标准年份 ES2027）

```js
function openDb() {
  return {
    query() {},
    [Symbol.dispose]() { console.log("关闭"); },
  };
}

{
  using db = openDb();       // 离开作用域自动调用 Symbol.dispose
  db.query();
}                            // 打印"关闭"

// 异步版本
await using conn = await connect();   // Symbol.asyncDispose
```

Node 24 默认支持；浏览器 MDN 标"Limited availability"，需转译。

### 11.7 其他"已可用但常被忽略"的语法

```js
// 数字分隔符
const big = 1_000_000;

// 逻辑赋值
x ??= 1;  x ||= 2;  x &&= 3;

// 顶层 await（仅 ESM）
const config = await fetch("/config.json").then((r) => r.json());

// class 私有 + static 块
class Config { static #instance; static { Config.#instance = new Config(); } }

// 可选 catch 绑定
try { risky(); } catch { /* 不用异常对象 */ }

// Array.prototype.at、Object.hasOwn、String.replaceAll
arr.at(-1);  Object.hasOwn(o, "k");  "a-a".replaceAll("a", "b");
```

### 11.8 Decorators 现状

Decorators 仍是 **Stage 3**：TypeScript 5.0+ 有实现（`experimentalDecorators` 为旧版提案），**没有任何 JS 引擎原生支持**。用的时候必须经过转译（tsc/esbuild/Babel）。在纯 JS 项目里建议暂时用高阶函数替代。

### 11.9 练习

1. 用 `Object.groupBy` 把订单按状态分组，再统计每组金额。
2. 用 `Set` 方法求两个数组的交集与差集。
3. 用 `Temporal` 计算"30 天后是几号"（并说明浏览器兼容风险）。
4. 用 `using` 写一个"自动关闭的临时文件"（Node）。

### 11.10 答案（要点）

```js
const grouped = Object.groupBy(orders, (o) => o.status);
const sums = Object.fromEntries(
  Object.entries(grouped).map(([k, list]) => [k, list.reduce((s, o) => s + o.amount, 0)])
);

const inter = new Set(a).intersection(new Set(b));
const diff = new Set(a).difference(new Set(b));

Temporal.Now.plainDateISO().add({ days: 30 }).toString();
```

### 11.11 本章速查

| 年份 | 关键词 |
| --- | --- |
| ES2024 | `groupBy`、`withResolvers`、`isWellFormed` |
| ES2025 | Iterator helpers、Set 运算、`Promise.try`、`RegExp.escape` |
| ES2026 | Upsert、base64/hex、`Math.sumPrecise`、`Error.isError`、`Array.fromAsync` |
| ES2027（引擎先行） | `Temporal`、`using` |

---

## 12. 内存、GC 与性能

### 12.1 垃圾回收怎么判断"可回收"

从根（全局对象、当前调用栈、闭包）出发的可达性分析。对象不再可达 → 可回收。所以你**不能手动释放**，只能切断引用。

```js
let big = new Array(1e7).fill(0);
big = null;          // 切断引用，下一次 GC 可回收
```

### 12.2 四种常见泄漏

```js
// 1) 全局变量意外创建（非严格模式）
function leak() { accidental = new Array(1e7); }   // 挂到 globalThis

// 2) 忘记清除定时器/监听器
setInterval(() => poll(), 1000);        // 组件销毁后仍在跑

// 3) 闭包持有大对象
function handler() { const huge = load(); return () => huge.length; }

// 4) 缓存无上限
const cache = new Map();   // 无限增长 → 用 LRU 或 WeakMap
```

### 12.3 `WeakMap` / `WeakRef` / `FinalizationRegistry`

```js
// WeakMap：键弱引用，键对象被回收则条目消失 —— 适合给对象挂元数据
const meta = new WeakMap();
meta.set(domNode, { clicks: 0 });

// WeakRef：不强留对象（慎用，行为不确定）
const ref = new WeakRef(target);
ref.deref()?.doSomething();

// FinalizationRegistry：对象被回收时收到通知（不能用来保证时机）
const reg = new FinalizationRegistry((id) => console.log("回收了", id));
reg.register(obj, "id-1");
```

### 12.4 怎么找泄漏（浏览器）

1. DevTools → Memory → Heap snapshot，操作前后各拍一张，看 `Comparison` 里哪些对象在增长；
2. Performance 面板录制，观察内存曲线是否呈"阶梯上升不回落"；
3. 检查 `Detached DOM tree`（已从文档移除但 JS 仍引用）。

Node：

```bash
node --inspect app.js            # Chrome DevTools 连接
node --heap-prof app.js          # 生成 .heapprofile
node --expose-gc -e "global.gc(); console.log(process.memoryUsage())"
```

### 12.5 性能优化的正确顺序

1. **先测量**（Performance 面板 / `performance.mark`），不要猜；
2. 找瓶颈（长任务、频繁 GC、布局抖动、重复渲染）；
3. 改算法/数据结构（O(n²) → O(n log n) 比任何微优化都值）；
4. 减少工作量（缓存、虚拟列表、懒加载）；
5. 最后才考虑微优化。

```js
// 常见错误：在循环里读 DOM 属性触发强制重排
for (const el of items) {
  el.style.width = el.offsetWidth + 10 + "px";   // ❌ 读-写-读-写，反复重排
}

// 正确：先批量读，再批量写
const widths = items.map((el) => el.offsetWidth);
items.forEach((el, i) => { el.style.width = widths[i] + 10 + "px"; });
```

### 12.6 数据结构选择对性能的影响

```js
// 频繁按 key 查找：Map 优于 Object（尤其键多、有删除）
// 频繁包含判断：Set 优于 Array.includes
const allowed = new Set(["a", "b"]);       // O(1)
// allowed.includes("a") 在大量元素时是 O(n)

// 频繁在头部插入/删除：避免 Array.shift（O(n)），改用双端队列或索引游标
```

### 12.7 练习

1. 找出下面代码的两处性能问题并修复：

```js
const result = [];
for (let i = 0; i < 1e5; i++) {
  result.push(data.filter((x) => x.id === i).map((x) => x.name));
}
```

2. 用 `Map` 写一个带容量上限的 LRU 缓存。
3. 说明为什么 `WeakMap` 适合做 DOM 节点的数据绑定。

### 12.8 答案（要点）

```js
// 1. 每次循环都全量 filter（O(n²)）且重复创建数组。改为先建索引：
const byId = new Map();
for (const x of data) {
  if (!byId.has(x.id)) byId.set(x.id, []);
  byId.get(x.id).push(x.name);
}
const result = ids.map((id) => byId.get(id) ?? []);

// 2.
class LRU {
  #map = new Map();
  constructor(cap) { this.cap = cap; }
  get(k) {
    if (!this.#map.has(k)) return undefined;
    const v = this.#map.get(k);
    this.#map.delete(k); this.#map.set(k, v);   // 刷新为最近使用
    return v;
  }
  set(k, v) {
    if (this.#map.has(k)) this.#map.delete(k);
    this.#map.set(k, v);
    if (this.#map.size > this.cap) this.#map.delete(this.#map.keys().next().value);
  }
}
```

### 12.9 本章速查

| 问题 | 手段 |
| --- | --- |
| 泄漏 | 断引用、清定时器、`WeakMap`、限制缓存 |
| 定位 | Heap snapshot 对比、`--heap-prof` |
| 优化 | 先测量 → 改算法 → 减工作量 → 微优化 |
| 重排 | 批量读、批量写 |
| 查找 | `Map`/`Set` 替代线性扫描 |

---

## 13. 浏览器进阶

### 13.1 事件模型

```js
// 捕获（从外到内）→ 目标 → 冒泡（从内到外）
document.addEventListener("click", handler, true);    // 捕获阶段
element.addEventListener("click", handler, false);   // 冒泡阶段（默认）

event.stopPropagation();     // 阻止继续传播（慎用）
event.preventDefault();      // 阻止默认行为（如链接跳转、表单提交）
event.target;                // 真正触发的元素
event.currentTarget;         // 当前监听器绑定的元素
```

### 13.2 事件委托

```js
// 一个监听器处理所有子项（列表项动态增删也不用重绑）
list.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  handle(btn.dataset.id);
});
```

好处：省内存、天然支持动态节点。注意 `closest` 要防跨出容器。

### 13.3 渲染流水线

```text
JS → Style → Layout → Paint → Composite
```

会触发 Layout（重排，昂贵）的：改 `width/height/margin/padding/top/left/font-size`、读写 `offsetWidth` 等布局属性。
只触发 Composite（便宜）的：`transform`、`opacity`（配合 `will-change`）。

```js
// 动画优先用 transform/opacity
el.style.transform = `translateX(${x}px)`;

// 读取布局属性会强制同步重排（layout thrashing）
const h = el.offsetHeight;   // 若前面刚改过样式，这里会强制重排
```

### 13.4 `requestAnimationFrame`

```js
function animate(el) {
  let x = 0;
  const step = () => {
    x += 2;
    el.style.transform = `translateX(${x}px)`;
    if (x < 500) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

在渲染帧前执行，天然 60fps 节流；`setInterval` 做不到。

### 13.5 存储方案

| 方案 | 容量 | 生命周期 | 同步/异步 | 用途 |
| --- | --- | --- | --- | --- |
| Cookie | ~4KB | 可设过期 | 同步（随请求发送） | 会话标识（`HttpOnly` 放 token） |
| `localStorage` | 5–10MB | 永久 | 同步 | 用户偏好、草稿 |
| `sessionStorage` | 5–10MB | 标签页关闭 | 同步 | 单次会话状态 |
| IndexedDB | 数百 MB+ | 永久 | 异步 | 结构化数据、离线缓存、大文件 |
| Cache API | 磁盘配额 | 永久 | 异步 | Service Worker 缓存资源 |

```js
localStorage.setItem("theme", "dark");
const theme = localStorage.getItem("theme") ?? "light";   // 只有字符串！

// 存对象必须序列化
localStorage.setItem("user", JSON.stringify(user));
const user = JSON.parse(localStorage.getItem("user") ?? "null");
```

注意：`localStorage` 是**同步**的，大写入会阻塞主线程；敏感数据不要放这里（XSS 可读）。

### 13.6 `MutationObserver` 与 `IntersectionObserver`

```js
// 监听 DOM 变化
const mo = new MutationObserver((records) => {
  for (const r of records) console.log("变化", r.type);
});
mo.observe(container, { childList: true, subtree: true });

// 监听元素是否进入视口（懒加载、无限滚动、曝光统计）
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      loadImage(e.target);
      io.unobserve(e.target);
    }
  }
}, { rootMargin: "200px" });

document.querySelectorAll("img[data-src]").forEach((img) => io.observe(img));
```

比监听 `scroll` 事件省得多（不触发重排、浏览器内部优化）。

### 13.7 表单与可访问性

```html
<label for="email">邮箱</label>
<input id="email" type="email" required aria-describedby="email-hint" />
<p id="email-hint">我们只会用它发送通知。</p>
<button type="submit">订阅</button>
```

```js
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();      // 触发浏览器原生校验提示
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  submit(data);
});
```

清单：语义标签（`button` 不用 `div`）、`alt`、键盘可达（Tab 顺序、`:focus-visible`）、`aria-*` 只在语义不足时用、颜色对比 ≥ 4.5:1。

### 13.8 练习

1. 用事件委托实现一个待办列表的"删除"按钮（列表项动态添加）。
2. 用 `IntersectionObserver` 实现图片懒加载。
3. 写一个滚动动画（用 `translateY` 而不是 `top`），并解释区别。
4. 用 IndexedDB 存一组笔记（提示：用 `idb` 库或手写 `open`/`transaction`）。

### 13.9 答案（要点）

```js
list.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='delete']");
  if (!btn) return;
  btn.closest("li").remove();
});

const io = new IntersectionObserver((entries, obs) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const img = e.target;
    img.src = img.dataset.src;
    obs.unobserve(img);
  }
});
// 3. transform 只触发合成层，top 触发 layout，后者会让整条渲染流水线重跑。
```

### 13.10 本章速查

| 需求 | API |
| --- | --- |
| 动态元素的事件 | 事件委托 + `closest` |
| 动画 | `requestAnimationFrame` + `transform` |
| 视口检测 | `IntersectionObserver` |
| DOM 变化 | `MutationObserver` |
| 本地存储 | `localStorage`（小）/ IndexedDB（大） |
| 表单校验 | `checkValidity` / `reportValidity` |

---

## 14. 工程化：构建、测试、质量

### 14.1 现代构建链路

```text
源码（ESM + TS）
  → 开发：Vite dev server（原生 ESM，按需编译，HMR）
  → 生产：Rolldown 打包（tree-shaking、压缩、代码分割、指纹文件名）
  → 产物：dist/（html + js + css + assets）
```

```js
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: { vendor: ["lodash-es"] },
      },
    },
  },
  server: { port: 5173, proxy: { "/api": "http://localhost:3000" } },
});
```

`target` 决定语法降级程度：`es2022` 支持原生 class 字段、顶层 await；要兼容老浏览器（比如 `es2019`）就得接受更大的产物。

### 14.2 tree-shaking 的三个条件

1. 使用 ESM（`import`/`export`）；
2. 无副作用（或 `package.json` 标注 `"sideEffects": false`）；
3. 打包器能静态分析（避免 `export default {}` 之后动态挂属性）。

```js
// ✅ 可摇树
export function add(a, b) { return a + b; }

// ❌ 不可摇树：导出一个对象，属性名是运行时拼的
const api = {};
api.addLater = () => {};
export default api;
```

### 14.3 测试

```js
// math.test.js
import { describe, it, expect } from "vitest";
import { add } from "./math.js";

describe("add", () => {
  it("相加", () => expect(add(1, 2)).toBe(3));
  it("浮点用 toBeCloseTo", () => expect(0.1 + 0.2).toBeCloseTo(0.3));
});
```

```bash
pnpm vitest run           # 跑一次
pnpm vitest               # watch
pnpm vitest --coverage    # 覆盖率
```

异步与 Mock：

```js
it("异步", async () => {
  await expect(fetchUser(1)).resolves.toMatchObject({ id: 1 });
});

import { vi } from "vitest";
const spy = vi.fn(() => 42);
spy(); 
expect(spy).toHaveBeenCalledTimes(1);

vi.spyOn(console, "log").mockImplementation(() => {});

vi.mock("./api.js", () => ({ fetchUser: vi.fn().mockResolvedValue({ id: 1 }) }));
```

测试金字塔：单元（多、快）→ 集成（中）→ E2E（少、慢，Playwright）。

### 14.4 Lint 与格式化（ESLint 10 flat config）

```js
// eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { window: "readonly", document: "readonly" },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["error", "warn"] }],
      eqeqeq: ["error", "always"],
    },
  },
];
```

格式化二选一：Prettier（生态最广）或 Biome（快、lint+format 一体）。不要两个一起用。

```json
// .prettierrc
{ "semi": true, "singleQuote": false, "printWidth": 100, "trailingComma": "all" }
```

### 14.5 类型：JSDoc 或 TypeScript

```js
/**
 * @param {string} name
 * @param {{ retry?: number }} [options]
 * @returns {Promise<{ id: number, name: string }>}
 */
export async function createUser(name, options = {}) { /* ... */ }
```

```json
// tsconfig.json（JS 项目也能用）
{ "compilerOptions": { "allowJs": true, "checkJs": true, "noEmit": true, "strict": true } }
```

小项目用 JSDoc，中大型直接上 TypeScript。

### 14.6 CI 流水线

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 12 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test -- --coverage
      - run: pnpm build
```

### 14.7 发布

```json
// package.json
{
  "name": "mylib",
  "version": "1.2.3",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": { "build": "tsc -p tsconfig.build.json" }
}
```

```bash
pnpm version minor        # 改版本 + 打 tag
pnpm publish --access public
```

### 14.8 练习

1. 给一个小项目配好 `dev`/`build`/`test`/`lint` 四个脚本，并在 CI 里跑通。
2. 写三个测试：同步函数、异步函数、带 Mock 的函数。
3. 解释为什么 `import lodash from "lodash"` 会让产物变大，怎么改。
4. 配一份 ESLint flat config，要求 `eqeqeq`、禁止 `console`（除 `error`）。

### 14.9 答案（要点）

```js
// 3. lodash 的 CJS 入口不可摇树 → 改 import debounce from "lodash-es/debounce"
```

### 14.10 本章速查

| 环节 | 工具 |
| --- | --- |
| 开发服务器 | Vite 8 |
| 打包 | Rolldown（Vite 内置） |
| 测试 | Vitest 5 + Playwright |
| 检查 | ESLint 10（flat config）+ Prettier/Biome |
| 类型 | TypeScript 7 / JSDoc + checkJs |
| 发布 | `exports` + `files` + `pnpm publish` |

---

## 15. 设计模式：只在需要时用

### 15.1 先说结论

JavaScript 里大部分"经典设计模式"已经内建在语言里：

| GoF 模式 | JS 里的形态 |
| --- | --- |
| 单例 | 模块本身就是单例（ESM 只求值一次） |
| 工厂 | 普通函数返回对象 |
| 迭代器 | `Symbol.iterator` + 生成器 |
| 观察者 | `EventTarget` / `EventEmitter` |
| 策略 | 传函数（一等函数） |
| 装饰器 | 高阶函数 `withLogging(fn)` |
| 命令 | 把操作包成 `{ run(), undo() }` |
| 适配器 | 包一层的转换函数 |

所以真正需要"模式"的时刻是：**代码开始变复杂、需要约定边界**的时候。下面四个是日常最有用的。

### 15.2 策略 / 查表替代 if-else

```js
// ❌ 越来越长的分支
function price(user, amount) {
  if (user.type === "vip") return amount * 0.8;
  if (user.type === "svip") return amount * 0.6;
  if (user.type === "staff") return amount * 0.5;
  return amount;
}

// ✅ 查表
const DISCOUNTS = { vip: 0.8, svip: 0.6, staff: 0.5 };
const price = (user, amount) => amount * (DISCOUNTS[user.type] ?? 1);
```

需要附带其他行为时，表里放对象或函数：

```js
const STRATEGIES = {
  json: { ext: "json", encode: JSON.stringify, decode: JSON.parse },
  text: { ext: "txt", encode: String, decode: String },
};

function save(data, format) {
  const s = STRATEGIES[format];
  if (!s) throw new Error(`不支持的格式：${format}`);
  return writeFile(`out.${s.ext}`, s.encode(data));
}
```

### 15.3 观察者 / 事件总线

```js
class Emitter {
  #handlers = new Map();

  on(type, fn) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(fn);
    return () => this.off(type, fn);          // 返回取消函数
  }

  off(type, fn) {
    this.#handlers.get(type)?.delete(fn);
  }

  emit(type, payload) {
    for (const fn of this.#handlers.get(type) ?? []) {
      try { fn(payload); }
      catch (e) { console.error(`handler for ${type} failed`, e); }   // 一个坏监听器不能拖垮全部
    }
  }
}

const bus = new Emitter();
const off = bus.on("save", (doc) => console.log("saved", doc.id));
bus.emit("save", { id: 1 });
off();
```

要点：返回取消函数（比"传同一个函数引用去 off"更不容易错）、`emit` 里捕获异常、用 `Set` 去重。

浏览器里也可以直接用 `EventTarget`：

```js
const bus = new EventTarget();
bus.addEventListener("save", (e) => console.log(e.detail.id));
bus.dispatchEvent(new CustomEvent("save", { detail: { id: 1 } }));
```

### 15.4 状态机

状态多于三个、转换有约束时，用显式的状态表胜过散落的 `if`。

```js
const TRANSITIONS = {
  idle: { start: "running" },
  running: { pause: "paused", stop: "idle", fail: "failed" },
  paused: { start: "running", stop: "idle" },
  failed: { reset: "idle" },
};

class Machine {
  #state = "idle";
  #listeners = new Set();

  get state() { return this.#state; }

  send(action) {
    const next = TRANSITIONS[this.#state][action];
    if (!next) {
      throw new Error(`非法转换：${this.#state} --${action}--> ?`);
    }
    const prev = this.#state;
    this.#state = next;
    for (const fn of this.#listeners) fn(prev, next, action);
    return next;
  }

  onChange(fn) { this.#listeners.add(fn); return () => this.#listeners.delete(fn); }
}

const m = new Machine();
m.onChange((a, b, act) => console.log(`${a} --${act}--> ${b}`));
m.send("start");     // idle --start--> running
m.send("pause");     // running --pause--> paused
// m.send("fail");   // 抛错：paused 不允许 fail
```

这个"表驱动"写法与你 TypeScript 手册里的判别联合是同一个思想：**把所有合法转换集中到一处**。

### 15.5 依赖注入：参数化依赖

```js
// ❌ 硬编码依赖，测试难
export async function getUsers() {
  const res = await fetch("https://api.example.com/users");
  return res.json();
}

// ✅ 依赖从参数进来，测试可替换
export async function getUsers({ http = fetch, baseUrl = "https://api.example.com" } = {}) {
  const res = await http(`${baseUrl}/users`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 测试
const fakeHttp = async () => ({ ok: true, json: async () => [{ id: 1 }] });
await getUsers({ http: fakeHttp });
```

不需要容器、不需要装饰器。**"把不稳定的东西变成参数"** 就是最实用的 DI。

### 15.6 分层：把副作用挤到边缘

```text
┌─────────────────────────────┐
│ 入口层（UI / CLI / HTTP）    │  ← 只做：解析输入、调用、渲染输出
├─────────────────────────────┤
│ 业务逻辑（纯函数）           │  ← 无 IO、可单测、可复用
├─────────────────────────────┤
│ 适配层（fetch / fs / db）    │  ← 唯一知道外部世界的地方
└─────────────────────────────┘
```

```js
// 业务层：纯函数，不碰网络
export function summarize(orders) {
  const total = orders.reduce((s, o) => s + o.amount, 0);
  return { count: orders.length, total };
}

// 入口层：负责 IO
const orders = await fetchOrders();
render(summarize(orders));
```

判断标准：如果这个函数需要 mock 才能测试，那它应该在适配层。

### 15.7 什么时候**不要**用模式

- 只有一种实现时，不要为了"以后可能扩展"加抽象；
- 层数超过三层就在制造理解成本；
- 一个函数能解决的事不要建类；
- 事件总线滥用会让调用链无法追踪（"谁改了状态？"）。

经验法则：**第二次重复时再抽象**（Rule of Three）。

### 15.8 本章速查

| 需求 | 手段 |
| --- | --- |
| 消除长 if-else | 查表 / 策略对象 |
| 解耦通知 | 观察者（`Emitter` / `EventTarget`） |
| 约束状态转换 | 状态机表 |
| 可测试 | 依赖注入（参数化） |
| 可维护 | 分层：副作用集中在边缘 |

---

## 16. 状态管理与响应式原理

### 16.1 三种状态

| 类型 | 例子 | 存哪 |
| --- | --- | --- |
| 本地 UI 状态 | 弹窗开关、输入框内容 | 组件内部变量 |
| 共享状态 | 当前用户、主题、购物车 | 一个 store |
| 服务端状态 | 列表数据、详情 | 请求缓存（可失效） |

**常见错误**：把服务端数据也当成共享状态手动同步，结果到处是"记得刷新"。服务端状态交给数据层（TanStack Query / SWR 思路）。

### 16.2 手写一个最小 store（发布订阅）

```js
function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,
    set(updater) {
      const next = typeof updater === "function" ? updater(state) : updater;
      if (Object.is(next, state)) return;      // 值没变就不通知
      state = next;
      for (const fn of listeners) fn(state);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const store = createStore({ count: 0, items: [] });
const off = store.subscribe((s) => console.log("变了", s.count));

store.set((s) => ({ ...s, count: s.count + 1 }));
store.set((s) => ({ ...s, count: s.count }));    // 新对象，会通知（引用变了）
off();
```

要点：`set` 接收**函数**（基于旧状态算新状态，避免竞态）、不可变更新、订阅返回取消函数。

### 16.3 Proxy 实现响应式（Vue 3 的核心思路）

```js
const effects = new Set();
let active = null;

function effect(fn) {
  active = fn;
  fn();                 // 首次执行，触发 get 收集依赖
  active = null;
}

const bucket = new WeakMap();   // target -> Map<key, Set<effect>>

function track(target, key) {
  if (!active) return;
  let deps = bucket.get(target);
  if (!deps) bucket.set(target, (deps = new Map()));
  let set = deps.get(key);
  if (!set) deps.set(key, (set = new Set()));
  set.add(active);
}

function trigger(target, key) {
  bucket.get(target)?.get(key)?.forEach((fn) => fn());
}

function reactive(obj) {
  return new Proxy(obj, {
    get(t, key, receiver) {
      track(t, key);
      const v = Reflect.get(t, key, receiver);
      return typeof v === "object" && v !== null ? reactive(v) : v;   // 深层
    },
    set(t, key, value, receiver) {
      const ok = Reflect.set(t, key, value, receiver);
      trigger(t, key);
      return ok;
    },
  });
}

const state = reactive({ count: 0 });
effect(() => console.log("count =", state.count));   // 首次打印 0
state.count++;                                        // 打印 1
```

这 40 行就是"响应式系统"的最小内核。看懂它，Vue 的 `ref`/`reactive`/`computed` 都不再神秘。

### 16.4 不可变更新与结构共享

```js
// 只改深层一个字段，要沿路径复制
const next = {
  ...state,
  user: {
    ...state.user,
    profile: { ...state.user.profile, name: "Ann" },
  },
};
```

深层嵌套会很啰嗦，两种解法：

1. 用 `immer` 的 `produce`（内部用 Proxy 记录修改）；
2. 把状态拍平（用 id 索引 + 引用，而不是深层嵌套）。

```js
// 拍平：更适合大列表
{
  users: { byId: { "1": {...} }, allIds: ["1"] },
  selectedUserId: "1",
}
```

### 16.5 服务端状态：缓存与失效

```js
const cache = new Map();

async function query(key, fetcher, { ttl = 30_000 } = {}) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;

  const value = await fetcher();
  cache.set(key, { value, at: Date.now() });
  return value;
}

// 写操作后主动失效
function invalidate(prefix) {
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
}
```

生产里用 TanStack Query / SWR，它们处理了并发去重、重试、窗口聚焦刷新、乐观更新。

### 16.6 三种常见状态 bug

```js
// 1) 直接改对象导致"没渲染"
state.items.push(x);            // ❌ 引用没变
state.items = [...state.items, x];   // ✅

// 2) 闭包里的旧状态
setCount(count + 1);
setCount(count + 1);            // ❌ 两次都基于同一个旧值
setCount((c) => c + 1);         // ✅ 函数式更新

// 3) 异步竞态：后发的请求先返回，覆盖了新结果
let seq = 0;
async function load(q) {
  const my = ++seq;
  const data = await fetch(`/search?q=${q}`);
  if (my !== seq) return;       // ✅ 过期结果丢弃
  render(data);
}
```

### 16.7 练习

1. 给 `createStore` 增加 `select(selector, fn)`：只有选中部分变化时才通知。
2. 实现 `computed(getter)`，依赖变化时才重新计算并缓存。
3. 用 `immer` 或手写，实现"更新嵌套数组里 id=3 的对象"。
4. 解释为什么 `state.items.push(x)` 在响应式系统里常常"没反应"。

### 16.8 答案（要点）

```js
function select(store, selector, fn) {
  let last = selector(store.get());
  fn(last);
  return store.subscribe((s) => {
    const cur = selector(s);
    if (Object.is(cur, last)) return;
    last = cur;
    fn(cur);
  });
}

function computed(getter) {
  let dirty = true, value;
  return () => {
    if (dirty) { value = getter(); dirty = false; }
    return value;
  };
}
// 真正的 computed 需要依赖收集：getter 执行时记录用到的响应式属性，属性变化时置 dirty。
```

### 16.9 本章速查

| 需求 | 手段 |
| --- | --- |
| 小型共享状态 | 发布订阅 store |
| 响应式 | Proxy + 依赖收集 |
| 深层更新 | 沿路径复制 / `immer` / 拍平 |
| 服务端数据 | 缓存 + TTL + 失效 |
| 竞态 | 序号 / `AbortController` |

---

## 17. 实战一：不靠框架的前端应用

目标：一个"任务列表"单页应用，只用浏览器 API，把前 16 章的内容串起来。功能：

1. 添加/完成/删除任务；
2. 按状态过滤（全部/未完成/已完成）；
3. 数据存 `localStorage`；
4. 请求模拟接口（带加载/错误状态）；
5. 路由（用 `hashchange`）。

### 17.1 目录结构

```text
todo/
├── index.html
├── src/
│   ├── main.js        # 启动
│   ├── store.js       # 状态
│   ├── api.js         # 假接口
│   ├── view.js        # 渲染
│   └── router.js      # 路由
└── style.css
```

页面骨架。`view.js` 里 `querySelector` 的那些 id 必须在这里存在，否则模块一加载就 `null.addEventListener` 报错——这是前端最常见的一类"什么都没显示"的来源：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>待办</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <form id="new-form">
    <input id="new-title" placeholder="要做的事" autocomplete="off" required />
    <button>添加</button>
  </form>

  <div id="filters"></div>
  <ul id="list"></ul>
  <p id="status"></p>

  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

样式只求够用（这个例子的重点不在 CSS）：

```css
/* style.css */
body { font: 16px/1.6 system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; }
#new-form { display: flex; gap: .5rem; }
#new-title { flex: 1; padding: .5rem; }
#filters { display: flex; gap: .25rem; margin: 1rem 0; }
#filters button { padding: .25rem .6rem; }
#filters button.active { font-weight: 600; border-color: #333; }
#list { list-style: none; padding: 0; }
#list li { display: flex; align-items: center; gap: .5rem; padding: .35rem 0; border-bottom: 1px solid #eee; }
#list li.done span { text-decoration: line-through; color: #888; }
#list li.empty { color: #999; border: 0; }
#status { color: #666; font-size: .875rem; }
```

### 17.2 状态层

```js
// src/store.js
const KEY = "todo:v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? { todos: [], filter: "all" };
  } catch {
    return { todos: [], filter: "all" };      // 数据损坏时降级，不要崩
  }
}

let state = load();
const listeners = new Set();

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(next) {
  state = next;
  save();
  listeners.forEach((fn) => fn(state));
}

export function addTodo(title) {
  const t = title.trim();
  if (!t) return;
  commit({
    ...state,
    // id 用 randomUUID：自增计数器在页面刷新后会从头开始，和已有 id 撞车
    todos: [...state.todos, { id: crypto.randomUUID(), title: t, done: false, at: Date.now() }],
  });
}

export function toggle(id) {
  commit({
    ...state,
    todos: state.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  });
}

export function remove(id) {
  commit({ ...state, todos: state.todos.filter((t) => t.id !== id) });
}

export function setFilter(filter) {
  commit({ ...state, filter });
}

export function visibleTodos() {
  const { todos, filter } = state;
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}
```

### 17.3 数据层

```js
// src/api.js —— 可选：本地优先，联网时再同步
export async function syncRemote(todos, { signal } = {}) {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(todos),
    signal,
  });
  if (!res.ok) {
    const err = new Error(`同步失败：HTTP ${res.status}`);
    err.status = res.status;            // 带上状态码，重试逻辑才知道该不该重试
    throw err;
  }
  return res.json();
}

// 带重试的版本
export async function syncWithRetry(todos, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await syncRemote(todos, { signal: AbortSignal.timeout(5000) });
    } catch (e) {
      last = e;
      // 4xx 是"你错了"，重试只会重复犯错；5xx/网络错误才值得退避重试
      if (e.status >= 400 && e.status < 500) break;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  throw last;
}
```

这层默认**不接线**：应用先本地可用，同步是可选能力（`main.js` 里没 import 它）。要接上的话，在 `subscribe` 里做防抖同步即可——但别在 `commit` 里直接 `await`，否则一次点击会卡住整条渲染链。

### 17.4 视图层

```js
// src/view.js
import { getState, visibleTodos, addTodo, toggle, remove } from "./store.js";

const el = {
  form: document.querySelector("#new-form"),
  input: document.querySelector("#new-title"),
  list: document.querySelector("#list"),
  filters: document.querySelector("#filters"),
  status: document.querySelector("#status"),
};

const FILTERS = [
  ["all", "全部"],
  ["active", "未完成"],
  ["done", "已完成"],
];

function renderFilters() {
  const { filter } = getState();
  el.filters.innerHTML = FILTERS.map(
    ([key, label]) =>
      `<button data-filter="${key}" class="${key === filter ? "active" : ""}">${label}</button>`
  ).join("");
}

function renderList() {
  const todos = visibleTodos();
  if (todos.length === 0) {
    el.list.innerHTML = `<li class="empty">还没有任务</li>`;
    return;
  }
  el.list.innerHTML = todos
    .map(
      (t) => `
      <li data-id="${t.id}" class="${t.done ? "done" : ""}">
        <input type="checkbox" ${t.done ? "checked" : ""} data-act="toggle" />
        <span>${escapeHtml(t.title)}</span>
        <button data-act="remove" aria-label="删除">✕</button>
      </li>`
    )
    .join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function render(state) {
  renderFilters();
  renderList();
  const { todos } = state;
  el.status.textContent = `共 ${todos.length} 条，未完成 ${todos.filter((t) => !t.done).length} 条`;
}

export function bindEvents() {
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(el.input.value);
    el.input.value = "";
    el.input.focus();
  });

  // 事件委托：一个监听器处理所有列表操作
  el.list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.matches("[data-act='toggle']")) toggle(id);
    else if (e.target.matches("[data-act='remove']")) remove(id);
  });

  el.filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    // 不直接改 store：先改 hash，让"地址栏"成为唯一真相来源
    if (btn) location.hash = `/${btn.dataset.filter}`;
  });
}
```

### 17.5 路由

极简 hash 路由。注意它返回的是"取消订阅"函数——和 `store.subscribe` 一个风格，组件卸载时能干净地拆掉：

```js
// src/router.js
export function onHashChange(fn) {
  const fire = () => fn(location.hash.slice(1) || "/");
  window.addEventListener("hashchange", fire);
  fire();                                   // 首屏也要触发一次，否则刷新后筛选丢失
  return () => window.removeEventListener("hashchange", fire);
}
```

### 17.6 启动

```js
// src/main.js
import { getState, subscribe, setFilter } from "./store.js";
import { render, bindEvents } from "./view.js";
import { onHashChange } from "./router.js";

bindEvents();                       // DOM 事件 → store
subscribe(render);                  // store 变化 → 重画
onHashChange((path) => {            // 地址栏 → store
  const filter = path === "/active" ? "active" : path === "/done" ? "done" : "all";
  setFilter(filter);
});
render(getState());
```

数据流是一条单向链，调试时按这条链逐段检查即可：

```text
点击/输入 → 改 hash 或调 store 方法 → commit → 通知订阅者 → render → 重新生成 DOM
```

### 17.7 这个例子里藏着哪些知识点

| 代码 | 用到的概念 |
| --- | --- |
| `subscribe(render)` | 观察者 / 发布订阅（第 15 章） |
| `commit({...state})` | 不可变更新（第 16 章） |
| `innerHTML` + `escapeHtml` | XSS 防护（安全） |
| 事件委托 | 事件模型（第 13 章） |
| `try/catch` 解析 localStorage | 错误处理（第 10 章） |
| `AbortSignal.timeout` | 取消与超时（第 8 章） |
| `import` 分文件 | ESM（第 9 章） |

### 17.8 扩展练习

1. 加"编辑任务标题"（双击进入编辑，回车保存，Esc 取消）。
2. 加"撤销删除"（保存最近一次删除，3 秒内可恢复）。
3. 把列表改成虚拟滚动（只渲染可视区域的 20 条）。

---

## 18. 实战二：Node 数据管道 CLI

目标：把 CSV 转成统计报告（JSON + 控制台表格），要求：流式读取、错误可诊断、可被测试、退出码正确。

```text
pipeline/
├── package.json      # { "type": "module" }
├── src/
│   ├── main.js       # 入口：捕获异常、决定退出码
│   ├── cli.js        # 参数解析与业务编排
│   ├── parse.js      # CSV 解析（纯函数）
│   ├── stats.js      # 统计（纯函数）
│   └── io.js         # 读写文件（副作用）
└── test/
    ├── parse.test.js
    └── stats.test.js
```

### 18.1 纯函数层

```js
// src/parse.js
/** 极简 CSV 解析：支持双引号包裹、字段内逗号与换行 */
export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    if (ch === "\r") continue;
    field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }

  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body
    .filter((r) => r.length === header.length && r.some((c) => c !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i]])));
}
```

```js
// src/stats.js
export function summarize(records, { amountField = "amount", groupField = "category" } = {}) {
  const groups = new Map();
  let invalid = 0;

  for (const rec of records) {
    // 坑：Number("") === 0、Number("  ") === 0，空金额会被当成 0 混进统计
    const raw = String(rec[amountField] ?? "").trim();
    const amount = raw === "" ? Number.NaN : Number(raw);
    if (!Number.isFinite(amount)) { invalid++; continue; }
    const key = rec[groupField] || "(未分类)";
    const cur = groups.get(key) ?? { key, count: 0, total: 0 };
    cur.count++;
    cur.total += amount;
    groups.set(key, cur);
  }

  const rows = [...groups.values()]
    .map((g) => ({ ...g, avg: g.total / g.count }))
    .sort((a, b) => b.total - a.total);

  const total = rows.reduce((s, r) => s + r.total, 0);
  return {
    total,
    invalid,
    count: rows.reduce((s, r) => s + r.count, 0),
    rows,
  };
}
```

纯函数的好处：不碰文件、不读参数，测试只需给字符串。

> **一个真踩到的坑**：最初 `summarize` 里写的是 `const amount = Number(rec[amountField])`。看起来没问题，但 `Number("") === 0`、`Number("  ") === 0`、`Number([]) === 0`——空金额被当成 0 计入统计，报表里凭空多出一组"0 元"的分类，而 `invalid` 计数也不会报警。
>
> 所以这里先 `String(...).trim()`，判空后显式给 `NaN`。教训是：**在做数值转换前，先判断"有没有值"，而不是指望转换函数替你拒绝空值。**

### 18.2 副作用层

```js
// src/io.js
import { readFile, writeFile } from "node:fs/promises";

export async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") throw new Error(`文件不存在：${path}`, { cause: e });
    if (e.code === "EACCES") throw new Error(`没有读取权限：${path}`, { cause: e });
    throw e;
  }
}

export async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}
```

### 18.3 参数解析与入口

```js
// src/cli.js
import { parseArgs } from "node:util";
import { readText, writeJson } from "./io.js";
import { parseCsv } from "./parse.js";
import { summarize } from "./stats.js";

export async function main(argv = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o" },
      group: { type: "string", default: "category" },
      json: { type: "boolean", default: false },
    },
  });

  const [input] = positionals;
  if (!input) {
    console.error("用法：node src/main.js <input.csv> [-o out.json] [--group field] [--json]");
    return 2;                       // 用法错误用 2
  }

  const text = await readText(input);
  const records = parseCsv(text);
  if (records.length === 0) throw new Error("没有解析到任何数据行");

  const report = summarize(records, { groupField: values.group });

  if (values.out) await writeJson(values.out, report);

  if (values.json) {
    console.log(JSON.stringify(report));
  } else {
    console.log(`合计 ${report.total.toFixed(2)}（${report.count} 条，跳过 ${report.invalid} 条）`);
    for (const r of report.rows) {
      console.log(`${r.key.padEnd(12)} ${String(r.count).padStart(5)}  ${r.total.toFixed(2).padStart(10)}`);
    }
  }
  return 0;
}
```

```js
// src/main.js —— 入口：区分"用法错误"与"运行错误"，退出码不同
import { main } from "./cli.js";

try {
  process.exitCode = await main();
} catch (e) {
  console.error(`错误：${e.message}`);
  process.exitCode = 1;
}
```

### 18.4 测试

```js
// test/parse.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../src/parse.js";

test("基础解析", () => {
  const rows = parseCsv("a,b\n1,2\n3,4\n");
  assert.deepEqual(rows, [{ a: "1", b: "2" }, { a: "3", b: "4" }]);
});

test("引号内的逗号与转义引号", () => {
  const rows = parseCsv('name,note\n"Li, Lei","说 ""hi"""\n');
  assert.equal(rows[0].name, "Li, Lei");
  assert.equal(rows[0].note, '说 "hi"');
});
```

```js
// test/stats.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize } from "../src/stats.js";

test("按分类汇总，跳过非法金额", () => {
  const r = summarize([
    { category: "书", amount: "10" },
    { category: "书", amount: "5.5" },
    { category: "笔", amount: "x" },
    { category: "笔", amount: "" },
    { category: "笔", amount: "  " },
  ]);
  assert.equal(r.total, 15.5);
  assert.equal(r.invalid, 3);        // "x"、""、"  " 都不是有效金额
  assert.equal(r.rows[0].key, "书");
  assert.equal(r.count, 2);
});
```

```bash
node --test          # Node 内置测试运行器，无需安装
```

### 18.5 这个例子里的工程要点

| 要点 | 做法 |
| --- | --- |
| 可测试 | 解析与统计是纯函数 |
| 可诊断 | 错误信息带路径与原因（`cause`） |
| 退出码 | 0 成功 / 1 运行错误 / 2 用法错误 |
| 无依赖 | `node:util` 的 `parseArgs` + `node:test` |
| 输出可管道 | `--json` 输出机器可读结果 |

### 18.6 扩展练习

1. 支持从 stdin 读（`cat a.csv | node src/cli.js -`）。
2. 改成流式解析（`for await` 逐行），支持 1GB 文件。
3. 加 `--top 5` 只输出前 N 组。
4. 加进度输出到 stderr（不影响 stdout 管道）。

---

## 19. 陷阱与反模式清单

### 19.1 语言层

| 陷阱 | 说明 | 修法 |
| --- | --- | --- |
| `==` 隐式转换 | `"" == 0`、`null == undefined` | 用 `===` |
| `sort()` 字典序 | `[10, 9].sort()` → `[10, 9]` | 传比较函数 |
| `parseInt` 无基数 | 老环境 `08` 可能出错 | 总传 `10` |
| 浮点比较 | `0.1+0.2 !== 0.3` | 用整数或 `Number.EPSILON` |
| `typeof null === "object"` | 历史 bug | `x === null` 判断 |
| 稀疏数组 | `[,,].length === 2`，`map` 跳过空洞 | 避免；用 `Array.from` |
| `Date` 月份从 0 | `new Date(2026, 9, 1)` 是十月 | 用 `Temporal`（若可用）或封装 |
| 字符串不可变 | `s[0] = "x"` 无效 | `replace`/切片 |

### 19.2 异步层

| 反模式 | 问题 | 修法 |
| --- | --- | --- |
| `forEach` + `async` | 不等结果 | `for...of` / `Promise.all` |
| 顺序 `await` | 串行变慢 | `Promise.all` |
| 漏 `await` | 错误抓不到、时序乱 | 开 `no-floating-promises` 检查 |
| `new Promise` 包一切 | 冗余、易漏错误 | 直接用 `async` 函数 |
| 无超时 `fetch` | 卡死后端 | `AbortSignal.timeout` |
| 无限 `while` + `await` | 微任务饿死 | 加 `setTimeout` 让出 |

### 19.3 结构层

- **万能 `utils.js`**：什么都能往里塞 → 按领域分模块；
- **回调金字塔**：超过两层的回调改成 Promise；
- **魔法数字/字符串**：抽常量或枚举对象；
- **深层嵌套 `if`**：提前 `return`（卫语句）；
- **复制粘贴三份**：第三次出现时抽象；
- **过度抽象**：一个函数只有一行还包一层。

### 19.4 安全层

```js
// XSS：永远不要直接插用户输入
el.innerHTML = `<p>${escapeHtml(userInput)}</p>`;   // ✅
el.textContent = userInput;                          // ✅ 更简单

// 原型污染
Object.assign({}, JSON.parse('{"__proto__":{"admin":true}}'));   // 危险
// 用 Object.create(null) 或校验 key

// eval / new Function：除非做沙箱，否则不要用

// 反序列化不可信数据：结构化克隆、JSON.parse 都只处理数据；不要反序列化函数
```

### 19.5 可维护性快速自检

- [ ] 函数超过 40 行了吗？（拆）
- [ ] 参数超过 3 个了吗？（传对象）
- [ ] 有没有 `try/catch` 里空实现？（至少记日志）
- [ ] 有没有名字叫 `data`、`temp`、`obj` 的变量？（改语义化）
- [ ] 有没有依赖执行顺序的模块级副作用？（挪进函数）
- [ ] 报错信息能让人定位吗？（带上下文）

### 19.6 本章速查

| 类别 | 一句话 |
| --- | --- |
| 相等 | 用 `===` |
| 排序 | 传比较函数 |
| 异步 | `await` 到位，并发用 `all` |
| 用户输入 | 用 `textContent` 或转义 |
| 抽象 | 第三次重复再抽象 |

---

## 20. 练习总集（40 题）

按难度分为三档，参考答案见 20.4。建议先自己想 10 分钟。

### 20.1 基础（1–15）

1. 用闭包实现 `counter()`，暴露 `inc/dec/value`。
2. 实现 `once(fn)`（只执行一次）。
3. 实现 `debounce` 与 `throttle`，并说明何时用哪个。
4. 手写 `myBind(fn, ctx, ...args)`。
5. 用 `reduce` 实现 `map`、`filter`。
6. 实现 `flatten(arr, depth)`（支持指定深度）。
7. 实现 `deepClone`（处理数组、对象、Date、Map、Set）。
8. 实现 `groupBy(arr, fn)` 与 `countBy(arr, fn)`。
9. 用 `Proxy` 实现只读对象（写时抛错）。
10. 写 `range(start, end, step)`，可被 `for...of` 遍历。
11. 实现 `uniq(arr)`（不用 `Set`，然后改用 `Set` 并比较）。
12. 把回调式 `setTimeout` 包成 Promise 版本。
13. 实现 `sleep(ms)`，并支持取消。
14. 实现数组的 `chunk(n)`（不改原数组）。
15. 判断一个变量是"纯对象"还是"其他对象"（数组/Date/Map）。

### 20.2 进阶（16–30）

16. 实现 `pipe`、`compose`、`curry`。
17. 实现 `memoize`，支持 `WeakMap` 版本（对象作参数）。
18. 实现 LRU 缓存（`get`、`set`、容量淘汰）。
19. 实现 `EventEmitter`（`on`/`off`/`once`/`emit`）。
20. 实现一个状态机 `createMachine(config)`，支持 `onTransition`。
21. 实现 `retry(fn, opts)`，带指数退避与 `shouldRetry`。
22. 实现 `mapLimit(items, limit, fn)`。
23. 实现 `promiseAll`（不用 `Promise.all`）。
24. 实现 `pLimit(n)`（返回 `limit(fn)`）。
25. 用 `IntersectionObserver` 实现懒加载，并处理兼容降级。
26. 实现一个简易路由（`hash` 或 History API），支持参数 `:id`。
27. 实现 `deepEqual`。
28. 实现 `throttle` 的"首次立即执行 + 末次补发"版本。
29. 实现 `EventBus` 支持通配符事件（`user.*`）。
30. 用 Proxy 实现"默认值对象"（读不存在的键返回 `0` 并记录访问）。

### 20.3 综合（31–40）

31. 写一个"表单校验器"：规则可组合（必填、最小长度、正则），返回错误映射。
32. 实现一个带取消的自动补全：输入 → 防抖 → 取消上次 → 渲染 → 错误提示。
33. 用 Worker 计算 1e7 个数的求和，主线程保持可交互。
34. 实现一个可撤销的 store（`undo`/`redo`）。
35. 实现"虚拟列表"：只渲染可视区域，支持滚动定位。
36. 实现 `fetchWithRetry`：超时、重试、`429` 读 `Retry-After`。
37. 写一个文件下载合并器（Node）：流式读取多个文件，输出合并结果并计算校验和。
38. 实现一个"任务队列"：并发上限、优先级、失败重试、暂停/恢复。
39. 用 `node:test` 给第 38 题写测试（含并发与重试用例）。
40. 用 `PerformanceObserver` 采集长任务，输出统计。

### 20.4 参考答案（要点）

```js
// 1
const counter = () => {
  let n = 0;
  return { inc: () => ++n, dec: () => --n, value: () => n };
};

// 6
const flatten = (arr, depth = 1) =>
  depth < 1 ? arr.slice()
  : arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flatten(x, depth - 1) : x), []);

// 10
function* range(start, end, step = 1) {
  for (let i = start; step > 0 ? i < end : i > end; i += step) yield i;
}

// 15
const isPlainObject = (v) =>
  v !== null && typeof v === "object" &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

// 23
async function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const out = new Array(list.length);
    let left = list.length;
    if (left === 0) return resolve(out);
    list.forEach((p, i) =>
      Promise.resolve(p).then(
        (v) => { out[i] = v; if (--left === 0) resolve(out); },
        reject
      )
    );
  });
}

// 24
function pLimit(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

// 29
class WildBus {
  #map = new Map();
  on(pattern, fn) {
    const re = new RegExp("^" + pattern.split("*").map(escapeRe).join("[^.]+") + "$");
    (this.#map.get(pattern) ?? this.#map.set(pattern, []).get(pattern)).push({ re, fn });
    return () => { /* 移除对应项 */ };
  }
  emit(type, payload) {
    for (const list of this.#map.values())
      for (const { re, fn } of list) if (re.test(type)) fn(payload, type);
  }
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
```

```js
// 31 组合式校验
const required = (msg = "必填") => (v) => (v == null || v === "" ? msg : null);
const minLen = (n) => (v) => (String(v).length < n ? `至少 ${n} 个字符` : null);
const pattern = (re, msg) => (v) => (re.test(v) ? null : msg);

const rules = {
  email: [required(), pattern(/^[^@\s]+@[^@\s]+$/, "邮箱格式不对")],
  password: [required(), minLen(8)],
};

function validate(values, spec) {
  const errors = {};
  for (const [field, fns] of Object.entries(spec)) {
    for (const fn of fns) {
      const msg = fn(values[field]);
      if (msg) { (errors[field] ??= []).push(msg); break; }
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
```

```js
// 36
async function fetchWithRetry(url, { attempts = 3, timeout = 3000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (res.status === 429) {
        const wait = Number(res.headers.get("retry-after") ?? 1) * 1000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  throw lastErr;
}
```

```js
// 40
const po = new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.duration > 50) console.warn("长任务", Math.round(e.duration), "ms");
  }
});
po.observe({ type: "longtask", buffered: true });
```

### 20.5 自测标准

- 能不看答案写出 1–15：基础过关；
- 能写出 16–30 并解释复杂度：进阶过关；
- 31–40 中至少完成 6 题：可以写生产代码了。

---

## 21. 速查表与学习路径

### 21.1 语法速查

```js
// 声明
const f = (a, b = 1) => a + b;

// 解构 / 展开
const { a, b: renamed, ...rest } = obj;
const [x, , z] = arr;
const merged = { ...a, ...b };

// 可选链 / 空值合并
user?.profile?.name ?? "匿名";

// 模板字符串
`${name} 有 ${list.length} 项`;

// 数组
arr.map(fn); arr.filter(fn); arr.reduce(fn, init);
arr.toSorted(); arr.with(0, v); arr.at(-1);
arr.flat(2); arr.flatMap(fn);

// 对象
Object.entries(o); Object.fromEntries(e);
Object.hasOwn(o, "k"); { ...o, [k]: v };

// 集合
new Map(); new Set(); new WeakMap();

// 迭代
for (const v of iterable) {}
function* gen() { yield 1; }
iterable.values().map(fn).toArray();

// 异步
await fn();
Promise.all([...]); Promise.allSettled([...]);
Promise.race([...]); Promise.any([...]);

// 取消
const ac = new AbortController();
fetch(url, { signal: ac.signal });
ac.abort();
AbortSignal.timeout(1000);

// 模块
import x from "./x.js";
import { y } from "./y.js";
const z = await import("./z.js");
export default fn;
export { a, b };

// 类
class A extends B { #p = 1; static s = 2; constructor() { super(); } }
```

### 21.2 执行顺序速记

```text
同步代码（调用栈）
  ↓ 栈空
微任务队列（全部清空）：Promise.then / queueMicrotask / await 后续
  ↓
宏任务（一次一个）：setTimeout / setInterval / I/O / 事件
  ↓（浏览器可能渲染）
```

### 21.3 与 Python / C 的心智对照

| 概念 | JS | Python | C |
| --- | --- | --- | --- |
| 类型 | 动态，`typeof` | 动态，`type()` | 静态，编译期 |
| 相等 | `===`（严格）/ `==`（转换） | `==`（值）/ `is`（身份） | `==` 数值 |
| 字符串 | 不可变 | 不可变 | `char[]` 以 `\0` 结尾 |
| 列表/数组 | `Array`（动态） | `list` | 定长数组 |
| 字典/映射 | `Object` / `Map` | `dict` | 手写哈希表 |
| 闭包 | 天然 | 天然 | 函数指针 + 手工环境 |
| 类 | `class`（原型） | `class`（多继承/MRO） | 无（struct + 函数） |
| 并发 | 单线程 + 事件循环；Worker 多线程 | 线程 + GIL；多进程；asyncio | 线程/进程，手动同步 |
| 内存 | GC（可达性） | 引用计数 + GC | 手动 malloc/free |
| 错误 | `throw`/`try`（任何值） | `raise`/`except`（异常类） | 返回码 / `setjmp` |
| 模块 | ESM | 模块/包 | 头文件 + 链接 |

### 21.4 常见面试级问答

| 问题 | 要点 |
| --- | --- |
| `var`/`let`/`const` 区别 | 作用域、TDZ、重复声明、提升 |
| 闭包是什么、有什么用、什么时候泄漏 | 函数 + 定义时作用域；私有状态/记忆化；长生命周期持有大对象 |
| `this` 的四种绑定 | 默认/隐式/显式/new；箭头函数不绑定 |
| 原型链怎么查找 | 自身 → `__proto__` → … → `null` |
| 事件循环与微任务 | 同步 → 微任务（清空）→ 宏任务 → 渲染 |
| `Promise.all` vs `allSettled` | 快速失败 vs 全部完成 |
| `==` 与 `===` | 是否做类型转换 |
| 深拷贝怎么做 | `structuredClone`；JSON 有损 |
| 防抖与节流 | 停止后触发 vs 固定频率触发 |
| 内存泄漏怎么查 | Heap snapshot 对比、Performance 内存曲线 |

### 21.5 六周学习路径

| 周 | 内容 | 产出 |
| --- | --- | --- |
| 1 | 第 1–3 章：类型、作用域、闭包、`this`、原型 | 手写 debounce/throttle/once，解释输出顺序 |
| 2 | 第 4–6 章：函数式、对象与集合、迭代器、数组 | 实现 pipe/curry/memoize/LRU |
| 3 | 第 7–8 章：事件循环、Promise、取消、流、Worker | 写 mapLimit、fetchWithRetry |
| 4 | 第 9–11 章：模块、错误、标准演进 | 把 CJS 项目迁到 ESM；读一遍 ES2024–2026 提案表 |
| 5 | 第 12–14 章：内存、浏览器、工程化 | 配好 lint/test/CI；做一次性能分析 |
| 6 | 第 15–20 章：模式、实战、练习 | 完成第 17、18 章实战 + 10 道综合题 |

### 21.6 资源

| 类型 | 推荐 |
| --- | --- |
| 规范 | tc39.es/ecma262、tc39 提案仓库 |
| 文档 | MDN Web Docs（最权威的日常查询） |
| 运行时 | nodejs.org/docs、Node 的 `--help` 与 `node --test` |
| 书 | 《JavaScript 高级程序设计（第 5 版）》《You Don't Know JS Yet》 |
| 工具 | Vite、Vitest、ESLint、Biome、Playwright |
| 性能 | web.dev/metrics、Chrome DevTools Performance 文档 |

### 21.7 最后三条建议

1. **先让它跑对，再让它跑快**。性能优化的前提是测量。
2. **边界清晰胜过抽象精巧**。纯函数在中间，副作用在边缘。
3. **标准在变，模型不变**。语言模型（作用域、原型、事件循环、迭代协议）比 API 名称活得久——API 会改名，模型不会。
