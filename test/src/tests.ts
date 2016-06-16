/// <reference path="../Scripts/typings/QUnit.d.ts"/>
QUnit.test("hello test", function (assert) {
  assert.ok(<any>1 == "1", "HaHa Passed!");
});

// Qunit.test("hello test", (assert) => {

// });
//requirejs(['ApplicationTest']);
