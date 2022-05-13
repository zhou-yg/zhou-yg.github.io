# Why serverless
2022-05-13

## 概览
基于响应式的，纯粹的，描述的业务逻辑执行模型（不限语言，环境），write once run any where<br />参考： remix，qwik，nextjs，dva，redux，react hooks，axii，vue setup，Proxy

## 现状
纯粹的前端状态管理不行吗？有什么是redux和vuex，hooks解决不了的

不行的原因是：

- 自主性不足，普通web应用的前端的状态管理是二手的，基于数据逻辑的再封装和再计算，重复劳动
   - 导致现状：服务不存状态，角色分工
      - 模型体现在数据库表里
   - 特定领域的重型前端应用呢？如编辑器
      - 不是，UI侧数据模型，数据库表可能有或没有（存了原子操作
- 数据的能力不足，前端管理的是
   - GUI所依赖的临时缓存，如loading，交互状态的缓存
   - 用户行为产生的数据，如输入，轨迹	
   - 待更新的数据草稿
   - server端返回的数据

因为数据的流向是 db -> server -> client，下游的持久化需求最终都依赖db手动的支撑

要解决的是：业务模型单元，纯函数逻辑，保持简洁和防止出错

- 纯UI的状态
   - useState,
      - disabled
- 涉及服务	
   - 响应式
      - useRequest
         - loading
         - deps
   - 命令式
      - sendRequest()

useRequest建立联系后就可以不管了，自动处理了订阅关系，包括loading。<br />所有的state都视作数据 + 计算结果，都视作乐观更新，这是Read

Update，Remove，Create怎么解？ 

- 手动
   - 调用apis.Method().then( ...重新读取当前数据 )
- 自动
   - 赋值即create
   - 修改属性则update
   - = null 则删除（删除比较危险，可以更“显性”一些

数据控制idea：由于编程 = 数据 + 指令，数据是指令的起点，指令的目的是生成下一份数据，<br />异常表示程序指令无法正确的执行，通常是由于指令依赖的数据不及预期<br />而逻辑则是一系列数据 + 指令的有序的集合

## 数据 & 计算 &副作用
之前在思考如何在serverless 避免处理客户端长连接的情况，然后长连接的逻辑一般都是写在 useEffect里的，即在函数里看来，由于长链接的场景只消费当前计算的结果，不会影响当前的计算结果，所以它可以视作一种副作用。<br />而在SSR的过程中，也不会去处理副作用的逻辑，免得计算结果不一致。

对于“计算”而言，要拆解成3种：

- 参数Context
   - 原子参数
   - computed参数 （参数和参数之间的关系）
      - b = computed (a)
   - 明确数据的存储特性
      - state（内存，基本）
         - cache（缓存，服务端缓存 or 客户端缓存，内存更新后，同步更新缓存）
            - 客户端缓存 or 服务端缓存
               - 依据的是数据的逻辑依赖上下游	
                  - 被Model依赖，服务端缓存
                  - 没有被Model依赖，客户端缓存
         - model（DB，内存更新后，异步更新DB）
      - 更新策略问题（参考分布式系统的缓存和数据一致性问题）？
         - 默认乐观更新（先更新缓存，再更新数据库）
            - 先更新数据库，再更新缓存
            - 先删除缓存，再更新数据库
            - 先更新数据库，再删除缓存
- 输入计算 f（跟computed的差别在于是否有外部输入，即入参）
   - newContext =  f ( input , currentContext) 
   - f 和 f之间的关系
- 副作用 （基于上述2者的变化
   - context 
      - before, after
   - inputCompute
      - before, after
```javascript
// V1
// V1
const serverlessUnit = {
  context: {
    a; new State(),
    b: new Cache()
    c: new Model('Entity')
  },
  init () {
    // init body
  },
  inputCompute: {
    inputCompute (arg) {
      const deps = init(contextDraft)
      // middle state ?
      return { result: newResult } 
    },
  },
  effect: {
    notify: [['result'] ,(prev, current) => {
      //sendToNotify()
    }],
    beforeCompute: [(prev, current) => {
      //sendToNotify()
    }, ['compute']],
  },
}

// V2
function serverlessUnit () {
  const a = useState()
  const b = useCache()
  const c = useModel('Entity')
  
  const d = computed(() => a().x + b().x)
  
  // must receive a parameter，有语义的合集
  // reducer的既视感
  const inputCompute = useInputCompute(async (parameter) => {
    // do something with draft：a,b,c
    
    // progress ? no 只有0，1的2种状态
    
    return { a, b, c } // commit draft
  })
  
  // before compute
  useEffect([(prev) => {
    // prev = [a, b, c]
  }, [inputCompute]])

  // after compute
  useEffect([[inputCompute], (prev) => {
  }])
  
  return { a,b,c, compute }
}
```


## 对比 redux
不同于redux的单向数据流思路，改变数据一定要dispatch(action）-> reducer -> state，因为整个unit的数据都是响应式的，所以如果要修改state可以更简单些

- 直接修改
- 通过 inputCompute

这2者好像是互相冲突的，简单来说外部的输入，一定得引发内部某个变量的修改才有意义，即入参最终是某个变量的某个值 。所以从效果来说 2者是等价的。但 inputCompute 还是有存在的必要，因为它可以存在“语义”，serverless最终目的是一个建设业务模型，所以保留计算合集并提供一个语意就很重要，这也是区别于它不是一个单纯的数据结构

原本的系统是个整体 + 纯函数逻辑，所以如果要修改unit，那必须有外部的参数输入才能引起变化。inputCompute也应该是响应式的，按照最新的调用进行执行。虽然中间不达预期，但至少达到了 最终一致性<br />unit stack

1. modify, a.x = 1  
   1.  直接更新(1)
2. start recomputed  d （耗时较久）
2. inputeComute (入参) 
   1. 获取 d （旧的值，d还没计算完）
   1. 更新(2)
4. end recomputed d 
   1. inputCompute重新计算
   1. 更新(3)	
5. 结束

是否要必要保留”直接修改“ ？如果去掉是不是会更加纯粹，同redux一样 compute -> state？简单的场景下：<br />page.value + 1 和 一个addPage(1) 在语义上没有区别

综合下来，最大的区别是响应式 + 依赖

## 状态同步传输
由于server端还是不保存状态，所以当进行计算时，会将所依赖的Context通过http传到server端，这样server就可以执行compute计算
