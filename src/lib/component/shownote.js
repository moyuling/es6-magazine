import { Iscroll } from './content/iscroll'

function ShowNote(data) {
    data.id = parseInt(data.id);
    data.actType = data.type;
    _.extend(this, data)
    this.setup();
}

ShowNote.prototype = {
    setup: function() {
        var that = this,
            note = this.data.note,
            prop = Xut.config.proportion,
            width = Math.round((prop.width + prop.height) / 2 * Xut.config.iconHeight),
            space = Math.round(width / 2);
        retStr = '<div class="xut-shownote-box" style="z-index:' + Xut.zIndexlevel() + '">' +
            '<div class="close" style="width:' + width + 'px;height:' + width + 'px;top:-' + space + 'px;right:-' + space + 'px"></div>' +
            '<div class="content">' + note + '</div>' +
            '</div>';

        this._dom = $(retStr);
        this._dom.find('.close').on("touchend mouseup", function() {
            that.dispatchProcess();
        });
        $(this.rootNode).append(this._dom);

        this.show();
        this.iscroll = Iscroll(this._dom.find('.content')[0]);
        return true;
    },

    //外部调用接口
    dispatchProcess: function() {
        //自动热点 取消关闭
        if (this.isAutoPlay) return;
        //当前对象状态
        this.state ? this.hide() : this.show();
    },

    recovery: function() {
        if (this.state) {
            this.dispatchProcess();
            return true;
        }
        return false
    },

    hide: function() {
        this.state = false;
        $("#ShowNote_" + this.id).css('background-image', 'url(images/icons/hideNote.png)');
        this._dom.hide()
    },


    show: function() {
        this.state = true;
        $("#ShowNote_" + this.id).css('background-image', 'url(images/icons/showNote.png)');
        this._dom.show();
    },

    destroy: function() {
        if (this._dom) {
            this._dom.find('.close').off();
            this._dom && this._dom.hide().remove();
        }

        //iscroll销毁
        if (this.iscroll) {
            this.iscroll.destroy();
            this.iscroll = null;
        }
    }

}


export { ShowNote }
