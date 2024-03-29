# design-pattern
2022-11-23

## 现状和问题
长年的UI 开发，仿佛让人意识到 视觉样式是有一定的内在规律的，而且这个规律往往跟 布局结构，数据状态的有一定的联系，但似乎又不是特别紧密，是在design-token 基础之上的更高级抽象

现在很多的组件库的组件，都会在提供相应的props 来配置视觉，实现的方式是 提供场景语义或者直接的样式属性 比如 primary,  font, color 相关，但是对于程序来说，在额外说明的情况下，无法识别出哪些 prop 其实属于视觉相关的，哪些是逻辑相关的


## 场景
由状态 驱动 出 视图样式，这属于“视觉逻辑”，即通过总结组件的状态，组件的语义构成，即很多组件可能是 layout结构不同，但他们在视觉上的语义结构是一致的

- Button
   - 视觉结构：
      - 背景块
      - 边框
      - 文字
- Checkbox
   - 视觉结构：	
      - 背景块
      - 边框
      - 文字（勾的颜色）

对于这两种结构，在就可以使用一种设计模式（包含了3者的），对这些视觉元素进行统一的设置

- 对应pattern
   - 状态入参：
      - 选中，hover，disable 等
   - 输出：
      - 背景：{  背景色，透明度 }
      - 边框：{  颜色，宽度 }
      - 文字：{ 大小，颜色 }

注意pattern的边界，它具备是纯粹的视觉逻辑，不影响布局结构，只对应前端的一小部分css<br />这样的解耦的好处在于：当组件layout结构发生了变化或修改时，只需要调整语义的部分，不再需要调整视觉逻辑。这个对于一个支持无限可拓展的组件库来说非常重要，这意味着即使用户完全修改了 旧组件的结构，也依然能保持视觉逻辑的正确应用。

缺点则是对于开发者 或 设计者来说，需要在编码或可视化编辑过程中，增加额外的视觉语义声明

## 视觉语义
是另一套基于 layout 结构的一种标记语言，建立 layout 到 vision 的映射，解决视觉语义缺失的问题<br />标记语言的2个职责：

- 表明不同种类：块，文字，层次块
   - 特点：具备bbox
   - markup： is-text，is-block
- 增加附加性视觉效果：边框，圆角
   - markup: has-border-round

为了避免过度抽象，is-block 只是做视觉语义不会在标签上添加 display: block 的css

视觉语义的可对应的值的特点

- 影响范围特征
   - 不影响bbox的
      - 颜色，透明度
   - 影响bbox（自身或父级
      - margin，padding，border，fontSize等
- 值的类型
   - 绝对值：10px，100%等
   - 相对值：
      - +20% 基于当前值再加20%

在没有特别的边界清晰下，原则上就不过度抽象，pattern应支持所有的feature

## pattern管理
在组件库的场景，pattern有非常多的结构，而且pattern之间可能还可以互相继承，组合。<br />pattern 本身也成了类似于 组件库的存在。至此，pattern 和 组件就形成一种互相交叉的 n: n 关系

既然pattern也可以有一个pattern库，那么pattern库该如何定义和分类呢？

- 方式一：是否依然保持组件库的命名方式，比如 button-pattern
   - 问题：其它组件库也可能应用这个pattern，这有点过于先入为主了
- 方式二：以视觉语义结构为核心，寻找新的定义，比如 character-active-pattern	
   - 问题：容易迷惑

方式二看起来更合理，但难度很大，需要透过现象看本质，问题点在于，这好像触及了知识的盲区

- 盲区1：根本不知道这个本质是什么，如何定义，如何描述
- 盲区2：不确定这作为命题是否成立，属于什么域，应该看什么资料

web里的一切元素都似乎可以归类为：表格，表单，控件 3大类，在看不清楚的情况下，或许可以先实践后学习


## 应用
应用的时机在组件的“内部”产生还是”外部“产生，pattern依赖于组件，如果普通的组件库那就只应用于内部，但是在这里，pattern可以应用于“中部”，这样的层次结构就变得很合理起来

- 状态 和 数据的逻辑
   - pattern
      - 最终注入到 layout

这样的好处在于，当 release出组件的时候，pattern产生的设置项就可以天然的标识出这个是视觉层的prop，并且开发组件dpattern的人就可以自主的预知和开放哪些prop会作为视觉相关的prop

pattern产生的视觉prop：
> text FontColor = 
> text （视觉语义）- Font （属性集） - Color （具体字段）
