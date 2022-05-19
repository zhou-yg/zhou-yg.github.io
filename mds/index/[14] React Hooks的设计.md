# React Hooks的设计
2022-05-19

## 概览
出于设计useServerless的需要，最好能参考React源码的实现

react Hooks的实现作为前端经典八股文之一，之前已经大致了解内部是基于循环链表的实现过程，但仔细回想后，发现虽然了解了它的原理（WHAT）还是有很多地方不明白为什么要这么写（WHY），比如

- 为什么hook数据对象使用的是链表？数组可以吗？
- hook的queue跟hook数据的链表不一样，反而是环状链表？
- 为什么Dispatcher要分成 HooksDispatcherOnMount 和  HooksDispatcherOnUpdate 2类？
- useState的计算的时机为什么是下次更新的时候才Merge ？

以useReducer为例，hooks的源码出处：

## 基本原理说明
在Hooks实现里最重要的事情，就是useState和useEffect之类的hook函数，能够知道当前执行的上下文信息，包含：

- 当前是哪个Component在调用这个hook函数
- 现在这个hook函数，它调用的入参 和 上次存储的值是多少？


### 1.如何hook被哪个Component调用了？
受限于JS的语言特性，strict模式下的当前函数无法获取当前的caller是谁，参考：[callee](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Functions/arguments/callee)

所以一般情况下需要通过一点技巧来实现，即通过劫持函数执行前后的全局变量，维持一个调用栈

这样在render函数在执行的时候，当前全局变量里最新的Component就是当前正在执行的Component

为什么可以这么做？是因为JS是单线程执行模型，代码在执行是同步的在一个线程里共享内存变量，所以才能用这个“技巧”
> 拓展思考：如果是多线程里，如何实现这个功能呢？

```javascript
let globalCurrent = []
function run() {
  pushGlobalCurrentStack(ReactComponent)
  ReactComponent.render()
  popGlobalCurrentStack()
}
```

### 2.获取上次的存储值
总所周知，React的hook的值是存储在Component对应的Fiber中，所以只有能找到Component就能找到Fiber

在hooks有2个数据的来源，hooks初始设定的参数作为默认值，上一次的提交的action和上一次的值

- mount时
   - 关心初始参数，保存到 hook的memoizedState 和 baseState
- update
   - 关心上次dispatch的action变更，和 hook的memoizedState，计算出新的值并保存

由于mount和update的完全不同，所以需要区别2者，React的判断方法是：通过Fiber
```javascript
// renderWithHooks current:Fiber
ReactCurrentDispatcher.current =
  current === null || current.memoizedState === null
    ? HooksDispatcherOnMount
    : HooksDispatcherOnUpdate;
```


## useReducer的数据结构

分成2步：

1. 获取当前的hook对应的数据对象，通过 mountWorkInProgressHook
1. 构建hook的返回 pair 结构 [state, setState]

为什么useReducer每次都需要从Fiber中取数据，不能直接跟自己关联，2个原因：

1. useReducer本身是全局引用，不能被污染。
   1. 除非在useReducer在Component进行实例化，在实例化的useReducer上挂数据，但受限于React的 Function Component的特性，这行不通。因为每次渲染的时候，Component作为一个Function会重新执行一次，执行的时候，函数body是从0开始执行的，useReducer每次都会被重新实例化
2. 受限于语言特性，函数无法在function body内保存数据，useReducer只能将自己依赖的数据，保存到一个hook对象，并挂在当前Fiber里，用到的时候再取出。

如果真不想的每次都从外部的Fiber中取数据，将数据内存在组件内部，就必须得做到2个方面：

- Component 初始化只执行一次，重新渲染的时候，函数不再重新执行那么就不会重新实例化
- Component 的render逻辑需要在第一次执行的时候就跟状态数据绑定“关系”，这样就即修改数据不用初始化，仅render 视图就可以了
> 嗯没错，这就是Vue.setup的核心思想了，条条大路通罗马



### 1.获取当前hook数据对象
mount的逻辑相对简单，只需要做2件事情

1. 初始化最基本的数据结构接口
1. 将当前hooh对象 append 或 init 到全局

hook对象的构建链表的过程：

1. 第一个 hook1
   1. currentlyRenderingFiber.memoizedState = workInProgressHook（全局，此时为null） = hook1
      1. currentlyRenderingFiber.memoizedState = hook1（这个Fiber下的hook起点始终指向hook1，这样才能通过遍历链表找到所有的hook数据对象
2. 第二个 hook2
   1. workInProgressHook = hook2， hook1.next = hook2
3. 后面重复这个过程

经过mount的初始化之后，此时我们就得到了一条hook数据构建的单链表：
> currentlyRenderingFiber.memoizedState（hook1)  -> hook2 -> hook3 ...


update的逻辑会稍微复杂一点，并且已经它的逻辑是已经经过mount了，认为已经有一条hook的单链表的前提下

在update里有2种hook对象，分别是：

- nextCurrentHook
   - 初始化时来自于 currentlyRenderingFiber.alternate.memoizedState
   - 此时正在更新中，currentlyRenderingFiber是当前workInProcess，是新Fiber，它的alternate指向的是旧FIber
- nextWorkInProgressHook
   - 表示当前正在执行的hook数据对象，即新Fiber的hook数据对象
      - 如果第一个hook（nextWorkInProgressHook == null时）则来自于  currentlyRenderingFiber.memoizedState，指向的是新Fiber的链表的头部
      - 否则来自于 workInProgressHook.next （即上一个hook数据对象的next)
         - 新FIber的hook链表

对alternate的补充说明：update的逻辑点正是在于 alternate的差别，了解React源码会知道React在更新的时候会有一个“2棵树”逻辑，基于待更新的Fiber，构建一个新的Fiber链表，新的iew会使用新的Fiber链渲染，并替换旧FIber，它们之间通过alernate关联，所以 fiber.alternate 可以理解为最新的fiber节点
>  oldFiber.alternate === newFiber
> newFiber.alternate === OldFiber


在useReducer的update逻辑，在第一个hook执行会有一个迷惑点，即

- nextCurrentHook来自于旧Fiber， currentlyRenderingFiber.alternate.memoizedState
- nextWorkInProgressHook来自于新Fiber

React在这里主要是行为将旧Fiber的hook数据对象，复制到新Fiber的hook数据对象中，下面展示的是clone hook的过

update的取数据对象的过程中：

1. 第一个 hook1
   1. 分别取出新旧Fiber的hook链表的第1个
      1. old-hook1： 此时currentHook不存在，所以得从旧Fiber中先取出第1个 currentlyRenderingFiber.alternate.memoizedState，并设置到全局作为currentHook
      1. new-hook1：nextWorkInProgressHook也不存在，从新Fiber的currentlyRenderingFiber.memoizedState取出作为第1个
   2. 将旧Fiber的hook链表头clone到新Fiber
      1. currentlyRenderingFiber.memoizedState = 从旧Fiber上克隆的 old-hook1
      1. 此时 workInProgressHook 就是执行新Fiber的hook链的头部，即new-hook1，同时把new-hook设置到全局workInProgressHook，作为下一个turn的启动点
2. 第二个 hook2
   1. 还是分别取出新旧Fiber的hook链表的第2个hook数据对象
      1. 由于此时全局的currentHook已经存在（指向的是old-hook1），直接使用currentHook.next
      1. workInProgressHook已经存在（指向的是new-hook2），直接使用workInProgressHook.next
   2. 同上的克隆过程
3. 后面重复这个过程

经过取hook对象的过程，也完成了旧Fiber到新Fiber的数据克隆过程，update的逻辑之所以复杂，是因为同时涉及取数据和克隆hook的过程

这么设计的原因，基于函数式的特点，所有的计算都是lazy的，React在内部的大部分编程代码里都遵循了这一个原则

### 2.执行并计算hook
计算hook也是一个lazy的过程，当setState的时候，对应React，这个只是触发更新的一个信号，此时并不会将setState的入参更新到Fiber.memoizedState里，

计算hook的有1个特点：会进行优先级判断，并且在判断后会进行会将剩余的低优先级action保存到hook中，等待下次的渲染，同时要保存的时候要维持之前action queue的顺序，

而queue用到的数据结构化是环状链表，queue.pending始终指向最后一个插入的update，即链表的尾部
> queue.pending = upadete3 <-- update2 <-- update1 （ = update3.next）

用了“环”之后，它的巧妙之处在于就可以

- 当有新的update插入时，可以直接插入到链表的末尾
- 当在useReducer需要进行更新的时候，要按顺序进行遍历的时候，只要访问 queue.pending.next（因为是环状的，所以尾部的next就是头部）就可以立刻从头部开始

这种实现在JS里在，用数组当然也能实现，主要还是因为JS的数组非常“强大”。但使用“环状链表”确实非常的酷炫，另外一个可能的好处是queue.pending保存最后一个updaet就行，

遍历完update的之后后面就是简单的 newState = reducer(state, action)这一套，同样是遵循lazy的设计。
