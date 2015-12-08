/// <reference path="common.ts" />

namespace chitu.gesture {
    function start(move: (selector: string | HTMLElement) => Move, page: chitu.Page, pullDownBar: PullDownBar, pullUpBar: PullUpBar) {
        var pre_deltaY = 0;
        var cur_scroll_args: ScrollArguments = page['cur_scroll_args'];
        var content_move = move(page.nodes().content);//createMove(page);
        var body_move: Move;
        //========================================================
        // 说明：判断页面是否已经滚动底部（可以向上拉动刷新的依据之一）。
        var enablePullUp = false;
        //==================================================================
        // 说明：以下代码是实现下拉更新，但注意在 ISO 中，估计是由于使用了 IScroll，
        // 不能使用 transform，只能设置 top 来进行位移。
        var start_pos: number;
        var delta_height: number;
        var enablePullDown: boolean = false;// pullDownBar != null;
        var hammer = new Hammer(page.nodes().content);
        hammer.get('pan').set({ direction: Hammer.DIRECTION_UP | Hammer.DIRECTION_DOWN });

        //$(page.nodes().body).mousedown(() => {
        //    var rect = page.nodes().content.getBoundingClientRect();
        //    if (start_pos == null)
        //        start_pos = rect.top;

        //});

        hammer.on('panstart', function (e: PanEvent) {
            var rect = page.nodes().content.getBoundingClientRect();
            var parent_rect = page.nodes().body.getBoundingClientRect();

            if (start_pos == null) {
                start_pos = rect.top;
            }

            if (delta_height == null) {
                delta_height = rect.height - $(page.nodes().body).height();
            }

            pre_deltaY = e['deltaY'];

            //====================================================================
            // 如果已经滚动到底部，则允许上拉
            enablePullUp = pullUpBar != null && Math.abs(parent_rect.bottom - rect.bottom) <= 20 && e['direction'] == Hammer.DIRECTION_UP;
            if (enablePullUp)
                body_move = move(page.nodes().body);
            //====================================================================
            // 如果页面处内容处理顶部 <= 20（不应该使用 0，允许误差），并且向下拉，则开始下拉事件
            enablePullDown = pullDownBar != null && Math.abs(rect.top - start_pos) <= 20 && e['direction'] == Hammer.DIRECTION_DOWN;
            //====================================================================
            if (enablePullDown === true) {
                hammer.get('pan').set({ direction: Hammer.DIRECTION_UP | Hammer.DIRECTION_DOWN, domEvents: false });
            }

        })

        hammer.on('pan', function (e: Event) {
            var delta

            var event: any = e;
            if (event.distance > config.PULL_DOWN_MAX_HEIGHT)
                return;

            if (enablePullDown === true) {
                content_move.set('top', event.deltaY + 'px').duration(0).end();
                if (Math.abs(event.deltaY) > config.PULLDOWN_EXECUTE_CRITICAL_HEIGHT) {
                    pullDownBar.status(RefreshState.ready);
                }
                else {
                    pullDownBar.status(RefreshState.init);
                }

                //pre_deltaY = event.deltaY;
                //======================================
                // 说明：如果已经处理该事件处理，就可以阻止了。
                event.preventDefault();
                //======================================
            }
            else if (enablePullUp) {
                body_move.y(event.deltaY - pre_deltaY).duration(0).end();
                if (Math.abs(event.deltaY) > config.PULLUP_EXECUTE_CRITICAL_HEIGHT) {
                    pullUpBar.status(RefreshState.ready);
                }
                else {
                    pullUpBar.status(RefreshState.init);
                }
            }

            pre_deltaY = e['deltaY']
        });

        hammer.on('panend', function (e: Event) {
            var scroll_deferred = $.Deferred();
            if (enablePullDown === true) {
                if (pullDownBar.status() == RefreshState.ready) {
                    // 位置复原到为更新状态位置
                    content_move
                        .set('top', config.PULLDOWN_EXECUTE_CRITICAL_HEIGHT + 'px')
                        .duration(200)
                        .end();
                    //content_move.x()
                    pullDownBar.status(RefreshState.doing);
                    pullDownBar.execute().done(() => {
                        pullDownBar.status(RefreshState.done)
                        content_move.set('top', '0px').duration(500).end(() => {
                            console.log('scrollTop');
                            scroll_deferred.resolve()
                        });
                    });


                }
                else {
                    content_move.set('top', '0px').duration(200).end(() => scroll_deferred.resolve());
                }
            }
            else if (enablePullUp) {
                if (pullUpBar.status() == RefreshState.ready) {
                    pullUpBar.execute();
                }

                console.log('d');
                var m = move(page.nodes().body);
                m.y(0).duration(200).end();
            }
        });
    }
    export function enable_divfixed_gesture(page: chitu.Page, pullDownBar: PullDownBar, pullUpBar: PullUpBar) {
        requirejs(['move', 'hammer'], (move: (selector: string | HTMLElement) => Move, hammer) => {
            debugger;
            window['Hammer'] = hammer;
            start(move, page, pullDownBar, pullUpBar)
        });
    }
}
