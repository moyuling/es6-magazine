import { effects } from './effects/index'
import { PptAni } from './event'
import { execJson } from '../../../../util/dom'
 
console.log(effects)
 
/**
 * Pptanimation.js - PPT Animation for Zepto/jQuery.
 *requestAnimationFrame
 * 参数说明
 * pageType: 页面类型
 * chapterId: 当前页ID
 * element: 动画对象
 * itemArray: 动画参数数组
 * container: 父容器
 * hasLoop: 是否循环动画
 * startEvent: 整个动画开始事件
 * completeEvent: 整个动画结束事件
 *
 **/
function PPTAnimation(pageIndex, pageType, chapterId, element, itemArray, container, hasLoop, startEvent, completeEvent) {
    this.screenWidth = document.documentElement.clientWidth;
    this.screenHeight = document.documentElement.clientHeight;
    this.container = container ? $(container) : $(document.body); //父容器(主要用于手势控制路径动画)
    this.isDebug = false; //是否显示调试信息

    this.pageIndex = pageIndex;

    if (typeof(element) == "object") {
        this.pageType = pageType;
        this.chapterId = chapterId;
        this.element = element;
        this.elementStyle = ''; //动画对象默认样式
        this.elementVisibility = 'visible'; //初始化后对象状态
        this.options = [];
        if (Array.isArray(itemArray)) {
            this.options = itemArray;
        } else {
            console.log("Animation options error is not Array.");
        }
        this.useMask = (PptAni.isDesktop || PptAni.isMacOS) ? true : false; //是否使用CSS渐变效果
        this.hasLoop = (hasLoop == true) ? true : false;
        this.startEvent = startEvent;
        this.completeEvent = completeEvent;
        this.parameter0 = null; //第一个动画参数（默认支持多个动画作用于一个对象）
        this.isExit0 = false; //第一个动画类型（进入/退出）
        this.preCode = ''; //动画前脚本
        this.postCode = ''; //动画后脚本
        this.codeDelay = 0; //延时
        this.hasRunning = true; //是否继续运行
        this.isCompleted = false; //是否完全执行过(用于解决重复执行问题)
        //初始对象状态:opacity(visibility)
        this.initElement();
    }
};

PPTAnimation.prototype = {
    //解锁处理
    unlockHandler: function() {
        //购买解锁
        var unlock = Xut.Application.Unlock ? Xut.Application.Unlock() : "undefind";
        //脚本解锁
        if (typeof(this.preCode) == "function") {
            try {
                unlock = this.preCode();
            } catch (error) {
                console.log("Run preCode is error in initElement:" + error);
            }
            unlock = !!unlock;
        }
        //如果其值为1，并且当前未解锁，则执行动画(显示)，否则不执行。
        if (unlock == false && this.parameter0.inapp == 1)
            this.element.css("visibility", "visible");
        //如果其值为2，并且当前已解锁，则执行动画(显示)，否则不执行。
        else if (unlock == true && this.parameter0.inapp == 2)
            this.element.css("visibility", "visible");
        else
            this.element.css("visibility", "hidden"); //默认隐藏
    },

    //对象初始化(visibility)
    initElement: function() {
        if (this.options.length >= 1) {
            var data = this.options[0];
            this.parameter0 = this.parseJSON(data.parameter);

            //为高级动画修改增加
            //2016.3.16
            this.parameter0.pageType = this.pageType;
            this.parameter0.pageIndex = this.pageIndex;

            this.isExit0 = this.parameter0.exit ? (this.parameter0.exit).toLowerCase() == "true" : false;

            //获取动画前脚本
            if (data.preCode && data.preCode.length > 0) {
                this.preCode = execJson("(function(){" + this.enterReplace(data.preCode) + "})");
            } else if (this.parameter0.preCode && this.parameter0.preCode.length > 0) {
                this.preCode = execJson("(function(){" + this.enterReplace(this.parameter0.preCode) + "})");
            }

            //获取动画后脚本
            if (data.postCode && data.postCode.length > 0) {
                this.postCode = execJson("(function(){" + this.enterReplace(data.postCode) + "})");
            } else if (this.parameter0.postCode && this.parameter0.postCode.length > 0) {
                this.postCode = execJson("(function(){" + this.enterReplace(this.parameter0.postCode) + "})");
            }

            //获取延时时间
            if (data.codeDelay && data.codeDelay > 0) {
                this.codeDelay = data.codeDelay;
            } else if (this.parameter0.codeDelay && this.parameter0.codeDelay > 0) {
                this.codeDelay = this.parameter0.codeDelay;
            }

            var initPpt = this.element.attr("data-pptAnimation");
            if (initPpt == null) {
                //解锁支持(In-app购买解锁、脚本解锁)
                if (this.parameter0.inapp > 0) {
                    this.hasRunning = false;
                    this.unlockHandler();
                } else {
                    //路径动画对象默认显示
                    if (data.animationName.indexOf("EffectPath") == 0 || data.animationName == "EffectCustom")
                        this.element.css("visibility", "visible");
                    else {
                        switch (data.animationName) {
                            //强调动画默认显示
                            case "EffectFlashBulb": //脉冲
                            case "EffectFlicker": //彩色脉冲
                            case "EffectTeeter": //跷跷板
                            case "EffectSpin": //陀螺旋转
                            case "EffectGrowShrink": //放大/缩小
                            case "EffectDesaturate": //不饱和
                            case "EffectDarken": //加深
                            case "EffectLighten": //变淡
                            case "EffectTransparency": //透明
                            case "EffectColorBlend": //对象颜色
                            case "EffectComplementaryColor": //补色
                            case "EffectChangeLineColor": //线条颜色
                            case "EffectChangeFillColor": //填允颜色
                            case "EffectFlashOnce": //闪烁(一次)
                                this.element.css("visibility", "visible");
                                break;
                            case "EffectCredits": //字幕式特殊处理
                                this.element.css("visibility", "hidden");
                                break;
                            default:
                                if (this.isExit0)
                                    this.element.css("visibility", "visible"); //退出动画默认显示
                                else
                                    this.element.css("visibility", "hidden"); //进入动画默认隐藏
                                break;
                        }
                    }
                }
                //标识初始化状态
                this.element.attr("data-pptAnimation", true);
                this.elementStyle = this.element[0].style.cssText;
                this.elementVisibility = this.element.css("visibility");
            }
        }
    },

    //执行动画
    runAnimation: function(scopeComplete) {
        if (this.hasRunning == false) return;
        if (this.isCompleted) this.resetAnimation();
        this.animation = this._initAnimation(this.startEvent, scopeComplete || this.completeEvent);
        this.animation.play();
    },

    //停止动画
    stopAnimation: function() {
        if (this.animation instanceof TimelineLite) {
            this.animation.stop();
            this.animation.kill();
            this.animation.clear();
        }
        this.animation = null;
    },

    //复位动画
    resetAnimation: function() {
        this.stopAnimation();
        if (this.elementStyle && this.elementStyle.length > 0) {
            var origin = this.element.css("-webkit-transform-origin");
            var isscroll = this.element.attr("isscroll");
            if (isscroll == null) this.element[0].style.cssText = this.elementStyle; //卷滚区域里的对象不需要还原
            this.element.css("-webkit-transform-origin", origin);
            this.element.css("visibility", this.elementVisibility);
            this.element.css("-webkit-transform", "none");
            this.element[0]["_gsTransform"] = null; //清理对象上绑定的动画属性
        }
        if (this.hasRunning == false) this.unlockHandler();
        this.isCompleted = false;
    },

    //销毁动画
    destroyAnimation: function() {
        this.stopAnimation();
        this.container = null;
        this.options = null;
        this.element = null;
    },


    //初始化
    _initAnimation: function(startEvent, completeEvent) {
        var self = this;

        function startHandler(preCode) {

            //整个动画开始事件(外部事件)
            if (typeof(startEvent) == "function") startEvent();
            //条件判断动画是否执行
            if (typeof(preCode) == "function") {
                self.animation.pause();
                var result = false;
                try {
                    result = preCode();
                } catch (error) {
                    console.log("Run preCode is error in startHandler:" + error);
                }
                if (result == true)
                    self.animation.resume();
                else {
                    self.animation.stop();
                    //整个动画完成事件(动画不需继续执行视为执行完成)
                    if (typeof(completeEvent) == "function") completeEvent();
                }
            }
        }

        function completeHandler(postCode, codeDelay) {
            self.isCompleted = true;
            //延迟执行postCode代码
            try {
                if (typeof(postCode) == "function") {
                    if (codeDelay > 0)
                        setTimeout(postCode, codeDelay);
                    else
                        postCode();
                }
            } catch (error) {
                console.log("Run postCode is error in completeHandler:" + error);
            }
            //整个动画完成事件(外部事件)
            if (typeof(completeEvent) == "function") completeEvent();
        }

        var start = new TimelineLite({
            paused: true,
            onStart: startHandler,
            onStartParams: [this.preCode],
            onComplete: completeHandler,
            onCompleteParams: [this.postCode, this.codeDelay]
        });


        for (var i = 0; i < this.options.length; i++) {
            if (i == 0) {
                start.add(this._getTimeline(this.options[i], i), "shape0");
            } else {
                var invokeMode = this.options[i].invokeMode;
                if (invokeMode == 2)
                    start.add(this._getTimeline(this.options[i], i));
                else
                    start.add(this._getTimeline(this.options[i], i), "shape0"); //"shape"+(i-1)
            }
        }

        return start;
    },


    //返回动画对象
    _getTimeline: function(data, index) {
        var object = this.element;
        var parameter = this.parameter0;
        var isExit = this.isExit0;
        if (index > 0 || this.parameter0 == null) {
            parameter = this.parseJSON(data.parameter);
            isExit = parameter.exit ? (parameter.exit).toLowerCase() == "true" : false; //false:进入 true:消失
            if (index == 0) {
                this.parameter0 = parameter;
                this.isExit0 = isExit;
            }
        }
        var duration = data.speed / 1000; //执行时间
        var delay = data.delay / 1000; //延时时间
        if (navigator.epubReadingSystem) delay += 0.15; //如果是epub阅读器则动画延时0.15秒
        var repeat = (data.repeat >= 0) ? data.repeat - 1 : 0; //重复次数
        if (this.hasLoop) repeat = -1;
        parameter.pageType = this.pageType;
        parameter.chapterId = this.chapterId;
        parameter.animationName = data.animationName;
        //赋给动画音频Id
        parameter.videoId = data.videoId;

        //文字动画
        if (data.animationName == "xxtTextEffect") {
            return this.getTextAnimation(parameter, object, duration, delay, repeat);
        }

        //路径动画
        if (data.animationName.indexOf("EffectPath") == 0 || data.animationName == "EffectCustom") {
            return this.getPathAnimation(parameter, object, duration, delay, repeat);
        }

        switch (data.animationName) {
            //进入退出动画
            default:
                case "EffectAppear": //出现/消失
                return this.getEffectAppear(parameter, object, isExit, duration, delay, repeat);
            case "EffectFade": //淡出
                    return this.getEffectFade(parameter, object, isExit, duration, delay, repeat);
            case "EffectFly": //飞入/飞出
                    return this.getEffectFly(parameter, object, isExit, duration, delay, repeat);
            case "EffectAscend": //浮入/浮出(上升)
                    return this.getEffectAscend(parameter, object, isExit, duration, delay, repeat);
            case "EffectDescend": //浮入/浮出(下降)
                    return this.getEffectDescend(parameter, object, isExit, duration, delay, repeat);
            case "EffectSplit": //劈裂(分割)
                    return this.getEffectSplit(parameter, object, isExit, duration, delay, repeat);
            case "EffectWipe": //擦除
                    return this.getEffectWipe(parameter, object, isExit, duration, delay, repeat);
            case "EffectCircle": //形状一(圆)
                    return this.getEffectCircle(parameter, object, isExit, duration, delay, repeat);
            case "EffectBox": //形状二(方框)
                    return this.getEffectBox(parameter, object, isExit, duration, delay, repeat);
            case "EffectDiamond": //形状三(菱形)
                    return this.getEffectDiamond(parameter, object, isExit, duration, delay, repeat);
            case "EffectPlus": //形状四(加号)
                    return this.getEffectPlus(parameter, object, isExit, duration, delay, repeat);
                /*
			case "EffectWheel": //轮子
				return;
			case "EffectRandomBars": //随机线条
				return;
			*/
            case "EffectGrowAndTurn": //翻转式由远及近
                    return this.getEffectGrowAndTurn(parameter, object, isExit, duration, delay, repeat);
            case "EffectZoom": //基本缩放
                    return this.getEffectZoom(parameter, object, isExit, duration, delay, repeat);
            case "EffectFadedZoom": //淡出式缩放
                    return this.getEffectFadedZoom(parameter, object, isExit, duration, delay, repeat);
            case "EffectSwivel": //基本旋转
                    return this.getEffectSwivel(parameter, object, isExit, duration, delay, repeat);
            case "EffectFadedSwivel": //旋转(淡出式回旋)
                    return this.getEffectFadedSwivel(parameter, object, isExit, duration, delay, repeat);
            case "EffectBounce": //弹跳
                    return this.getEffectBounce(parameter, object, isExit, duration, delay, repeat);
            case "EffectBlinds": //百叶窗
                    return this.getEffectBlinds(parameter, object, isExit, duration, delay, repeat);
            case "EffectPeek": //切入/出
                    return this.getEffectPeek(parameter, object, isExit, duration, delay, repeat);
                /*
			case "EffectWedge": //楔入
				return;
			case "EffectStrips": //阶梯状
				return;
			case "EffectCheckerboard": //棋盘
				return;
			case "EffectDissolve": //向内/外溶解
				return;
			*/
            case "EffectExpand": //展开/收缩
                    return this.getEffectExpand(parameter, object, isExit, duration, delay, repeat);
            case "EffectRiseUp": //升起/下沉
                    return this.getEffectRiseUp(parameter, object, isExit, duration, delay, repeat);
            case "EffectCenterRevolve": //中心旋转
                    return this.getEffectCenterRevolve(parameter, object, isExit, duration, delay, repeat);
            case "EffectSpinner": //回旋
                    return this.getEffectSpinner(parameter, object, isExit, duration, delay, repeat);
            case "EffectFloat": //浮动
                    return this.getEffectFloat(parameter, object, isExit, duration, delay, repeat);
            case "EffectSpiral": //螺旋飞入/出
                    return this.getEffectSpiral(parameter, object, isExit, duration, delay, repeat);
            case "EffectPinwheel": //玩具风车
                    return this.getEffectPinwheel(parameter, object, isExit, duration, delay, repeat);
            case "EffectCredits": //字幕式
                    return this.getEffectCredits(parameter, object, isExit, duration, delay, repeat);
            case "EffectBoomerang": //飞旋
                    return this.getEffectBoomerang(parameter, object, isExit, duration, delay, repeat);
            case "EffectArcUp": //曲线向上/下
                    return this.getEffectArcUp(parameter, object, isExit, duration, delay, repeat);

                //强调动画
            case "EffectFlashBulb": //脉冲
                    return this.getEffectFlashBulb(parameter, object, duration, delay, repeat);
            case "EffectFlicker": //彩色脉冲
                    return this.getEffectFlicker(parameter, object, duration, delay, repeat);
            case "EffectTeeter": //跷跷板
                    return this.getEffectTeeter(parameter, object, duration, delay, repeat);
            case "EffectSpin": //陀螺旋转
                    return this.getEffectSpin(parameter, object, duration, delay, repeat);
            case "EffectGrowShrink": //放大/缩小
                    return this.getEffectGrowShrink(parameter, object, duration, delay, repeat);
            case "EffectDesaturate": //不饱和
                    return this.getEffectDesaturate(parameter, object, duration, delay, repeat);
            case "EffectDarken": //加深
                    return this.getEffectDarken(parameter, object, duration, delay, repeat);
            case "EffectLighten": //变淡
                    return this.getEffectLighten(parameter, object, duration, delay, repeat);
            case "EffectTransparency": //透明
                    return this.getEffectTransparency(parameter, object, duration, delay, repeat);
            case "EffectColorBlend": //对象颜色
                    return new TimelineMax();
            case "EffectComplementaryColor": //补色
                    return this.getEffectComplementaryColor(parameter, object, duration, delay, repeat);
            case "EffectChangeLineColor": //线条颜色
                    return new TimelineMax();
            case "EffectChangeFillColor": //填允颜色
                    return new TimelineMax();
            case "EffectFlashOnce": //闪烁(一次)
                    return this.getEffectFlashOnce(parameter, object, duration, delay, repeat);
                /*
			//路径动画
			case "EffectPathDown": //直线（下） M 0 0 L 0 0.25 E
			case "EffectPathLeft": //直线（靠左）
			case "EffectPathRight": //直线（靠右）
			case "EffectPathUp": //直线（上）
			case "EffectPathDiamond": //形状（菱形）
			case "EffectPathEqualTriangle": //形状（等边三角形）
			case "EffectPathHexagon": //形状（六边形）
			case "EffectPathOctagon": //形状（八边形）
			case "EffectPathParallelogram": //形状（平行四边形）
			case "EffectPathPentagon": //形状（五边形）
			case "EffectPathRightTriangle": //形状（直角三角形）
			case "EffectPathSquare": //形状（正方形）
			case "EffectPathTrapezoid": //形状（梯形）
			case "EffectPathArcDown": //弧线（向下）
			case "EffectPathArcLeft": //弧线（靠左）
			case "EffectPathArcRight": //弧线（向右）
			case "EffectPathArcUp": //弧线（向上
			case "EffectPathTurnDown": //转弯(下) M 0 0 L 0.125 0 C 0.181 0 0.25 0.069 0.25 0.125 L 0.25 0.25 E
			case "EffectPathTurnRight": //转弯（右下）
			case "EffectPathTurnUp": //转弯（上）
			case "EffectPathTurnUpRight": //转弯（右上）
			case "EffectPathCircle": //形状（圆）
			case "EffectPathHorizontalFigure8": //循环（水平数字）
			case "EffectPathVerticalFigure8": //循环（垂直数字）
			case "EffectPathLoopdeLoop": //循环（反复循环）
			case "EffectPathTeardrop": //形状（泪滴形）
			case "EffectPath5PointStar": //形状（五角形）
			case "EffectPathCrescentMoon": //形状（新月形）
			case "EffectCustom": //自定义路径
				return this.getPathAnimation(parameter,object,duration,delay,repeat);
			*/
        }
    },



    //=======================================================
    //子动画通用开始事件
    startHandler: function(parameter, object, params) {
        for (var item in params) {
            switch (item) {
                case "x":
                    TweenLite.set(object, {
                        x: params[item]
                    });
                    break;
                case "y":
                    TweenLite.set(object, {
                        y: params[item]
                    });
                    break;
                case "rotation":
                    TweenLite.set(object, {
                        rotation: params[item]
                    });
                    break;
                case "rotationX":
                    TweenLite.set(object, {
                        rotationX: params[item]
                    });
                    break;
                case "rotationY":
                    TweenLite.set(object, {
                        rotationY: params[item]
                    });
                    break;
                case "scale":
                    TweenLite.set(object, {
                        scale: params[item]
                    });
                    break;
                default:
                    object.css(item, params[item]);
                    break;
            }
        }
        //ppt动画音频
        if (parameter.videoId > 0) {
            Xut.AudioManager.contentAudio(parameter.chapterId, parameter.videoId)
        }


        var callSpiritWidget = function() {
            var pageObj = Xut.Presentation.GetPageObj(parameter.pageIndex, parameter.pageType)
            if (pageObj) {
                //启动了canvas模式
                if (pageObj.canvasRelated.enable) {
                    var components, domId;
                    if ((components = pageObj.baseGetComponent())) {
                        components.length && components.forEach(function(componentObj) {
                            domId = object.attr('id');
                            if (domId == componentObj.getIdName()) {
                                componentObj.play();
                            }
                        })
                    }
                    return;
                }
            }
            spiritWidget.updateAction(object.attr("id"), params);
        }


        //ppt动画扩展处理
        if (parameter.pptanimation && parameter.pptanimation.pptapi) {
            var params = parameter.pptanimation.parameters ? parameter.pptanimation.parameters : {};
            switch (parameter.pptanimation.pptapi) {
                case "bonesWidget": //骨骼动画
                    bonesWidget.updateAction(object.attr("id"), params.actList);
                    break;
                case "spiritWidget":
                    callSpiritWidget();
                    break;
            }
        }


    },

    //子动画通用结束事件
    completeHandler: function(parameter, object, params) {
        //if(parameter.pptAudio) parameter.pptAudio.end(); //声音存在延时问题，马上结束可导制无法听到声音
        for (var item in params) {
            switch (item) {
                case "x":
                    TweenLite.set(object, {
                        x: params[item]
                    });
                    break;
                case "y":
                    TweenLite.set(object, {
                        y: params[item]
                    });
                    break;
                case "rotation":
                    TweenLite.set(object, {
                        rotation: params[item]
                    });
                    break;
                case "rotationX":
                    TweenLite.set(object, {
                        rotationX: params[item]
                    });
                    break;
                case "rotationY":
                    TweenLite.set(object, {
                        rotationY: params[item]
                    });
                    break;
                case "scale":
                    TweenLite.set(object, {
                        scale: params[item]
                    });
                    break;
                default:
                    object.css(item, params[item]);
                    break;
            }
        }
    },

    //线性渐变效果更新(己注释)
    updateLineGradient: function(t1, object, isExit, direction) {
        var len = parseInt(t1.progress() * 100);
        if (isExit == false) {
            switch (direction) {
                case "DirectionUp":
                    object.css("-webkit-mask", "-webkit-gradient(linear,0% 0%, 0% " + len + "%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                case "DirectionDown":
                    object.css("-webkit-mask", "-webkit-gradient(linear,0% 100%, 0% " + (100 - len) + "%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                case "DirectionLeft":
                    object.css("-webkit-mask", "-webkit-gradient(linear,0% 0%, " + len + "% 0%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                case "DirectionRight":
                    object.css("-webkit-mask", "-webkit-gradient(linear,100% 0%, " + (100 - len) + "% 0%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                default:
                    console.log("updateLineGradient:parameter error.");
                    break;
            }
            if (len == 100) object.css("-webkit-mask", "none");
        } else {
            switch (direction) {
                case "DirectionUp":
                    object.css("-webkit-mask", "-webkit-gradient(linear,0% 100%, 0% " + len + "%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                case "DirectionDown":
                    object.css("-webkit-mask", "-webkit-gradient(linear,0% 0%, 0% " + (100 - len) + "%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                case "DirectionLeft":
                    object.css("-webkit-mask", "-webkit-gradient(linear,100% 0%, " + len + "% 0%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                case "DirectionRight":
                    object.css("-webkit-mask", "-webkit-gradient(linear,0% 0%, " + (100 - len) + "% 0%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)),color-stop(0.9,rgba(0,0,0,1)))");
                    break;
                default:
                    console.log("updateLineGradient:parameter error.");
                    break;
            }
            if (len == 100) {
                //object.css("opacity","0");
                object.css("visibility", "hidden");
                object.css("-webkit-mask", "none");
            }
        }
    },
    //rect切割效果更新
    updateClipRect: function(t1, object, isExit, direction, objInfo) {
        var progress = t1.progress();
        var len = progress;
        if (isExit == false) {
            var top = objInfo.height * (1 - len);
            var height = objInfo.height - top;
            var left = objInfo.width * (1 - len);
            var width = objInfo.width - left;
            switch (direction) {
                case "DirectionUp":
                    object.css("clip", "rect(0px " + objInfo.width + "px " + height + "px 0px)");
                    break;
                case "DirectionDown":
                    object.css("clip", "rect(" + top + "px " + objInfo.width + "px " + objInfo.height + "px 0px)");
                    break;
                case "DirectionLeft":
                    object.css("clip", "rect(0px " + width + "px " + objInfo.height + "px 0px)");
                    break;
                case "DirectionRight":
                    object.css("clip", "rect(0px " + objInfo.width + "px " + objInfo.height + "px " + left + "px)");
                    break;
                default:
                    console.log("updateClipRect:parameter error.");
                    break;
            }
        } else {
            var top = objInfo.height * len;
            var height = objInfo.height - top;
            var left = objInfo.width * len;
            var width = objInfo.width - left;
            switch (direction) {
                case "DirectionUp":
                    object.css("clip", "rect(" + top + "px " + objInfo.width + "px " + objInfo.height + "px 0px)");
                    break;
                case "DirectionDown":
                    object.css("clip", "rect(0px " + objInfo.width + "px " + height + "px 0px)");
                    break;
                case "DirectionLeft":
                    object.css("clip", "rect(0px " + objInfo.width + "px " + objInfo.height + "px " + left + "px)");
                    break;
                case "DirectionRight":
                    object.css("clip", "rect(0px " + width + "px " + objInfo.height + "px 0px)");
                    break;
                default:
                    console.log("updateClipRect:parameter error.");
                    break;
            }
        }
    },
    //获取对象至屏幕中心的距离
    getDirectionInCenter: function(object) {
        var objInfo = this.getObjectInfo(object);
        var x = Math.round(this.screenWidth / 2 - objInfo.offsetLeft - objInfo.width / 2);
        var y = Math.round(this.screenHeight / 2 - objInfo.offsetTop - objInfo.height / 2);
        return {
            x: x,
            y: y
        };
    },
    //获取对象相关信息
    getObjectInfo: function(object) {
        var width = Math.round(object.width()); //四舍五入取整
        var height = Math.round(object.height());
        var top = Math.round(object.css("top").replace("px", ""));
        var left = Math.round(object.css("left").replace("px", ""));
        var offsetTop = Math.round(object.offset().top);
        if (object.attr("offsetTop"))
            offsetTop = parseInt(object.attr("offsetTop"));
        else
            object.attr("offsetTop", offsetTop);
        var offsetBottom = Math.ceil(this.screenHeight - offsetTop - height);
        var offsetLeft = Math.round(object.offset().left);
        if (object.attr("offsetLeft"))
            offsetLeft = parseInt(object.attr("offsetLeft"));
        else
            object.attr("offsetLeft", offsetLeft);
        var offsetRight = Math.ceil(this.screenWidth - offsetLeft - width);
        return {
            width: width,
            height: height,
            top: top,
            left: left,
            offsetTop: offsetTop,
            offsetLeft: offsetLeft,
            offsetBottom: offsetBottom,
            offsetRight: offsetRight
        };
    },
    //JSON解析
    parseJSON: function(itemArray) {
        var anminJson;
        try {
            anminJson = JSON.parse(itemArray);
        } catch (error) {
            console.log("parseJSON:" + error);
            anminJson = (new Function("return " + itemArray))();
        }
        return anminJson;
    },
    //回车符处理
    enterReplace: function(str) {
        return str.replace(/\r\n/ig, '').replace(/\r/ig, '').replace(/\n/ig, '');
    },
    //计算两点直线距离
    calculateDistance: function(currentPoint, historyPoint) {
        var xdiff = currentPoint.x - historyPoint.x;
        var ydiff = currentPoint.y - historyPoint.y;
        return Math.ceil(Math.pow(xdiff * xdiff + ydiff * ydiff, 0.5));
    },
    //区间计算
    calculateDirection: function(currentPoint, historyPoint) {
        var quadrant = ""; //象限
        if (currentPoint.y == historyPoint.y && currentPoint.x > historyPoint.x)
            quadrant = "+x"; //水平正方向
        else if (currentPoint.y == historyPoint.y && currentPoint.x < historyPoint.x)
            quadrant = "-x"; //水平负方向
        else if (currentPoint.x == historyPoint.x && currentPoint.y > historyPoint.y)
            quadrant = "+y"; //垂直正方向
        else if (currentPoint.x == historyPoint.x && currentPoint.y < historyPoint.y)
            quadrant = "-y"; //垂直负方向
        else if (currentPoint.x > historyPoint.x && currentPoint.y < historyPoint.y)
            quadrant = "1"; //第一象限
        else if (currentPoint.x > historyPoint.x && currentPoint.y > historyPoint.y)
            quadrant = "2"; //第二象限
        else if (currentPoint.x < historyPoint.x && currentPoint.y > historyPoint.y)
            quadrant = "3"; //第三象限
        else if (currentPoint.x < historyPoint.x && currentPoint.y < historyPoint.y)
            quadrant = "4"; //第四象限
        return quadrant;
    },
    /**
     * 十六进制颜色转换为RGB颜色
     * @param color 要转换的十六进制颜色
     * @return RGB颜色
     */
    colorHexToRGB: function(color, opacity) {
        color = color.toUpperCase();
        var regexpHex = /^#[0-9a-fA-F]{3,6}$/; //Hex
        if (regexpHex.test(color)) {
            var hexArray = new Array();
            var count = 1;
            for (var i = 1; i <= 3; i++) {
                if (color.length - 2 * i > 3 - i) {
                    hexArray.push(Number("0x" + color.substring(count, count + 2)));
                    count += 2;　　　　　　
                } else {
                    hexArray.push(Number("0x" + color.charAt(count) + color.charAt(count)));
                    count += 1;
                }
            }
            if (opacity && opacity > 0)
                return "RGBA(" + hexArray.join(",") + "," + opacity + ")";
            else
                return "RGB(" + hexArray.join(",") + ")";
        } else {
            console.error("Hex Color string(" + color + ") format conversion error.")
            return color;　　
        }
    },
    /**
     * RGB颜色转换为十六进制颜色
     * @param color 要转换的RGB颜色
     * @return 十六进制颜色
     */
    colorRGBToHex: function(color) {
        var regexpRGB = /^(rgb|RGB)\([0-9]{1,3},\s?[0-9]{1,3},\s?[0-9]{1,3}\)$/; //RGB
        if (regexpRGB.test(color)) {
            color = color.replace(/(\(|\)|rgb|RGB)*/g, "").split(",");
            var colorHex = "#";
            for (var i = 0; i < color.length; i++) {
                var hex = Number(color[i]).toString(16);
                if (hex.length == 1) hex = "0" + hex;
                colorHex += hex;
            }
            return colorHex;
        } else {
            console.error("RGB Color string(" + color + ") format conversion error.")
            return color;
        }
    }
};


export { PPTAnimation }
