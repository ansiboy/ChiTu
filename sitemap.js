define([
    'require'
], function (require) {
    'use strict';


    let sitemap = {
        index: {
            action(page) {
                // loadView(page)
                page.element.className = 'container'
                let title = document.createElement('h1')
                title.innerHTML = 'CHITU 手册'
                page.element.appendChild(title)
                for (let key in sitemap.index.children) {
                    renderSection(page, sitemap.index.children[key])
                }
            },
            children: {
                usage: {
                    text: '使用',
                    children: {
                        quick_start: {
                            text: '快速入门'
                        },
                        async_load: {
                            text: '异步加载页面'
                        },
                        page_navigation: {
                            text: '页面间跳转'
                        },
                        page_pass_parameter: {
                            text: '页面间参数的传递'
                        }
                    }
                },
                ajax_invke: {
                    text: 'AJAX 调用',
                    children: {
                        ajax_get: {
                            text: '数据的获取'
                        },
                        ajax_form: {
                            text: '以表单格式提交数据'
                        },
                        ajax_json: {
                            text: '以 JSON 格式提交数据'
                        }
                    },
                },
                music: {
                    text: '杂项',
                    children: {
                        event_usage: {
                            text: '消息的通知'
                        },
                        error_handle: {
                            text: '错误的处理'
                        }
                    }
                },
                deepen_understand: {
                    text: '深入了解',
                    children: {
                        page_render: {
                            text: '理解页面的呈现'
                        },
                        exception: {
                            text: '异常的处理机制'
                        },
                        page_event: {
                            text: '页面的事件'
                        }
                    }
                }
            }
        }
    }

    assignDefaultAction(sitemap.index)
    return sitemap
});

var hideMobilePages = ['index', 'page_render'];

/**
 * @param {chitu.SiteMapNode} node 
 */
function assignDefaultAction(node) {
    node.action = node.action || loadView
    for (let key in node.children || {}) {
        assignDefaultAction(node.children[key])
    }
}

/**
 * @param {chitu.Page} page 
 * @param {chitu.SiteMapNode} node 
 */
function renderSection(page, node) {
    let section = document.createElement('h2')
    section.innerHTML = `<h2>${node.text}</h2>`
    page.element.appendChild(section)

    let list = document.createElement('ol')
    page.element.appendChild(list)
    for (let key in node.children) {
        let li = document.createElement('li')
        li.innerHTML = `<a href="#${key}">${node.children[key].text}</a>`
        node.action = loadView
        list.appendChild(li)
    }

}

/**
 * load view
 * @param {chitu.Page} page 
 */
function loadView(page) {
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

    if (hideMobilePages.indexOf(page.name) < 0) {
        require(['device'], function (func) {
            func(mobile_element)
        })
    }

}