requirejs.config({
    shim: {
        tests: {
            deps: ['chitu'],
            exports: 'chitu'
        },
        chitu: {
            deps: ['jquery']
        }
    },
    paths: {
        chitu: 'scripts/chitu',
        hammer: 'scripts/hammer',
        iscroll: 'iscroll-probe',
        jquery: 'scripts/jquery-2.1.4',
        move: 'scripts/move',
        text: 'scripts/text'
    }
});
requirejs(['chitu'], () => {
    requirejs(['tests', 'routeParserTest', 'applicationTest']);//, 'application-test'
})
