define(['chitu'], function (chitu) {

    function HomePage(container, pageInfo, args, previous) {
        chitu.Page.apply(this,arguments);
    }

    HomePage.prototype = chitu.Page.prototype;
    return HomePage;
});