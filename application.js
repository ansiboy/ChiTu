define(['chitu', 'sitemap'], function (c, siteMap) {


    function main() {


        let pageNames = [
            'quick_start', 'async_load', 'page_navigation',
            'ajax_invoke', 'page_pass_parameter', 'error_handle',
            'event_usage', 'page_render', 'page_event'
        ]
        let obj = {}
        pageNames.forEach(o => obj[o] = (page) => Application.loadView(page))
        let app = new Application(siteMap);
        return app;
    }

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    class Application extends chitu.Application {
        constructor(siteMap) {
            super(siteMap, false);
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
<div class="col-md-7 col-lg-8"></div>
<div class="col-md-5 col-lg-4"></div>
`
            let elements = page.element.querySelectorAll('div');
            let mobile_container = elements[1]
            let mobile_element = document.createElement('div')
            mobile_container.appendChild(mobile_element)

            let doc_element = elements[0]
            let url = `modules/${page.name}.md`


            fetch(url)
                .then(res => {
                    return res.text();
                })
                .then(text => {
                    var html_content = marked(text);
                    doc_element.innerHTML = html_content;
                    let title_element = doc_element.querySelector('h1')
                    page.element.insertBefore(title_element, doc_element)

                    let modules = ['highlight', 'highlight_javascript', 'highlight_typescript'];
                    require(modules, function (hljs, n) {
                        doc_element.querySelectorAll('code').forEach(block => {
                            let { className } = block
                            if (className != 'mermaid') {
                                hljs.highlightBlock(block);
                            }
                        })
                    });

                    doc_element.querySelectorAll('.mermaid').forEach(block => {
                        block.id = 'xdfasf'
                        let graphDefinition = block.innerText
                        var insertSvg = function (svgCode, bindFunctions) {
                            block.innerHTML = svgCode;
                            block.children[0].style.height = '400px'
                        };
                        window.mermaid.mermaidAPI.render(block.id, graphDefinition, insertSvg)
                    })
                })
        }
    }

    return main()
});
