/**
 *  创建widgets对象任务片
 *  state状态
 *      0 未创建
 *      1 正常创建
 *      2 创建完毕
 *      3 创建失败
 */

//组件任务
import {Bind} from './dispenser/bind'
import {reviseSize} from '../../util/option'

function TaskComponents(data, suspendCallback, successCallback) {

    //预编译模式跳过创建
    if (Xut.IBooks.runMode()) {
        successCallback();
        return;
    }

    if (data['activitys'].length) {
        var str;
        this.rootNode = data['rootNode'];
        this.callback = {
            'suspendCallback': suspendCallback,
            'successCallback': successCallback
        }
        str = this.create(data);
        this.compileSuspend(str);
    } else {
        successCallback();
    }
}

TaskComponents.prototype = {

    clearReference: function() {
        this.rootNode = null;
    },

    create: function(data) {
        var actType,
            pageType      = data.pageType,
            createWidgets = data.activitys,
            chpaterData   = data.chpaterData,
            chapterId     = data.chapterId,
            pid           = data.pid,
            virtualOffset = data.virtualOffset,
            widgetRetStr  = [];
            

        function virtualCreate(actType, activityData) {
            var scaleLeft = activityData.scaleLeft;
            // 创建分布左边的对象
            if (virtualOffset === 'left') {
                if (scaleLeft < Xut.config.screenSize.width) {
                    startCreate(actType, activityData)
                }
            }
            //创建分布右边的对象
            if (virtualOffset === 'right') {
                if (scaleLeft > Xut.config.screenSize.width) {
                    startCreate(actType, activityData)
                }
            }
        }

        //创建
        function startCreate(actType, activityData) {
            //创建DOM元素结构
            //返回是拼接字符串
            widgetRetStr.push(Bind[actType]['createDom'](
                activityData, chpaterData, chapterId, pid, Xut.zIndexlevel(), pageType
            ));
        }


        //需要创建的数据结构
        createWidgets.forEach(function(activityData, index) {

            //创建类型
            actType = activityData.actType || activityData.animation;

            //特殊类型 showNote
            if (!actType && activityData.note) {
                activityData['actType'] = actType = "ShowNote";
            }

            switch (actType) {
                case 'ShowNote':
                case 'Action':
                case 'Widget':
                case 'Audio':
                case 'Video':

                    //缩放比
                    activityData = reviseSize(activityData);

                    //处理虚拟模式创建
                    if (Xut.config.virtualMode) {
                        virtualCreate(actType, activityData)
                    } else {
                        startCreate(actType, activityData)
                    }
                    break;
            }
        })

        return widgetRetStr.join("");
    },

    /**
     * 编译中断函数
     * @return {[type]} [description]
     */
    compileSuspend: function(str) {

        var nextTasks, suspendTasks,
            self = this;

        //继续执行
        nextTasks = function() {
            Xut.nextTick({
                container: self.rootNode,
                content: $(str)
            }, function() {
                self.clearReference();
                self.callback.successCallback();
            });
        }

        //中断方法
        suspendTasks = function() {
            self.suspendQueues = [];
            self.suspendQueues.push(function() {
                nextTasks()
            })
        }

        self.callback.suspendCallback(nextTasks, suspendTasks);
    },

    //运行被阻断的线程任务
    runSuspendTasks: function() {
        if (this.suspendQueues) {
            var fn;
            if (fn = this.suspendQueues.pop()) {
                fn();
            }
            this.suspendQueues = null;
        }
    }
}

export { TaskComponents }
