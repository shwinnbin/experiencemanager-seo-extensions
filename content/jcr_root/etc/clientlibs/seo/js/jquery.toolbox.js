(function($, window, document, undefined) {
    var pluginName = 'toolbox';
    var defaults = {
        extraClass: "CQjquery",
        closeSelector: ".cq-close",
        resizableOptions: {},
        draggableOptions: {
            handle: ".cq-seo-tools",
            addClasses: false
        },
        cookie: "cq-seo-toolbox"
    };

    var Toolbox = function(element, config) {
        this.element = element;
        this.$element = $(this.element);
        this.config = $.extend({}, defaults, config);
        this.plugins = [];
        $.template('suggestionTemplate', '<li class=${status}>${hint}</li>');
        this._init();
    };

    var cookieHelper = {
        names: ['visible','top','left', 'height', 'width'],
        serialize: function(state) {
            return $.map(cookieHelper.names, function(n) {
                return state[n];
            }).join(':');
        },
        deserialize: function(cookieString) {
            var parts = cookieString.split(':');
            var state = {};
            $.each(parts, function(i, p) {
                state[cookieHelper.names[i]] = p;
            });
            return state;
        }
    };

    $.extend(Toolbox.prototype, {
        _init: function() {
            var c = this.config;
            var $el = this.$element;
            $el.addClass(c.extraClass)
                    .resizable(c.resizableOptions)
                    .draggable(c.draggableOptions)
                    .removeAttr("style")
                    .hide();
            this._initHTML();
            if (c.cookie) {
                this._initCookie();
            }
            var self = this;
            $el.on('toolbox-contentloaded', function() {
                $(document).trigger('toolbox-registerplugins', $el);
                self._initPlugins();
                console.debug("trigger toolbox-ready");
                $(document).trigger('toolbox-ready', $el);
            });
        },
        _initHTML: function() {
            var self = this;
            var c = this.config;
            $.get("/etc/seo/toolbox.tools.html?wcmmode=disabled", function(data) {
                        var toolboxHTML = $(data);
                        var el = self.$element;
                        el.append(toolboxHTML);
                        if (c.closeSelector) {
                            el.on("click", c.closeSelector, function() {
                                self.hide();
                            });
                        }
                        el.trigger("toolbox-contentloaded");
                    }
            );
        },
        _initCookie: function() {
            var self = this;
            var el = this.$element;

            var state = $.cookie(self.config.cookie);
            console.debug("restore state from cookie", state);
            if (state) {
                state = cookieHelper.deserialize(state);
                state.visible = state.visible === 'true';
                self._setState(state);
            } else {
                self._setState({ visible: false, top: 50, left: 50 });
            }

            var storeStateHandler = function(event) {
                var state = self._getState();
                state.visible = event.type !== 'toolbox-beforehide';
                var stateString = cookieHelper.serialize(state);
                console.debug("store state to cookie", stateString);
                $.cookie(self.config.cookie, stateString);
            };

            el.on('toolbox-show', storeStateHandler);
            el.on('toolbox-beforehide', storeStateHandler);
            el.on('dragstop', storeStateHandler);
            el.on('resizestop', storeStateHandler);
        },
        _updateCriteria: function(criteria) {
            var self = this;
            var list = $("<ul></ul>");
            $.each(criteria, function(i, criterion) {
                $.tmpl('suggestionTemplate', criterion).appendTo(list);
            });
            self.$element.find('.cq-seo-suggestions ul').replaceWith(list);
        },
        _initPlugins: function() {
            var self = this;
            var jsonURL = this.$element.attr("data-url");
            $.get(jsonURL, { page: CQ.WCM.getPagePath()}, function(json) {
                var criteria = [];
                $.each(self.plugins, function(i, plugin) {
                    criteria.push(plugin.extractCriteria(json));
                });
                self._updateCriteria(criteria);
            });
        },
        _getState: function() {
            var e = this.$element;
            var pos = e.offset();
            var top = pos.top - $(document).scrollTop();
            var left = pos.left - $(document).scrollLeft();
            return {
                visible: e.is(':visible'),
                top: top,
                left: left,
                height: e.height(),
                width: e.width()
            };
        },
        _setState: function(state) {
            var e = this.$element;
            e.offset({ top: state.top, left: state.left });
            e.height(state.height);
            e.width(state.width);
            if (state.visible && e.is(':hidden')) {
                this.show();
            } else if (!state.visible && e.is(':visible')) {
                this.hide();
            }
        },
        toggle: function() {
            if (this.$element.is(":hidden")) {
                this.show();
            } else {
                this.hide();
            }
        },
        show: function() {
            var el = this.$element;
            if (el.trigger("toolbox-beforeshow")) {
                el.fadeIn(function() {
                    el.trigger("toolbox-show");
                });
            }
        },
        hide: function() {
            var el = this.$element;
            if (el.trigger("toolbox-beforehide")) {
                el.fadeOut(function() {
                    el.trigger("toolbox-hide");
                });
            }
        },
        registerPlugin: function(plugin) {
            this.plugins.push(plugin);
        },
        refresh: function() {
            this._initPlugins();
        }
    });

    $.fn[pluginName] = function(config) {
        return this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new Toolbox(this, config));
            }
        });
    };
})($CQ || jQuery, window, document);