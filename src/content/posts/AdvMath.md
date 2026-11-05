---
title: 高等数学（上）笔记
description: 高等数学（上）笔记。
date: 2025-03-01
category: 技术
tags:
  - 数学
  - 笔记
readingTime: 160
---


# 高等数学Ⅰ

<style>
.center-image {
  display: block;
  margin-left: auto;
  margin-right: auto;
  padding-top: 20px;
  padding-bottom: 20px;
}
</style>

#### 版权信息

此文件由 川崎敬Kawasaki_Takashi（[Bilibili@古室聚合物](https://space.bilibili.com/349364610)）编写，分享仅供学习交流，严禁用于商业用途

# 目录

- [1 极限](#1-极限)
  - [1.1 极限的基础](#11-极限的基础)
  - [1.2 计算极限](#12-计算极限)
    - [等价无穷小代换（优先考虑）](#等价无穷小代换优先考虑)
    - [L'Hôpital法则](#lhospital法则)
    - [e的特殊极限（$1^\infty$型）](#e的特殊极限1infty型)
    - [导数/定积分的定义](#导数定积分的定义)
    - [夹逼准则](#夹逼准则)
    - [Taylor展开](#taylor展开)
  - [1.3 无穷小的比较](#13-无穷小的比较)
  - [1.4 连续与间断](#14-连续与间断)
    - [连续性](#连续性)
    - [间断点类型](#间断点类型)
  - [1.5 闭区间连续函数性质](#15-闭区间连续函数性质)
    - [有界性和最值定理](#有界性和最值定理)
    - [零点定理和介值定理](#零点定理和介值定理)
  - [1.6 数列极限](#16-数列极限)
    - [数列极限的性质](#数列极限的性质)
    - [Heine定理/函数极限的Heine定义](#heine定理函数极限的heine定义)
- [2 导数与微分](#2-导数与微分)
  - [2.1 导数与微分的概念](#21-导数与微分的概念)
  - [2.2 导数/微分的性质与几何意义](#22-导数微分的性质与几何意义)
    - [连续与可导](#连续与可导)
    - [导数的几何意义](#导数的几何意义)
    - [微分的应用（近似计算）](#微分的应用近似计算)
  - [2.3 导数的计算](#23-导数的计算)
    - [导数表](#导数表)
    - [导数的四则运算与链式法则](#导数的四则运算与链式法则)
    - [反函数求导](#反函数求导)
    - [隐函数求导](#隐函数求导)
    - [参数方程求导](#参数方程求导)
    - [高阶导数](#高阶导数)
  - [2.4 微分中值定理](#24-微分中值定理)
    - [Fermat引理](#fermat引理)
    - [Rolle定理](#rolle定理)
    - [Lagrange中值定理](#lagrange中值定理)
    - [Cauchy中值定理](#cauchy中值定理)
    - [微分中值定理总结](#微分中值定理总结)
  - [2.5 Taylor公式](#25-taylor公式)
  - [2.6 单调性与凹凸性](#26-单调性与凹凸性)
    - [单调性](#单调性)
    - [凹凸性](#凹凸性)
  - [2.7 极值与最值](#27-极值与最值)
    - [极值点](#极值点)
    - [最值](#最值)
  - [2.8 曲率](#28-曲率)
    - [弧微分](#弧微分)
    - [曲率公式](#曲率公式)
- [3 不定积分](#3-不定积分)
  - [3.1 不定积分的概念与性质](#31-不定积分的概念与性质)
  - [3.2 不定积分的计算](#32-不定积分的计算)
    - [常用函数不定积分](#常用函数不定积分)
    - [凑微法（第一类换元积分法）（优先考虑）](#凑微法第一类换元积分法优先考虑)
    - [显式换元（第二类换元积分法）](#显式换元第二类换元积分法)
      - [三角代换](#三角代换)
      - [倒代换](#倒代换)
      - [根式代换](#根式代换)
      - [总结](#总结)
    - [分部积分法](#分部积分法)
    - [有理函数的不定积分](#有理函数的不定积分)
      - [有理分式](#有理分式)
      - [无理分式](#无理分式)
      - [三角分式](#三角分式)
- [4 定积分](#4-定积分)
  - [4.1 定积分的定义与几何意义](#41-定积分的定义与几何意义)
  - [4.2 定积分的性质](#42-定积分的性质)
    - [定积分的基本性质](#定积分的基本性质)
    - [积分中值定理](#积分中值定理)
  - [4.3 变限积分求导](#43-变限积分求导)
  - [4.4 定积分的计算](#44-定积分的计算)
    - [Newton-Leibniz公式（微积分基本公式）](#newton-leibniz公式微积分基本公式)
    - [定积分的换元积分法](#定积分的换元积分法)
    - [定积分的分部积分法](#定积分的分部积分法)
    - [定积分计算中的重要推论](#定积分计算中的重要推论)
      - [被积函数的奇偶性](#被积函数的奇偶性)
      - [被积函数的周期性](#被积函数的周期性)
      - [Wallis公式](#wallis公式)
  - [4.5 反常积分](#45-反常积分)
    - [无穷区间上的反常积分](#无穷区间上的反常积分)
    - [无界函数的反常积分（瑕积分）](#无界函数的反常积分瑕积分)
  - [4.6 定积分的应用](#46-定积分的应用)
    - [微元法](#微元法)
    - [求弧长](#求弧长)
    - [求面积](#求面积)
      - [极坐标下定积分求面积](#极坐标下定积分求面积)
      - [极坐标下定积分求面积](#极坐标下定积分求面积-1)
    - [求体积](#求体积)
      - [圆盘法](#圆盘法)
      - [柱壳法](#柱壳法)
      - [切片法](#切片法)
- [5 常微分方程](#5-常微分方程)
  - [5.1 微分方程的概念](#51-微分方程的概念)
  - [5.2 可分离变量的常微分方程](#52-可分离变量的常微分方程)
    - [齐次方程](#齐次方程)
  - [5.3 一阶线性微分方程](#53-一阶线性微分方程)
    - [一阶线性微分方程的解法](#一阶线性微分方程的解法)
    - [Bernoulli方程](#bernoulli方程)
  - [5.4 可降阶的高阶微分方程](#54-可降阶的高阶微分方程)

---

# 1 极限

## 1.1 极限的基础

$\epsilon-\delta$ 定义

左极限、右极限

**$\displaystyle\lim_{x\to x_0/\infty}f(x)=\infty$ 时极限不存在**

极限的性质：局部保号性、**夹逼性**

## 1.2 计算极限

### 等价无穷小代换（优先考虑）

$x\to0$ 时，有

$$
x\sim\sin x\sim\tan x\sim\arctan x\sim\arcsin x
$$

$$
x\sim\ln(1+x)\sim e^x-1
$$

$$
1-\cos x\sim \frac{1}{2}x^2
$$

$$
\tan x-\sin x\sim \frac{1}{2}x^3
$$

$$
(1+x)^\alpha-1\sim \alpha x,\hspace{1em}\alpha\in(0,1)
$$

若 $x\to x_0$ 时 $u_1(x)\sim u_2(x)$，$v_1(x)\sim v_2(x)$，则
$$
\lim_{x\to x_0}\frac{u_1(x)}{v_1(x)}=\lim_{x\to x_0}\frac{u_2(x)}{v_2(x)}
$$
注意：根据等价无穷小的自反性，任何时候都有 $u(x)\sim u(x)$

### L'Hôpital法则

$$
\lim_{x\to x_0/\infty}\frac{f(x)}{g(x)}=\lim_{x\to x_0/\infty}\frac{f'(x)}{g'(x)}
$$

注意适用条件：$\frac{\infty}{\infty}$型 或 $\frac{0}{0}$型

另外， $\displaystyle\lim_{x\to0}\frac{\sin x}{x}=1$ 属于特殊极限，不可使用L'Hôpital法则

例： $\displaystyle\lim_{x\to a}\dfrac{a^x-x^a}{x-a}=\lim_{x\to a}\dfrac{a^x\ln a-ax^{a-1}}{1}=a^a(\ln a-1)$

### e的特殊极限（$1^\infty$型）

$$
\lim_{\phi(x)\to\infty}(1+\frac{1}{\phi(x)})^{\phi(x)}=e
$$

将 $u(x)^{v(x)}$ 型的式子变形，利用e的特殊极限定义求解极限

例： $\displaystyle\lim_{x\to\infty}(\frac{2x+3}{2x+1})^{x+1}$

$=\displaystyle\lim_{x\to\infty}(1+\frac{2}{2x+1})^\frac{2x+1}{2}\cdot(\frac{2x+3}{2x+1})^\frac{1}{2}$

$=\displaystyle e\cdot\lim_{x\to\infty}(\frac{2x+3}{2x+1})^\frac{1}{2}=e$

### 导数/定积分的定义

导数定义（详见 [2.1导数与微分的概念](#21-导数与微分的概念)）：
$$
f'(x_0)=\lim_{h\to0}\frac{f(x_0+h)-f(x_0)}{h}
$$

<br>

例： $\lim_{h\to0}\dfrac{f(x_0+2h)-f(x_0)}{h}=2\lim_{h\to0}\dfrac{f(x_0+2h)-f(x_0)}{2h}=2f'(x_0)$

例： $\lim_{n\to\infty}n[f(x_0+\frac{1}{n})-f(x_0)]=\lim_{n\to\infty}\dfrac{f(x_0+\frac{1}{n})-f(x_0)}{\frac{1}{n}}=f'(x_0)$

定积分定义（详见 [4.1定积分的定义与几何意义](#41-定积分的定义与几何意义)）：
$$
\int_a^bf(x)dx=\lim_{\lambda\to0}\sum_{i=1}^nf(\xi_i)\Delta x_i
$$
<br>

例： $\displaystyle\lim_{n\to\infty}\ln\frac{\sqrt[n]{(n+1)(n+2)\cdots(n+n)}}{n}$

$=\displaystyle\lim_{n\to\infty}\frac{1}{n}\sum_{i=1}^{n}\ln(1+\frac{i}{n})$

$=\displaystyle\int_0^1\ln(1+x)dx$

$=[(1+x)\ln(1+x)-x]_0^1=2\ln2-1$

注： 此处将 $\frac{1}{n}$ 视为 $dx$ ，求和从 $i=1$ 变到 $i=n$ 的过程中 $\frac{i}{n}$ 从 $0$ 变到 $1$ ，因此将 $\frac{i}{n}$ 视为 $x$ ，积分下限与积分上限分别为 $0$ 与 $1$

### 夹逼准则

**夹逼性**：若$\exist\delta_0>0$，使得当$0<|x-x_0|<\delta_0$时有$g(x)\leq f(x)\leq h(x)$，且$\lim_{x\to x_0}g(x)=\lim_{x\to x_0}h(x)=A$，则$\lim_{x\to x_0}f(x)=A$

寻找一大一小两个函数，证明其在题目给定的极限条件下相等，利用夹逼准则求解极限

例： 求$\lim_{n\to\infty}n(\frac{1}{n^2+e}+\frac{1}{n^2+2e}\cdots\frac{1}{n^2+ne})$，

当$n\in[0,+\infty]$时，$n(\frac{1}{n^2+e}+\frac{1}{n^2+e}\cdots\frac{1}{n^2+e})\leq n(\frac{1}{n^2+e}+\frac{1}{n^2+2e}\cdots\frac{1}{n^2+ne})\leq n(\frac{1}{n^2+ne}+\frac{1}{n^2+ne}\cdots\frac{1}{n^2+ne})$，

即 $\frac{n^2}{n^2+e}\leq n(\frac{1}{n^2+e}+\frac{1}{n^2+2e}\cdots\frac{1}{n^2+ne})\leq\frac{n^2}{n^2+ne}$，

又 $\lim_{n\to\infty}\frac{n^2}{n^2+e}=\lim_{n\to\infty}\frac{n^2}{n^2+ne}=1$，

所以 $\lim_{n\to\infty}n(\frac{1}{n^2+e}+\frac{1}{n^2+2e}\cdots\frac{1}{n^2+ne})=1$

<br>

例： 求$\lim_{n\to\infty}\sqrt[n]{4^n+5^n+6^n}$,

当$n\in[0,+\infty]$时，$\sqrt[n]{6^n}\leq\sqrt[n]{4^n+5^n+6^n}\leq\sqrt[n]{3\cdot6^n}$，

又 $\lim_{n\to\infty}\sqrt[n]{6^n}=\lim_{n\to\infty}\sqrt[n]{3\cdot6^n}=6$，

所以 $\lim_{n\to\infty}\sqrt[n]{4^n+5^n+6^n}=6$

遇到带有$n$以及省略号的极限求解，可以先尝试使用夹逼准则求解与利用定积分定义求解

### Taylor展开

利用$n$阶Taylor展开（实际为Mauclaurin公式，详情见后文[Taylor公式](#25-taylor公式)）
$$
f(x)=\sum_{k=0}^n\frac{f^{(n)}(0)}{n!}x^n+o(x^n)
$$
求解极限，其中 $o(x^n)$ 为$x^n$ 的高阶无穷小，并规定记 $f^{(0)}(x)=f(x)$

例： 求极限$\lim_{x\to\infty}[x-x^2\ln(1+\frac{1}{x})]$，

原式 $=\lim_{x\to\infty}\dfrac{\frac{1}{x}-\ln(1+\frac{1}{x})}{(\frac{1}{x})^2}$，

令 $t=\frac{1}{x}$，得 原式 $=\lim_{t\to0}\dfrac{t-\ln(1+t)}{t^2}$， 

将 $f(x)=\ln(1+x)$ 的2阶Taylor展开
$$
\ln(1+x)=x-\frac{x^2}{2}+o(x^2)
$$
代入得 原式 $=\lim_{t\to0}\dfrac{t-(t-\frac{t^2}{2}+o(t^2))}{t^2}$ 

$\hspace{5em}=\lim_{t\to0}\dfrac{\frac{t^2}{2}-o(t^2)}{t^2}=\dfrac{1}{2}$

注：根据高阶无穷小的定义，$\lim_{t\to0}\dfrac{o(t^2)}{t^2}=0$

## 1.3 无穷小的比较

注意高阶/低阶/同阶/$k$阶/等价无穷小的概念，利用极限判断关系。此部分内容简单，故此处不作赘述

## 1.4 连续与间断

### 连续性

内点：$\lim_{x\to x_0}f(x)=f(x_0)$

端点：左/右连续

### 间断点类型

**第一类间断点（跳跃/可去间断点）**

跳跃间断点：左右极限存在但$\lim_{x\to x_0^-}f(x)\not=\lim_{x\to x_0^+}f(x)$

可去间断点：左右极限相等，但至少一个与$f(x_0)$不相等（或$f$在$x_0$处无定义）

**第二类间断点（无穷/震荡间断点）**

无穷间断点：左右极限中有一个或两个因函数趋于无穷而不存在，即$\lim_{x\to x_0^-}f(x)=\infty$或$\lim_{x\to x_0^+}f(x)=\infty$或$\lim_{x\to x_0}f(x)=\infty$

震荡间断点：左右极限中有一个或两个因函数值剧烈震荡而不存在，例如函数$y=\sin\frac{1}{x}$存在震荡间断点$x=0$

## 1.5 闭区间连续函数性质

### 有界性和最值定理

有界性定理：连续函数在闭区间上必有界

最值定理：若$y=f(x)$在$[a,b]$上连续，则$\exist\xi,\eta\in[a,b]$使$\forall x\in[a,b]$ ，有$f(\xi)\leq f(x)\leq f(\eta)$

### 零点定理和介值定理

介值定理：若$y=f(x)$在$[a,b]$上连续,$m,M$分别为$f(x)$在$[a,b]$上的最小值、最大值，则$\forall c\in[m,M]$，$\exist\xi\in[a,b]$使$f(\xi)=c$

零点定理即介值定理取 $c=0$ 时的特殊

## 1.6 数列极限

### 数列极限的性质

唯一性、有界性、保序性（$\to$保号性）、夹逼性

单调有界原则：单调有界数列必收敛

子数列收敛原理：若数列$\{x_n\}$收敛于$a$，则他的任意子数列$\{x_{n_k}\}$也收敛于$a$ （证明通过证逆否命题）

应当注意，子数列收敛原理的逆命题不一定成立

### Heine定理/函数极限的Heine定义

$\displaystyle\lim_{x\to x_0}=A$ $\Leftrightarrow$ 对于任意$\{x_n\}$，若满足$\displaystyle\lim_{n\to\infty}x_n=x_0且x_n\not=x_0$，都有$\displaystyle\lim_{n\to\infty}f(x_n)=A$

利用数列极限可以给出函数极限的第二定义（即Heine定义），此部分内容稍作了解即可

# 2 导数与微分

## 2.1 导数与微分的概念

导数：导数的定义在 [1.2计算极限-导数/定积分的定义](#导数定积分的定义) 中已给出，即 
$$
f'(x)=\frac{d}{dx}f(x)=\lim_{\Delta x\to0}\frac{f(x+\Delta x)-f(x)}{\Delta x}
$$
可将导数理解为函数的变化率

微分：微分的定义较为抽象，不便于理解，一般利用导数求解，<br>
即
$$
dy=y'dx
$$
或
$$
dy|_{x=x_0}=f'(x_0)dx
$$
可将微分理解为极小范围内函数的增量

**注意：计算函数在某处的微分时不要漏写**$dx$

## 2.2 导数/微分的性质与几何意义

### 连续与可导

可导 $\Rightarrow$ 连续，反过来不一定成立<br>
判断函数在某一点处是否可导，应计算该点处左导数与右导数是否相等<br>
即
$$
\lim_{h\to0^-}\frac{f(x_0+h)-f(x_0)}{h}=\lim_{h\to0^+}\frac{f(x_0+h)-f(x_0)}{h}=A\hspace{1em}\Leftrightarrow\hspace{1em}f'(x_0)=A
$$

此知识点常考类型为：讨论分段函数在分界点处的可导性

### 导数的几何意义

函数$f(x)$在$x_0$处的导数在几何上表示$y=f(x)$在$x=x_0$处切线的斜率

切线方程：$y-f(x_0)=f'(x_0)\cdot(x-x_0)$

法线方程：$y-f(x_0)=\frac{-1}{f'(x_0)}(x-x_0)$

### 微分的应用（近似计算）

函数 $y=f(x)$ 在 $x_0$ 处可微，则
$$
\Delta y=f(x_0+\Delta x)-f(x_0)=f'(x_0)\cdot\Delta x+o(\Delta x)
$$
当 $|\Delta x|$ 足够小时，忽略 $o(\Delta x)$ 得到近似计算公式：
$$
f(x_0+\Delta x)\approx f(x_0)+f'(x_0)\cdot\Delta x
$$

## 2.3 导数的计算

### 导数表

此处仅列举一些高中未涉及或涉及较少的，需要额外复习的导数

| | |
|:--:|:--:|
|$(a^x)'=a^x\ln x$|$(log_ax)'=\frac{1}{x\ln a}$|
|$(\tan x)'=\sec^2x$|$(\cot x)'=-\csc^2x$|
|$(\sec x)'=\tan x\sec x$|$(\csc x)'=-\cot x\csc x$|
|$(\arcsin x)'=\dfrac{1}{\sqrt{1-x^2}}$|$(\arccos x)'=-\dfrac{1}{\sqrt{1-x^2}}$|
|$(\arctan x)'=\dfrac{1}{1+x^2}$|$(\text{arccot } x)'=-\dfrac{1}{1+x^2}$|

值得注意的时，$\tan x$/$\sec x$/$\arcsin x$/$\arctan x$这组函数的导数与$\cot x$/$\csc x$/$\arccos x$/$\text{arccot }x$这组的类似，可联系记忆

### 导数的四则运算与链式法则

和差法则：
$$
(u+v)'=u'+v'
$$

积法则：
$$
(uv)'=u'v+uv'
$$

商法则：
$$
(\frac{u}{v})'=\frac{u'v-uv'}{v^2},\hspace{1em}v(x)\not =0
$$

链式法则：
$$
\frac{dy}{dx}=\frac{dy}{du}\cdot\frac{du}{dx}
$$

对形如 $u^v$ 底数与指数均含有$x$的表达式求导时，可先换底为 $e^{v\ln u}$ 再利用链式法则求导（此处$u$与$v$均为有关$x$的函数）

### 反函数求导

设$g(x)$为$f(x)$的反函数，即$y=f(x)\Leftrightarrow g(y)=x$，<br>
则有
$$
g'(x)=\frac{1}{f'(x)}
$$
或
$$
\frac{dx}{dy}=\frac{1}{\frac{dy}{dx}}
$$

### 隐函数求导

利用[导数的四则运算与链式法则](#导数的四则运算与链式法则)对函数方程两边同时对$x$求导后，将$\frac{dy}{dx}$视为变量，$x$与$y$视为常量，解出$\frac{dy}{dx}$有关$x$与$y$的表达式

若计算二阶导数，则求出一阶导数$\frac{dy}{dx}$后，将函数方程两边同时对$x$求两次导数后，将$\frac{dy}{dx}$代入方程后，将$\frac{d^2y}{dx^2}$视为变量，$x$与$y$视为常量，解出$\frac{d^2y}{dx^2}$有关$x$与$y$的表达式

例： 求方程$e^x-e^y=xy$所确定的隐函数$y=f(x)$的导数与二阶导数，

等式两边对$x$求导得，$e^x-e^y\dfrac{dy}{dx}=y+x\dfrac{dy}{dx}\cdots(\text{I})$，

变形求解得，$\dfrac{dy}{dx}=\dfrac{e^x-y}{x+e^y}\cdots(\text{II})$，

等式$(\text{I})$两边对$x$求导得，$e^x-e^y(\dfrac{dy}{dx})^2-e^y\dfrac{d^2y}{dx^2}=\dfrac{dy}{dx}+\dfrac{dy}{dx}+x\dfrac{d^2y}{dx^2}$，

将$(\text{II})$代入上式得，$e^x-e^y(\dfrac{e^x-y}{x+e^y})^2-e^y\dfrac{d^2y}{dx^2}=2\cdot\dfrac{e^x-y}{x+e^y}+x\dfrac{d^2y}{dx^2}$，

变形求解得，$\dfrac{d^2y}{dx^2}=\dfrac{e^x(x+e^y)^2-e^y(e^x-y)^2-2(e^x-y)(x+e^y)}{(x+e^y)^3}$

注：若题目要求求解函数在某处的二阶导数值，而对二阶导函数表达式不作要求，则可以在将$\frac{dy}{dx}$代入方程前先计算此处的$\frac{dy}{dx}$，将$\frac{dy}{dx}|_{x=x_0}$以数值形式代入方程再求解$\frac{d^2y}{dx^2}|_{x=x_0}$

### 参数方程求导

对于由参数方程
$$
\begin{cases}
x=\phi(t) \\
y=\psi(t)
\end{cases}
$$
确定的函数$y=f(x)$，有
$$
\frac{dy}{dx}=\frac{dy}{dt}\bigg/\frac{dx}{dt}=\frac{\phi'(t)}{\psi'(t)}
$$
$$
\frac{d^2y}{dx^2}=\frac{d}{dt}(\frac{dy}{dx})\bigg/\frac{dx}{dt}
$$

例： 求由参数方程
$$
\begin{cases}
x=a(t-\sin t) \\
y=a(1-\cos t)
\end{cases}
$$
确定的函数$y=f(x)$的导数与二阶导数，

计算 $\dfrac{dx}{dt}=a(1-\cos t)$， $\dfrac{dy}{dt}=a\sin t$，

得一阶导数 $\dfrac{dy}{dx}=\dfrac{dy}{dt}\bigg/\dfrac{dx}{dt}=\dfrac{a\sin t}{a(1-\cos t)}=\cot\dfrac{t}{2}$，

计算 $\dfrac{d}{dt}(\dfrac{dy}{dx})=\dfrac{d}{dt}(\cot\dfrac{t}{2})=-\csc^2\dfrac{t}{2}$，

得二阶导数 $\dfrac{d^2y}{dx^2}=\dfrac{d}{dt}(\dfrac{dy}{dx})\bigg/\dfrac{dx}{dt}=\dfrac{-\csc^2\frac{t}{2}}{a(1-\cos t)}=\dfrac{-1}{a(1-\cos t)^2}$

### 高阶导数

$n$阶导数$f^{(n)}(x)=y^{(n)}=\dfrac{d^ny}{dx^n}$

下面列出一些常见函数的高阶导数，但不需要记忆，考试所考的高阶导数一般都可现推
$$
(c^\mu)^{(n)}=\mu(\mu-1)(\mu-2)\cdots(\mu-n+1)x^{\mu-n},\hspace{1em}\mu\in\mathbb{R}
$$
$$
(\sin kx+\phi)^{(n)}=k^n\sin(kx+\phi+\frac{n\pi}{2}),\hspace{1em}k\not=0
$$
$$
(a^x)^{(n)}=a^x(\ln a)^n
$$
其中 $(c^\mu)^{(n)}$ 的系数 $\mu(\mu-1)(\mu-2)\cdots(\mu-n+1)$ 与排列数 $\text{A}_\mu^n$ 形式相同

高阶导数的线性运算法则：

$$
(c_1u+c_2v)^{(n)}=c_1u^{(n)}+c_2v^{(n)}
$$

高阶导数的**莱布尼兹公式**：

$$
(uv)^{(n)}=\sum_{k=0}^n\text{C}_n^ku^{(n-k)}v^{(k)}
$$

此处组合数 $\text{C}_n^k=\frac{n!}{k!(n-k)!}$，并规定记 $f^{(0)}(x)=f(x)$

莱布尼兹公式与二项式定理公式极为相似，可类比记忆

例： 求$y=x^3e^x+\sin2x$的9阶导数，<br>

$y^{(9)}=\sum_{k=0}^9\text{C}_9^k(x^3)^{(k)}(e^x)^{(9-k)}+(\sin2x)^{(9)}$ <br>

$\hspace{2em}=(1x^3+9\cdot3x^2+36\cdot6x+84\cdot6)e^x+2^9\sin(2x+\frac{9\pi}{2})$ <br>

$\hspace{2em}=e^x(x^3+27x^2+216x+504)+512\cos2x$ <br>

（当 $k>3$ 时 $(x^3)^{(k)}=0$，故 $\sum_{k=0}^9\text{C}_9^k(x^3)^{(k)}(e^x)^{(9-k)}仅计算4项即可$）

## 2.4 微分中值定理

### Fermat引理

可导函数极值点 $\Rightarrow$ 驻点，反过来不一定成立

若$x_0$为函数$f$的极值点，且$f$在$x_0$可导，则必有$f'(x_0)=0$

### Rolle定理

若函数$f$在闭区间$[a,b]$连续，在开区间$(a,b)$可导，若$f(a)=f(b)$，则
$$
\exist\xi\in(a,b)\hspace{1em}\text{s.t.}\hspace{1em}f'(\xi)=0
$$

几何意义：两端点等高的连续可导曲线，必存在平行于$x$轴的切线

### Lagrange中值定理

若函数$f$在闭区间$[a,b]$连续，在开区间$(a,b)$可导，则
$$
\exist\xi\in(a,b)\hspace{1em}\text{s.t.}\hspace{1em}f'(\xi)=\frac{f(b)-f(a)}{b-a}
$$

几何意义：在连续可导曲线上，必存在切线平行于两端点连线

Lagrange公式也可写成
$$
f(b)-f(a)=f'(\xi)(b-a)
$$
故其又称**有限增量公式**：<br>
在区间$[x,x+\Delta x]$（或$[x+\Delta x,x]$）上应用可得
$$
f(x+\Delta x)-f(x)=f'(x+\theta\Delta x)\cdot\Delta x,\hspace{1em}\theta\in(0,1)
$$

**推论1** 若函数$f$在区间$I$上的导数恒为0，则$f$在$I$上恒为常数

**推论2** 若在区间$I$上恒有$f'(x)=g'(x)$，则
$$
f(x)=g(x)+C
$$
其中$C$为某一常数

Lagrange中值定理常用来证明与导数有关的不等式，证明重点在于**构造函数**

例： 证明当$x>0$时，
$$
\frac{x}{1+x}<\ln(1+x)<x
$$
注意到 $\dfrac{x}{1+x}=(\ln(1+x))'(x-0)$，

令 $f(t)=\ln(1+t)$，当 $x>0$ 时在 $[0,x]$ 应用Lagrange中值定理得
$$
f(x)-f(0)=f'(\xi)(x-0),\hspace{1em}0<\xi<x
$$
即
$$
\ln(1+x)=\frac{x}{1-\xi}
$$
因为 $0<\xi<x$，所以
$$
\frac{x}{1+x}<\frac{x}{1-\xi}<x
$$
即
$$
\frac{x}{1+x}<\ln(1+x)<x
$$

### Cauchy中值定理

若函数$f$与$g$在闭区间$[a,b]$连续，在开区间$(a,b)$可导，且$g'(x)\not=0$，则
$$
\exist\xi\in(a,b)\hspace{1em}\text{s.t.}\hspace{1em}\frac{f'(\xi)}{g'(\xi)}=\frac{f(b)-f(a)}{g(b)-g(a)}
$$

将$f$与$g$视为曲线$y=\phi(x)$的参数方程即
$$
\begin{cases}
x=f(t) \\
y=g(t)
\end{cases}
$$
则几何意义：在由参数方程确定的连续可导曲线上，必存在切线平行于两端点连线<br>
因此，Cauchy中值定理也可视为Lagrange中值定理在参数方程下的表达

### 微分中值定理总结

微分中值定理题目的重点与难点，在于如何构造函数应用定理，此部分往往只能通过练习加深自身理解

此部分公式不需要额外记忆，记住各定理的几何意义往往就能顺利地记住公式。另，Cauchy中值定理取$g(x)=x$的特殊，即可得到Lagrange中值定理；Lagrange中值定理取$a=b$的特殊，即可得到Rolle定理

## 2.5 Taylor公式

Taylor中值定理： 如果函数 $f(x)$ 在 $(a,b)$ 内 $n+1$ 阶可导，且 $x_0\in(a,b)$，则 $\forall x\in(a,b)$，有
$$
f(x)=\sum_{k=0}^n\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n+\frac{f^{(n+1)}(\xi)}{(n+1)!}(x-x_0)^{n+1}
$$
其中 $\xi$ 为介于 $x$ 与 $x_0$ 之间的某个值（ $x$ 与 $x_0$ 的大小关系不确定）

上述公式称为函数 $f(x)$ 在点 $x_0$ 处的 $n$ **阶Taylor公式** $f(x)=P_n(x)+R_n(x)$，其中
$$
P_n(x)=\sum_{k=0}^n\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n
$$
称为函数 $f(x)$ 在点 $x_0$ 处的 $n$ **次Taylor多项式**，
$$
R_n(x)=\frac{f^{(n+1)}(\xi)}{(n+1)!}(x-x_0)^{n+1},\hspace{1em}\xi在x与x_0之间
$$
称为**Lagrange余项**

Taylor中值定理可用Lagrange中值定理进行证明（但非数学类专业同学一般不要求掌握此证明），而取 $n=0$ 的Taylor公式就是Lagrange中值定理公式

不需要知道余项精确数值时可将Lagrange余项换为**Peano余项**：
$$
R_n(x)=o((x-x_0)^n)
$$

令 $x_0=0$，则有 $\xi$ 介于 $0$ 与 $x$ 之间，可令 $\xi=\theta x\hspace{0.5em}(\theta\in(0,1))$，得到带Lagrange余项的**Maclaurin公式**：
$$
f(x)=\sum_{k=0}^n\frac{f^{(n)}(0)}{n!}x^n+\frac{f^{(n+1)}(\theta x)}{(n+1)!}x^{n+1}
$$
以及带Peano余项的Maclaurin公式（**最常用**）:
$$
f(x)=\sum_{k=0}^n\frac{f^{(n)}(0)}{n!}x^n+o(x^n)
$$
下面给出一些常用的带Peano余项的Maclaurin公式
$$
e^x=\sum_{k=0}^n\frac{1}{n!}x^n+o(x^n)=1+x+\frac{1}{2}x^2+\cdots+\frac{1}{n!}x^n+o(x^n)
$$
$$
\sin x=\sum_{k=0}^n\frac{(-1)^n}{(2n+1)!}x^{2n+1}+o(x^{2n+1})=x-\frac{x^3}{3!}+\frac{x^5}{5!}-\cdots+\frac{(-1)^n}{(2n+1)!}x^{2n+1}+o(x^{2n+1})
$$
$$
\cos x=\sum_{k=0}^n\frac{(-1)^n}{(2n)!}x^{2n}+o(x^{2n})=1-\frac{x^2}{2!}+\frac{x^4}{4!}-\cdots+\frac{(-1)^n}{(2n)!}x^{2n}+o(x^{2n})
$$
$$
\ln(1+x)=\sum_{k=0}^n\frac{(-1)^{n-1}}{n}x^n+o(x^n)=x-\frac{x^2}{2}+\frac{x^3}{3}-\cdots+\frac{(-1)^{n-1}}{n}x^n+o(x^n)
$$
$$
(1+x)^\alpha=1+\alpha x+\frac{\alpha(\alpha-1)}{2!}x^2+\cdots+\frac{\alpha(\alpha-1)\cdots(\alpha-n+1)}{n!}x^n+o(x^n),\hspace{1em}\alpha\in\mathbb{R}
$$
其中大部分都可以现用现推，若确需记忆，可背 $\sin x$ 而不背 $\cos x$，利用 $(\sin x)'=\cos x$记忆$\cos x$的公式。另，$(1+x)^\alpha$ 的通项系数 $\frac{\alpha(\alpha-1)\cdots(\alpha-n+1)}{n!}$与组合数 $\text{C}_\alpha^n$具有相同的形式

Taylor公式的应用：近似计算、计算极限（详见前文 [1.2计算极限-Taylor展开](#taylor展开)）

## 2.6 单调性与凹凸性

### 单调性

单调递增（递减） $\Leftrightarrow$ $f'(x)\geq0$（$\leq0$） **且 $f'(x)$ 在 $(a,b)$ 任一部分区间内不恒等于0**

单调性的应用：证明不等式、证明根的唯一性

### 凹凸性

定义：若函数 $f(x)$ 在 $(a,b)$ 内的切线总位于曲线的下（上）方，则称曲线 $y=f(x)$ 在 $[a,b]$ 上是凹（凸）的

凹（凸） $\Leftrightarrow$ 在 $(a,b)$ 内 $f''(x)\geq0$（$\leq0$）

凹与凸的分界点称为**拐点**，注意，拐点与极值点 $x=x_0$ 不同，**拐点是二维点** $(x,y)$

## 2.7 极值与最值

### 极值点

**第一充要条件** 若函数 $y=f(x)$ 在点 $x_0$ 处连续，且在某去心邻域 $\mathring{U}(x_0,\delta)$ 内可导，则有<br>
(1) 若 $x\in(x_0-\delta,x)$ 时 $f'(x)>0$，$x\in(x_0,x+\delta)$ 时 $f'(x)<0$，则 $x_0$ 为极大值点；<br>
(2) 若 $x\in(x_0-\delta,x)$ 时 $f'(x)<0$，$x\in(x_0,x+\delta)$ 时 $f'(x)>0$，则 $x_0$ 为极小值点

**第二充要条件** 若函数 $y=f(x)$ 在点 $x_0$ 处二阶可导，且 $f'(x_0)=0$，$f''(x_0)\not=0$，则有<br>
(1) 若 $f''(x_0)<0$，则$x_0$ 为极大值点；<br>
(1) 若 $f''(x_0)>0$，则$x_0$ 为极小值点

第一充要条件的优势是，可以在 $x_0$ 处不可导的情况下判断 $x_0$ 是否为极值点，而第二充要条件必须在 $x_0$ 处二阶可导的情况下才能判断

### 最值

对于连续函数，**最值只会出现在极值点或端点，而极值点只会出现在驻点或导数不存在的点中**，因此，求连续函数区间内最值的一般步骤：<br>
(1) 找出区间内所有驻点、导数不存在的点<br>
(2) 计算区间内所有驻点、导数不存在的点处的函数值，以及端点处的函数值<br>
(3) 比较步骤(2)中得到的所有函数值，其中最大的即为函数在区间内的最大值，最小的为最小值，相应的点为最大值点（最小值点）

## 2.8 曲率

### 弧微分
$$
ds=\sqrt{(dx)^2+(dy)^2}=\sqrt{1+(\frac{dy}{dx})^2}dx
$$
参数方程的弧微分
$$
ds=\sqrt{(dx)^2+(dy)^2}=\sqrt{(\frac{dx}{dt})^2+(\frac{dy}{dt})^2}dt
$$
极坐标方程 $\rho=\rho(\theta)$ 的弧微分
$$
ds=\sqrt{\rho^2+(\frac{d\rho}{d\theta})^2}d\theta
$$

### 曲率公式
$$
K=\frac{|y''|}{(1+(y')^2)^\frac{3}{2}}
$$
参数方程及极坐标方程下的曲率公式较为复杂，此处不作给出，建议先求参数方程及极坐标方程的导数 $y'$ 与 $y''$，再代入此曲率公式计算

**曲率半径公式**
$$
R=\frac{1}{K}
$$
求「曲率半径最大/小」问题时，可化为求「曲率最小/大」进行计算，往往更为方便快捷

# 3 不定积分

## 3.1 不定积分的概念与性质

简而言之，求函数 $f(x)$ 的不定积分就是求函数 $f(x)$ 的原函数 $F(x)$，两者满足关系
$$
F'(x)=f(x)
$$
原函数存在定理： **连续函数必存在原函数**

原函数之间的关系：若 $F(x)$ 与 $G(x)$ 都是 $f(x)$ 的原函数，则 $F(x)$ 与 $G(x)$ 只相差一个常数项，即
$$
F(x)=G(x)+C,\hspace{1em}C为常数
$$
因此，若 $F(x)$ 为 $f(x)$ 的一个原函数，则 $f(x)$ 的全体原函数可表示为 $F(x)+C$，即
$$
\int f(x)dx=F(x)+C
$$
其中 $C$ 为常数，称为积分常数，**注意作答不定积分题目时不要漏写积分常量** $C$

不定积分的线性运算法则
$$
\int[c_1f(x)+c_2g(x)]dx=c_1\int f(x)dx+c_2\int g(x)dx
$$

基础积分表即基础导数表的倒写，此处不再给出

## 3.2 不定积分的计算

### 常用函数不定积分

此处给出常用函数的不定积分（证明方法见后文介绍），建议熟练记忆<br>（此表中为简洁省略了积分常量 $+C$ 部分）
|  |  |
|:--:|:--:|
|$\displaystyle\int\tan xdx=\ln\|\sec x\|$|$\displaystyle\int\cot xdx=-\ln\|\csc x\|$|
|$\displaystyle\int\sec xdx=\ln\|\sec x+\tan x\|$|$\displaystyle\int\csc xdx=\ln\|\csc x-\cot x\|$|
|$\displaystyle\int\frac{dx}{\sqrt{a^2-x^2}}=\arcsin\frac{x}{a}$|$\displaystyle\int\frac{dx}{a^2+x^2}=\frac{1}{a}\arctan\frac{x}{a}$|
|$\displaystyle\int\frac{dx}{\sqrt{x^2-a^2}}=\ln\|x+\sqrt{x^2-a^2}\|$|$\displaystyle\int\frac{dx}{\sqrt{x^2+a^2}}=\ln(x+\sqrt{x^2+a^2})$|
|$\displaystyle\int\frac{dx}{x^2-a^2}=\frac{1}{2a}\ln\bigg\|\frac{x-a}{x+a}\bigg\|$|$\displaystyle\int\frac{dx}{a^2-x^2}=\frac{1}{2a}\ln\bigg\|\frac{x+a}{x-a}\bigg\|$|

表格中同一行左右部分存在联系，可进行联系记忆

### 凑微法（第一类换元积分法）（优先考虑）

设 $\int f(x)dx=F(x)+C$，有
$$
\int f(u(x))u'(x)dx=\int f(u(x))d(u(x))=F(u(x))+C
$$

运用凑微法要求观察被积函数，从中找出某部分恰为另一部分的导数，进行凑微<br>
例如在计算 $\int x\sqrt{1-x^2}dx$ 时易注意到 $x$ 是根号内的 $x^2$ 的导数，因此可以用 $xdx=-\dfrac{1}{2}d(1-x^2)$ 凑微，得到原式 $=-\dfrac{1}{2}\int\sqrt{1-x^2}d(1-x^2)=-\dfrac{1}{2}\cdot\dfrac{2}{3}(1-x^2)^{\frac{3}{2}}+C=-\dfrac{1}{3}(1-x^2)^{\frac{3}{2}}+C$

例： $\displaystyle\int\tan xdx=\int\dfrac{\sin x}{\cos x}dx=\int\dfrac{d(\cos x)}{\cos x}=-\ln|\cos x|+C$

例： $\displaystyle\int\sec xdx=\int\dfrac{\cos x}{\cos^2x}dx=\int\frac{d(\sin x)}{1-\sin^2x}$

$=\displaystyle\frac{1}{2}\int\frac{d(\sin x)}{1+\sin x}+\frac{1}{2}\int\frac{d(\sin x)}{1-\sin x}$

$=\displaystyle\frac{1}{2}\ln|1+\sin x|-\frac{1}{2}\ln|1-\sin x|+C$

$=\displaystyle\frac{1}{2}\ln\Bigg|\frac{1+\sin x}{1-\sin x}\Bigg|+C=\displaystyle\ln|\sec x+\tan x|+C$

例： $\displaystyle\int\frac{dx}{\sqrt{a^2-x^2}}=\frac{1}{a}\int\frac{dx}{\sqrt{1-(\frac{x}{a})^2}}=\int\frac{d(\frac{x}{a})}{\sqrt{1-(\frac{x}{a})^2}}=\arcsin\frac{x}{a}+C$

计算带正/余弦函数奇数次方形如 $\sin^{2k+1}x\cos^{n}x$（或 $\sin^{n}x\cos^{2k+1}x$）的被积函数时先拿 $\sin x$（或 $\cos x$）凑微得到 $-d(\cos x)$ （或 $d(\sin x)$），再利用 $\sin^2x+\cos^2x=1$ 将式子中的**全部化为同名三角函数**

计算带正/余弦函数偶数次方形如 $\sin^{2k}x\cos^{2n}x$ 的被积函数时**先降次**，利用 $\displaystyle\sin^2x=\frac{1-\cos2x}{2}$ 与 $\displaystyle\cos^2x=\frac{1+\cos2x}{2}$**化为低次式后再进行计算**

例： $\displaystyle\int\sin^3xdx=-\int\sin^2xd(\cos x)$

$=\displaystyle-\int(1-\cos^2x)d(\cos x)=-\cos x+\frac{1}{3}\cos^3x+C$

例： $\displaystyle\int\cos^2xdx=\int\frac{1+\cos2x}{2}dx=\frac{x}{2}+\frac{\sin2x}{4}+C$

计算带正切/割函数的幂的被积函数时，**应活用 $\sec^2x=d(\tan x)$ 与 $\tan x\sec x=d(\sec x)$ 完成凑微**：若 $\sec x$ 的指数为偶数，则用 $\sec^2x$ 凑微；若 $\tan x$ 的指数为奇数，则用 $\tan x\sec x$ 凑微，再**利用 $\tan^2x+1=\sec^2x$ 完成三角函数同名化**（余切/割函数的思路与之相同，不再赘述）

例： $\displaystyle\int\sec^4xdx=\int\sec^2xd(\tan x)=\int(\tan^2x+1)d(\tan x)=\frac{\tan^3x}{3}+\tan x+C$

### 显式换元（第二类换元积分法）

当被积函数中某一部分较为复杂，则可以将此部分换元再进行计算

设 $y=f(x)$，$x=\phi(t)$ 及 $\frac{dx}{dt}=\phi'(t)$ 均连续，对应有 $\psi(x)=t$ 且 $\phi'(t)\not=0$，$f(\phi(t))\phi'(t)$ 的一个原函数为 $F(t)$，则有
$$
\int f(x)dx=\int f(\phi(t))\cdot\phi'(t)dt=F(t)+C=F(\psi(x))+C
$$

基本步骤：被积函数代换、微分代换 $\rightarrow$ 计算积分 $\rightarrow$ **还原为** $x$ **的表达式**

显式换元主要有三类：三角代换、倒代换、根式代换

#### 三角代换

被积函数含有形如 $\sqrt{Ax^2+B}$ 的式子时常用到三角换元，利用三角函数之间的关系化简完成计算（换元时**注意变量的定义范围**）
$$
\sqrt{a^2-x^2}\enspace\rightarrow\enspace x=a\sin t,\enspace\sqrt{a^2-x^2}=a\cos t
$$
$$
\sqrt{x^2-a^2}\enspace\rightarrow\enspace x=a\sec t,\enspace\sqrt{a^2-x^2}=a\tan t
$$
$$
\sqrt{x^2+a^2}\enspace\rightarrow\enspace x=a\tan t,\enspace\sqrt{a^2-x^2}=a\sec t
$$
例： 求 $\displaystyle\int\frac{dx}{\sqrt{x^2-a^2}}$， （$a>0$）

令 $x=a\sec t$ （$t\in(0,\dfrac{\pi}{2})$），则有 $\sqrt{a^2-x^2}=a\tan t$，$dx=a\tan t\sec tdt$，

代入得 原式 $=\displaystyle\int\frac{a\tan t\sec tdt}{a\tan t}=\int\sec tdt$

$=\displaystyle\ln|\sec t+\tan t|+C$

$=\displaystyle\ln(\frac{x}{a}+\frac{\sqrt{a^2-x^2}}{a})+C$

$=\displaystyle\ln(x+\sqrt{a^2-x^2})+C$

#### 倒代换

分式中分母次数较大时常用倒代换 $t=x^{-1}$ **降低分母的次数**，将真分式（分母次数较高）**转换为假分式**（分子次数较高），再利用裂项等手段完成计算（此部分内容详见后文[有理分式的不定积分]()）

例： 求 $\displaystyle\int\frac{x^2}{(x-1)^{100}}dx$，

令 $t=(x-1)^{-1}$，则有 $x=t^{-1}+1$，$dx=-t^{-2}dt$，

代入得 原式 $=\displaystyle\int(t^{-1}+1)^2t^{100}(-t^{-2})dt=-\int(t^{96}+2t^{97}+t^{98})dt$

$=\displaystyle-\frac{t^{97}}{97}-\frac{t^{98}}{49}-\frac{t^{99}}{99}+C$

$=\displaystyle-\frac{1}{97(x-1)^{97}}-\frac{1}{49(x-1)^{98}}-\frac{1}{99(x-1)^{99}}+C$

#### 根式代换

被积函数为含有形如 $\sqrt{Ax+B}$ 的式子时常用根式换元将函数转为有理函数，化简后再结合其他计算方法完成计算（例子见[分部积分法](#分部积分法)）

#### 总结

显示换元法适用场景较多，有时同一场景下也有多种选择，此时应尽量尝试选择较为简单的方法进行计算

例： 计算 $I=\displaystyle\int\frac{dx}{x\sqrt{x^2-a^2}}$，

(思路1) 观察到 $\sqrt{x^2-a^2}$ 的结构，使用三角代换 $x=a\sec t$计算

(思路2) 观察到分母的次数（$2$）比分子的（$0$）大，使用倒代换 $t=x^{-1}$ 计算

(思路3) 注意到将根式提一个 $x$ 出来后根式内含有 $\dfrac{1}{x}$ 结构，根式外有 $\dfrac{1}{x^2}$ 结构，进行凑微（**无论何时都优先考虑凑微法**），$I=\displaystyle\int\frac{dx}{x^2\sqrt{1-(\frac{a}{x})^2}}=\int\frac{d(\frac{1}{x})}{\sqrt{1-(\frac{a}{x})^2}}=-\frac{1}{a}\arcsin\frac{a}{x}+C$

### 分部积分法

**分部积分公式**：设函数 $u=u(x)$ 与 $v=v(x)$ 的导函数均连续，则有
$$
\int udv=uv-\int vdu
$$
或
$$
\int uv'dx=uv-\int u'vdx
$$

运用分部积分法时一般被积函数能被**拆分为两个函数的乘积**，即 $u\cdot v'$ 的形式。而分部积分的重点在于选取合适的式子作为 $v'$ 与 $dx$ 结合成 $dv$，一般可以参考「**反对谜之伞**」（反三角函数、对数函数、幂函数、指数函数、三角函数）的顺序，此中**越靠后的函数越先考虑**作为 $v'$ 与 $dx$ 结合成 $dv$

有时被积函数 $f(x)$ 没有明显的乘积结构，可以考虑拆出1因子，拆分为 $1\cdot f(x)$ 进行分部积分

例： $\displaystyle\int\arctan\sqrt{x}dx=x\cdot\arctan\sqrt{x}-\int x\cdot\frac{1}{1+x}\frac{1}{2\sqrt{x}}dx$

$=\displaystyle x\arctan x-\int(1-\frac{1}{1+x})d(\sqrt{x})$

$=\displaystyle(x+1)\arctan\sqrt{x}-\sqrt{x}+C$

有时多次运用分部积分法后就可以用常用函数积分公式得出结果，而有时式子仍较复杂，此时考虑分部积分的**回归法**或**递推法**，即通过多次分部积分得到**与原式相同或相似**的部分，通过解方程或数列递推得到最终结果

例： 求 $I=\displaystyle\int e^x\sin xdx$

$=e^x(-\cos x)-\displaystyle\int e^x(-\cos x)dx$

$=\displaystyle-e^x\cos x+e^x\sin x-\int e^x\sin xdx=-e^x\cos x+e^x\sin x-I$

$\displaystyle\Rightarrow\enspace I=\frac{1}{2}e^x(\sin x-\cos x)+C$

例： 求 $I_n=\displaystyle\int x(\ln x)^ndx$。

$I_n=\displaystyle\frac{x^2}{2}(\ln x)^n-\int\frac{x^2}{2}\frac{n(\ln x)^{n-1}}{x}dx$

$\displaystyle\hspace{1.25em}=\frac{x^2(\ln x)^n}{2}-\frac{n}{2}I_{n-1}$，

$I_0=\displaystyle\int xdx=\frac{x^2}{2}+C$

$\displaystyle\Rightarrow\enspace I_n=\sum_{k=0}^n(-\frac{n}{2})^{n-k}\cdot\frac{x^2(\ln x)^k}{2}+C$

再如，给定函数 $f(x)$，要求求解形如 $\displaystyle\int g(x)\cdot f'(x)dx$ 的不定积分时，也常用分部积分法

### 有理函数的不定积分

#### 有理分式

对于假分式或部分真分式，常将其**裂项**：即先将分母**分解因式**，再用**待定系数法**将分式拆分成多个低次真有理分式之和进行积分，例如
$$
\int\frac{2x-1}{x^2-5x+6}dx=\int\bigg(\frac{5}{x-3}-\frac{3}{x-2}\bigg)dx=5\ln|x-3|-3\ln|x-2|+C
$$
$$
\int\frac{dx}{x(x-1)^2}=\int\bigg(\frac{1}{x}-\frac{1}{x-1}+\frac{1}{(x-1)^2}\bigg)dx=\ln\bigg|\frac{x}{x-1}\bigg|-\frac{1}{x-1}+C
$$
裂项后得到的常见结果如下：

1. 形如 $\displaystyle\frac{1}{Ax+B}$ 的结构可直接凑微积分 
  $$\displaystyle\int\frac{dx}{Ax+B}=\frac{1}{A}\frac{d(Ax+B)}{Ax+B}=\frac{1}{A}\ln|Ax+B|+C$$
2. 形如 $\displaystyle\frac{1}{Ax^2+Bx+Q}$ 的结构，
   
   若 $\Delta\geq0$ 可继续裂项为 $\displaystyle\frac{\lambda}{x-x_1}+\frac{\mu}{x-x_2}$ 计算积分；

   若 $\Delta<0$ 可以将分母配方为 $A[(x+\lambda)^2+a^2]$ 的结构，利用 $\displaystyle\int\frac{dx}{a^2+x^2}=\frac{1}{a}\arctan\frac{x}{a}+C$ 凑微积分
  $$\int\frac{dx}{Ax^2+Bx+Q}=\frac{1}{A}\int\frac{dx}{(x+\lambda)^2+a^2}=\frac{1}{A}\cdot\frac{1}{a}\arctan\frac{x+\lambda}{a}+C$$

3. 形如 $\displaystyle\frac{\lambda x+\mu}{Ax^2+Bx+Q}$ 的结构（$\Delta<0$），可以将分子的一次项拆出 $k(2Ax+B)$ 凑微，剩下分子常数项按情况2.的方法处理
  $$\displaystyle\int\frac{k(2Ax+B)}{A^2+Bx+Q}dx=k\int\frac{d(Ax^2+Bx+Q)}{Ax^2+Bx+Q}=k\ln(Ax^2+Bx+Q)+C$$ 
  $$\displaystyle\int\frac{\lambda x+\mu}{Ax^2+Bx+Q}dx=\int\bigg(k\cdot\frac{2Ax+B}{A^2+Bx+Q}+\frac{p}{Ax^2+Bx+Q}\bigg)dx$$

例： 求 $I=\displaystyle\int\frac{x^2+2x-1}{x^3-2x^2+2x-1}dx$

对分母分解因式得 $(x-1)(x^2-x+1)$，待定系数
$$
\displaystyle\frac{A}{x-1}+\frac{Bx+C}{x^2-x+1}=\frac{x^2+2x-1}{x^3-2x^2+2x-1}
$$
解得 $A=2,B=-1,C=3$

$I=\displaystyle\int\bigg(\frac{2}{x-1}-\frac{x-3}{x^2-x+1}\bigg)dx=\displaystyle2\ln|x-1|-\int\frac{\frac{1}{2}(2x-1)-\frac{5}{2}}{x^2-x+1}dx$

$=\displaystyle2\ln|x-1|-\frac{1}{2}\int\frac{d(x^2-x+1)}{x^2-x+1}+\frac{5}{2}\int\frac{dx}{(x-\frac{1}{2})^2+\frac{3}{4}}$

$=\displaystyle2\ln|x-1|-\frac{1}{2}\ln(x^2-x+1)+\frac{5}{2}\cdot\frac{2}{\sqrt3}\arctan\frac{x-\frac{1}{2}}{\frac{\sqrt3}{2}}+C$

$=\displaystyle2\ln|x-1|-\ln\sqrt{x^2-x+1}+\frac{5}{\sqrt3}\arctan\frac{2x-1}{\sqrt3}+C$

当分母次数远高于分子时，可考虑使用**倒代换** $t=(x+a)^{-1}$ **降低分母次数**，按照上述假分式积分方法计算，也可以尝试**考虑凑微**

例： 求 $I=\displaystyle\int\frac{1}{x^4(x^2+1)}dx$

令 $t=x^{-1}$，代入整理得

$I=\displaystyle-\int\frac{t^4}{t^2+1}dt=-\int\bigg(t^2-1+\frac{1}{t^2+1}\bigg)dt=-\frac{1}{3}t^3+t-\arctan t+C$

$=\displaystyle-\frac{1}{3x^3}+\frac{1}{x}-\arctan\frac{1}{x}+C$

例： $\displaystyle\int\frac{dx}{x(x^{10}-2)}=\int\frac{dx}{x^{11}(1-2x^{-10})}=-\frac{1}{10}\int\frac{d(x^{-10})}{1-2x^{-10}}=\frac{1}{20}\ln\bigg|1-2x^{-10}\bigg|+C$

#### 无理分式

使用**根式代换**，将无理分式**转换为有理分式**

例：

计算 $\displaystyle\int\frac{dx}{(x+1)\sqrt{x+2}}$，可令 $t=\sqrt{x+2}$ 代入

计算 $\displaystyle\int\frac{1}{x}\sqrt{\frac{x+1}{x}}dx$，可令 $t=\displaystyle\sqrt{\frac{x+1}{x}}$ 代入

计算 $\displaystyle\int\frac{dx}{\sqrt{e^x+1}}$，可令 $t=\sqrt{e^x+1}$ 代入

代整理后可得到有理分式，计算方法与[有理分式](#有理分式)部分内容完全相同，此处不再赘述

#### 三角分式

利用**万能公式**，将三角分式**转换为有理分式**

令 $\displaystyle t=\tan\frac{x}{2}$，此时 $\displaystyle dx=\frac{2dt}{1+t^2}$，$x=2\arctan t$，根据万能公式有
$$
\displaystyle\sin x=\frac{2t}{1+t^2}
$$
$$
\displaystyle\cos x=\frac{1-t^2}{1+t^2}
$$
$$
\displaystyle\tan x=\frac{2t}{1-t^2}
$$
以此将三角分式转换为有理分式进行计算

例： 求 $\displaystyle I=\int\frac{\sin x}{1+\sin x+\cos x}dx$

令 $\displaystyle t=\tan\frac{x}{2}$，利用万能公式得
 
 $\displaystyle I=\int\frac{\frac{2t}{1+t^2}}{1+\frac{2t}{1+t^2}+\frac{1-t^2}{1+t^2}}\cdot\frac{2dt}{1+t^2}=\int\frac{2t}{(t+1)(t^2+1)}dt=\ln\bigg|\frac{\sqrt{t^2+1}}{t+1}\bigg|+\arctan t+C$

 $\displaystyle=-\ln\bigg|\sin\frac{x}{2}+\cos\frac{x}{2}\bigg|+\frac{x}{2}+C$

# 4 定积分

## 4.1 定积分的定义与几何意义

定积分的定义在 [1.2计算极限-导数/定积分的定义](#导数定积分的定义) 中已给出，即 
$$
\int_a^bf(x)dx=\lim_{\lambda\to0}\sum_{i=1}^nf(\xi_i)\Delta x_i
$$
其中在被积区间 $[a,b]$ 上有 $x_1,x_2,\cdots,x_n$ 共 $n$ 个分点，$\Delta x_i$ 为小区间 $[x_{i-1},x_i]$ 的长度，$\xi_i$ 为小区间 $[x_{i-1},x_i]$ 上任意一点，$\lambda$ 为小区间长度的最大值即 $\displaystyle\lambda=\max_{1\leq i\leq n}\{\Delta x_i\}$

注意：定积分代表一个数，**其值与积分变量无关**，即
$$
\displaystyle\int_a^bf(x)dx=\int_a^bf(t)dt
$$

$a$ 与 $b$ 的大小关系任意，并规定
$$
\int_a^bf(x)dx=-\int_b^af(x)dx
$$

定积分的定义常用来计算极限，详见 [1.2计算极限-导数/定积分的定义](#导数定积分的定义)

定积分的几何意义为曲线与坐标轴围成的**曲边梯形的面积**，其中 $x$ 轴上方面积取正，下方取负，如下图所示

<img src="IMG01.webp" alt="一张有关定积分的几何定义的图片" width="40%" class="center-image">

定积分的几何意义常用来计算例如 $\displaystyle\int_0^2\sqrt{2x-x^2}dx$ 等被积函数为常见图形曲线（例如圆）的定积分

## 4.2 定积分的性质

### 定积分的基本性质

线性运算法则
$$
\int_a^b[c_1f(x)+c_2g(x)]dx=c_1\int_a^b f(x)dx+c_2\int_a^b g(x)dx
$$

积分区间可加性（$a<c<b$）
$$
\int_a^b f(x)dx=\int_a^c f(x)dx+\int_c^b f(x)dx
$$

保号性：若在 $[a,b]$ 上恒有 $f(x)\geq0$,则 $\displaystyle\int_a^b f(x)\geq0$

估值定理：若 $\displaystyle m=\min_{x\in[a,b]}\{f(x)\}$，$\displaystyle M=\min_{x\in[a,b]}\{f(x)\}$，则
$$
m(b-a)\leq\int_a^b f(x)dx\leq M(b-a)
$$

由保号性可推得，若在 $[a,b]$ 上恒有 $f(x)\leq g(x)$，则
$$
\int_a^b f(x)dx\leq\int_a^b g(x)dx
$$

### 积分中值定理

若函数 $f(x)$ 在区间 $[a,b]$ 上连续，则
$$
\exist\xi\in(a,b)\hspace{1em}\text{s.t.}\hspace{1em}\int_a^bf(x)dx=f(\xi)(b-a)
$$
上述公式称为**积分中值公式**，其中 $\displaystyle f(\xi)=\frac{1}{b-a}\int_a^bf(x)dx$ 可视为函数 $f(x)$ 在区间 $[a,b]$ 上的平均值

积分中值定理与微分中值定理相似，重点在于构造函数，也常与微分中值定理一起考查

## 4.3 变限积分求导

若在 $[a,b]$ 上，函数 $f(x)$ 连续且函数 $\displaystyle\Phi(x)=\int_a^xf(t)dt$可导，则有变动积分上限函数导数公式
$$
\Phi'(x)=\frac{d}{dx}\int_a^xf(t)dt=f(x)
$$

利用复合函数求导法则，可将其推广至
$$
\frac{d}{dx}\int_a^{\phi(x)}f(t)dt=\phi'(x)\cdot f(\phi(x))
$$

若上下限同时变动，则可利用积分区间可加性，将其**拆分为两个变动积分上限函数**，再进行计算，即
$$
\frac{d}{dx}\int_{u(x)}^{v(x)}f(t)dt=\frac{d}{dx}\int_a^{v(x)}f(t)dt-\frac{d}{dx}\int_a^{u(x)}f(t)dt
$$

若被积函数中存在含 $x$ 式子的因子，由于对于 $x$ 不是积分变量，可将其**提到积分号外**，再利用导数的积法则计算，即
$$
\frac{d}{dx}\int_a^xP(x)f(t)dt=\frac{d}{dx}\bigg(P(x)\cdot\int_a^xf(t)dt\bigg)
$$

例： $\displaystyle\frac{d}{dx}\int_2^{x^2}(x-t)\sin tdt$

$\displaystyle=\frac{d}{dx}\bigg(x\cdot\int_2^{x^2}\sin tdt\bigg)-\frac{d}{dx}\int_2^{x^2}t\sin tdt$

$\displaystyle=1\cdot\int_2^{x^2}\sin tdt+x\cdot2x\cdot\sin(x^2)-2x\cdot x^2\sin(x^2)$

$\displaystyle=(2x^2-2x^3)\sin(x^2)+\int_2^{x^2}\sin tdt$

若被积函数中含有 $x$，且无法以因子的形式提至积分号外时，则可考虑**使用换元积分法**（详见下文 [4.4定积分的计算-定积分的换元积分法](#定积分的换元积分法)）

例： 设 $f(x)$ 连续，求 $\displaystyle I=\frac{d}{dx}\int_0^x t\cdot f(t^2-x^2)dt$

令 $u(t)=t^2-x^2$，则 $du=2tdt$，积分上限 $u(x)=0$，积分下限 $u(0)=-x^2$，代入得

$\displaystyle I=\frac{d}{dx}\frac{1}{2}\int_{-x^2}^0f(u)du=-\frac{1}{2}\frac{d}{dx}\int_0^{-x^2}f(u)du=-\frac{1}{2}\cdot(-2x)\cdot f(-x^2)=x\cdot f(-x^2)$

例： 设 $f(x)$ 连续，求 $\displaystyle I=\frac{d}{dx}\int_0^1f(xt)dt$

令 $u(t) =xt$，则 $\displaystyle t=\frac{u}{x}$，$\displaystyle dt=\frac{du}{x}$，积分上限 $u(1)=x$，积分下限 $u(0)=0$，代入得

$\displaystyle I=\frac{d}{dx}\int_0^x\frac{f(u)}{x}du=\frac{d}{dx}\bigg(\frac{1}{x}\int_0^xf(u)du\bigg)=\frac{x\cdot f(x)-\int_0^xf(u)du}{x^2}$

## 4.4 定积分的计算

### Newton-Leibniz公式（微积分基本公式）

设函数 $f(x)$ 在区间 $[a,b]$ 上**连续**，$F(x)$ 为 $f(x)$ 的一个原函数，则有
$$
\int_a^bf(x)dx=\Big[F(x)\Big]_a^b=F(b)-F(a)
$$

注意：该公式使用需满足**连续**条件

计算较为复杂的定积分时，可先用不定积分的显式换元法，或分部积分法，**先求出原函数**再计算数值，但更建议使用定积分的换元积分法，或分部积分法，直接完成计算

### 定积分的换元积分法

定积分的换元积分法与[不定积分的显式换元法](#显式换元第二类换元积分法)基本类似，但除了被积**函数代换、微分代换**外，还要进行**上下限代换**，且由于定积分代表的是一个数值，最终无需还原为 $x$ 的表达式，直接在新的积分限上**用新的积分变量计算**即可

设 $f(x)$ 在 $[a,b]$ 上连续，$x=\phi(t)$ 在 $[\alpha,\beta]$（或 $[\beta,\alpha]$）上有连续导数，记 $\phi(a)=\alpha$，$\phi(b)=\beta$ 则有
$$
\int_a^bf(x)dx=\int_{\phi(a)}^{\phi(b)}f(\phi(t))d(\phi(t))=\int_\alpha^\beta f(\phi(t))\phi'(t)dt
$$

换元式的选择与不定积分的显式换元法类似，可参照 [3.2不定积分的计算-显式换元（第二类换元积分法）](#显式换元第二类换元积分法)

注意：**换元必换限，换元必换限，换元必换限**

注：凑微法不是显式换元，无需引入新的积分限或积分变量

定积分的换元积分法基本步骤可参照 [4.3 变限积分求导](#43-变限积分求导) 中的例子

### 定积分的分部积分法

定积分的分部积分法与[不定积分的分部积分法](#分部积分法)类似

设函数 $u=u(x)$ 与 $v=v(x)$ 在 $[a,b]$ 上的导函数均连续，则有
$$
\int_a^b uv'dx=\Big[uv\Big]_a^b-\int_a^b u'vdx
$$
与不定积分的分部积分法略有区别的是，定积分的分部积分法可以**边积边代入**，小幅度提高运算效率

与不定积分的分部积分法相同的是，选取合适的式子作为 $v'$ 与 $dx$ 结合成 $dv$ 存在一定的方法，同时定积分的分部积分法也存在**回归法**与**递推法**，此部分内容均可参照 [3.2不定积分的运算-分部积分法](#分部积分法)

### 定积分计算中的重要推论

#### 被积函数的奇偶性

若函数 $f(x)$ 在 $[a,b]$ 上连续，考虑其奇偶性，有

(1) 若 $f(x)$ 为奇函数，则有
$$
\displaystyle\int_{-a}^af(x)dx=0
$$
(2) 若 $f(x)$ 为偶函数，则有
$$
\displaystyle\int_{-a}^af(x)dx=2\int_0^af(x)
$$
此推论可通过[定积分的换元积分法](#定积分的换元积分法)证明

当出现**上下限互为相反数**的定积分时，首先考虑函数的奇偶性来简化运算

考试中常会出现这种定积分题型：积分上下限互为相反数，而被积函数某一部分十分复杂，难以寻找原函数<br>
仔细观察积分函数后往往会发现，那十分复杂的部分是个奇函数，积分后数值为 $0$，故不用费心寻找那复杂的原函数

#### 被积函数的周期性

若 $f(x)$ 是连续的周期函数，其周期为 $T$（包括但不限于是最小正周期），$n\in\mathbb{N}$，则有
$$
\int_a^{a+nT}f(x)dx=n\int_0^Tf(x)dx
$$
此推论可通过[定积分的换元积分法](#定积分的换元积分法)证明

此推论在含**三角函数**的定积分计算中运用较多

#### Wallis公式

若 $n\in\mathbb{N}$，$n>1$，则有
$$
\int_0^\frac{\pi}{2}\sin^n xdx=\int_0^\frac{\pi}{2}\cos^n xdx=\left\{\begin{array}{l} \displaystyle\frac{n-1}{n}\cdot\frac{n-3}{n-2}\cdot\cdots\cdot\frac{3}{4}\cdot\frac{1}{2}\cdot\frac{\pi}{2},\hspace{1em}n=2k
\\
\\ \displaystyle\frac{n-1}{n}\cdot\frac{n-3}{n-2}\cdot\cdots\cdot\frac{4}{5}\cdot\frac{2}{3},\hspace{1em}n=2k+1
\end{array}\right.
$$

此公式不用分奇数偶数不同情况进行记忆，只需按照分母分子、分母分子的顺序依次写下 $n$，$n-1$，$\cdots$，$2$，（$1$） ，若最后的分子为 $2$ 则停止，若为 $1$ 则在末尾再乘上 $\displaystyle\frac{\pi}{2}$ 即可

## 4.5 反常积分

### 无穷区间上的反常积分

若定积分的积分上下限中至少有一个为无穷大，则称该定积分为**无穷区间上的反常积分**<br>
无穷区间上的反常积分的实质是计算**积分的极限**
$$
\int_a^{+\infty}f(x)dx=\lim_{b\to+\infty}\int_a^bf(x)dx
$$
$$
\int_{-\infty}^bf(x)dx=\lim_{a\to-\infty}\int_a^bf(x)dx
$$
$$
\int_{-\infty}^{+\infty}f(x)dx=\int_c^{+\infty}f(x)dx+\int_{-\infty}^cf(x)dx=\lim_{b\to+\infty}\int_c^bf(x)dx+\lim_{a\to-\infty}\int_a^cf(x)dx
$$
若上述等式中右侧**极限均存在**，则称左侧反常积分收敛，反之则发散

例： 讨论 $\displaystyle I_p=\int_a^{+\infty}\frac{1}{x^p}dx$ 的敛散性

$p=1$ 时，$\displaystyle I_p=\int_a^{+\infty}\frac{1}{x}dx=\Big[\ln x\Big]_a^{+\infty}=+\infty$，发散

$p\not=1$ 时，$\displaystyle I_p=\Big[\frac{1}{1-p}x^{1-p}\Big]_a^{+\infty}$，$p<1$ 时 $I_p=+\infty$ 发散， $p>1$ 时 $\displaystyle I_p=\frac{a^{1-p}}{p-1}$ 收敛

综上，$p\leq1$ 时 $I_p=+\infty$ 发散，$p>1$ 时 $\displaystyle I_p=\frac{a^{1-p}}{p-1}$ 收敛

### 无界函数的反常积分（瑕积分）

瑕点（即**无穷间断点**）：若 $f(x)$ 在点 $a$ 的任一领域内都无界，则称 $a$ 为 $f(x)$ 的无穷间断点，又称**瑕点**，例如 $x=0$ 为函数 $\dfrac{1}{x}$ 的瑕点

若函数 $f(x)$ 在闭区间 $[a,b]$ 内存在瑕点，则称定积分 $\displaystyle\int_a^bf(x)dx$ 为**瑕积分**<br>
瑕积分的实质也是计算**积分的极限**
$$
\int_a^bf(x)dx=\lim_{t\to a^+}\int_t^bf(x)dx\hspace{1em}（a为瑕点）
$$
$$
\int_a^bf(x)dx=\lim_{t\to b^-}\int_a^tf(x)dx\hspace{1em}（b为瑕点）
$$
若 $c\in[a,b]$ 为瑕点，则
$$
\int_a^bf(x)dx=\int_a^cf(x)dx+\int_c^bf(x)dx=\lim_{t\to c^-}\int_a^tf(x)dx+\lim_{t\to c^+}\int_t^bf(x)dx
$$
若上述等式中右侧**极限均存在**，则称左侧反常积分收敛，反之则发散

与无穷区间上的反常积分不同，瑕积分与正常积分在形式上相差无几，因此计算定积分时必须先判断函数 $f(x)$ 在被积区间 $[a,b]$ 上是否连续

典型**错误**：$\displaystyle\int_{-1}^1\frac{1}{x^2}dx=\Big[-\frac{1}{x}\Big]_{-1}^1$

例： 求 $I=\displaystyle\int_0^a\frac{dx}{\sqrt{a^2-x^2}}$，$a>0$

注意到 $\displaystyle\lim_{x\to a}\frac{1}{\sqrt{a^2-x^2}}=+\infty$，$a$ 为瑕点，此定积分为瑕积分，

$\displaystyle I=\Big[\arcsin\frac{x}{a}\Big]_0^{a^-}=\lim_{x\to a^-}\arcsin\frac{x}{a}-0=\frac{\pi}{2}$

## 4.6 定积分的应用

### 微元法

将问题所求的量 $U$ 在 $x$ 变化的区间 $[a.b]$ 上分为无穷多个区间中的无穷多个微元 $dU$，用 $dx$ 表示 $dU$，再进行积分求和
$$
U=\int_a^bdU=\int_a^bf(x)dx
$$

### 求弧长

弧微分的公式在 [2.8曲率-弧微分](#弧微分) 中已给出，即

直角坐标系的弧微分
$$
ds=\sqrt{(dx)^2+(dy)^2}=\sqrt{1+(\frac{dy}{dx})^2}dx
$$
参数方程的弧微分
$$
ds=\sqrt{(dx)^2+(dy)^2}=\sqrt{(\frac{dx}{dt})^2+(\frac{dy}{dt})^2}dt
$$
极坐标方程 $\rho=\rho(\theta)$ 的弧微分
$$
ds=\sqrt{\rho^2+(\frac{d\rho}{d\theta})^2}d\theta
$$
利用微元法可得
$$
S=\int_a^bds=\int_a^b\sqrt{1+(\frac{dy}{dx})^2}dx=\int_\alpha^\beta\sqrt{(\frac{dx}{dt})^2+(\frac{dy}{dt})^2}dt
$$
其中 $a=x(\alpha)$，$b=y(\beta)$

极坐标方程 $\rho=\rho(\theta)$ 可视为参数方程的特例，即参数方程
$$
\begin{cases}
x=\rho(t)\cos t \\
y=\rho(t)\sin t
\end{cases}
$$
其中 $t\in[0,2\pi)$

### 求面积

直角坐标系下，对于曲线 $y=f(x)$ 或 $x=g(y)$，根据矩形面积公式，有面积微元
$$
dA=f(x)dx
$$
或
$$
dA=g(y)dy
$$

定积分求面积主要需要考虑的是**积分变量的选取**，选择合适的积分变量有利于大幅减少计算，例如在下图中，选取 $y$ 作为积分变量明显优于 $x$

<img src="IMG02.webp" alt="一张有关积分变量选取的图片" width="60%" class="center-image">

#### 极坐标下定积分求面积

极坐标下，对于曲线 $r=r(\theta)$，根据扇形面积公式，面积微元为
$$
dA=\frac{1}{2}r^2(\theta)d\theta
$$

<img src="IMG03.webp" alt="一张有关极坐标面积微元的图片" width="40%" class="center-image">

#### 极坐标下定积分求面积

### 求体积

定积分常用于求旋转体的体积

利用定积分求体积时应尽可能将所求立体图形的图像画出，用以辅助选取合适的体积微元

#### 圆盘法

沿**轴向**将区间分为无穷多个区间，**以圆盘作为体积微元**，根据圆柱体积公式，有体积微元
$$
dV=\pi f^2(x)dx\hspace{1em}（以x轴为旋转轴）
$$
或
$$
dV=\pi g^2(y)dy\hspace{1em}（以y轴为旋转轴）
$$
<img src="IMG04.webp" alt="一张有关圆盘法的图片" width="60%" class="center-image">

#### 柱壳法

沿**径向**将区间分为无穷多个区间，**以柱壳作为体积微元**，根据柱壳体积公式，有体积微元
$$
dV=2\pi xydx\hspace{1em}（以x轴为旋转轴）
$$
或
$$
dV=2\pi xydx\hspace{1em}（以y轴为旋转轴）
$$
（下图以y轴为旋转轴为例）

<img src="IMG05.webp" alt="一张有关柱壳法的图片" width="40%" class="center-image">

#### 切片法

除旋转体以外，定积分还可以用切片法求更多样的立体图形的体积

若在某立体图形中取一 $x$ 轴，平面 $\Pi$ 垂直于 $x$ 轴，平面 $\Pi$ 沿 $x$ 轴移动时所截得的面积均可由 $A=f(x)$ 表示，则沿 $x$ 轴分为无穷多个区间，以切片作为体积微元，根据柱体公式，有体积微元
$$
dV=f(x)dx
$$
<img src="IMG06.webp" alt="一张有关切片法的图片" width="40%" class="center-image">

切片法常用于求解楔形体与截锥体的体积（上图为楔形体，下图为截锥体）

<img src="IMG07.webp" alt="一张有关截锥体的图片" width="30%" class="center-image">

# 5 常微分方程

## 5.1 微分方程的概念

同时包含未知函数、未知函数的导数（或微分）与自变量的方程称为微分方程.其中的未知函数若为一元函数，则称为**常微分方程**；若为多元函数，则称为偏微分方程

微分方程中出现的未知函数的**最高阶导数的阶数**，称为微分方程的**阶**

$n$ 阶方程基本结构为
$$
F(x,y,\frac{dy}{dx},\cdots,\frac{d^ny}{dx^n}=0)
$$
如果微分方程的解中包含**独立的任意常数**，且其个数**与**微分方程的**阶相等**，则称这样的解为微分方程的**通解**；能由通解确定，不包含任意常数的解，称为**特解**

注意：通解 $\not=$ 所有的解

确定一个 $n$ 阶微分方程的特解，需要 $n$ 个**初始条件** $\displaystyle y\Big|_{x=x_0}=y_0,y'\Big|_{x=x_0}=y'_0,\cdots,y^{(n)}\Big|_{x=x_0}=y^{(n)}_0$

解常微分方程的重难点在于判断方程的类型，方程的类型决定了方程的解法；下面介绍一些常见常微分方程的类型及其解法

## 5.2 可分离变量的常微分方程

若某个一阶微分方程可分离变量，写为
$$
g(y)dy=f(x)dx
$$
记 $F(x)$，$G(x)$ 分别为 $f(x)$，$g(x)$ 的一个原函数，等式两侧积分可得**隐式通解**
$$
G(y)=F(x)+C
$$
若此隐函数能化成显函数，则可得到**显式通解** $y=\phi(x)$

例： 求 $x(1+y^2)dx+y(1+x^2)dy=0$ 的通解

分离变量得 $\displaystyle-\frac{y}{1+y^2}dy=\frac{x}{1+x^2}dx$

两侧积分得 $\displaystyle-\frac{1}{2}\ln(1+y^2)=\frac{1}{2}\ln(1+x^2)+C_1$

整理得 $\displaystyle y^2=\frac{C}{1+x^2}-1$

### 齐次方程

若删去微分后，方程中的所有项次数相同（$x$ 为一次，$x^2y$ 为三次）（根号中次数需相同，$\sqrt{x^2+y^2}$ 为一次，$\sqrt{y^2+1}$ 非齐次），则称为齐次方程

齐次常微分方程可化为
$$
\frac{dy}{dx}=\phi\bigg(\frac{y}{x}\bigg)
$$
使用**比值换元**，令 $\displaystyle u=\frac{y}{x}$，则有 $y=ux$，$\displaystyle\frac{dy}{dx}=u+x\frac{du}{dx}$，代入后再分离变量即可求解，即
$$
u+x\frac{du}{dx}=\phi(u)
$$
$$
\frac{du}{\phi(u)-u}=\frac{dx}{x}
$$
两侧积分后再将 $\displaystyle u=\frac{y}{x}$ 代入还原为 $x$，$y$ 的表达式即可

例： 求 $(y^2-3x^2)dy+2xydx=0$ 的通解

将齐次方程化为 $\displaystyle\bigg(\Big(\frac{y}{x}\Big)^2-3\bigg)\frac{dy}{dx}+2\cdot\frac{y}{x}=0$

令 $\displaystyle u=\frac{y}{x}$，代入得 $\displaystyle(u^2-3)\bigg(u+x\frac{du}{dx}\bigg)+2u=0$

分离变量得 $\displaystyle\frac{u^2-3}{u^3-u}du=\frac{dx}{x}$

两侧积分得 $3\ln|u|-\ln|u-1|-\ln|u+1|=-\ln|x|+C_1$

将 $\displaystyle u=\frac{y}{x}$ 代入得 $\displaystyle 3\ln\bigg|\frac{y}{x}\bigg|-\ln\bigg|\frac{y}{x}-1\bigg|-\ln\bigg|\frac{y}{x}+1\bigg|=-\ln|x|+C_1$

整理得 $y^3=C(y^2-x^2)$

另外，当方程不是齐次方程的时候，也可用**合适的换元方法**将方程化为可**分离变量**的常微分方程，例如看到 $xy'+y$ 的结构可以考虑 $u=xy$ 换元

例： 求 $\displaystyle y'=\frac{1}{x-y}+1$ 的通解

令 $u=x-y$，代入求解整理还原得 $(x-y)^2=-2x+C$

## 5.3 一阶线性微分方程

形如
$$
\frac{dy}{dx}+P(x)y=Q(x)
$$
的常微分方程称为**一阶线性微分方程**，即最高阶导数为一阶，未知函数 $y$ 的次数为一次；其中 $P(x)$ 为未知函数 $y$ 的**系数**，$Q(x)$ 为**自由项**

若 $Q(x)\equiv 0$，则称方程为**齐次**的，反之则称为**非齐次**的

### 一阶线性微分方程的解法

对于齐次一阶线性微分方程 $\displaystyle\frac{dy}{dx}+P(x)y=0$，可分离变量为
$$
\frac{dy}{y}=-P(x)dx
$$
两侧积分得
$$
\ln|y|=-\int P(x)dx+C_1
$$
其中 $\displaystyle\int P(x)dx$ 表示 $P(x)$ 的一个原函数，记 $\displaystyle\int P(x)dx=\mu(x)$ ，整理得通解
$$
y=Ce^{-\mu(x)}
$$

对于非齐次一阶线性微分方程 $\displaystyle\frac{dy}{dx}+P(x)y=Q(x)$，<br>
使用**常数变易法**，将齐次一阶线性微分方程通解中的任意常数 $C$ 换为 $u=u(x)$，即 $y=ue^{-\mu(x)}$ 代入方程得
$$
(u'(x)-u(x)P(x))e^{-\mu(x)}+P(x)u(x)e^{-\mu(x)}=Q(x)
$$
整理积分后得
$$
u=\int Q(x)e^{\mu(x)}dx+C_1
$$
代入得非齐次一阶线性微分方程的**通解公式**（**此公式需熟练记忆**）
$$
y=e^{-\mu(x)}\Big[\int Q(x)e^{\mu(x)}dx+C\Big]
$$
其中 $\displaystyle\mu(x)=\int P(x)dx$

注意：运用此公式时必须将一阶线性微分方程**化为标准型** $\displaystyle\frac{dy}{dx}+P(x)y=Q(x)$

解题时题目中的方程可能是以 $y$ 为未知变量的一阶线性微分方程，也可能是**以** $x$ **为未知变量**的一阶线性微分方程，需要具体题目具体判断，以合适的方法求解

例： 求 $\displaystyle\frac{dy}{dx}=\frac{y}{x+y^3}$ 的通解

变形为 $\displaystyle\frac{dx}{dy}-\frac{1}{y}x=y^2$，$\displaystyle P(y)=-\frac{1}{y}$，$Q(y)=y^2$，$\displaystyle\mu(y)=\int P(x)dx=-\ln|y|$，代入公式得

$\displaystyle x=e^{-\mu(x)}\Big[\int Q(x)e^{\mu(x)}dx+C\Big]=e^{\ln y}\Big[\int y^2e^{-\ln y}dy+C\Big]=y\Big(\frac{y^2}{2}+C\Big)$

### Bernoulli方程

方程
$$
\frac{dy}{dx}+P(x)y=Q(x)y^n，\hspace{1em}n\not=0,1
$$
称为**Bernoulli方程**

与一阶线性微分方程相比，Bernoulli方程右侧多了一个 $y^n$ 因子，但Bernoulli方程可以**化为一阶线性微分方程**

Bernoulli方程两侧同除以 $y^n$ 得
$$
y^{-n}\frac{dy}{dx}+P(x)y^{1-n}=Q(x)
$$
由于 $\displaystyle y^{-n}\frac{dy}{dx}=\frac{1}{1-n}\frac{d(y^{1-n})}{x}$，使用**换元**法，令 $u=y^{1-n}$，代入得
$$
\frac{1}{1-n}\frac{du}{dx}+P(x)u=Q(x)
$$
得到了以 $u$ 为未知变量的一阶线性微分方程，求出通解后将 $u=y^{1-n}$ 代入还原为 $x$，$y$ 的表达式即可

## 5.4 可降阶的高阶微分方程

### 5.4.1 多次积分

形如
$$
y^{(n)}=f(x)
$$
的高阶微分方程，通过多次积分降阶，即可得到方程的通解

### 5.4.2 不含y

形如
$$
y''=f(x,y')
$$
的微分方程



### 5.4.3 不含x

形如
$$
y''=f(y,y'')
$$
的微分方程






