//***********************************************************
//
//             多事件模块
//
//**********************************************************

import {
    conversionEventType, bindEvents, destroyEvents
}
from '../component/content/event'

//获取对应的activity对象
var getActivity = function(activityId, callback) {
    var activity;
    if (activity = this.abActivitys) {
        _.each(activity.get(), function(contentObj, index) {
            if (activityId == contentObj.activityId) {
                callback(contentObj)
                return;
            }
        }, this);
    }
}

//制作一个处理绑定函数
var makeRunBinding = function(pagebase) {
    var registers = this.registers;
    var shift;
    return function() {
        var activityId = registers[0];
        getActivity.call(pagebase, activityId, function(activityObj) {
            activityObj.runEffects(function() {
                shift = registers.shift();
                registers.push(shift);
            })
        })
    }
};

/**
 * 多事件处理
 * 每次通过同一个热点,触发不同的对象操作
 * @return {[type]} [description]
 */
function combineEvents(pagebase, eventRelated) {

    var contentObj, element, eventName;

    //多条activty数据,一个对象上多事件
    _.each(eventRelated, function(edata) {

        _.each(edata, function(scope) {

            contentObj = pagebase.baseGetContentObject(scope.eventContentId)

            if (!contentObj) {
                Xut.log('error', 'pagebase.js第' + pagebase.pageIndex + '页多事件处理出错!!!!')
                return
            }

            element = contentObj.$contentProcess;
            eventName = conversionEventType(scope.eventType);

            //制动运行动作
            scope.runEffects = makeRunBinding.call(scope, pagebase);

            //销毁方法
            scope.destroy = function() {
                destroyEvents(scope, eventName);
                scope.registers = null
                scope.runEffects = null;
            }

            //事件绑定
            bindEvents({
                'eventRun': function() {
                    scope.runEffects();
                },
                'eventHandler': function(eventReference, eventHandler) {
                    scope.eventReference = eventReference;
                    scope.eventHandler = eventHandler;
                },
                'eventContext': element,
                'eventName': eventName,
                'parameter': scope.dragdropPara,
                'target': null,
                'domMode': true
            })
        })

        //暴露引用
        pagebase.listenerHooks.registerEvents = eventRelated;
    })
}



export function create(pagebase, eventRelated) {
    combineEvents(pagebase, eventRelated);
}


export function destroy(pagebase) {
    var registerEvents;
    if (registerEvents = pagebase.listenerHooks.registerEvents) {
        _.each(registerEvents, function(edata) {
            _.each(edata, function(obj) {
                obj.destroy && obj.destroy();
            })
        })
    }
    pagebase.listenerHooks.registerEvents = null;
}