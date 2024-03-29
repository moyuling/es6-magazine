/**
 *
 * 基本事件管理
 *
 */

var observe = (function(slice) {

    var ArrayProto = Array.prototype;
    var nativeIndexOf = ArrayProto.indexOf;
    var slice = ArrayProto.slice;

    function bind(event, fn) {
        var i, part;
        var events = this.events = this.events || {};
        var parts = event.split(/\s+/);
        var num = parts.length;

        for (i = 0; i < num; i++) {
            events[(part = parts[i])] = events[part] || [];
            if (_indexOf(events[part], fn) === -1) {
                events[part].push(fn);
            }
        }
        return this;
    }

    function one(event, fn) {
        // [notice] The value of fn and fn1 is not equivalent in the case of the following MSIE.
        // var fn = function fn1 () { alert(fn === fn1) } ie.<9 false
        var fnc = function() {
            this.unbind(event, fnc);
            fn.apply(this, slice.call(arguments));
        };
        this.bind(event, fnc);
        return this;
    }

    function unbind(event, fn) {
        var eventName, i, index, num, parts;
        var events = this.events;

        if (!events) return this;

        //指定
        if (arguments.length) {
            parts = event.split(/\s+/);
            for (i = 0, num = parts.length; i < num; i++) {
                if ((eventName = parts[i]) in events !== false) {
                    index = (fn) ? _indexOf(events[eventName], fn) : -1;
                    if (index !== -1) {
                        events[eventName].splice(index, 1);
                    }
                }
            }
        } else {
            this.events = null;
        }


        return this;
    }

    function trigger(event) {
        var args, i;
        var events = this.events,
            handlers;

        if (!events || event in events === false) {
            return this;
        }

        args = slice.call(arguments, 1);
        handlers = events[event];
        for (i = 0; i < handlers.length; i++) {
            handlers[i].apply(this, args);
        }
        return this;
    }

    function _indexOf(array, needle) {
        var i, l;

        if (nativeIndexOf && array.indexOf === nativeIndexOf) {
            return array.indexOf(needle);
        }

        for (i = 0, l = array.length; i < l; i++) {
            if (array[i] === needle) {
                return i;
            }
        }
        return -1;
    }

    return function() {
        this.$watch = this.bind = bind;
        this.$off = this.unbind = unbind;
        this.$emit = trigger;
        this.$once = one;
        return this;
    };

})([].slice);

export { observe }
