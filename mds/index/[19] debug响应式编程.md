# debug响应式编程
2022-08-30

相关资料：

[https://programming-group.com/assets/pdf/papers/2016_Debugging-for-Reactive-Programming.pdf](https://programming-group.com/assets/pdf/papers/2016_Debugging-for-Reactive-Programming.pdf)

《Debugging for Reactive Programming》

论文对应的产出产品 [https://guidosalva.github.io/reactive-inspector/](https://guidosalva.github.io/reactive-inspector/)

[https://gousios.org/pub/debugging-dataflows-in-reactive-programs.pdf](https://gousios.org/pub/debugging-dataflows-in-reactive-programs.pdf)

论文对应的产出产品:[https://rxfiddle.net/](https://rxfiddle.net/)

在研发以响应式的框架的过程中体会到了响应式编程中对debug的不易，在产品复杂之后，一个数据的修改，会引发雪崩式的更新，响应式编程无法debug的几个问题：

- 缺少全局视角的依赖网络
- 无法断点
- 无法追踪触发的范围

以及需要深刻的理解响应式编程中的其它debug问题

在思考查询解决方案的过程中，发现有一篇论文好像很贴切[《Debugging for Reactive Programming》](https://programming-group.com/assets/pdf/papers/2016_Debugging-for-Reactive-Programming.pdf)  因为之前从没有过通过论文来获得输入，所以尝试着体验下，结果一发不可收拾

> ps：原本我以为这是德国大学生的毕业论文，后来查了下才发现原来是2个教授


相比常规文章，论文本身虽然很长但内容通常是精而不广，论证过程严谨，有实验有数据。用来对线令人信服。

## 一点收获
对于reactive programing的理解又加深一点点，把我模糊的感觉进一步的清晰化：

- dependencies structure也是程序逻辑的组成部分
- 心智模型在程序和reactive application是统一的。

基于刷新后的认知下再重新回顾了下之前的工具，平台。

而且通过论文这种方式获取的信息就很有安全感和“高级”感，也不用太担心获取到fake news，


## Debugging for Reactive Programming 摘录

### 3.designing RP debugging

### 4.RP debugging at work
列举RP编程中的问题和解法

- 4.1 missing dependencies
- 4.2 bugs in signal expressions
- 4.3 understanding the RP programs
   - tranditional debugging  issues
      - erratic behavior
      - many-to-many relations
- 4.4 memory and time leaks
- 4.5 performance bugs
   - because of inside unneccessarily recomputing
- 4.6 advanced RP debugging
   - inspecting history
   - conditional breakpoints and queries
      - 通过一个自定义拓展的查询语言，在图上设定断点或查看历史


### 5.implementation
![image.png](https://cdn.nlark.com/yuque/0/2022/png/329030/1661429359219-d3f8d4b7-6e05-4e16-a18d-d4f37579e53d.png#clientId=udd612afd-4b51-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=266&id=u2029d2db&margin=%5Bobject%20Object%5D&name=image.png&originHeight=266&originWidth=467&originalType=binary&ratio=1&rotation=0&showTitle=false&size=26608&status=done&style=none&taskId=uae019f50-3e39-4bb0-9ebc-7c5499af911&title=&width=467)<br />plugin architecture 

### 6.evalution
organized a controlled experiment with 18 subjects

- expriment results
   - 在时间上对比，用RD的学生时间耗时更少 2572/4317
   - 验证了RD在程序开发的有效性

### 7.discussion

- dynamic dependency graphs
   - 必须先执行一遍才行
   - 跟传统的指令式断点是不冲突，而是进一步完善
- scalability of the visualization
   - dependency graph realitvly object graph
   - mitigate effect of large grah
      - inspect the graph  associated single node
      - collapse the node in graph
      - search
- limitations
   - 用以实现debug插件的scala语言抽象不足
   - 落地实现的特性太少了，比如时间回溯