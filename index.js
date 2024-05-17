/************
 * 具体实现思路可以查看 useTools...
 */

// 创建指定位数的随机数
let uuid = function (len, radix = 16) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    const uuid = []
    let i
    radix = radix || chars.length
    if (radix > chars.length) radix = chars.length
    if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)]
    } else {
        let r
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
        uuid[14] = '4'
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | (Math.random() * 16)
                uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]
            }
        }
    }
    return uuid.join('')
}

import {
        recursionListToFormat,
        _addCoordinateRange,
        _checkPosIsExist,
        cleanAllRectOrLine,
        _chooseRectById
       } from './tools';

import {c_layer_l_r,
        u_layer_l_r
       } from './konvaLogic';

export class UnderlineComments {
    // constructor(targetDom, plOpt = {}, plSelfFn, addTableDataFn,tableRowClick,tableRowClickCallback) {
    // constructor(targetDom, plOpt = {}, plSelfFn, addTableDataFn,tableRowClickCallback,showErrorMsg,showDiffContentFn,showAllContentFn) {
    constructor(targetDom, plOpt = {}, plSelfFn, addTableDataFn, tableRowClickCallback, showDiffContentFn, showAllContentFn) {
        // 根据传入的 plOpt 初始化评论按钮元素样式组

        this.plBtnStyle = {};

        for (let item in plOpt) {
            this.plBtnStyle[item] = plOpt[item];
        };

        this.mainDom = targetDom;
        this.nowRange = null;
        this.rangeList = [];
        this.allRectList = [];

        this.rectPosList = [];

        this.globalW = 0;
        this.globalH = 0;
        this.globalL = 0;
        this.globalT = 0;
        this.globalB = 0;
        this.globalR = 0;
        this.plBtnW = 50;
        this.plBtnH = 30;
        this.isMouseDownX = 0;
        this.isMouseDownY = 0;
        this.oldScrollX = 0;// 上一次横向滚动位置
        this.oldScrollY = 0;// 上一次纵向滚动位置

        this.blankFold = 0;

        this.plSelfFn = plSelfFn;
        this.addTableDataFn = addTableDataFn;
        this.tableRowClickCallback = tableRowClickCallback;
        // this.showErrorMsg = showErrorMsg;
        this.showDiffContentFn = showDiffContentFn;
        this.showAllContentFn = showAllContentFn;
        // this.tableRowClick = tableRowClick;
        this._observe = null;// 使用 ResizeObserver 构造函数创建 ResizeObserver 对象监听元素的尺寸变化

        this.createRange = this.createRange.bind(this);
        this.initCanvas = this.initCanvas.bind(this);
        this.init = this.init.bind(this);
        this.addMouseUpFn = this.addMouseUpFn.bind(this);
        this.addMouseDownFn = this.addMouseDownFn.bind(this);
        this.listenSizeChange = this.listenSizeChange.bind(this);
        this.createPlBtn = this.createPlBtn.bind(this);
        this.plFn = this.plFn.bind(this);
        this.setRangeList = this.setRangeList.bind(this);
        this.setTableData = this.setTableData.bind(this);
        this.createLayer = this.createLayer.bind(this);
        this.createRect = this.createRect.bind(this);
        this.updateRects = this.updateRects.bind(this);
        this.updateAllRectListVal = this.updateAllRectListVal.bind(this);
        this.delOnceRange = this.delOnceRange.bind(this);
        this.changePosVal = this.changePosVal.bind(this);
        this.showOldData = this.showOldData.bind(this);
        this.computeBlankFold = this.computeBlankFold.bind(this);
        // this.showDiffContentInfo = this.showDiffContentInfo.bind(this);
        this.findOneContentInfo = this.findOneContentInfo.bind(this);
        this.findAllContentInfo = this.findAllContentInfo.bind(this);
    }
    createRange() {
        let _this = this;
        return new Promise((resolve, reject) => {
            // 获取用户单次选中的区域相关信息...
            const {
                startContainer, // 起始节点
                startOffset, // 起始节点偏移量
                endContainer, // 终止节点
                endOffset // 终止节点偏移量
            } = document.getSelection().getRangeAt(0);

            // 使用range对象记录用户每次选中的区域
            let once_range = document.createRange();

            let uuidFormat;

            // 每次生成 uuid 时，需要检测下当前 RangeList 中是否已经存在当前创建的 id，如果有重新生成...
            function createUuid() {
                let uuidFormatOnce = uuid(8);

                if (!_this.rangeList.some((item) => { return uuidFormatOnce == item._rId })) {
                    // uuidFormat = uuid(8);
                    return uuid(8);
                }
                else {
                    createUuid();
                }
            }

            uuidFormat = createUuid();

            /***
             * 这里的 RangeID 建议是存入数据时让后台重新生成下再存，不然前端只能保证在当前页面中ID不重复，同一时间不同用户在页面上创建的 ID 有小概率会一样......
             */
            once_range["_rId"] = uuidFormat;// range 的唯一标识

            once_range.setStart(startContainer, startOffset);// 记录页面上选中区域的开始位置并存入 Range 对象中
            once_range.setEnd(endContainer, endOffset);// 记录页面上选中区域的结束位置并存入 Range 对象中

            // 如果用户只是点击了内容区域的任何地方而非框选，可以通过 range.collapsed （开始点和结束点是否位于相同的位置） 这个属性判断是否是点击了页面而非框选，从而是否需要生成一个Range对象...
            if (!once_range.collapsed) {
                resolve(once_range);
            }
            else {
                resolve(null);
            }
        })
    }
    initCanvas() {
        let _this = this;
        return new Promise((resolve, reject) => {

            if (document.querySelector("._konva") && document.querySelector("._konva") != null) {
                document.querySelector("._konva").remove();
            }

            // 获取目标元素几何尺寸
            let targetDom = document.querySelector(_this.mainDom);
            targetDom.style.position = 'relative';
            // let { width, height, left, right, bottom, top } = targetDom.getBoundingClientRect();
            let { width, height } = targetDom.getBoundingClientRect();

            // 记录当前 canvas 画布（主体内容区域）几何尺寸
            _this.globalW = width;
            _this.globalH = height;
            // _this.globalT = top;
            // _this.globalR = right;
            // _this.globalB = bottom;
            // _this.globalL = left;

            // 使用 createDocumentFragment（其实对于添加一个DOM使用文档碎片不会提升效率,所以改为直接创建）
            // let canvasDomFrag = document.createDocumentFragment();

            // 创建 canvas 元素
            let canvasDom = document.createElement('div');

            canvasDom.style.position = 'absolute';
            canvasDom.style.top = 0;
            canvasDom.style.left = 0;
            canvasDom.style.pointerEvents = 'none';
            canvasDom.classList.add('_konva');

            // canvasDomFrag.appendChild(canvasDom);

            targetDom.appendChild(canvasDom);


            /*** konva 创建画布步骤： 
             *  1.先创建layer --- 图层
             *  2.再创建stage --- 舞台（画布）
             *  3.将创建好的layer添加至舞台（画布）
             * */

            _this._layerGlobal = new Konva.Layer();

            _this._stageGlobal = new Konva.Stage({
                container: canvasDom,   // id of container <div>
                width,
                height
            });

            _this._stageGlobal.add(_this._layerGlobal);
            resolve('200');
        })
    }
    listenSizeChange() {
        let _this = this;
        let targetDom = document.querySelector(_this.mainDom);// 获取目标元素
        // 使用 ResizeObserver 构造函数创建 ResizeObserver 对象监听元素的尺寸变化
        _this._observe = new ResizeObserver(entries => {
            let targetDom = document.querySelector(_this.mainDom);// 每次变化时要重新获取目标元素
            if (targetDom && targetDom != null) {
                let { width, height, left, top } = targetDom.getBoundingClientRect();

                _this.globalW = width;// 当前canvas画布的宽 重新赋值
                _this.globalH = height;// 当前canvas画布的高 重新赋值
                _this.globalL = left;// 当前canvas画布距离屏幕左边距离 重新赋值
                _this.globalT = top;// 当前canvas画布距离屏幕上边距离 重新赋值

                _this._stageGlobal.setSize({ width, height });


                if (_this.rangeList.length != 0) {
                    _this.updateAllRectListVal();
                }

                if (document.querySelector(".plEle") && document.querySelector(".plEle") != null) {
                    document.querySelector(".plEle").remove();
                }
            }
        })

        _this._observe.observe(targetDom);
    }
    // 创建评论按钮
    createPlBtn(e) {
        
        let _this = this;
        // 获取内容区域的元素节点
        let contentDom = document.querySelector('.content');
        // 为按钮父元素（内容区域元素）设置相对定位
        contentDom.style.position = 'relative';
        // 创建DOM
        let btnDom = document.createElement('div');
        btnDom.innerText = "评论";

        // 根据传参设置样式
        for (let styleItem in _this.plBtnStyle) {
            btnDom.style[styleItem] = _this.plBtnStyle[styleItem];
        }

        
        // 获取评论按钮父元素获取相对于视口中的位置和宽高信息
        let pNodePosInWindow = contentDom.getBoundingClientRect();
        
        // 为按钮元素设置绝对定位，并设置位置为当前鼠标抬起时在页面中的位置
        btnDom.style.position = "absolute";
        
        // 因为不知道当前文章区域 .content 在页面中的嵌套关系，评论按钮是在 .content 下的，所以评论按钮的位置应该是 当前鼠标的位置 - 其包含块的距视口最左侧和距视口最顶部 的距离

        btnDom.style.left = (e.x - pNodePosInWindow.left) + 'px';// 鼠标抬起时的横坐标信息 = 当前鼠标点击横坐标 - 父元素距离视口最左边的距离
        btnDom.style.top = (e.y - pNodePosInWindow.top) + 'px';// 鼠标抬起时的纵坐标信息 = 当前鼠标点击纵坐标 - 父元素距离视口最上边的距离

        btnDom.classList.add("plEle");
        // debugger;

        btnDom.addEventListener('click', _this.plFn);

        contentDom.appendChild(btnDom);
    }
    // 创建每行所占区域
    createRect(resRange) {
        let _this = this;
        let _rectList = [];

        _rectList = resRange.getClientRects();

        _rectList["_rectType"] = resRange["_rType"];// --- rectType ---
        _rectList["_rectId"] = resRange["_rId"];// --- rectId ---

        let domEle = document.querySelector(_this.mainDom);

        let formatList = recursionListToFormat(domEle);

        for (let item of formatList) {
            if (resRange["startContainer"] == item._node) {
                _rectList["_start_pos"] = resRange["startOffset"] + item["_nodeStartPos"];// --- rectId ---
            }
            if (resRange["endContainer"] == item._node) {
                _rectList["_end_pos"] = resRange["endOffset"] + item["_nodeStartPos"];// --- rectId ---
            }
        }

        _this._rectList = _rectList;

        _this.allRectList.push(_rectList);

        _addCoordinateRange(_this.allRectList);
    }
    // 更新已有区域
    updateRects() {

    }
    plFn() {
        let _this = this;

        // 当用户点击时，为了增加体验，应该将评论按钮删除......
        Promise.resolve().then(() => {
            if (document.querySelector(".plEle") != null) {
                document.querySelector(".plEle").remove();
            };
        })

        /**
         * 在JS项目中如果不使用任何 ui 库的情况下，可以使用js触发原生的 prompt 框，但是原生的 prompt 框会阻碍 js 主线程的执行
         * 使用 setTimeout 将 确认函数 添加到 上述代码 --- 评论按钮消失 的任务队列之后，避免上述代码（评论按钮消失）运行阻塞
        */

        setTimeout(() => {


            _this.plSelfFn().then((res) => {

                _this.createLayer().then(() => {
                    let thisPlData = {
                        hcnr: _this.nowRange.toString(),// 当前选中内容
                        plnr: res,
                        // id: _this._layerGlobal.id,
                        id: _this.nowRange._rId,
                        sPos: _this._rectList._start_pos,
                        ePos: _this._rectList._end_pos
                    };

                    _this.rectPosList.push({
                        hcnr: _this.nowRange.toString(),// 当前选中内容
                        plnr: res,
                        // id: _this._layerGlobal.id,
                        id: _this.nowRange._rId,
                        sPos: _this._rectList._start_pos,
                        ePos: _this._rectList._end_pos,
                        blankFold: _this.blankFold
                    })

                    _this.setRangeList();

                    _this.setTableData(thisPlData);
                })
                // _this.pushLayerToList(res);
            }).catch((eFn) => {
                // 进入这里的一定是前面参数中定义的用户取消事件行为（根据 typeof 是否为 function 判断），否则有可能是代码书写错误或其他未知错误，抛出错误，便于调试
                if (typeof (eFn) == 'object') {
                    throw eFn
                }
                else if (typeof (eFn) == 'function') {
                    eFn();
                }
            });
        }, 0)
    }
    /**
     * 深拷贝对象，不影响原数据
     * @param {Object} dataSource 数据源
     * @returns 
     */
    deepClone(dataSource) {
        if (!dataSource && typeof dataSource !== 'object') {
            throw new Error('error arguments', 'deepClone')
        }

        let result = {};

        for (let item in dataSource) {
            if (dataSource[item] != null && dataSource[item].constructor == Object) { // 判断子元素是否为对象，是则继续递归克隆，否则直接赋值
                result[item] = deepClone(dataSource[item]);
            }
            else {
                result[item] = dataSource[item];
            }
        }

        return result;
    }
    /**
     * 回显已保存的数据
     * 1.遍历数据源
     * 2.根据数据源创建 range --- 一条数据对应一个 range 
     * 3.创建 rectList 
     * 4.上显表格
     * @param {*} dataList 数据源
     */
    showOldData(dataListSource) {
        let _this = this;
        let dataList = [];

        // 这里需要深拷贝数据源，防止后续操作改变源数据

        for (let item of dataListSource) {
            dataList.push(_this.deepClone(item));
        }

        // 绘制画布并使用 ResizeObserver 构造函数创建 ResizeObserver 对象监听元素的尺寸变化
        this.initCanvas().then((res) => {
            if (res == '200') {
                this.listenSizeChange();
            }
        });

        let nodeForRange = document.querySelector(_this.mainDom);
        _this.rectPosList = dataList;// 将后台返回的值赋值给需保存传入后台的数据列表中，因为后台返回的值就是上次保存后的值

        // let _range = document.createRange();// 创建一个range对象
        //     _range.selectNodeContents(nodeForRange);// 把指定的 node 节点的所有子节点信息填充到范围range内
        // let formatList = recursionListToFormat(_range.commonAncestorContainer);// 将区域内的文章进行段落分割（包含空白行）
        let formatList = recursionListToFormat(nodeForRange);// 将区域内的文章进行段落分割（包含空白行）
        // let r_range = document.createRange();// 创建一个新的 range 对象用来放置之前存的数据
        // r_range.setStart(document.querySelector(_this.mainDom),0);
        // r_range.setEnd(document.querySelector(_this.mainDom),dataList[dataList.length - 1].ePos);


        function addRange(onceData) {
            let c_range = document.createRange();// 创建一个新的 range 对象用来放置之前存的数据

            let startContent,
                // startContentPrev,
                endContent;
            // endContentPrev;

            /**
             * 遍历已分割的所有文章段落
             * 如果传入数据项的起始文字偏移量在某一段占据整篇文章的起止偏移量内，那么满足条件的那一段为开始段落
             * 如果传入数据项的终止文字偏移量在某一段占据整篇文章的起止偏移量内，那么满足条件的那一段为结束段落
             * 
             * 解释：当传入的数据为{ ...
             *                     sPos:100, --- 数据库中存储的划词区域在文章中的开始文字位置
             *                     ePos:196, --- 数据库中存储的划词区域在文章中的终止文字位置
             *                     ...
             *                   }
             * 
             *      假设文章有四段：
             *          第一段是文章的 0 ~ 110 个字
             *          第二段是文章的 111 ~ 190 个字
             *          第三段是文章的 191 ~ 201 个字
             *          第四段是文章的 202 ~ 365 个字
             * 
             *      就说明当前划词区域是从文章的第100个字所在的段落 到 文章的第196个字所在的段落，也就是划词区域从第一段开始到第三段结束
             */

            // for(let item of formatList){
            for (let i = 0; i < formatList.length; i++) {
                let item = formatList[i];
                if (
                    onceData.sPos >= item._nodeStartPos &&
                    onceData.sPos <= item._nodeEndPos
                ) {
                    startContent = item;
                }

                if (
                    onceData.ePos >= item._nodeStartPos &&
                    onceData.ePos <= item._nodeEndPos
                ) {
                    endContent = item;
                }
            }


            if (startContent == undefined || endContent == undefined) {
                return false;
            }


            // 设置 range 的起始位置和起始文本内容
            c_range.setStart(startContent._node, onceData.sPos - startContent["_nodeStartPos"]);
            c_range.setEnd(endContent._node, onceData.ePos - endContent["_nodeStartPos"]);

            // 如果根据之前存储时的位置生成的内容不等于之前存储时的划词文章内容时，表示之前的划词区域内容已被修改，则之前存储的评论也就没什么意义了
            if (c_range.toString() != onceData.hcnr) {
                // _this.showErrorMsg({
                //     errMsg:'content404',
                //     oldHcnr:onceData.hcnr,
                //     newHcnr:c_range.toString()
                // });

                c_range["_rType"] = 'diffContent';

                // return "diffContent";
            }

            // const rangeId = uuid(8); // --- rangeID ---
            const rangeId = onceData['id']; // --- rangeID ---
            c_range["_rId"] = rangeId;
            return c_range;
        }

        let domEle = document.querySelector(_this.mainDom);// 获取当前画布元素

        let allStyle = document.defaultView.getComputedStyle(domEle, null);// 获取所有的内部样式
        let domEleLeft = allStyle.paddingLeft;
        let domEleRight = allStyle.paddingRight;

        for (let item of dataList) {

            let thisBlankFold = _this.computeBlankFold();

            item.sPos -= item.blankFold - thisBlankFold;
            item.ePos -= item.blankFold - thisBlankFold;

            let _thisRange = addRange(item);

            if (_thisRange === false) {
                // _this.showErrorMsg({
                //     errMsg:'pos404',
                // });

                continue;
            }

            // if(_thisRange == 'diffContent'){
            //     continue;
            // }

            _this.createRect(_thisRange);

            _this.rangeList.push(_thisRange);// 将 range 添加至 rangeList 中

            let thisPlData = {};


            // }


            if (_thisRange._rType == 'diffContent') {
                c_layer_l_r(
                    _this._rectList,
                    _this.globalW,
                    _this.globalH,
                    _this.globalL,
                    _this.globalT,
                    parseFloat(domEleLeft) + parseFloat(domEleRight),
                    _this._layerGlobal,
                    true
                );
            }
            else {
                thisPlData = {
                    hcnr: _thisRange.toString(),// 当前选中内容
                    plnr: item.plnr,
                    id: _thisRange._rId,
                    sPos: item.sPos,
                    ePos: item.ePos,
                    _tType: _thisRange._rType
                    // sPos:itemSpos,
                    // ePos:itemEpos
                };

                c_layer_l_r(
                    _this._rectList,
                    _this.globalW,
                    _this.globalH,
                    _this.globalL,
                    _this.globalT,
                    parseFloat(domEleLeft) + parseFloat(domEleRight),
                    _this._layerGlobal
                );

                _this.setTableData(thisPlData);
            }

        }

        _this.nowRange = null;
    }
    /**
     *  // 12A 3 --- 2
        // 123456A  7 --- 6

        nowPos = oldPos - (oldBlankFold - newBlankFold)

        7 - (6 - 2) = 3
        ? = 3 - (2 - 6) = 7

     * 因为一段文章的源代码中开头会有空白折叠，所以储存的数据中的 sPos（起始文字偏移量）= 页面中字所在文章中的位置 + 文章开头的空白折叠字符数量
     * 比如：
     *     代码中：<div>
     *               测试代码一二三 
     *            </div>
     * 
     *     上述代码中 第一个字 “测” 的实际在文档中的位置其实应该是 1 + 文章开头的空白折叠字符数量
     * 
     * 需要将存储的划词区域在之前文章中的偏移量位置(文章中的第几个字)换算成在现在文章的偏移量位置：
     *      新偏移量 = 旧偏移量 - （旧空白折叠数量 - 新空白折叠数量）
     *      newOffset = oldOffset - (oldBlankFold - newBlankFold)
     * 
     * 比如：之前文章空白折叠为 2 ，划词区域是从 第 3 个字开始的，那么这个字的实际偏移量是 5;
     *      若现在文章的空白折叠为 6，根据上述推论算出第三个字的当前偏移量为 3 -（2 - 6）= 7；
     *      
     * 如何算出空白折叠:使用当前文章中的第一个字（innerText）在 当前文章区域DOM的 innerHTML 中的下标
     *
     */
    computeBlankFold() {
        let thisInnerHTML = document.querySelector(this.mainDom).innerHTML;
        let thisInnerText = document.querySelector(this.mainDom).innerText;

        return thisInnerHTML.indexOf(thisInnerText[0]);
    }
    setRangeList() {// 将所有的range存储起来
        let _this = this;
        _this.rangeList.push(_this.nowRange);// 将 range 添加至 rangeList 中

        // let posList = _this.nowRange.getClientRects();// 获取当前用户选中内容某一块区域的每一行数据

        _this.nowRange = null;
    }
    createLayer() {
        let _this = this;
        /**
       * 调用公共方法 c_layer，参数为：1.当前Range在屏幕上所占的区域  2.当前画布宽  3.当前画布高  4.当前画布距离屏幕左边距离  5.当前画布距离屏幕上边距离
       * 创建 layer，并将其添加至 layerList 中
       */

        return new Promise((resolve, reject) => {

            if (_this.nowRange.collapsed) {// 判断当前range是否开始点和结束点一致，如果一致，就不用在 layer 层里创建图元，没有意义
                return;
            }

            let domEle = document.querySelector(_this.mainDom);// 获取当前画布元素

            let allStyle = document.defaultView.getComputedStyle(domEle, null);// 获取所有的内部样式
            // let btnLeft = parseFloat(domAllStyle.paddingLeft);
            let domEleLeft = allStyle.paddingLeft;
            let domEleRight = allStyle.paddingRight;
            // debugger;

            // 获取当前 canvas 画布（主体内容区域）几何尺寸并更新全局的画布全局尺寸......

            let targetDom = document.querySelector(_this.mainDom);
            let { width, height, left, right, bottom, top } = targetDom.getBoundingClientRect();

            _this.globalW = width;
            _this.globalH = height;
            _this.globalT = top;
            _this.globalR = right;
            _this.globalB = bottom;
            _this.globalL = left;

            c_layer_l_r(
                _this._rectList,
                _this.globalW,
                _this.globalH,
                _this.globalL,
                _this.globalT,
                parseFloat(domEleLeft) + parseFloat(domEleRight),
                _this._layerGlobal
            );

            resolve();
        })
    }
    updateLayer() {

        /**
         * 调用工具类方法 u_layer，参数为：1.当前Range在屏幕上所占的所有行区域  2.当前画布宽  3.当前画布高  4.当前画布距离屏幕左边距离  5.当前画布距离屏幕上边距离
         * 更新 layer
         */
        let _this = this;

        let domEle = document.querySelector(_this.mainDom);
        let allStyle = document.defaultView.getComputedStyle(domEle, null);// 获取所有的内部样式
        let domEleLeft = allStyle.paddingLeft;
        let domEleRight = allStyle.paddingRight;

        u_layer_l_r(
            _this.allRectList,
            _this.globalW,
            _this.globalH,
            _this.globalL,
            _this.globalT,
            parseFloat(domEleLeft) + parseFloat(domEleRight),
            _this._layerGlobal
        );
    }
    /**
     * 目标区域尺寸变化后，需要更新所有用户选中区域 range 的新位置...
     * 1.遍历当前页面里的所有 range
     * 2.因为 之前的处理逻辑中，一个 range 必然会在 allRectList 中有一个对应的 rectList（区域在页面中占据的每一行的位置信息）
     * 3.通过 rangeid ---> rId 找到属于自己的几何位置信息并更新
     * 4.调用 updateLayer 方法更新当前layer中的所有图元（下划线、用户点击某行后高亮的背景色）
     */
    updateAllRectListVal() {
        let _this = this;
        // 遍历当前所有的 range
        for (let item of this.rangeList) {
            let _rangeId = item._rId;// 记录当前遍历的 rangeId
            let _rangeType = item._rType;// 记录当前遍历的 rangeId
            let _rectIndex;// 记录符合条件的 rect 下标
            let _layerId = _this._layerGlobal.id; // 获取当前 layerId
            // let _newthisRectsList = item.getClientRects();// 当前Range变化后在屏幕上所占的区域
            let _newthisRectsList = item.getClientRects();// 当前屏幕变化后当前遍历的Range在屏幕上所占的新全部区域
            _newthisRectsList["_rectId"] = _rangeId;// 为新区域range 的rect赋值为 rangeID
            _newthisRectsList["_rectType"] = _rangeType;// 为新区域range 的rect赋值为 rangeID

            _rectIndex = _this.allRectList.findIndex(i => i._rectId === item._rId);// 根据 range 的 id 查找对应的 RectList

            if (_this.allRectList[_rectIndex]) {// 如果存在
                _this.allRectList[_rectIndex] = _newthisRectsList;// 将同一个range中的位置信息更新 
                _addCoordinateRange(_this.allRectList);// 为目标数组添加横纵坐标范围
            }

            if (_layerId) {
                _this.updateLayer(_newthisRectsList, _layerId);// 更新layer中的所有图元
            }

            _this._layerGlobal.batchDraw();// 批量更新...
        }
    }
    setTableData(resData) {// 添加表格数据
        this.addTableDataFn(resData);
    }
    // 监听鼠标按下事件（记录当前用户按下鼠标的位置，为了避免因为用户没划词出现评论按钮的情况）
    addMouseDownFn() {
        let _this = this;
        document.querySelector(_this.mainDom).addEventListener('mousedown', (e) => {
            _this.isMouseDownX = e.x;
            _this.isMouseDownY = e.y;
        })
    }
    // 监听鼠标抬起事件（用户已经划词）
    addMouseUpFn() {
        let _this = this;

        /***
         * 点击 content 区域外部时不会触发 content区域的 mouseup事件，
           但是当点击 content 区域时,因为同时监听了 content 区域的鼠标抬起事件（mouseup）
           所以在视口的 mouseup 事件监听里需要设置在 addEventListener 的第三个参数为 true，使得 window 的 mouseup 事件从捕获阶段（事件由外到内）就响应
           那么逻辑会是： 1.先触发 window 的 mouseup，移除评论按钮（如果页面中有的话...）
                         2.再触发 content 的 mouseup...（详见 line 748）
         */ 
            
        window.addEventListener('mouseup', (e) => {
            /**
             *  因为监听了评论按钮 ---> .plEle 的点击事件，且在JS中 click事件执行时机 会晚于 mouseup事件
             *  所以正常情况下会先触发下面代码：评论按钮被删除（点击评论按钮符合当前 mouseup事件 的判断条件），意味着评论按钮的 click事件永远不会触发
             *  故而使用 requestAnimationFrame 将 下面代码 延迟到 评论按钮 click事件 的 后面执行
            */
            requestAnimationFrame(() => {
                if (document.querySelector(".plEle") != null) {
                    document.querySelector(".plEle").remove();
                }
            })
        },true);

        document.querySelector(_this.mainDom).addEventListener('mouseup', (e) => {
            /**
             *  因为监听了评论按钮 ---> .plEle 的点击事件，且在JS中 click事件执行时机 会晚于 mouseup事件
             *  所以正常情况下会先触发下面代码：评论按钮被删除（点击评论按钮符合当前 mouseup事件 的判断条件），意味着评论按钮的 click事件永远不会触发
             *  故而使用 requestAnimationFrame 将 下面代码 延迟到 评论按钮 click事件 的 后面执行
            */
            requestAnimationFrame(() => {
                /**
                 * 因为用户点击页面或者点击评论按钮时也会触发mouseup事件，但是这时候不需要创建 range、range 所对应的 rect、绘制konva.line、绘制konva.rect以及数据上显表格
                 * 所以需要通过 用户鼠标抬起的位置是否等于按下的位置 来判断是否为点击触发而非框选触发的 mouseup，从而是否执行后续创建 Range 操作...... 
                */  
                if (_this.isMouseDownX == e.x
                    &&
                    _this.isMouseDownY == e.y
                ) 
                {
                    // alert(1)
                    if (document.querySelector(".plEle") != null) {
                        document.querySelector(".plEle").remove();
                    }
                    return;
                }

                // alert(1)

                _this.createRange().then((rangeObj) => {
                    _this.nowRange = rangeObj;

                    _this.createRect(rangeObj);
                    /**
                     * 防止多次划词出现的多个评论按钮
                     */
                    // debugger;
                    if (document.querySelector(".plEle") == null) {
                        _this.createPlBtn(e);
                    }
                    else {
                        document.querySelector(".plEle").remove();
                        _this.createPlBtn(e);
                    }
                }).catch(() => {
                    return;
                })

            })
        });
    }
    /**
     * 根据 rangeId 或 rectId 删除某个range并重绘layer图层和删除相关数据组中的数据...
     **/
    delOnceRange(rectId) {
        let _this = this;
        // 获取图层Id
        let _layerId = _this._layerGlobal.id;

        // 通过 列表ID 查找当前要删除的 range 覆盖的所有行区域
        let allRectIndex = _this.allRectList.findIndex(i => i._rectId === rectId);
        // 通过 列表ID 查找当前要删除的 range
        let rangeIndex = _this.rangeList.findIndex(i => i._rId === rectId);
        // 通过 列表ID 查找当前要删除的所有划词区域具体位置信息项
        let rectPosIndex = _this.rectPosList.findIndex(i => i.id === rectId);

        _this.rangeList.splice(rangeIndex, 1);// 从全部range列表中移除指定range
        _this.allRectList.splice(allRectIndex, 1);// 从全部Rect列表中移除指定Rect
        _this.rectPosList.splice(rectPosIndex, 1);// 从全部RectPos列表中移除指定项

        let _newRangeAllList = _this.allRectList;// 当前Range变化后在屏幕上所占的区域组

        // if(_newRangeAllList.length == 0){
        //     _this._layerGlobal.destroyChildren();
        //     _this._layerGlobal.batchDraw();
        // }  
        // else{
        _this.updateLayer(_newRangeAllList, _layerId);// 更新layer
        // }   
    }
    /**
     * 改变页面上所有划词区域及其在页面上占据的每行区域的位置
     * 目前的判定条件为用户当前鼠标点击的位置是否在每行区域的坐标范围（属性 _posFormat_ 中的 xStart，xEnd，yStart，yEnd） 内
     * 所以可以通过每次滚动时改变每行区域的 _posFormat_ 中的相关属性实现效果
     * @param {Object} valObj 每次滚动的位差
    */
    changePosVal(valObj) {
        let _this = this;
        // 获取所有划词区域组
        const ALLRECTLIST = _this.allRectList;
        for (let item of ALLRECTLIST) {
            for (let items of Array.from(item)) {
                if (items["_posFormat_"]) {
                    items["_posFormat_"]["xStart"] += valObj['x'];// 滚动后当前行的起始水平位置
                    items["_posFormat_"]["xEnd"] = items["_posFormat_"]["xStart"] + items['_posFormat_']['w'];// 滚动后当前行的终止水平位置（起始水平位置 + 当前行区域占据的宽度）
                    items["_posFormat_"]["yStart"] -= valObj['y'];// 滚动后当前行的起始垂直位置
                    items["_posFormat_"]["yEnd"] = items["_posFormat_"]["yStart"] + items['_posFormat_']['h'];// 滚动后当前行的终止垂直位置（起始垂直位置 + 当前行区域占据的高度）
                }
            }
        }
    }
    /**
     * 查找当前显示的划词区域内容与之前存储的划词区域内容不一致的划词区域
     * thisClickRect：遍历 allRectList（所有区域列表），判断当前点击的是哪一个区域
     * isDiffBlur：若 thisClickRect 有值，则通过 thisClickRect 的 _rectType 属性是否为 diffContent 判断是否当前划词区域已和之前存储的内容不一致
     * thisSaveItem：若 isDiffBlur 为 true，则遍历上一次存储的所有区域坐标，找出已被修改的划词区域的具体文本信息（划词内容，评论内容...）
     * thisRangeVal：遍历当前所有 range ，找出当前鼠标点击区域的 range 的文本
     * 
     * @param {*} resultId --- 当前点击区域是否为已划词区域（有值则是，反之则无）
     * @param {*} allRectList --- 当前所有划词区域
     * @param {*} allRectPosList --- 当前所有划词区域位置
     * @param {*} allRangeList --- 当前所有划词区域的 Range
     */
    findDiffContentInfo(resultId, allRectList, allRectPosList, allRangeList) {
        let thisSaveItem = null;
        let isDiffBlur = null;
        let thisClickRect = null;
        let thisRangeVal = '';

        // 当前点击区域是否为已划词区域（有值则是，反之则无）
        if (resultId !== "") {
            thisClickRect = allRectList.filter((item) => {
                return item._rectId == resultId
            })[0];

            thisRangeVal = allRangeList.filter((item) => {
                return item._rId == resultId
            })[0];

            if (thisClickRect) {
                isDiffBlur = thisClickRect._rectType == "diffContent";
            }

            if (isDiffBlur) {
                thisSaveItem = allRectPosList.filter((item) => {
                    return item.id == resultId
                })[0];
            }
        }

        if (thisSaveItem != null) {
            thisSaveItem['nowHcnr'] = thisRangeVal.toString();
        }

        return thisSaveItem;
    }

    /**
     * 查找指定的某个区域ID的文本信息
     * 
     * thisClickRect：遍历 allRectList（所有区域列表），判断当前点击的是哪一个区域
     * isDiffBlur：若 thisClickRect 有值，则通过 thisClickRect 的 _rectType 属性是否为 diffContent 判断是否当前划词区域已和之前存储的内容不一致
     * thisSaveItem：遍历当前页面中的所有区域，找出划词区域的具体文本信息（划词内容，评论内容...），若 isDiffBlur 为 true，则添加标识 isDiff 用来表示当前划词内容是否与之前的一致
     * thisRangeVal：遍历当前所有 range ，找出当前鼠标点击区域的 range
     * 
     * @param {*} resultId --- 当前点击区域是否为已划词区域（有值则是，反之则无）
     * @param {*} allRectList --- 当前所有划词区域
     * @param {*} allRectPosList --- 当前所有区域列表具体位置
     * @param {*} allRangeList --- 当前所有划词区域的 Range 对象
     */
    findOneContentInfo(resultId, allRectList, allRectPosList, allRangeList) {
        let thisSaveItem = null;
        let isDiffBlur = null;
        let thisClickRect = null;
        let thisRangeVal = '';

        // 当前点击区域是否为已划词区域（有值则是，反之则无）
        if (resultId !== "") {

            // thisClickRect：遍历 allRectList（所有区域列表），判断当前点击的是哪一个区域
            thisClickRect = allRectList.filter((item) => {
                return item._rectId == resultId
            })[0];

            // isDiffBlur：若 thisClickRect 有值，则通过 thisClickRect 的 _rectType 属性是否为 diffContent 判断是否当前划词区域已和之前存储的内容不一致
            if (thisClickRect) {
                isDiffBlur = thisClickRect._rectType == "diffContent"
            }

            // 遍历当前页面中的所有区域，找出划词区域的具体文本信息（划词内容，评论内容...）
            thisSaveItem = allRectPosList.filter((item) => {
                return item.id == resultId
            })[0];

            // thisRangeVal：遍历当前所有 range ，找出当前鼠标点击区域的 range
            thisRangeVal = allRangeList.filter((item) => {
                return item._rId == resultId
            })[0];
        }

        // 如果当前点击区域无值，return null......
        if (thisSaveItem == undefined) {
            return null;
        }

        // 根据 isDiffBlur，添加标识 isDiff 用来表示当前划词内容是否与之前的一致
        if (isDiffBlur) {
            thisSaveItem['isDiff'] = true;
        }
        else {
            thisSaveItem['isDiff'] = false;
        }

        // 若当前点击区域存在有效的 range，获取目前这个划词区域的当前文本内容
        if (thisSaveItem != null) {
            thisSaveItem['nowHcnr'] = thisRangeVal.toString();
        }

        return thisSaveItem;
    }
    /**
     * 找出指定区域ID组内每个区域的所有文本信息
     * 
     * @param {Array} allList 指定区域ID组
     * @param {Array} allRectList 所有区域列表
     * @param {Array} allRectPosList 当前所有区域列表具体位置
     * @param {Array} allRangeList 当前所有划词区域的 Range 对象
     * @returns resultAllList 指定区域ID组内每个区域的所有文本信息
     */
    findAllContentInfo(allList, allRectList, allRectPosList, allRangeList) {
        let _this = this;

        let resultAllList = [];

        for (let item of allList) {
            resultAllList.push(_this.findOneContentInfo(item, allRectList, allRectPosList, allRangeList))
        }

        return resultAllList;
    }
    // 将指定区域ID组内每个区域的所有文本信息传入展示内容区域中所有满足条件的划词区域处理函数
    showAllContentInfo(resObjList) {
        /****
         * 展示内容区域中有可能存在 null
         */

        this.showAllContentFn(resObjList);
    }
    init() {
        let _this = this;

        _this.blankFold = _this.computeBlankFold();

        this.initCanvas().then((res) => {
            if (res == '200') {
                this.listenSizeChange();
            }
        });
        this.addMouseDownFn();
        this.addMouseUpFn();
        let domEle = document.querySelector(_this.mainDom);
        domEle.addEventListener("click", function (eve) {
            const ALLRECTLIST = _this.allRectList;
            const ALLRANGELIST = _this.rangeList;
            
            // console.log('976 ---> ',eve);
            
            /** 
            * 如果点击内容区域的某一个位置时，需要获取当前用户鼠标点击位置是否有划词区域
            * 注意：需要判断当前鼠标行为的后续函数执行保证是在 click 而非 mouseup
            */

            _checkPosIsExist(eve, ALLRECTLIST, '_rectId').then((resultList) => {

                /**
                 * 因为同时监听了 mouseup 事件，所以如果不加限制，会导致鼠标点击某一块位置时，同时会触发 mouseup 事件
                 *   因为 mousedown 事件里已经记录了鼠标按下的坐标
                 *   所以只需判断当前点击时的鼠标按下的坐标和 mousedown 的坐标是否一直就可以判断是不是点击而非框选
                 */

                if (_this.isMouseDownX == eve.x
                    &&
                    _this.isMouseDownY == eve.y
                ) {

                    // 查找点击区域可能被包含的划词区域的所有相关信息
                    let thisSaveList = _this.findAllContentInfo(resultList, ALLRECTLIST, _this.rectPosList, ALLRANGELIST);

                    /* 展示内容区域中有可能存在 null
                     * 例如：
                     * 如果用户框选了其中一段文本，这时候会出现评论按钮，但是这时候用户发现自己选错了内容，于是点击了评论按钮之外的区域，那么评论按钮会被移除，用户又再次框选了正确的内容,点了评论按钮，填写了评论并确定，
                       全局的 rangeList 会存入第二次框选正确内容的 range，但是 allRectList 中会把这两次的 range 对应的 rect 都记录下来，所以当查找点击区域对应的 rect 会有一个为 null
                       故而需要排除结果为 null 的项
                     */ 

                    let noNullList = thisSaveList.filter((item) => {return item !== null});
                    let noNullIdList = [];


                    // 查找点击区域可能被包含的不为 null 的划词区域ID组
                    for(let item of noNullList){
                        for(let items of resultList){
                            if(items == item.id){
                                noNullIdList.push(items);
                            }
                        }
                    }

                    // 当前点击位置无划词区域，移除所有图元（下划线，背景色），并重置所有表格行选中效果...
                    if (noNullIdList.length == 0) {
                        cleanAllRectOrLine(_this._layerGlobal);
                        if(_this.tableRowClickCallback != null){
                            _this.tableRowClickCallback("clear");
                        }
                        return;
                    }

                    // 当划词区域只有一项...
                    // if (resultList.length == 1) {
                    // if (thisSaveList.length == 1) {
                    if (noNullIdList.length == 1) {
                        // debugger;
                        // 如果原划词内容已经被更改后，获取这块划词区域的相关内容
                        let thisDiffSaveItem = _this.findDiffContentInfo(noNullIdList[0], ALLRECTLIST, _this.rectPosList, ALLRANGELIST);
                        // let thisDiffSaveItem = _this.findDiffContentInfo(noNullList[0], ALLRECTLIST, _this.rectPosList, ALLRANGELIST);

                        // 如果当前点击区域只有一项且这项的划词区域已经被更改.....
                        if (thisDiffSaveItem != null) {
                            _this.showDiffContentFn(thisDiffSaveItem);
                        }
                        // 否则高亮这块区域，且相应的表格行被选中
                        else {
                            _chooseRectById(noNullIdList[0], _this._layerGlobal);// 点击高亮当前区域
                            if(_this.tableRowClickCallback != null){
                                _this.tableRowClickCallback(noNullIdList[0]);
                            }
                            // _chooseRectById(noNullList[0], _this._layerGlobal);// 点击高亮当前区域
                            // _this.tableRowClickCallback(noNullList[0]);
                        }
                    }
                    // 当点击区域可能被包含的划词区域不止一项时，找出所有区域的相关信息，将所有区域的相关信息传入相关处理函数...
                    else {
                        // let thisSaveList = _this.findAllContentInfo(resultList, ALLRECTLIST, _this.rectPosList, ALLRANGELIST);
                        // _this.showAllContentInfo(thisSaveList)
                        _this.showAllContentInfo(noNullList)
                    }
                }

            });
        })
        /**
         * 监听页面滚动事件：
         * 在页面上下左右每一次滚动时，需要改变滚动前页面上的每行区域在整个页面的位置，是为了解决当页面滚动后，用户点击已划词区域时，因为位置改变了导致划词区域无法高亮的 BUG
         */

        window.addEventListener('scroll', function (event) {
            // 获取当前滚动的垂直距离
            let nowScrollTop = window.scrollY;
            // 获取当前滚动的水平距离
            let nowScrollLeft = window.scrollX;

            let diffX = nowScrollLeft - _this.oldScrollX;// 目前滚动的单次水平位移量
            let diffY = nowScrollTop - _this.oldScrollY;// 目前滚动的单次垂直位移量

            _this.oldScrollX = nowScrollLeft;// 记录当前滚动的水平位置作为下次滚动时的上一次横向滚动位置，用于改变目前页面上的rect区域
            _this.oldScrollY = nowScrollTop;// 记录当前滚动的垂直位置作为下次滚动时的上一次纵向滚动位置，用于改变目前页面上的rect区域

            if (_this.allRectList.length != 0) {
                if (Math.abs(diffX + diffY) > 0) {
                    _this.changePosVal({ x: diffX, y: diffY });
                }
            }
        })
    }
}

export function chooseRectByTool(areaID, _layerObj){
    _chooseRectById(areaID, _layerObj);
}

export function clearAllRectOrLineByTool(_layerObj){
    cleanAllRectOrLine(_layerObj);
}

// initCanvas();

