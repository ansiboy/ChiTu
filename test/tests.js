

QUnit.asyncTest('Application.showPage 显示页面', (assert) => {
    let app = new chitu.Application();
    app.showPage('home/index/').then((page) => {
        assert.equal(page.name, 'home.index');
        let element = document.querySelector(`page[name='${page.name}']`);
        assert.notEqual(element, null);
        QUnit.start();
    });

});

QUnit.asyncTest('Application.pageCreated 页面创建事件', (assert) => {
    let app = new chitu.Application();
    let pageCount = 0;
    app.pageCreated.add(() => {
        pageCount = pageCount + 1;
    });
    app.showPage('home/index/').then(() => {
        assert.equal(pageCount, 1);
        QUnit.start();
    });
});

QUnit.asyncTest('Application.currentPage 当前页面', (assert) => {
    let app = new chitu.Application();
    app.showPage('user/index/')
        .then(() => {
            assert.notEqual(app.currentPage, null);
            assert.equal(app.currentPage.name, 'user.index');
            return app.showPage('home/index/');;
        })
        .then((page) => {
            assert.notEqual(app.currentPage, null);
            assert.equal(app.currentPage.name, 'home.index');
        });

    QUnit.start();
});

QUnit.asyncTest('Application.currentPage 当前页面', (assert) => {
    let app = new chitu.Application();
    app.showPage('user/index/')
        .then(() => {
            assert.notEqual(app.currentPage, null);
            assert.equal(app.currentPage.name, 'user.index');
            return app.showPage('home/index/');;
        })
        .then((page) => {
            assert.notEqual(app.currentPage, null);
            assert.equal(app.currentPage.name, 'home.index');
            return app.back();
        })
        .then(() => {
            //assert.equal(app.currentPage.name, 'user.index.index');
        });

    QUnit.start();
});



