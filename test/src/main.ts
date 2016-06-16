/// <reference path="../scripts/typings/require.d.ts"/>
/// <reference path="../scripts/typings/jquery.d.ts"/>
/// <reference path="../scripts/typings/chitu.d.ts"/>
/// <reference path="../scripts/typings/qunit.d.ts"/>
/// <reference path="../scripts/typings/hammer.d.ts"/>

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