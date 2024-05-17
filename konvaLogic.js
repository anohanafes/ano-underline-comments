
function C_L(x1, y1, x2, y2) {
    // console.log(x1)
    // console.log(x2)
    // console.log(y1)
    // console.log(y2)

    return new Konva.Line({
        points: [x1, y1, x2, y2],
        stroke: 'red',
        strokeWidth: 2,
    });
}

function C_E_L(x1, y1, x2, y2) {
    // console.log(x1)
    // console.log(x2)
    // console.log(y1)
    // console.log(y2)

    return new Konva.Line({
        points: [x1, y1, x2, y2],
        stroke: 'blue',
        strokeWidth: 2,
        lineJoin: 'round',
        /*
        * line segments with a length of 33px
        * with a gap of 10px
        */
        dash: [8, 1]
    });
}

// export function createRect(_x,_y,_w,_h){
// export function c_R(_x,_y,_w,_h){ 
function C_R(_x, _y, _w, _h) {
    return new Konva.Rect({
        x: _x,
        y: _y,
        width: _w,
        height: _h,
        fill: 'rgba(255, 170, 0, 0.2)',
    });
}

function C_E_R(_x, _y, _w, _h) {
    return new Konva.Rect({
        x: _x,
        y: _y,
        width: _w,
        height: _h,
        fill: 'transparent',
    });
}

/**
 * 
 * @param {*} _rectList 当前页面上所选区域的所有行
 * @param {*} _w 画布宽
 * @param {*} _h 画布高
 * @param {*} _l 画布离屏幕左边距离
 * @param {*} _t 画布离屏幕顶边距离
 * @param {*} _domPadding 当前canvas画布父元素的左右内边距和
 * @param {*} _resLayer 当前 layer 对象
 */
// function c_layer_l_r(rangeId,_rectList,_w,_h,_l,_t,_domPadding,_resLayer){
export function c_layer_l_r(_rectList, _w, _h, _l, _t, _domPadding, _resLayer, isError) {
    let _layerId = _rectList._rectId;

    _resLayer["id"] = _layerId;
    // console.log(_layerId);

    for (let item of Array.from(_rectList)) {
        /**
         * Range.getClientRects() --- 可获取元素占据页面的所有矩形区域所有行的数组
         * 如果有 br 换行标签， Range.getClientRects() 此 api 会算作一行，如果给这行添加划线，会产生没必要的多余内存消耗，要将其排除在外
         * 根据这行的 width 是否为 0 且 单行的 width 不可占满 判断是否满足条件
         * 当用户选中占满单行的文字的时候，那返回的 width 其实是等于 字体大小 * 字数 ，所以如果选中的文字宽度 + 左右内边距（如果存在）应该小于 容器宽度，
           如果文章中包含 p，h1，h2 这样的有默认 margin 的块盒元素（在不单独设置宽度的情况下，宽度为父元素的 100%）
           若其内容为空，那么 Range.getClientRects() 返回的这一行的 height 为 0 且 width 为 容器宽度;
           说明此行无可选中的文字
         */
        if (item.width != 0 && item.width != (_w - _domPadding) && item.height != 0) {
        // if (item.width != 0 && item.height != 0) {
        // if (item.width != 0) {
            // if(item.width != 0){
            let _thisLine = null;
            let _thisRect = null;

            if (isError) {
                _thisLine = C_E_L(
                    item.left - _l,
                    item.top - _t + item.height,
                    item.left - _l + item.width,
                    item.top - _t + item.height
                );

                _thisRect = C_E_R(
                    item.left - _l,
                    item.top - _t,
                    item.width,
                    item.height
                )
            }
            else {
                _thisLine = C_L(
                    item.left - _l,
                    item.top - _t + item.height,
                    item.left - _l + item.width,
                    item.top - _t + item.height
                );

                _thisRect = C_R(
                    item.left - _l,
                    item.top - _t,
                    item.width,
                    item.height
                )
            }
            _thisLine["lineId"] = _layerId;
            _thisRect["rectId"] = _layerId;

            _thisRect["rectType"] = 'bgcRect';

            _thisRect.hide();// 创建 rect 的时候需先隐藏,当后面点击时，才高亮这个区域
            _resLayer.add(_thisRect);
            _resLayer.add(_thisLine);
            
        }
    }


    _resLayer.batchDraw();// 批量重绘Layer,否则不生效
    // console.log('86 _resLayer ---> ',_resLayer)
}

// export function u_layer_l_r(_rectList,_w,_h,_l,_t,_domPadding,_resLayer,_resId){
export function u_layer_l_r(_rectList, _w, _h, _l, _t, _domPadding, _resLayer) {
    // alert(1)
    // console.log('124 ---> ',_rectList)
    // export function u_layer_l_r(_allRectList,_w,_h,_l,_t,_domPadding,_resLayer,_resId,_allRectList){
    // let _self = this;
    _resLayer.destroyChildren();// 更新前，先清空当前layer下面所有的 图元

    // let _layerId = _resId;// 获取当前 layer 的 Id
    for (let itemAll of _rectList) {
        // console.log(itemAll)
        // let _thisRectId = itemAll.posInfo._rectId;
        let _thisRectId = itemAll._rectId;
        let _thisRectType = itemAll._rectType;

        // for(let item of Array.from(_rectList)){
        for (let item of Array.from(itemAll)) {
            /**
             * Range.getClientRects() --- 可获取元素占据页面的所有矩形区域所有行的数组
             * 如果有 br 换行标签， Range.getClientRects() 此 api 会算作一行，如果给这行添加划线，会产生没必要的多余内存消耗，要将其排除在外
             * 根据这行的 width 是否为 0 且 height 是否为 0 且 单行的 width 不可占满 判断是否满足条件
             * 当用户选中占满单行的文字的时候，那返回的 width 其实是等于 字体大小 * 字数 ，所以如果选中的文字宽度 + 左右内边距（如果存在）应该小于 容器宽度，
               如果文章中包含 p，h1，h2 这样的有默认 margin 的块盒元素（在不单独设置宽度的情况下，宽度为父元素的 100%）
               若其内容为空，那么 Range.getClientRects() 返回的这一行的 height 为 0 且 width 为 容器宽度;
               说明此行无可选中的文字
             */
            
            if (item.width != 0 && item.width != (_w - _domPadding) && item.height != 0) {
            // if (item.width != 0 && item.height != 0) {
            // if (item.width != 0) {
                // if(item.width != 0){
                let _thisLine = null;
                let _thisRect = null;

                if (_thisRectType) {
                    _thisLine = C_E_L(
                        item.left - _l,
                        item.top - _t + item.height,
                        item.left - _l + item.width,
                        item.top - _t + item.height
                    );

                    _thisRect = C_E_R(
                        item.left - _l,
                        item.top - _t,
                        item.width,
                        item.height
                    )
                }
                else {
                    _thisLine = C_L(
                        item.left - _l,
                        item.top - _t + item.height,
                        item.left - _l + item.width,
                        item.top - _t + item.height
                    );

                    _thisRect = C_R(
                        item.left - _l,
                        item.top - _t,
                        item.width,
                        item.height
                    )
                }


                // _thisLine["lineId"] = _layerId;
                // _thisRect["rectId"] = _layerId;
                _thisLine["lineId"] = _thisRectId;
                _thisRect["rectId"] = _thisRectId;
                _thisRect["rectType"] = 'bgcRect';
                _thisRect.hide();// 创建 rect 的时候需先隐藏,当后面点击时，才高亮这个区域

                _resLayer.add(_thisRect);
                _resLayer.add(_thisLine);
                

            }
        }
    }

    _resLayer.batchDraw();// 批量重绘Layer,否则不生效
}