# vscode中ts文件的类型提示实现原理
2022-10-18

## 背景
起因是在探索下一代组件库的过程中，发现对类型系统是强依赖的，所以需要一个”工具“能够获取结构化的类型数据。发现在vs code的编码中过程，当你hover在某个变量的时候，会发现ts插件总能帮你提示出这个变量的类型

如下：

![image.png](./21-1.png)


所以就思考如果能直接获取这个提示后的结果再直接解析岂不事半功倍？

## 过程
官方文档里有一个简单的文档说到这个事情，[https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29](https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29)

从文档里可知，插件的实现是依赖于ts-server工具，但因为ts-server的command数量实在很多且文档稀少，而且存在break change。所以最好的方式是看官方插件里是怎么使用tsserver。

如果开发vsc插件知识应该可以了解到的，”hover变量“的行为是vsc提供的一个事件机制：registerDefinitionProvider

通过搜索看到了插件的调用方式：

![image.png](./21-2.png)

通过代码盲猜 ，获取 ts的行为就是:

- command  = definitionAndBoundSpan | 'definition' | 'implementation' | 'typeDefinition'
   -   根据版本的不同有一些是之前的command
- 参数 =  { line: number; offset : number } 
   - 注意：上面2个number都是从1开始，跟编辑器的显示保持了一致

在得知了如何调用ts-server就可以开始这个测试的可行性，参考：[https://github.com/mmorearty/tsserver-example.git](https://github.com/mmorearty/tsserver-example.git)

但是结果太遗憾了，definitionAndBoundSpan等命令获取到的类型真的只能是文本提示，而且结果逻辑比较黑盒，在没有文档的情况下只能熟读源码才行

其次是通过上述的example工程测试的command的结果跟插件还是有出入，可能还是存在一些配置或调用的问题。

综合来说，通过ts-server的捷径是行不通，还是回归AST更靠谱