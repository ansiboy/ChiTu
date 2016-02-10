var chitu;
(function (chitu) {
    var ScrollArguments = (function () {
        function ScrollArguments() {
        }
        return ScrollArguments;
    })();
    chitu.ScrollArguments = ScrollArguments;
    var WebPageContainer = (function () {
        function WebPageContainer(prevous) {
            this.animationTime = 300;
            this.scrollEnd = $.Callbacks();
            this.is_dispose = false;
            var node = document.createElement('div');
            document.body.appendChild(node);
            this.previous = prevous;
            this.nodes = new chitu.PageNodes(node);
            this.disableHeaderFooterTouchMove();
        }
        WebPageContainer.prototype.show = function (swipe) {
            var _this = this;
            if (this.visible == true)
                return $.Deferred().resolve();
            var container_width = $(this.nodes.container).width();
            var container_height = $(this.nodes.container).height();
            var result = $.Deferred();
            var on_end = function () {
                result.resolve();
            };
            switch (swipe) {
                case chitu.SwipeDirection.None:
                    $(this.nodes.container).show();
                    result = $.Deferred().resolve();
                    break;
                case chitu.SwipeDirection.Down:
                    this.translateY(0 - container_height, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(function () {
                        _this.translateY(0, _this.animationTime).done(on_end);
                    }, 30);
                    break;
                case chitu.SwipeDirection.Up:
                    this.translateY(container_height, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(function () {
                        _this.translateY(0, _this.animationTime).done(on_end);
                    }, 30);
                    break;
                case chitu.SwipeDirection.Right:
                    this.translateX(0 - container_width, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(function () {
                        _this.translateX(0, _this.animationTime).done(on_end);
                    }, 30);
                    break;
                case chitu.SwipeDirection.Left:
                    this.translateX(container_width, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(function () {
                        _this.translateX(0, _this.animationTime).done(on_end);
                    }, 30);
                    break;
            }
            return result;
        };
        WebPageContainer.prototype.translateDuration = function (duration) {
            if (duration < 0)
                throw chitu.Errors.paramError('Parameter duration must greater or equal 0, actual is ' + duration + '.');
            var result = $.Deferred();
            if (duration == 0) {
                this.nodes.container.style.transitionDuration =
                    this.nodes.container.style.webkitTransitionDuration = '';
                return result.resolve();
            }
            this.nodes.container.style.transitionDuration =
                this.nodes.container.style.webkitTransitionDuration = duration + 'ms';
            window.setTimeout(function () { return result.resolve(); }, duration);
            return result;
        };
        WebPageContainer.prototype.translateX = function (x, duration) {
            var result = this.translateDuration(duration);
            this.nodes.container.style.transform = this.nodes.container.style.webkitTransform
                = 'translateX(' + x + 'px)';
            return result;
        };
        WebPageContainer.prototype.translateY = function (y, duration) {
            var result = this.translateDuration(duration);
            this.nodes.container.style.transform = this.nodes.container.style.webkitTransform
                = 'translateY(' + y + 'px)';
            return result;
        };
        WebPageContainer.prototype.disableHeaderFooterTouchMove = function () {
            $([this.footer, this.header]).on('touchmove', function (e) {
                e.preventDefault();
            });
        };
        WebPageContainer.prototype.hide = function (swipe) {
            var _this = this;
            if (this.visible == false)
                return $.Deferred().resolve();
            var container_width = $(this.nodes.container).width();
            var container_height = $(this.nodes.container).height();
            var result;
            switch (swipe) {
                case chitu.SwipeDirection.None:
                    result = $.Deferred().resolve();
                    break;
                case chitu.SwipeDirection.Down:
                    result = this.translateY(container_height, this.animationTime);
                    break;
                case chitu.SwipeDirection.Up:
                    result = this.translateY(0 - container_height, this.animationTime);
                    break;
                case chitu.SwipeDirection.Right:
                    result = this.translateX(container_width, this.animationTime);
                    break;
                case chitu.SwipeDirection.Left:
                    result = this.translateX(0 - container_width, this.animationTime);
                    break;
            }
            result.done(function () { return $(_this.nodes.container).hide(); });
            return result;
        };
        WebPageContainer.prototype.dispose = function () {
            if (this.is_dispose)
                return;
            this.is_dispose = true;
            this.nodes.container.parentNode.removeChild(this.nodes.container);
        };
        Object.defineProperty(WebPageContainer.prototype, "header", {
            get: function () {
                return this.nodes.header;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebPageContainer.prototype, "content", {
            get: function () {
                return this.nodes.content;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebPageContainer.prototype, "footer", {
            get: function () {
                return this.nodes.footer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebPageContainer.prototype, "loading", {
            get: function () {
                return this.nodes.loading;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebPageContainer.prototype, "visible", {
            get: function () {
                return $(this.nodes.container).is(':visible');
            },
            set: function (value) {
                if (value)
                    $(this.nodes.container).show();
                else
                    $(this.nodes.container).hide();
            },
            enumerable: true,
            configurable: true
        });
        return WebPageContainer;
    })();
    chitu.WebPageContainer = WebPageContainer;
})(chitu || (chitu = {}));
