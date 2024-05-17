// 获取当前文章的所有段落的文字并进行分段格式化数据（为了后面读取数据库内的数据，从而能找到之前已评论的语句）
export function recursionListToFormat(_resList) {
    let nodeListFomatVal;

    /** 递归查找指定文档里所有 Text 元素(及其所有后代元素)
     * @param resList:源数据列表
     */
    function recursionList(resList) {
        let nodeListFomat = [];

        // 遍历数据源列表...
        for (let item of resList) {

            /**
             * 如果当前元素为非空的文本节点时，将其添加至列表内
             * 记录节点列表
             * {
             *    _node:文本节点内容
             *    _nodeLength:文本节点内容长度
             * }
            */
            if (item.nodeName == "#text" && item.textContent != "") {
                nodeListFomat.push({
                    _node: item,
                    _nodeLength: item.length
                })
            }
            /**
             * 否则将元素节点的子元素进行递归查找并拼接至段落节点列表内
            */
            else {
                nodeListFomat = nodeListFomat.concat(recursionList(item.childNodes))
            }
        }

        return nodeListFomat;
    }

    /**
     * 如果传入的节点已经是文本节点（文本节点自然没有子元素），将其添加至列表内并记录节点列表
        * {
        *    _node:文本节点内容
        *    _nodeLength:文本节点内容长度
        * }
    */
    if (_resList.childNodes.length == 0 && _resList.nodeName == "#text") {
        // nodeListFomatVal = [];
        nodeListFomatVal.push({
            _node: _resList,
            _nodeLength: _resList.length
        })
    }
    // 否则递归处理
    else {
        nodeListFomatVal = recursionList(_resList.childNodes);
    }

    /** 1.已经将内容进行格式化完毕，当前的数据结构为：
     *  [
     *      第一段落
     *      {
     *          _node:文本节点内容
     *          _nodeLength:文本节点内容长度
     *      },
     *      第二段落
     *      {
     *          _node:文本节点内容
     *          _nodeLength:文本节点内容长度
     *      },
     *      第三段落
     *      {
     *          _node:文本节点内容
     *          _nodeLength:文本节点内容长度
     *      },
     *  ]
     * 
     *  2.下面要算出每一段在整篇文章中的开始位置（偏移字数）和终止位置（偏移字数）
     *    目的是：为了每次保存的时候，传给后台的其实是一个数组，数组每项记录的是当前用户选中的每句话是从 整篇文章中的第几个字开始 至 整篇文章中的第几个字结束，那当下次调接口拿数据
     *           的时候就可以知道用户上次划的是哪些词或句
     * 
     *    当前段落的起始文字偏移(用人话说就是：这一段是从这篇文章的第几个字开始的) = 如果当前为第一段，开始位置为 0；否则：上一段的起始位置 + 上一段的总字数
     *    当前段落的终止文字偏移(用人话说就是：这一段是到这篇文章的第几个字结束的)  = 如果当前为第一段，终止位置为 当前段落的总字数；否则：当前段落的起始位置 + 当前段落的总字数
     */

    for (var i = 0; i < nodeListFomatVal.length; i++) {
        let item = nodeListFomatVal[i];// 获取当前遍历的段落
        let itemPrev = nodeListFomatVal[i - 1];// 获取当前遍历段落的上一段落

        // 设置当前段落的起始位置...
        item["_nodeStartPos"] = i == 0 ? 0 : (itemPrev["_nodeStartPos"] + itemPrev._nodeLength);
        // 设置当前段落的终止位置...
        item["_nodeEndPos"] = i == 0 ? item["_nodeLength"] : (item["_nodeStartPos"] + item["_nodeLength"]);
    }
    // }
    return nodeListFomatVal
}

/**
 * 格式化 横纵范围
 * @param x --- 开始横坐标
 * @param y --- 开始纵坐标
 * @param width 宽
 * @param height 高
*/
function _formatPos({ x, y, width, height }) {
    return {
        xStart: x, // 横坐标起始位置 = 传入的横坐标起始位置
        xEnd: x + width, // 横坐标终止位置 = 横坐标起始位置 + 传入的宽度
        yStart: y,// 纵坐标起始位置 = 传入的纵坐标起始位置
        yEnd: y + height, // 纵坐标终止位置 = 纵坐标起始位置 + 传入的高度
        w:width,
        h:height
    }
}

/**
 * 为数组添加横纵坐标范围
 * （给每个range生成的所有行区域（allRectList）添加坐标区间，为了判断用户点击页面时是否点到了之前已经划词的区域，为了实现点击已划词区域高亮和与下面表格联动的效果）
 * @param resList --- 需要添加横纵坐标范围的目标数组
*/
export function _addCoordinateRange(resList) {
    for (let item of resList) {
        /** 因为每个rect组根据前面的处理后现在其实是个伪数组，格式如下：
         * {
         *   0:所占区域行1
         *   1:所占区域行2
         *   2:所占区域行3
         *   _end_pos:xxx,
         *   _start_pos:xxx,
         *   _rectId:xxx,
         *   length:3
         * }
         * 
         * 使用 Array.from（）对这个rect组内的每一行rect添加所需要的数据：
         * 1.每一行rect所占区域的横纵坐标起止位置
         * 2.每一行rect所占区域的宽高
         * 3.每一行rect的类型（rType）
         */ 

        for (let items of Array.from(item)) {
        // for (let items of Array.from(item.rects)) {
            items["_posFormat_"] = _formatPos(items);
            items["_rType"] = item._rectType;
            // item["_posFormat_"] = _formatPos(items);
        }
    }
}

/**
    * 查询某个坐标点是否存在于位置数组中
    * 遍历传入的位置数组，将坐标点与每一项进行条件匹配（之前会给每一块位置设置一个坐标区间），使用 Jslabel 标记外层循环，若当前坐标点的横坐标与纵坐标在某一个位置区间中,
    * 退出外层循环，返回对应区域ID（rectId）
    * @param x --- 当前需检测的点横坐标
    * @param y --- 当前需检测的点纵坐标
    * @param resList --- 位置数组
    * @param resKey --- 满足条件的 key
    * @returns 满足条件的数组项ID
   */

export function _checkPosIsExist({ x, y }, resList, resKey) {
    return new Promise((resolve, reject) => {
        let _resultRId = "";
        let _resultRIdList = [];
        outer: for (let item of resList) {
            for (let items of Array.from(item)) {
            // for (let items of Array.from(item.rects)) {
                // debugger;
                if (items["_posFormat_"]) {
                    if (x >= items["_posFormat_"]["xStart"] && x <= items["_posFormat_"]["xEnd"]
                        &&
                        y >= items["_posFormat_"]["yStart"] && y <= items["_posFormat_"]["yEnd"]
                    ) {
                        // _resultRId = item._rectId;
                        // _resultRId = item['posInfo'][resKey];
                        _resultRId = item[resKey];
                        _resultRIdList.push(item[resKey]);
                        // break outer;
                    }
                }

            }
        }

        // resolve(_resultRId);
        resolve(_resultRIdList);
    })
}

/**
    * 根据 layer 的 Id 隐藏已点击的划词背景
    * @param areaID --- 区域id
    * @param _layerObj --- 当前 layer 图层
   */
export function _hideRectById(areaID, _layerObj) {
    for (let item of _layerObj.children) {
        if (item.className == "Rect" && item.rectType == 'bgcRect') {
            if (item.rectId == areaID) {
                item.hide();
            }
            else {
                item.show();
            }
        }
    }

    _layerObj.batchDraw();
}

/**
    * 根据 layer 的 Id 让指定图元消失（隐藏划词背景及下划线）
    * @param areaID --- 区域id
    * @param _layerObj --- 当前 layer 图层
*/
export function _hideRectAndLineById(areaID, _layerObj) {
    for (let item of _layerObj.children) {
        // 隐藏背景矩形
        if (item.className == "Rect" && item.rectType == 'bgcRect') {
            if (item.rectId == areaID) {
                item.hide();
            }
        }
        // 隐藏下划线
        if(item.className == 'Line'){
            if (item.lineId == areaID) {
                item.hide();
            }
        }
    }

    _layerObj.batchDraw();
}

/**
    * 清空所有覆盖物（rect，line......）
    * @param _layerObj --- 当前 layer 图层
   */

export function cleanAllRectOrLine(_layerObj){
    for (let item of _layerObj.children) {
        if (item.className == "Rect" && item.rectType == 'bgcRect') {
            item.hide();
        }

        _layerObj.batchDraw();
    }

}

/**
    * 根据 layer 的 Id 高亮已点击的划词背景
    * @param areaID --- 区域id
    * @param _layerObj --- 当前 layer 图层
   */
export function _chooseRectById(areaID, _layerObj) {
    for (let item of _layerObj.children) {
        if (item.className == "Rect" && item.rectType == 'bgcRect') {
            if (item.rectId == areaID) {
                item.show();
            }
            else {
                item.hide();
            }
        }

        _layerObj.batchDraw();
    }


}
