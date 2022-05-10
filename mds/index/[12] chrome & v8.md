# chrome & v8源码探路
2021-05-09

> 冷知识：chromium的源码虽然也是git，但是托管在自建服务上的

代码仓库：
[https://chromium.googlesource.com/chromium/src.git/](https://chromium.googlesource.com/chromium/src.git/)

代码阅读器：
[https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/clipboard/;bpv=0;bpt=0](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/clipboard/;bpv=0;bpt=0)

需要学一点C++才能看得清楚明白
## 目录结构 

1. [third_party/](https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/third_party/) 第三方
   1. blink/ 排版渲染引擎（之前是webkit）
2. v8/ 外链到v8自己的目录 

v8是js的runtime，但是在浏览器有很多的API，如DOM，fetch等其实并不在v8里面，这些代码大部分在blink里

如 navigator.clipboard相关方法就在 

[https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/clipboard/clipboard_promise.h](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/clipboard/clipboard_promise.h) 

## 阅读姿势

- 了解整体的生命周期
   - 功能模块的职责
   - 功能模块的之间的调用机制和调用关系
- 针对具体功能再看具体代码
   - 要区分多平台

（to be continued）


