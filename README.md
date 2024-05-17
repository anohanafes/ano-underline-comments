
## ano-underline-comments

##目的：

* 划词评论：一个用户在任意文章框选内容后且对其进行评论的JS插件

##当前功能：

* 1.划词后内容区域会有标识，点击即会高亮显示(如果点击区域存在于多个划词区域中，会返回这些数据，你可以根据自己的的业务需求处理这些数据)

* 2.支持多人(每个人都可以看到所有这条篇文章的划词内容及其评论)

* 3.可删除评论(是否可以删除别人评论你可以根据自己的业务需求控制)

* 4.支持将上一次保存的所有划词区域数据回显到文章区域中(如果文章被修改，但如果上次保存的划词区域位置下还有内容，则会返回且数据中会带有内容被修改的标识)，你可以根据自己的业务需求来处理这些数据

##有问题反馈
这是我在 NPM上 的第三个插件，希望各位大佬在使用中有任何问题及性能优化建议，欢迎反馈给我，可以用以下联系方式跟我交流，感谢！

* 邮件(519855937#qq.com, 把#换成@)
* 微信:wqn30303
* QQ: 519855937

##tips：

在兴趣的驱动下,写一个`免费`的东西，有欣喜，也还有汗水，希望你喜欢我的作品，同时也能支持一下。

##关于作者

```javascript
var author = {
  nickName:"王秋宁",
  direction:"一个平平无奇的小前端~~~~"
}
```

##关于使用

* jq 项目中，可以直接 npm install ano-underline-comments 下载下来后，查看 jqDemo/jqPro.html 中的相关代码（line 220 ~ line 444）

```javascript
主 html文件，引入项目中的 konva.min.js( konva.js 的 CDN：https://unpkg.com/konva@4.0.0/konva.min.js，不太稳定，有时候请求不到)； 
参考 jqDemo/jqPro.html 中的 line 220 ~ line 444
html部分：
 
 ......

js部分：
    let domSel = '.content';
    let btnStyle = {};
    let selfPromptFn = function(){
        return new Promise((resolve,reject) => {
            resolve(...);

            let cancalFn = function () {
                ...
            };

            reject(cancalFn);
        })
    };
    let addTableDataFn = function(){};
    let tableRowClickCallback = function(){};
    let showDiffContentFn = function(){};
    let showAllContentFn = function(){};
    
    /**
     * 创建实例 UnderlineComments
     * 
     * @param {string} 参数一：内容区域DOM选择器
     ************************************************************
     * @param {Object} 参数二：划词后生成的评论按钮样式(格式：css 属性 ：css 属性值)
     ************************************************************
     * @param {Function} 参数三：划词后点击评论按钮触发的事件（请包装为一个 Promise 返回，resolve的值为评论内容，reject 的值为用户取消评论后做的事的回调函数） 
     ************************************************************
     * @param {Function} 参数四：用户单次操作后（划词完输入完评论内容后）要做的事（如：将数据显示在页面的一个已经创建好的表格或者任意ui组件里），插件会返回用户评论完后的数据（当前单次的划词内容，评论内容，ID）
     ************************************************************
     * @param {Function} 参数五：点击表格（或其他 ui组件）中单条数据的回调函数(点击的单条数据对应的划词区域id会通过参数返回)，如果不需要则传 null 就好；
                       （如：在表格UI组件中，点击单行表格数据高亮此行，这个参数的函数还会使得用户点击划词区域时触发对应表格行高亮；
                            如果你使用的是其他UI组件的话，需要将回调函数里面的内容换成你自己的业务逻辑）
     ************************************************************
     * @param {Function} 参数六：因为后台存的每条数据是相对于整篇文章的偏移量（也就是单条评论是文章中的第几个字开始到第几个字结束）
                                所以如果同样位置下划词区域的内容与上次保存的内容不一致的话（如：文章内容在上一次保存后被修改），会触发这个函数，参数是插件返回的对应的单条数据具体内容
     ************************************************************
     * @param {Function} 参数七：获取当前所有区域下的数据（包含同样位置下划词区域的内容与上次保存的内容不一致的项）
    */

    let thisSelTool = new UnderlineComments('.content', btnStyle, selfPromptFn, addTableDataFn, tableRowClickCallback, showDiffContentFn, showAllContentFn);
    // 初始化实例 UnderlineComments
    thisSelTool.init();
</script>
```


* MVVM框架 项目中，npm install ano-underline-comments

```javascript
js部分：
<script>
    import { UnderlineComments,chooseRectByTool,clearAllRectOrLineByTool } from 'ano-underline-comments';

    以 VUE 为例：

    /**
        * 创建实例 UnderlineComments
        * 
        * @param {string} 参数一：内容区域DOM选择器
        ************************************************************
        * @param {Object} 参数二：划词后生成的评论按钮样式(格式：css 属性 ：css 属性值)
        ************************************************************
        * @param {Function} 参数三：划词后点击评论按钮触发的事件（请包装为一个 Promise 返回，resolve的值为评论内容，reject 的值为用户取消评论后做的事的回调函数） 
        ************************************************************
        * @param {Function} 参数四：用户单次操作后（划词完输入完评论内容后）要做的事（如：将数据显示在页面的一个已经创建好的表格或者任意ui组件里），插件会返回用户评论完后的数据（当前单次的划词内容，评论内容，ID）
        ************************************************************
        * @param {Function} 参数五：点击表格（或其他 ui组件）中单条数据的回调函数(点击的单条数据对应的划词区域id会通过参数返回)，如果不需要则传 null 就好；
                        （如：在表格UI组件中，点击单行表格数据高亮此行，这个参数的函数还会使得用户点击划词区域时触发对应表格行高亮；
                                如果你使用的是其他UI组件的话，需要将回调函数里面的内容换成你自己的业务逻辑）
        ************************************************************
        * @param {Function} 参数六：因为后台存的每条数据是相对于整篇文章的偏移量（也就是单条评论是文章中的第几个字开始到第几个字结束）
                                    所以如果同样位置下划词区域的内容与上次保存的内容不一致的话（如：文章内容在上一次保存后被修改），会触发这个函数，参数是插件返回的对应的单条数据具体内容
        ************************************************************
        * @param {Function} 参数七：获取当前所有区域下的数据（包含同样位置下划词区域的内容与上次保存的内容不一致的项）
    */

    this.UnderLineObj =  new UnderlineComments('.content', btnStyle, selfPromptFn, addTableDataFn, tableRowClickCallback, showDiffContentFn, showAllContentFn);
    
    this.UnderLineObj.init();
</script>
```