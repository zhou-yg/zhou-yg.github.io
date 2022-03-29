# 快速理解next.js

最近尝鲜真正投入在业务场景里使用了下nextjs，但在刚开始用不久，就产生了一个疑问：

> 想在next.js 初始启动的时候去连接数据库，应该怎么做呢？


在参考了官方示例之后（[https://github.com/vercel/next.js/tree/canary/examples/with-mongodb](https://github.com/vercel/next.js/tree/canary/examples/with-mongodb)）

我有点悟了，发现完全误解了nextjs的真正形态，简单来说：nextjs不是一个带了node服务的前端框架，而是一个集成加强型view的node server

上述的疑问背后的真正问题是：我不了解nextjs，我在尝试寻找nextjs的server的“入口”，而实际上nextjs整个就是server
