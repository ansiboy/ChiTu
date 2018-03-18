
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
        highlight_css: 'js/highlight.js/styles/rainbow',
        mermaid: 'https://unpkg.com/mermaid@7.1.0/dist/mermaid'
    }
})

requirejs(['application'], function (app) {
    // if (!location.hash)
    //     location.hash = '#index'

    // require(['mermaid'], function (mermaid) {
    
    // })

    marked.setOptions({
        langPrefix: ""
    })

    app.run()
})
requirejs(['c!css/devices.css'])
requirejs(['c!highlight_css'])
