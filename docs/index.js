
requirejs.config({
    shim: {
        highlight_javascript: {
            deps: ['highlight']
        },
        highlight_typescript: {
            deps: ['highlight']
        }
    },
    paths: {
        chitu: 'js/chitu',
        c: 'js/css',
        highlight: 'js/highlight.js/highlight.pack',
        highlight_javascript: 'js/highlight.js/languages/javascript',
        highlight_typescript: 'js/highlight.js/languages/typescript',
        highlight_css: 'js/highlight.js/styles/rainbow'
    }
})

requirejs(['application'], function (app) {
    // if (!location.hash)
    //     location.hash = '#index'

    app.run()
})
requirejs(['c!css/devices.css'])
requirejs(['c!highlight_css'])

/**
 * @param {string} name
 * @param {()=>void} func 
 */
function action(name, func) {
    if (typeof name == 'function') {
        func = name
        name = null
    }

    func = func || (() => { })
    /**
     * @param {chitu.Page} page 
     */
    function actionFunction(page) {
        let url = `modules/${page.routeData.routeString}.md`
        fetch(url)
            .then(res => {
                return res.text();
            })
            .then(text => {
                var html_content = marked(text);
                page.element.innerHTML = html_content;

                let modules = ['highlight', 'highlight_javascript', 'highlight_typescript'];
                require(modules, function (hljs, n) {
                    func();
                    page.element.querySelectorAll('code').forEach(block => {
                        hljs.highlightBlock(block);
                    })
                });
            })
    }

    if (name) {
        define(name, ['exports'], function (exports) {
            exports.default = actionFunction
        });
    }
    else {
        define(['exports'], function (exports) {
            exports.default = actionFunction
        });
    }
}