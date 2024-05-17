<template>
    <div>
        <el-button size = 'small' type = 'primary' @click = 'saveData'>保存</el-button>
        <el-button size = 'small' type = 'primary' @click = 'loadData'>回显</el-button>
        <el-button size = 'small' type = 'primary' @click = 'clearTable'>清空所有表格选择</el-button>

        <div class='content'>
            {{ demoHtml }}
        </div>

        <el-table ref = "singleTable" 
                  class = 'demoTable'
                 :data="tableData" 
                  style="width: 100%" 
                 :row-class-name = 'changeRowCurrent'
                 @row-click = "rowClick"
        >
            <el-table-column align = 'center' type="index" label="序号" width="50">
            </el-table-column>
            <el-table-column align = 'center' prop="hcnr" label="划词内容">
            </el-table-column>
            <el-table-column align = 'center' prop="plnr" label="评论内容">
            </el-table-column>
            <el-table-column align = 'center' label="操作">
                <template slot-scope="scope">
                    <el-button size="mini" @click.stop ="delFn(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>

import { UnderlineComments,chooseRectByTool,clearAllRectOrLineByTool } from 'ano-underline-comments';

export default {
    name: "UnderlineComments",
    data() {
        return {
            demoHtml: `
                    Lorem ipsum dolor sit amet consectetur,Explicabo architecto maxime ratione ipsa asperiores aut, suscipit
                    repudiandae ipsum maiores quam recusandae nemo? Laudantium, quod provident? Ratione quis necessitatibus id
                    distinctio.
                    Et laudantium amet cumque obcaecati. Sit, <br />
                    <p>123</p>
                    <h1></h1>
                    <h2></h2>
                    <h3></h3> reiciendis laudantium maiores impedit tempore nisi, saepe autem tenetur cupiditate rerum amet
                    excepturi necessitatibus. Distinctio illo autem reprehenderit natus molestiae dolorem molestias iusto adipisci?
                    Nostrum nemo</p><br /> officiis ipsam doloribus. Accusantium ipsum placeat doloremque voluptas eligendi quos ea
                    praesentium id aut minima quo aliquid quas, necessitatibus dicta soluta alias laborum maxime natus temporibus.
                    Eveniet, quia!
                    Consequuntur voluptates dignissimos architecto sapiente, <br />
                    <p>assumenda vero illo quas. Fugit, doloribus dolore necessitatibus rerum blanditiis dolores iusto, earum
                        incidunt ratione quaerat possimus vero delectus quia at exercitationem sapiente nulla enim.
                        Iusto explicabo asperiores blanditiis itaque harum dolorem sed animi eligendi, </p><br /> quis cupiditate!
                    Vitae sapiente tenetur aspernatur harum hic nobis optio modi mollitia dolorum, error sunt, dolore obcaecati
                    laudantium libero et.
                    Consequatur maiores adipisci quia voluptate sequi eligendi saepe consectetur facere? Qui suscipit officia eum,
                    quidem, aliquid nulla veritatis assumenda rerum iusto debitis veniam illum dolorem quisquam vitae, facere
                    dignissimos quaerat.
                `,
            tableData:[],
            UnderLineObj:null,
            clickRowId:"",
            oldData:[
                {
                    blankFold:22,
                    ePos:47,
                    hcnr:" ame",
                    id:"EEA72B59",
                    plnr:"123",
                    sPos:43
                },
                {
                    blankFold:22,
                    ePos:1873,
                    hcnr:"ectus quia at exercitationem sapiente nulla enim.\n                        Iusto explicabo asperiores blanditiis itaque harum dolorem sed animi eligendi, </p><br /> quis cupiditate!\n                    Vitae sapiente tenetur aspernatur harum hic nobis optio modi mollitia dolorum, error sunt, dolore obcaecati\n                    laudantium libero et.\n                    Consequatur maiores adipisci quia voluptate sequi eligendi saepe consectetur facere? Qui suscipit officia eum,\n                    quidem, aliquid nulla veritatis assumenda rerum iusto debitis veniam illum dolorem quisquam vit",
                    id:"0A732994",
                    plnr:"321",
                    sPos:1276
                }
            ]
        }
    },
    mounted(){
        this.$nextTick(() => {
            this.initUnderline();
        })
    },
    methods:{
        // 保存已划词的所有 Range 信息（直接存入后台或者显示在页面上）
        saveData(){
            console.log(this.UnderLineObj.rectPosList);
        },
        // 模拟从数据库调取数据显示在页面上
        loadData(){
            let _this = this;
            _this.UnderLineObj.showOldData(_this.oldData);
        },
        // 当某一行被选中时需要清空表格行选中状态...
        clearTable(){
            this.clickRowId = "";
            clearAllRectOrLineByTool(this.UnderLineObj._layerGlobal);
        },
        // 通过ID查找对应的表格行并高亮显示...
        changeRowCurrent({row,rowIndex}){
            let _this = this;

            if(row.id == _this.clickRowId){
                return 'sel-row'
            }

            return '';
        },
        // 行点击事件
        rowClick(row, column, event){
            this.clickRowId = row.id;
            chooseRectByTool(row.id, this.UnderLineObj._layerGlobal);// 点击高亮当前区域
        },
        // 初始化组件
        initUnderline() {
            let _this = this;
            let btnStyle = {
                width: "50px",
                height: '30px',
                fontSize: "14px",
                letterSpacing: "1px",
                background: "#29a2ff",
                border: '1px solid #29a2ff',
                color: '#fff',
                textAlign: "center",
                lineHeight: '30px',
                cursor: 'pointer'
            };

            let selfPromptFn = function () {
                return new Promise((resolve, reject) => {
                    _this.$prompt('请输入评论', '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                    }).then(({ value }) => {
                        resolve(value);
                    }).catch(() => {
                        let cancalFn = function () {
                            _this.$message({
                                type: 'info',
                                message: '取消评论！'
                            });
                        };

                        reject(cancalFn);
                    });
                })
            }

            let addTableDataFn = function (data) {
                _this.tableData.push(data);
            }

            // 点击某个划词区域时，将这个区域的 id 存入当前 vue 实例的 data 中,本例中使用自定义属性添加样式的方式高亮某行，详情见methods中的 changeRowCurrent 函数...
            let tableRowClickCallback = function(rangeId){
                _this.clickRowId = rangeId;
            }

            let showDiffContentFn = function(data){
                console.log('diffContent',data)
            }

            let showAllContentFn = function(data){
                console.log('allContent',data)
            }

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
            
            // 初始化实例 UnderlineComments
            this.UnderLineObj.init();
        },
        // 删除行并移除对应的划词区域
        delFn(row){
            let _this = this;

            for(let i = 0;i < _this.tableData.length;i++){
                if(row.id == _this.tableData[i].id){
                    _this.tableData.splice(i,1);
                }
            }

            this.UnderLineObj.delOnceRange(row.id);
        },
    }
    
}
</script>

<style>
    .demoTable .sel-row{
        background:#1890ff;
        color: #fff;
    }

    .demoTable .sel-row:hover{
        color:inherit;
    }
</style>