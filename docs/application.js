define(['chitu'], function (c) {
    let siteMap = {
        index: {
            name: 'index',
            action(page) {
                Application.loadView(page)
            },
            children: {
                quick_start: (page) => Application.loadView(page),
                async_load: (page) => Application.loadView(page),
                page_navigation: (page) => Application.loadView(page),
                ajax_invoke: (page) => Application.loadView(page),
                page_pass_parameter: (page) => Application.loadView(page)
            }
        }
    }
    class Application extends chitu.Application {
        constructor() {
            super({ siteMap, allowCachePage: false });
        }

        /**
         * @param {string} url 
         */
        parseUrl(url) {
            let sharpIndex = url.indexOf('#');
            if (sharpIndex < 0) {
                return {
                    pageName: 'index',
                    url,
                    values: {}
                }
            }
            return super.parseUrl(url);
        }

        /**
         * 加载页面视图
         * @param {chitu.Page} page 
         */
        static loadView(page) {
            page.element.className = 'container'
            page.element.innerHTML = `
<div class="pull-right"></div>
<div class="doc"></div>
`
            let mobile_element = page.element.querySelector('.pull-right')
            let doc_element = page.element.querySelector('.doc')
            let url = `modules/${page.name}.md`
            fetch(url)
                .then(res => {
                    return res.text();
                })
                .then(text => {
                    var html_content = marked(text);
                    doc_element.innerHTML = html_content;
                    let title_element = doc_element.querySelector('h1')
                    page.element.insertBefore(title_element, mobile_element)

                    let modules = ['highlight', 'highlight_javascript', 'highlight_typescript'];
                    require(modules, function (hljs, n) {
                        doc_element.querySelectorAll('code').forEach(block => {
                            hljs.highlightBlock(block);
                        })
                    });
                })

            if (page.name != 'index') {
                require(['device'], function (func) {
                    func(mobile_element)
                })
            }

        }
    }

    let app = new Application();

    return app;

});