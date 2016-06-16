requirejs.config({
    paths: {
        chitu: 'scripts/chitu',
        hammer: 'scripts/hammer',
        iscroll: 'iscroll-probe',
        jquery: 'scripts/jquery-2.1.4',
        move: 'scripts/move',
        text: 'scripts/text'
    }
});
requirejs(['tests', 'application-test']);
