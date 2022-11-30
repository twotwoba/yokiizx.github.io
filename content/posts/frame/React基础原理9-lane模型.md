---
title: 'React基础原理9 - Lane模型'
date: 2022-11-30T11:59:50+08:00
tags: [React]
---

React 与 Scheduler 是两套不同的优先级机制。

React 的优先级机制需要满足以下情况：

- 可以表示优先级的不同
- 可以表示 `批` 的概念，因为可能同时存在几个同优先级的更新
- 便于进行优先级相关计算

针对第一点，React 采用一个 31 位二进制数来表示优先级，如 `lane:行车道` 的意思一样，每一个位置都表示一条行车道，位数越低，优先级越高
针对第二点，有些优先级同时占用好几条车道，依次来表示`批`

```TS
export const NoLanes: Lanes = /*                   */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                     */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                   */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*            */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /* */ 0b0000000000000000000000000000100;
const InputDiscreteLanes: Lanes = /*               */ 0b0000000000000000000000000011000;

const InputContinuousHydrationLane: Lane = /*      */ 0b0000000000000000000000000100000;
const InputContinuousLanes: Lanes = /*             */ 0b0000000000000000000000011000000;

export const DefaultHydrationLane: Lane = /*       */ 0b0000000000000000000000100000000;
export const DefaultLanes: Lanes = /*              */ 0b0000000000000000000111000000000;

const TransitionHydrationLane: Lane = /*           */ 0b0000000000000000001000000000000;
const TransitionLanes: Lanes = /*                  */ 0b0000000001111111110000000000000;

const RetryLanes: Lanes = /*                       */ 0b0000011110000000000000000000000;

export const SomeRetryLane: Lanes = /*             */ 0b0000010000000000000000000000000;

export const SelectiveHydrationLane: Lane = /*     */ 0b0000100000000000000000000000000;

const NonIdleLanes = /*                            */ 0b0000111111111111111111111111111;

export const IdleHydrationLane: Lane = /*          */ 0b0001000000000000000000000000000;
const IdleLanes: Lanes = /*                        */ 0b0110000000000000000000000000000;

export const OffscreenLane: Lane = /*              */ 0b1000000000000000000000000000000;
```

> 从 SyncLane 往下一直到 SelectiveHydrationLane，赛道的优先级逐步降低。

针对第三点，那就是二进制有利于位运算，也就方便了优先级的相关计算：

- 取交集(都拥有的赛道)
  `a & b`
- 取并集(合并赛道)
  `a | b`
- 从 a 的赛道 移除 b 的赛道
  `a & ~b`

