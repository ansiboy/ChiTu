namespace chitu {
// 
//     export class DivScroll {
//         constructor(page: chitu.Page) {
//             //============================================================
//             // 说明：实现滚动结束检测
//             var cur_scroll_args: ScrollArguments = new ScrollArguments();
//             var pre_scroll_top: number;
//             var checking_num: number;
//             var CHECK_INTERVAL = 300;
//             var scrollEndCheck = (page: chitu.Page) => {
//                 if (checking_num != null) return;
//                 //======================
//                 // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
//                 checking_num = 0;
//                 //======================
//                 checking_num = window.setInterval(() => {
//                     if (pre_scroll_top == cur_scroll_args.scrollTop) {
//                         window.clearInterval(checking_num);
//                         checking_num = null;
//                         pre_scroll_top = null;
// 
//                         //page['on_scrollEnd'](cur_scroll_args);
//                         page.on_scrollEnd(cur_scroll_args);
// 
//                         return;
//                     }
//                     pre_scroll_top = cur_scroll_args.scrollTop;
// 
//                 }, CHECK_INTERVAL);
//             }
//             //========================================================
//             var wrapper_node = page.nodes().body;
//             wrapper_node.onscroll = () => {
//                 var args = {
//                     scrollTop: wrapper_node.scrollTop,
//                     scrollHeight: wrapper_node.scrollHeight,
//                     clientHeight: wrapper_node.clientHeight
//                 };
// 
//                 page.on_scroll(args);
// 
//                 cur_scroll_args.clientHeight = args.clientHeight;
//                 cur_scroll_args.scrollHeight = args.scrollHeight;
//                 cur_scroll_args.scrollTop = args.scrollTop;
//                 scrollEndCheck(page);
//             };
// 
//         }
//     }
}

